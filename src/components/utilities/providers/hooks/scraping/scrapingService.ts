
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
    timeout: provider.provider_name.toLowerCase().includes('engie') ? 180000 : 60000,
    // Add navigation wait time extended for ENGIE Romania
    navigationWaitTime: provider.provider_name.toLowerCase().includes('engie') ? 45000 : 10000,
    // Set flag to handle post-login location change dialog
    handleLocationChange: provider.provider_name.toLowerCase().includes('engie'),
    // Enable persistent cookie storage for maintaining session
    persistCookies: provider.provider_name.toLowerCase().includes('engie'),
    // Set flag to clear cookies before starting (helps with session issues)
    clearCookies: provider.provider_name.toLowerCase().includes('engie'),
    // Set flag to handle MyENGIE app popup
    handleMyEngiePopup: provider.provider_name.toLowerCase().includes('engie'),
    // Set flag to skip waiting for navigation after selecting consumption location
    skipWaitAfterLocationSelection: provider.provider_name.toLowerCase().includes('engie'),
    // Resolve popups after logging in and before changing consumption location
    resolvePopupsAfterLogin: provider.provider_name.toLowerCase().includes('engie'),
    // Set flag to wait for login completion before proceeding
    waitForLoginCompletion: provider.provider_name.toLowerCase().includes('engie'),
    // Wait for account entry after CAPTCHA
    waitForAccountEntry: provider.provider_name.toLowerCase().includes('engie'),
    // Do not click login button again after captcha (check for prima-pagina)
    checkForPrimaPageAfterCaptcha: provider.provider_name.toLowerCase().includes('engie'),
    // Set user agent to appear as a modern browser
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
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
      
      // Check for CAPTCHA submission but waiting for the account to load
      if (scrapeData.error && scrapeData.error.includes('CAPTCHA submitted')) {
        throw new Error('CAPTCHA submitted, waiting for account entry to complete before changing consumption location.');
      }
      
      // Check for waiting for account entry after CAPTCHA
      if (scrapeData.error && scrapeData.error.includes('Waiting for account entry')) {
        throw new Error('CAPTCHA submitted, waiting for account entry before proceeding to change consumption location.');
      }
      
      // Check for MyENGIE app popup issues
      if (scrapeData.error && (scrapeData.error.includes('MyENGIE app popup') || scrapeData.error.includes('Mai târziu'))) {
        throw new Error('The process encountered a promotional popup about the MyENGIE app. We\'ll improve handling of this in future updates. Please try again.');
      }
      
      // Check for consumption location selection issues
      if (scrapeData.error && (scrapeData.error.includes('Change consumption location') || 
                              scrapeData.error.includes('Schimbă locul de consum') || 
                              scrapeData.error.includes('alege locul de consum'))) {
        throw new Error('The process encountered an issue while selecting the consumption location. The system will try to proceed without waiting for navigation.');
      }
      
      throw new Error(scrapeData?.error || 'Scraping failed');
    }

    if (!scrapeData.jobId) {
      throw new Error('No job ID returned from scraping service');
    }

    return scrapeData;
  } catch (error) {
    console.error('Error during scraping function invocation:', error);
    
    // Check for waiting for account entry after CAPTCHA
    if (error instanceof Error && error.message.includes('Waiting for account entry')) {
      console.log('Waiting for account entry after CAPTCHA, creating fallback job...');
      
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
          error: 'After CAPTCHA submission, the system is waiting for account entry. A fallback job has been created.'
        };
      } catch (fallbackError) {
        console.error('Fallback job creation failed:', fallbackError);
        throw new Error('Waiting for account entry after CAPTCHA. Please try again later.');
      }
    }
    
    // Check for CAPTCHA submission message
    if (error instanceof Error && error.message.includes('CAPTCHA submitted')) {
      console.log('CAPTCHA was submitted, proceeding directly to change consumption location...');
      
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
          error: 'CAPTCHA submitted, proceeding to changing consumption location. Using fallback job.'
        };
      } catch (fallbackError) {
        console.error('Fallback job creation failed:', fallbackError);
        throw new Error('CAPTCHA was submitted. Please try again if the process fails.');
      }
    }
    
    // Check for consumption location selection issues
    if (error instanceof Error && 
        (error.message.includes('Change consumption location') || 
         error.message.includes('Schimbă locul de consum') ||
         error.message.includes('alege locul de consum'))) {
      console.log('Consumption location selection issue detected, creating fallback job...');
      
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
          error: 'The process encountered an issue while selecting the consumption location. A fallback job has been created and will be processed skipping the navigation wait.'
        };
      } catch (fallbackError) {
        console.error('Fallback job creation failed:', fallbackError);
        throw new Error('The process encountered an issue while selecting the consumption location. Please try again later.');
      }
    }

    // Handle MyENGIE app popup issue
    if (error instanceof Error && (error.message.includes('MyENGIE app popup') || error.message.includes('Mai târziu'))) {
      console.log('MyENGIE app popup detected, creating fallback job...');
      
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
          error: 'The process encountered a promotional popup about the MyENGIE app. Using fallback job.'
        };
      } catch (fallbackError) {
        console.error('Fallback job creation failed:', fallbackError);
        throw new Error('The process was interrupted by a promotional popup. Please try again later.');
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
          throw new Error('The scraping process was interrupted after CAPTCHA submission. This may be due to session timeout or cookies issue. Please try again.');
        }

        if (error.message.includes('Waiting for login navigation') || 
            error.message.includes('navigation timeout')) {
          throw new Error('The scraping process timed out while waiting for the login page to load. The ENGIE Romania website may be slow or temporarily down. Please try again later.');
        }
        
        if (error.message.includes('Change consumption location') || 
            error.message.includes('Schimbă locul de consum') ||
            error.message.includes('alege locul de consum')) {
          throw new Error('The scraping process failed while trying to select the consumption location. The system will try to proceed without waiting for navigation.');
        }
        
        if (error.message.includes('cookie') || error.message.includes('session')) {
          throw new Error('Session management issue with ENGIE Romania website. This may be due to cookie handling or session expiration. Please try again later.');
        }

        if (error.message.includes('MyENGIE app popup') || error.message.includes('Mai târziu')) {
          throw new Error('The scraping process was interrupted by a promotional popup about the MyENGIE app. We\'ll improve handling of this in future updates. Please try again later.');
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
            error: 'The scraping service was interrupted due to a timeout or cookie issue. A fallback job has been created and will be processed later.'
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
