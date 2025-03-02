
import { supabase } from "@/integrations/supabase/client";
import { ScrapingJob } from "../../types";
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { JOB_CHECK_INTERVAL, JOB_CHECK_MAX_TIME } from "./constants";
import { formatEdgeFunctionError } from "./errorHandlers";

/**
 * Hook for checking and managing job status
 */
export function useJobStatusManager() {
  const { toast } = useToast();

  const checkJobStatus = useCallback(async (jobId: string, providerId: string, 
    updateJobStatus: (providerId: string, status: ScrapingJob) => void) => {
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
      console.log('Job error message:', job.error_message || 'None');
      
      updateJobStatus(providerId, {
        status: job.status,
        last_run_at: job.created_at,
        error_message: job.error_message
      });

      return job.status;
    } catch (error) {
      console.error('Error in checkJobStatus:', error);
    }
  }, []);

  const setupJobStatusMonitoring = useCallback((
    jobId: string, 
    providerId: string,
    updateJobStatus: (providerId: string, status: ScrapingJob) => void
  ) => {
    console.log('Setting up job status monitoring for job:', jobId);
    
    const checkJobInterval = setInterval(async () => {
      const status = await checkJobStatus(jobId, providerId, updateJobStatus);
      console.log('Job status check:', status);
      
      if (status === 'completed' || status === 'failed') {
        clearInterval(checkJobInterval);
        
        if (status === 'completed') {
          toast({
            title: "Success",
            description: "Successfully fetched utility bills",
          });
        } else if (status === 'failed') {
          // Check if we have a specific error message
          const { data: job } = await supabase
            .from('scraping_jobs')
            .select('error_message')
            .eq('id', jobId)
            .single();
            
          let errorDescription = "Failed to process utility bills. The provider may have changed their website or there might be a configuration issue.";
          
          if (job?.error_message) {
            console.error('Scraping job failed with error:', job.error_message);
            errorDescription = formatEdgeFunctionError(job.error_message);
            
            // Add specific error handling for missing API key, CAPTCHA issues, and other common errors
            if (job.error_message.includes("BROWSERLESS_API_KEY")) {
              errorDescription = "The system is missing the Browserless API key required for web scraping. Please contact your administrator.";
            } else if (job.error_message.includes("reCAPTCHA") || job.error_message.includes("captcha")) {
              errorDescription = "The provider's website requires CAPTCHA verification which cannot be automated. Please log in to the provider's website directly to download your bills.";
            } else if (job.error_message.includes("Module not found")) {
              errorDescription = "There's a configuration issue with the scraper. Please contact support.";
            } else if (job.error_message.includes("usernameSelector is not defined")) {
              errorDescription = "The login selectors for this provider need to be updated. Please contact support.";
            } else if (job.error_message.includes("400 Bad Request")) {
              errorDescription = "The Browserless API returned a 400 Bad Request error. Please check your API key configuration.";
            } else if (job.error_message.includes("429 Too Many Requests")) {
              errorDescription = "The scraping service has reached its rate limit. Please try again later.";
            } else if (job.error_message.includes("403 Forbidden")) {
              errorDescription = "The API key for scraping service may be invalid or exceeded its usage limits.";
            } else if (job.error_message.includes("timeout")) {
              errorDescription = "The request to the provider website timed out. This could be due to slow internet or the website being temporarily down.";
            } else if (job.error_message.includes("Authentication failed")) {
              errorDescription = "The provider login credentials were rejected. Please check your username and password.";
            } else if (
              job.error_message.includes("elements is not allowed") || 
              job.error_message.includes("\"elements\" is not allowed") ||
              job.error_message.includes("options is not allowed") || 
              job.error_message.includes("\"options\" is not allowed")
            ) {
              errorDescription = "There is a configuration issue with the Browserless API. Please contact your administrator to update the scraper.";
            } else if (
              job.error_message.includes("NoApplicationProtocol") || 
              job.error_message.includes("WebSocket") || 
              job.error_message.includes("connection failed")
            ) {
              errorDescription = "Failed to establish a secure connection to the utility provider service. This is likely a temporary network issue. Please try again later.";
            }
          }
          
          toast({
            variant: "destructive",
            title: "Error",
            description: errorDescription,
          });
        }
      }
    }, JOB_CHECK_INTERVAL);

    // Cleanup interval after max time
    setTimeout(() => clearInterval(checkJobInterval), JOB_CHECK_MAX_TIME);
    
    return checkJobInterval;
  }, [checkJobStatus, toast]);

  return {
    checkJobStatus,
    setupJobStatusMonitoring
  };
}
