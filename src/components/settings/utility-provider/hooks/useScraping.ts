
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UtilityProvider, ScrapingJob } from "../types";
import { Database } from "@/integrations/supabase/types/rpc";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

type GetDecryptedCredentialsResponse = Database['public']['Functions']['get_decrypted_credentials']['Returns'];

export function useScraping(providers: UtilityProvider[]) {
  const [scrapingStates, setScrapingStates] = useState<Record<string, boolean>>({});
  const [scrapingJobs, setScrapingJobs] = useState<Record<string, ScrapingJob>>({});
  const [scrapingQueue, setScrapingQueue] = useState<string[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const { toast } = useToast();

  const processQueue = useCallback(async () => {
    if (isProcessingQueue || scrapingQueue.length === 0) {
      console.log("Queue processing status:", { 
        isProcessingQueue, 
        queueLength: scrapingQueue.length,
        shouldProcess: !isProcessingQueue && scrapingQueue.length > 0
      });
      return;
    }

    setIsProcessingQueue(true);
    const providerId = scrapingQueue[0];
    console.log(`Processing queue: Starting with provider ${providerId}`, {
      queueLength: scrapingQueue.length,
      remainingItems: scrapingQueue.slice(1)
    });

    try {
      await handleScrapeWithRetry(providerId);
    } finally {
      const updatedQueue = scrapingQueue.slice(1);
      setScrapingQueue(updatedQueue);
      setIsProcessingQueue(false);
      
      // Process next item in queue if any
      if (updatedQueue.length > 0) {
        console.log(`Queue: ${updatedQueue.length} items remaining:`, updatedQueue);
        setTimeout(() => {
          processQueue();
        }, 1000);
      } else {
        console.log('Queue processing completed');
      }
    }
  }, [isProcessingQueue, scrapingQueue]);

  // Effect to monitor queue changes and start processing
  useEffect(() => {
    const shouldStartProcessing = scrapingQueue.length > 0 && !isProcessingQueue;
    console.log('Queue state changed:', {
      queueLength: scrapingQueue.length,
      isProcessing: isProcessingQueue,
      shouldStartProcessing
    });
    
    if (shouldStartProcessing) {
      processQueue();
    }
  }, [scrapingQueue, isProcessingQueue, processQueue]);

  const addToQueue = useCallback((providerId: string) => {
    console.log(`Adding provider ${providerId} to scraping queue`);
    setScrapingQueue(prev => {
      const newQueue = [...prev, providerId];
      console.log('Updated queue:', newQueue);
      return newQueue;
    });
  }, []);

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
      const { data: credentialsData, error: credentialsError } = await supabase.rpc('get_decrypted_credentials', {
        property_id_input: provider.property_id
      });

      if (credentialsError) {
        console.error('Credentials fetch failed:', credentialsError);
        throw new Error(`Failed to fetch credentials: ${credentialsError.message}`);
      }

      if (!credentialsData) {
        throw new Error('No credentials returned from the server');
      }

      const credentials = credentialsData as GetDecryptedCredentialsResponse;

      if (!credentials.username || !credentials.password) {
        console.error('Invalid credentials:', { hasUsername: !!credentials.username, hasPassword: !!credentials.password });
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
        type: provider.utility_type,
        hasUsername: !!requestBody.username,
        hasPassword: !!requestBody.password,
        requestBody: {
          ...requestBody,
          password: requestBody.password ? '[REDACTED]' : undefined
        }
      });

      const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('scrape-utility-invoices', {
        body: requestBody
      });

      if (scrapeError) {
        console.error('Scrape function error:', scrapeError);
        throw new Error(`Scraping failed: ${scrapeError.message}`);
      }

      console.log('Scrape completed successfully', { 
        providerId,
        response: scrapeData 
      });

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
      console.error('Scraping failed:', { 
        providerId, 
        error,
        errorMessage: error.message,
        errorDetails: error.details
      });

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
