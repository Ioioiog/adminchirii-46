
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UtilityProvider, ScrapingJob } from "../types";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const JOB_CHECK_INTERVAL = 5000; // 5 seconds

interface Credentials {
  id: string;
  username: string;
  password: string;
}

interface ScrapingResponse {
  success: boolean;
  error?: string;
  jobId?: string;
  bills?: Array<{
    amount: number;
    due_date: string;
    invoice_number: string;
    type: string;
    status: string;
  }>;
}

export function useScraping(providers: UtilityProvider[]) {
  const [scrapingStates, setScrapingStates] = useState<Record<string, boolean>>({});
  const [scrapingJobs, setScrapingJobs] = useState<Record<string, ScrapingJob>>({});
  const [scrapingQueue, setScrapingQueue] = useState<string[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const { toast } = useToast();

  const checkJobStatus = useCallback(async (jobId: string, providerId: string) => {
    try {
      console.log('Checking job status for:', jobId);
      const { data: job, error } = await supabase
        .from('scraping_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error checking job status:', error);
        return;
      }

      if (!job) {
        console.log('No job found with id:', jobId);
        return;
      }

      console.log('Job status:', job.status);
      setScrapingJobs(prev => ({
        ...prev,
        [providerId]: {
          status: job.status,
          last_run_at: job.created_at,
          error_message: job.error_message
        }
      }));

      return job.status;
    } catch (error) {
      console.error('Error in checkJobStatus:', error);
    }
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessingQueue || scrapingQueue.length === 0) {
      return;
    }

    setIsProcessingQueue(true);
    const providerId = scrapingQueue[0];

    try {
      await handleScrapeWithRetry(providerId);
    } finally {
      setScrapingQueue(prev => prev.slice(1));
      setIsProcessingQueue(false);
    }
  }, [isProcessingQueue, scrapingQueue]);

  useEffect(() => {
    const shouldStartProcessing = scrapingQueue.length > 0 && !isProcessingQueue;
    
    if (shouldStartProcessing) {
      processQueue();
    }
  }, [scrapingQueue, isProcessingQueue, processQueue]);

  const addToQueue = useCallback((providerId: string) => {
    console.log(`Adding provider ${providerId} to scraping queue`);
    setScrapingQueue(prev => [...prev, providerId]);
  }, []);

  const handleScrapeWithRetry = async (providerId: string, retryCount = 0): Promise<void> => {
    try {
      await handleScrape(providerId);
    } catch (error) {
      console.error(`Error during scraping attempt ${retryCount + 1}:`, error);
      
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return handleScrapeWithRetry(providerId, retryCount + 1);
      }
      throw error;
    }
  };

  const handleScrape = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    
    if (!provider || !provider.property_id) {
      throw new Error('Invalid provider configuration');
    }

    setScrapingStates(prev => ({ ...prev, [providerId]: true }));
    setScrapingJobs(prev => ({
      ...prev,
      [providerId]: {
        status: 'in_progress',
        last_run_at: new Date().toISOString(),
        error_message: null
      }
    }));

    try {
      console.log('Getting credentials for provider:', providerId);
      const { data: credentialsData, error: credentialsError } = await supabase.rpc(
        'get_decrypted_credentials',
        { property_id_input: provider.property_id }
      );

      if (credentialsError || !credentialsData) {
        console.error('Failed to fetch credentials:', credentialsError);
        throw new Error('Failed to fetch credentials');
      }

      const credentials = credentialsData as unknown as Credentials;
      console.log('Starting scraping for provider:', provider.provider_name);

      const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke<ScrapingResponse>(
        'scrape-utility-invoices',
        {
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
            utilityId: providerId,
            provider: provider.provider_name,
            type: provider.utility_type,
            location: provider.location_name
          })
        }
      );

      if (scrapeError) {
        console.error('Scraping error:', scrapeError);
        throw scrapeError;
      }

      if (!scrapeData || !scrapeData.success) {
        console.error('Scraping failed:', scrapeData?.error);
        throw new Error(scrapeData?.error || 'Scraping failed');
      }

      console.log('Scraping succeeded. Job ID:', scrapeData.jobId);

      const checkJobInterval = setInterval(async () => {
        const status = await checkJobStatus(scrapeData.jobId!, providerId);
        
        if (status === 'completed' || status === 'failed') {
          clearInterval(checkJobInterval);
          
          if (status === 'completed') {
            toast({
              title: "Success",
              description: "Successfully fetched utility bills",
            });
          }
        }
      }, JOB_CHECK_INTERVAL);

      // Cleanup interval after 5 minutes
      setTimeout(() => clearInterval(checkJobInterval), 300000);

    } catch (error) {
      console.error('Scraping failed:', error);
      
      setScrapingJobs(prev => ({
        ...prev,
        [providerId]: {
          status: 'failed',
          last_run_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }));

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch utility bills. Please try again.",
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
