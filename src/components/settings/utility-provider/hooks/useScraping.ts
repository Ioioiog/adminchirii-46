
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UtilityProvider, ScrapingJob } from "../types";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export function useScraping(providers: UtilityProvider[]) {
  const [scrapingStates, setScrapingStates] = useState<Record<string, boolean>>({});
  const [scrapingJobs, setScrapingJobs] = useState<Record<string, ScrapingJob>>({});
  const [scrapingQueue, setScrapingQueue] = useState<string[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const { toast } = useToast();

  const addToQueue = (providerId: string) => {
    console.log(`Adding provider ${providerId} to scraping queue`);
    setScrapingQueue(prev => [...prev, providerId]);
    processQueue();
  };

  const processQueue = async () => {
    if (isProcessingQueue || scrapingQueue.length === 0) {
      console.log("Queue processing skipped:", { isProcessingQueue, queueLength: scrapingQueue.length });
      return;
    }

    setIsProcessingQueue(true);
    const providerId = scrapingQueue[0];
    console.log(`Processing queue: Starting with provider ${providerId}`);

    try {
      await handleScrapeWithRetry(providerId);
    } finally {
      setScrapingQueue(prev => prev.slice(1));
      setIsProcessingQueue(false);
      
      // Process next item in queue if any
      if (scrapingQueue.length > 1) {
        console.log(`Queue: ${scrapingQueue.length - 1} items remaining`);
        setTimeout(processQueue, 1000);
      }
    }
  };

  const handleScrapeWithRetry = async (providerId: string, retryCount = 0): Promise<void> => {
    try {
      await handleScrape(providerId);
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        console.log(`Retry attempt ${retryCount + 1} for provider ${providerId}`, { error });
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return handleScrapeWithRetry(providerId, retryCount + 1);
      }
      console.error(`All retry attempts failed for provider ${providerId}`, { error });
      throw error;
    }
  };

  const handleScrape = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    
    if (!provider || !provider.property_id) {
      console.error('Provider validation failed:', { providerId, provider });
      throw new Error('No property associated with this provider');
    }

    console.log(`Starting scrape for provider: ${providerId} property: ${provider.property_id}`);
    setScrapingStates(prev => ({ ...prev, [providerId]: true }));

    try {
      console.log('Fetching decrypted credentials...');
      const { data: credentials, error: credentialsError } = await supabase.rpc(
        'get_decrypted_credentials',
        { property_id_input: provider.property_id }
      );

      if (credentialsError) {
        console.error('Credentials fetch failed:', credentialsError);
        throw credentialsError;
      }

      if (!credentials || !credentials.password) {
        console.error('Invalid credentials:', { credentials });
        throw new Error('No valid utility provider credentials found. Please update the credentials.');
      }

      const requestBody = {
        username: credentials.username,
        password: credentials.password,
        utilityId: providerId,
        provider: provider.provider_name,
        type: provider.utility_type,
        location: provider.location_name
      };

      console.log('Invoking scrape function...', { 
        providerId, 
        provider: provider.provider_name,
        type: provider.utility_type 
      });

      const { data: scrapeData, error } = await supabase.functions.invoke('scrape-utility-invoices', {
        body: JSON.stringify(requestBody)
      });

      if (error) {
        console.error('Scrape function error:', error);
        throw error;
      }

      console.log('Scrape completed successfully', { providerId });
      setScrapingJobs(prev => ({
        ...prev,
        [providerId]: {
          status: 'completed',
          last_run_at: new Date().toISOString(),
          error_message: null
        }
      }));

      toast({
        title: "Success",
        description: "Started fetching utility bills. This may take a few minutes.",
      });
    } catch (error: any) {
      console.error('Scraping failed:', { providerId, error });
      setScrapingJobs(prev => ({
        ...prev,
        [providerId]: {
          status: 'failed',
          last_run_at: new Date().toISOString(),
          error_message: error.message || 'Failed to scrape bills'
        }
      }));

      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch utility bills.",
      });

      throw error;
    } finally {
      setScrapingStates(prev => ({ ...prev, [providerId]: false }));
    }
  };

  return {
    scrapingStates,
    scrapingJobs,
    addToQueue,
    isProcessingQueue
  };
}
