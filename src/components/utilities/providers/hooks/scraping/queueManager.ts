
import { useState, useEffect, useCallback } from "react";
import { UtilityProvider, ScrapingJob } from "../../types";
import { ScrapingState } from "./types";
import { MAX_RETRIES, RETRY_DELAY } from "./constants";
import { 
  formatErrorMessage, 
  useErrorNotification, 
  isEdgeFunctionError, 
  formatEdgeFunctionError 
} from "./errorHandlers";
import { getProviderCredentials, invokeScrapingFunction } from "./scrapingService";
import { useJobStatusManager } from "./jobStatusManager";

/**
 * Hook for managing the scraping queue
 */
export function useScrapingQueue(providers: UtilityProvider[]) {
  const [state, setState] = useState<ScrapingState>({
    scrapingStates: {},
    scrapingJobs: {},
    scrapingQueue: [],
    isProcessingQueue: false
  });
  
  const { showErrorToast } = useErrorNotification();
  const { setupJobStatusMonitoring } = useJobStatusManager();

  // Helper function to update scraping jobs
  const updateScrapingJob = useCallback((providerId: string, job: ScrapingJob) => {
    setState(prev => ({
      ...prev,
      scrapingJobs: {
        ...prev.scrapingJobs,
        [providerId]: job
      }
    }));
  }, []);

  // Handler for scraping a single provider with retries
  const handleScrapeWithRetry = useCallback(async (providerId: string, retryCount = 0): Promise<void> => {
    try {
      console.log(`Attempt ${retryCount + 1} for provider ${providerId}`);
      await handleScrape(providerId);
    } catch (error) {
      console.error(`Error during scraping attempt ${retryCount + 1}:`, error);
      
      // If we've hit a fatal edge function error (like 500), don't retry more than once
      if (isEdgeFunctionError(error) && retryCount >= 1) {
        console.log('Edge function is consistently failing, not retrying further');
        
        // Format user-friendly error message
        const errorMessage = formatErrorMessage(error);
        showErrorToast(error);
        
        throw new Error(errorMessage);
      }
      
      // Check for prima-pagina (already logged in) error
      if (error instanceof Error && error.message.includes('/prima-pagina')) {
        console.log('User is already logged in (on prima-pagina). Updating job status');
        
        const customMessage = 'Successfully logged in to the ENGIE website, but encountered issues navigating to the invoices page. Please try again later when the website might be more responsive.';
        
        updateScrapingJob(providerId, {
          status: 'failed',
          last_run_at: new Date().toISOString(),
          error_message: customMessage
        });
        
        throw new Error(customMessage);
      }
      
      // Check if this is a "waiting for login navigation" or function shutdown error
      if (error instanceof Error && 
          (error.message.includes('Waiting for login navigation') || 
           error.message.includes('function is shutdown') ||
           error.message.includes('istoric-facturi') ||
           error.message.includes('table/tbody') ||
           error.message.includes('Schimbă locul de consum'))) {
        console.log('Login navigation, invoice table, or consumption location issue detected, updating job status');
        
        let customMessage = 'The process was interrupted. Please try again later.';
        
        if (error.message.includes('Waiting for login navigation')) {
          customMessage = 'The process timed out while waiting for the login page to respond after credentials submission. The provider website may be slow or experiencing high traffic. Please try again later.';
        } else if (error.message.includes('Schimbă locul de consum')) {
          customMessage = 'The process failed while attempting to select the consumption location. This is a common issue with the ENGIE Romania website. Please try again later.';
        } else if (error.message.includes('istoric-facturi') || error.message.includes('table/tbody')) {
          customMessage = 'The process timed out while waiting for the invoices table to load. This often happens when the ENGIE website is slow to respond. Please try again later.';
        }
        
        // Update the job status to show that we detected the specific issue
        updateScrapingJob(providerId, {
          status: 'failed',
          last_run_at: new Date().toISOString(),
          error_message: customMessage
        });
        
        throw new Error(customMessage);
      }
      
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return handleScrapeWithRetry(providerId, retryCount + 1);
      }
      
      // Format user-friendly error message
      const errorMessage = formatErrorMessage(error);
      
      showErrorToast(error);
      
      throw new Error(errorMessage);
    }
  }, [showErrorToast, updateScrapingJob]);

  // Main scraping handler
  const handleScrape = useCallback(async (providerId: string) => {
    console.log('Starting scrape for provider:', providerId);
    const provider = providers.find(p => p.id === providerId);
    
    if (!provider || !provider.property_id) {
      console.error('Invalid provider configuration:', provider);
      throw new Error('Invalid provider configuration');
    }

    setState(prev => ({
      ...prev,
      scrapingStates: { ...prev.scrapingStates, [providerId]: true },
      scrapingJobs: {
        ...prev.scrapingJobs,
        [providerId]: {
          status: 'in_progress',
          last_run_at: new Date().toISOString(),
          error_message: null
        }
      }
    }));

    try {
      // Get credentials and invoke scraping function
      const credentials = await getProviderCredentials(providerId, provider.property_id);
      const scrapeData = await invokeScrapingFunction(provider, credentials);
      
      console.log('Scraping succeeded. Job ID:', scrapeData.jobId);

      // Setup job status monitoring
      setupJobStatusMonitoring(scrapeData.jobId!, providerId, updateScrapingJob);

    } catch (error) {
      console.error('Scraping failed:', error);
      
      // Special handling for ENGIE Romania specific errors
      if (error instanceof Error) {
        if (error.message.includes('Waiting for login navigation') || 
            error.message.includes('function is shutdown')) {
          updateScrapingJob(providerId, {
            status: 'failed',
            last_run_at: new Date().toISOString(),
            error_message: 'The process timed out while waiting for the login page to respond after credentials submission. The provider website may be slow or experiencing high traffic. Please try again later.'
          });
        } else if (error.message.includes('Schimbă locul de consum')) {
          updateScrapingJob(providerId, {
            status: 'failed',
            last_run_at: new Date().toISOString(),
            error_message: 'The process failed while attempting to select the consumption location. This is a common issue with the ENGIE Romania website. Please try again later.'
          });
        } else if (error.message.includes('istoric-facturi') || error.message.includes('table/tbody')) {
          updateScrapingJob(providerId, {
            status: 'failed',
            last_run_at: new Date().toISOString(),
            error_message: 'The process timed out while waiting for the invoices table to load. This often happens when the ENGIE website is slow to respond. Please try again later.'
          });
        } else {
          updateScrapingJob(providerId, {
            status: 'failed',
            last_run_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'An unexpected error occurred'
          });
        }
      } else {
        updateScrapingJob(providerId, {
          status: 'failed',
          last_run_at: new Date().toISOString(),
          error_message: 'An unexpected error occurred during scraping'
        });
      }

      throw error;
    } finally {
      setState(prev => ({
        ...prev,
        scrapingStates: { ...prev.scrapingStates, [providerId]: false }
      }));
    }
  }, [providers, setupJobStatusMonitoring, updateScrapingJob]);

  // Add provider to queue
  const addToQueue = useCallback((providerId: string) => {
    console.log(`Adding provider ${providerId} to scraping queue`);
    setState(prev => ({
      ...prev,
      scrapingQueue: [...prev.scrapingQueue, providerId]
    }));
  }, []);

  // Process queue
  const processQueue = useCallback(async () => {
    if (state.isProcessingQueue || state.scrapingQueue.length === 0) {
      return;
    }

    setState(prev => ({ ...prev, isProcessingQueue: true }));
    const providerId = state.scrapingQueue[0];
    console.log('Processing queue for provider:', providerId);

    try {
      await handleScrapeWithRetry(providerId);
    } catch (error) {
      console.error('Error processing queue:', error);
      
      // Special handling for specific errors
      if (error instanceof Error) {
        if (error.message.includes('Waiting for login navigation') || 
            error.message.includes('function is shutdown')) {
          updateScrapingJob(providerId, {
            status: 'failed', 
            last_run_at: new Date().toISOString(),
            error_message: 'The process timed out while waiting for the login page to respond after credentials submission. The provider website may be slow or experiencing high traffic. Please try again later.'
          });
        } else if (error.message.includes('Schimbă locul de consum')) {
          updateScrapingJob(providerId, {
            status: 'failed', 
            last_run_at: new Date().toISOString(),
            error_message: 'The process failed while attempting to select the consumption location. This is a common issue with the ENGIE Romania website. Please try again later.'
          });
        } else if (error.message.includes('istoric-facturi') || error.message.includes('table/tbody')) {
          updateScrapingJob(providerId, {
            status: 'failed', 
            last_run_at: new Date().toISOString(),
            error_message: 'The process timed out while waiting for the invoices table to load. This often happens when the ENGIE website is slow to respond. Please try again later.'
          });
        } else {
          // Update job status to failed when we've exhausted retries
          updateScrapingJob(providerId, {
            status: 'failed',
            last_run_at: new Date().toISOString(),
            error_message: error instanceof Error 
              ? error.message 
              : 'Failed to connect to utility provider. Please try again later.'
          });
        }
      } else {
        updateScrapingJob(providerId, {
          status: 'failed',
          last_run_at: new Date().toISOString(),
          error_message: 'An unexpected error occurred'
        });
      }
    } finally {
      setState(prev => ({
        ...prev,
        scrapingQueue: prev.scrapingQueue.slice(1),
        isProcessingQueue: false
      }));
    }
  }, [state.isProcessingQueue, state.scrapingQueue, handleScrapeWithRetry, updateScrapingJob]);

  // Start queue processing when needed
  useEffect(() => {
    const shouldStartProcessing = state.scrapingQueue.length > 0 && !state.isProcessingQueue;
    
    if (shouldStartProcessing) {
      console.log('Starting queue processing with', state.scrapingQueue.length, 'items');
      processQueue();
    }
  }, [state.scrapingQueue, state.isProcessingQueue, processQueue]);

  return {
    scrapingStates: state.scrapingStates,
    scrapingJobs: state.scrapingJobs,
    addToQueue,
    isProcessingQueue: state.isProcessingQueue
  };
}
