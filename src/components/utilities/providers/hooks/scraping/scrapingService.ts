
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
 * removing any parameters that might be rejected by the Browserless API
 */
function prepareScrapingRequestBody(provider: UtilityProvider, credentials: Credentials) {
  // Create a simplified request body without any potentially problematic parameters
  return {
    username: credentials.username,
    password: credentials.password,
    utilityId: provider.id,
    provider: provider.provider_name,
    type: provider.utility_type,
    location: provider.location_name,
    // Set API compatibility flag to ensure scraper uses supported parameters
    apiCompatMode: true,
    // Disable cookie handling to avoid "Refused to get unsafe header" errors
    disableCookieHandling: true
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

  // Use simplified request body to prevent API compatibility issues
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
      }
    );

    console.log('Scrape function response:', scrapeData);

    if (scrapeError) {
      console.error('Scraping error:', scrapeError);
      
      // Parse edge function error for a more helpful message
      const errorMessage = formatEdgeFunctionError(scrapeError.message);
      
      throw new Error(errorMessage);
    }

    if (!scrapeData || !scrapeData.success) {
      console.error('Scraping failed:', scrapeData?.error);
      
      throw new Error(scrapeData?.error || 'Scraping failed');
    }

    if (!scrapeData.jobId) {
      throw new Error('No job ID returned from scraping service');
    }

    return scrapeData;
  } catch (error) {
    console.error('Error during scraping function invocation:', error);
    
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
    
    // Handle specific Browserless API configuration errors
    if (error instanceof Error) {
      // Check for Set-Cookie header errors
      if (error.message.includes("Refused to get unsafe header") ||
          error.message.includes("Set-Cookie")) {
        console.error('Browser security restriction on Set-Cookie headers:', error);
        throw new Error('The scraping service is experiencing issues with cookies. Please try again later.');
      }
      
      // Check for Browserless API configuration errors
      if (error.message.includes("elements is not allowed") || 
          error.message.includes("options is not allowed") || 
          error.message.includes("\"options\" is not allowed")) {
        console.error('Browserless API configuration error detected:', error);
        throw new Error('There is a configuration issue with the scraping service. The Browserless API needs to be updated. Please contact support.');
      }
    }
    
    // Rethrow the original error if it's not an edge function error or specific Browserless API error
    throw error;
  }
}
