
import { supabase } from "@/integrations/supabase/client";
import { UtilityProvider } from "../../types";
import { Credentials, ScrapingResponse } from "./types";
import { formatEdgeFunctionError } from "./errorHandlers";

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
 * Invokes the scraping edge function for a utility provider
 */
export async function invokeScrapingFunction(
  provider: UtilityProvider, 
  credentials: Credentials
): Promise<ScrapingResponse> {
  console.log('Starting scraping for provider:', provider.provider_name);

  const requestBody = {
    username: credentials.username,
    password: credentials.password,
    utilityId: provider.id,
    provider: provider.provider_name,
    type: provider.utility_type,
    location: provider.location_name
  };

  console.log('Invoking scrape-utility-invoices function with body:', JSON.stringify({
    ...requestBody,
    password: '***' // Hide password in logs
  }));

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
}
