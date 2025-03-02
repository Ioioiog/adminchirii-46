
import { supabase } from "@/integrations/supabase/client";
import { UtilityProvider } from "../../types";
import { Credentials, ScrapingResponse } from "./types";
import { formatEdgeFunctionError, isEdgeFunctionError } from "./errorHandlers";

/**
 * Retrieves decrypted credentials for a utility provider
 */
export async function getProviderCredentials(providerId: string, propertyId: string): Promise<Credentials> {
  console.log('Getting credentials for provider:', providerId);
  const { data: credentialsData, error: credentialsError } = await supabase.rpc(
    'get_decrypted_credentials',
    { property_id_input: propertyId }
  );

  if (credentialsError) {
    console.error('Failed to fetch credentials:', credentialsError);
    
    if (credentialsError.message.includes('pgcrypto')) {
      throw new Error('pgcrypto extension is not enabled in the database');
    }
    
    throw new Error('Failed to fetch credentials');
  }

  if (!credentialsData) {
    throw new Error('No credentials found for this provider');
  }

  return credentialsData as unknown as Credentials;
}

/**
 * Create a new scraping job record in the database directly
 * This serves as a fallback when the edge function fails
 */
async function createScrapingJobDirectly(providerId: string, providerName?: string, utilityType?: string, location?: string): Promise<string> {
  try {
    console.log('Creating fallback job for provider:', providerId);
    
    const { data, error } = await supabase
      .from('scraping_jobs')
      .insert({
        utility_provider_id: providerId,
        status: 'pending',
        error_message: 'Created as fallback due to edge function failure',
        provider: providerName,
        type: utilityType,
        location: location
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating scraping job directly:', error);
      throw new Error('Failed to create job record');
    }

    return data.id;
  } catch (error) {
    console.error('Failed to create scraping job record:', error);
    throw new Error('Could not create job record in the database');
  }
}

/**
 * Prepares request body for the scraping edge function,
 * cleaning it to prevent API compatibility issues
 */
function prepareScrapingRequestBody(provider: UtilityProvider, credentials: Credentials) {
  // Clean request body to ensure compatibility with the Edge Function
  return {
    username: credentials.username,
    password: credentials.password,
    utilityId: provider.id,
    provider: provider.provider_name,
    type: provider.utility_type,
    location: provider.location_name,
    // Set API compatibility flag to ensure scraper uses supported parameters
    apiCompatMode: true,
    // Add flag to indicate that this provider requires CAPTCHA handling
    hasCaptcha: provider.provider_name.toLowerCase().includes('engie'),
    // Add a longer timeout for providers with CAPTCHA
    timeout: provider.provider_name.toLowerCase().includes('engie') ? 120000 : 60000,
    // Add navigation wait time extended for ENGIE Romania
    navigationWaitTime: provider.provider_name.toLowerCase().includes('engie') ? 30000 : 10000,
    // Set flag to handle post-login location change dialog
    handleLocationChange: provider.provider_name.toLowerCase().includes('engie')
  };
}

/**
 * Invokes the scraping edge function for a utility provider
 */
export async function invokeScrapingFunction(
  provider: UtilityProvider, 
  credentials: Credentials
): Promise<ScrapingResponse> {
  console.log('Starting scraping for provider:', provider.provider_name);

  // Create a clean request body to prevent API compatibility issues
  const requestBody = prepareScrapingRequestBody(provider, credentials);

  console.log('Invoking scrape-utility-invoices function with body:', JSON.stringify({
    ...requestBody,
    password: '***' // Hide password in logs
  }));

  try {
    const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke<ScrapingResponse>(
      'scrape-utility-invoices',
      {
        body: JSON.stringify(requestBody)
        // Removed the responseType property as it's not supported
      }
    );

    console.log('Scrape function response:', scrapeData);

    if (scrapeError) {
      console.error('Scraping error:', scrapeError);
      
      // Parse edge function error for a more helpful message
      const errorMessage = formatEdgeFunctionError(scrapeError.message);
      
      throw new Error(errorMessage);
    }

    if (!scrapeData) {
      console.error('No data returned from scraping function');
      throw new Error('No data returned from the scraping service');
    }

    if (!scrapeData.success) {
      console.error('Scraping failed:', scrapeData?.error);
      
      // Check for CAPTCHA submission but function shutdown
      if (scrapeData.error && scrapeData.error.includes('CAPTCHA submitted')) {
        throw new Error(`CAPTCHA submitted, but the function was interrupted. Please try again.`);
      }
      
      throw new Error(scrapeData?.error || 'Scraping failed');
    }

    if (!scrapeData.jobId) {
      throw new Error('No job ID returned from scraping service');
    }

    return scrapeData;
  } catch (error) {
    console.error('Error during scraping function invocation:', error);
    
    // Check for CAPTCHA submission message
    if (error instanceof Error && error.message.includes('CAPTCHA submitted')) {
      console.log('CAPTCHA was submitted but process interrupted, creating fallback job...');
      
      try {
        const jobId = await createScrapingJobDirectly(
          provider.id,
          provider.provider_name,
          provider.utility_type,
          provider.location_name
        );
        
        return {
          success: true,
          jobId: jobId,
          error: 'CAPTCHA submitted, ID was recorded, but the process was interrupted. Using fallback job.'
        };
      } catch (fallbackError) {
        console.error('Fallback job creation failed:', fallbackError);
        throw new Error('CAPTCHA was submitted but the process was interrupted. Please try again.');
      }
    }
    
    // Check if it's an edge function error (500 status code)
    if (isEdgeFunctionError(error)) {
      console.log('Edge function error detected, creating fallback job...');
      
      // Create a job record directly in the database as a fallback
      try {
        const jobId = await createScrapingJobDirectly(
          provider.id,
          provider.provider_name,
          provider.utility_type,
          provider.location_name
        );
        
        console.log('Created fallback job with ID:', jobId);
        
        // Return a successful response with the fallback job ID
        return {
          success: true,
          jobId: jobId,
          error: 'Using fallback job due to edge function failure'
        };
      } catch (fallbackError) {
        console.error('Fallback job creation failed:', fallbackError);
        throw new Error('The utility provider service is temporarily unavailable');
      }
    }
    
    // Handle login and CAPTCHA errors specifically for ENGIE Romania
    if (error instanceof Error) {
      if (provider.provider_name.toLowerCase().includes('engie')) {
        if (error.message.includes('Login failed')) {
          throw new Error('Login to the ENGIE Romania website failed. Please check your credentials and try again.');
        }
        
        if (error.message.includes('CAPTCHA') || error.message.includes('captcha')) {
          throw new Error('The ENGIE Romania website requires CAPTCHA verification which could not be solved automatically. Please try again later.');
        }
        
        if (error.message.includes('function is shutdown') || error.message.includes('interrupted')) {
          throw new Error('The scraping process was interrupted after CAPTCHA submission. This may be due to a timeout. Please try again.');
        }

        if (error.message.includes('Waiting for login navigation') || 
            error.message.includes('navigation timeout')) {
          throw new Error('The scraping process timed out while waiting for the login page to load. The ENGIE Romania website may be slow or temporarily down. Please try again later.');
        }
        
        if (error.message.includes('Change consumption location') || 
            error.message.includes('Schimbă locul de consum')) {
          throw new Error('The scraping process failed while trying to select the consumption location. Please try again later.');
        }
      }
      
      // Handle Browserless API configuration errors
      if (error.message.includes("elements is not allowed") || 
          error.message.includes("options is not allowed") || 
          error.message.includes("\"options\" is not allowed")) {
        console.error('Browserless API configuration error detected:', error);
        throw new Error('There is a configuration issue with the scraping service. The Browserless API needs to be updated. Please contact support.');
      }
      
      // Handle JSON parsing errors
      if (error.message.includes("SyntaxError: Unexpected end of JSON")) {
        throw new Error('The provider website returned invalid data. This is often due to recent website changes or a timeout. Please try again later or contact support.');
      }

      // Handle function shutdown errors
      if (error.message.includes("function is shutdown")) {
        console.log('Function shutdown detected, creating fallback job...');
        
        try {
          const jobId = await createScrapingJobDirectly(
            provider.id,
            provider.provider_name,
            provider.utility_type,
            provider.location_name
          );
          
          return {
            success: true,
            jobId: jobId,
            error: 'The scraping service was interrupted due to a timeout. A fallback job has been created and will be processed later.'
          };
        } catch (fallbackError) {
          console.error('Fallback job creation failed:', fallbackError);
          throw new Error('The scraping process was interrupted due to a timeout. Please try again later with a shorter time interval.');
        }
      }
    }
    
    // Rethrow the original error if it's not a specific case we handle
    throw error;
  }
}
