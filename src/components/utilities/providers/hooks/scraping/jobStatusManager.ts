
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
      
      // Check for navigation timeout after CAPTCHA
      if (job.status === 'failed' && 
          job.error_message && 
          (job.error_message.includes('Waiting for login navigation') || 
           job.error_message.includes('navigation timeout'))) {
        console.log('Job failed due to navigation timeout after CAPTCHA, special handling');
        
        updateJobStatus(providerId, {
          status: 'failed',
          last_run_at: job.created_at,
          error_message: 'Login navigation timed out after CAPTCHA submission. The provider website may be slow or experiencing high traffic. Please try again later.'
        });
      } 
      // Check if the job shows signs of being interrupted after CAPTCHA
      else if (job.status === 'failed' && 
          job.error_message && 
          job.error_message.includes('CAPTCHA submitted')) {
        console.log('Job failed after CAPTCHA submission, special handling');
        
        updateJobStatus(providerId, {
          status: 'failed',
          last_run_at: job.created_at,
          error_message: 'CAPTCHA was submitted but the process was interrupted afterward. This often happens when the provider website is slow to respond after login. Please try again.'
        });
      } 
      // Check for cookie or session issues
      else if (job.status === 'failed' && 
          job.error_message && 
          (job.error_message.includes('cookie') || job.error_message.includes('session'))) {
        console.log('Job failed due to cookie/session issues, special handling');
        
        updateJobStatus(providerId, {
          status: 'failed',
          last_run_at: job.created_at,
          error_message: 'Session management issue with the provider website. This might be due to expired cookies or provider session restrictions. Try clearing your browser cookies and try again later.'
        });
      }
      // Check for "Change consumption location" dialog issues
      else if (job.status === 'failed' && 
          job.error_message && 
          (job.error_message.includes('Change consumption location') || 
           job.error_message.includes('Schimbă locul de consum'))) {
        console.log('Job failed due to consumption location selection, special handling');
        
        updateJobStatus(providerId, {
          status: 'failed',
          last_run_at: job.created_at,
          error_message: 'The scraping process failed during consumption location selection. This is a common issue with the ENGIE Romania website and often requires manual login. Please try again later or log in directly to the provider website.'
        });
      }
      else {
        // Regular job status update
        updateJobStatus(providerId, {
          status: job.status,
          last_run_at: job.created_at,
          error_message: job.error_message
        });
      }

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
            
            // Handle navigation timeout after CAPTCHA
            if (job.error_message.includes('Waiting for login navigation') || 
                job.error_message.includes('navigation timeout')) {
              errorDescription = "The system timed out while waiting for the login page to respond after CAPTCHA submission. The provider website may be slow or experiencing high traffic. Please try again later.";
            }
            // Handle CAPTCHA specific errors
            else if (job.error_message.includes('CAPTCHA submitted')) {
              errorDescription = "The CAPTCHA was successfully submitted, but the process was interrupted afterward. This could be due to the provider's website being slow to respond. Please try again.";
            } 
            else if (job.error_message.includes('cookie') || job.error_message.includes('session')) {
              errorDescription = "Session management issue with the provider website. This might be due to expired cookies or session timeout. Please try clearing your browser cookies and try again later.";
            }
            else if (job.error_message.includes('Change consumption location') || 
                     job.error_message.includes('Schimbă locul de consum')) {
              errorDescription = "The process failed during consumption location selection. This is a common issue with the ENGIE Romania website. Please try again later or log in manually to the provider website.";
            }
            else {
              errorDescription = formatEdgeFunctionError(job.error_message);
            }
            
            // Add specific error handling for different scenarios
            if (job.error_message.includes("BROWSERLESS_API_KEY")) {
              errorDescription = "The system is missing the Browserless API key required for web scraping. Please contact your administrator.";
            } else if (job.error_message.includes("Login failed")) {
              errorDescription = "Could not log in to the provider website. Please check your credentials or try again later.";
            } else if (job.error_message.includes("CAPTCHA") || job.error_message.includes("captcha")) {
              errorDescription = "The provider's website requires CAPTCHA verification which could not be solved automatically. Please try again or contact support.";
            } else if (job.error_message.includes("SyntaxError")) {
              errorDescription = "The provider website returned unexpected data. This often happens when they update their site structure. Please try again later.";
            } else if (job.error_message.includes("timeout")) {
              errorDescription = "The request to the provider website timed out. This could be due to slow internet or the website being temporarily down.";
            } else if (job.error_message.includes("function is shutdown") || job.error_message.includes("interrupted")) {
              errorDescription = "The scraping process was interrupted. This may be due to exceeding the function execution time limit. Please try again.";
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
