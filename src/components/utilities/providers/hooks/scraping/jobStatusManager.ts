
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
      
      // Check if the job has a shutdown event in the error message
      if (job.status === 'in_progress' && 
          (job.error_message?.includes('shutdown') || job.error_message?.includes('EarlyDrop'))) {
        console.log('Job was terminated due to provider website timeout, marking as failed');
        
        // Update the job status directly in the database
        await supabase
          .from('scraping_jobs')
          .update({
            status: 'failed',
            error_message: 'The scraping process was terminated due to the ENGIE website taking too long to respond. The Edge Function was shut down with reason: EarlyDrop. This typically happens during peak hours when ENGIE\'s website becomes slow.'
          })
          .eq('id', jobId);
          
        // Update the local state
        updateJobStatus(providerId, {
          status: 'failed',
          last_run_at: job.created_at,
          error_message: 'The scraping process was terminated due to ENGIE\'s website slow response. Please try again during off-peak hours.'
        });
        
        return 'failed';
      }
      
      // Check for WebSocket connection issues
      if (job.status === 'in_progress' && job.error_message && 
          (job.error_message.includes('WebSocket') || job.error_message.includes('NoApplicationProtocol'))) {
        console.log('Job failed due to WebSocket connection issues, marking as failed');
        
        let errorMessageToShow = 'Network connection issue occurred. Please try again later.';
        
        if (job.error_message.includes('NoApplicationProtocol')) {
          errorMessageToShow = 'Network connection issue due to SSL/TLS protocol mismatch. The provider website may have updated its security settings. Please try again later.';
        }
        
        // Update the job status directly in the database
        await supabase
          .from('scraping_jobs')
          .update({
            status: 'failed',
            error_message: errorMessageToShow
          })
          .eq('id', jobId);
          
        // Update the local state
        updateJobStatus(providerId, {
          status: 'failed',
          last_run_at: job.created_at,
          error_message: errorMessageToShow
        });
        
        return 'failed';
      }
      
      // Continue with regular error handling
      if (job.status === 'failed' && job.error_message && job.error_message.includes('shutdown')) {
        console.log('Job failed due to shutdown, special handling');
        
        updateJobStatus(providerId, {
          status: 'failed',
          last_run_at: job.created_at,
          error_message: 'The process was terminated due to timeout. ENGIE\'s website took too long to respond. Please try again in a few minutes when their website might be less busy.'
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
          error_message: 'CAPTCHA was submitted but the process was interrupted afterward. The ENGIE website might be slow to respond after login. Please try again.'
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
      // Check for MyENGIE app popup issues
      else if (job.status === 'failed' && 
          job.error_message && 
          (job.error_message.includes('MyENGIE app popup') || 
           job.error_message.includes('Mai târziu'))) {
        console.log('Job failed due to MyENGIE app popup, special handling');
        
        updateJobStatus(providerId, {
          status: 'failed',
          last_run_at: job.created_at,
          error_message: 'The scraping process was interrupted by a promotional popup on the ENGIE website. We\'ll improve handling of this in future updates. Please try again later.'
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
    
    // Implement an initial immediate check to detect early failures
    setTimeout(() => {
      checkJobStatus(jobId, providerId, updateJobStatus);
    }, 5000); // Check after 5 seconds initially
    
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
            
            // Handle shutdown errors (seen in your logs)
            if (job.error_message.includes('shutdown')) {
              errorDescription = "The process was terminated due to timeout. ENGIE's website took too long to respond. Please try again in a few minutes when their website might be less busy.";
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
            else if (job.error_message.includes('MyENGIE app popup') || 
                     job.error_message.includes('Mai târziu')) {
              errorDescription = "The process was interrupted by a promotional popup on the ENGIE website. We'll improve handling of this in future updates. Please try again later.";
            }
            else if (job.error_message.includes('shutdown') || job.error_message.includes('EarlyDrop')) {
              errorDescription = "The scraping process was terminated due to ENGIE's website slow response. Please try again during off-peak hours.";
            }
            else if (job.error_message.includes('WebSocket')) {
              if (job.error_message.includes('NoApplicationProtocol')) {
                errorDescription = "Network connection issue due to SSL/TLS protocol mismatch. The provider website may have updated its security settings. Please try again later.";
              } else {
                errorDescription = "WebSocket connection error occurred. This may be due to network issues or firewall restrictions. Please try again later.";
              }
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
    setTimeout(() => {
      clearInterval(checkJobInterval);
      
      // Check one last time if the job is still in progress
      checkJobStatus(jobId, providerId, async (providerId, status) => {
        if (status.status === 'in_progress') {
          console.log('Job appears to be stuck, marking as failed');
          
          // Update the job status directly in the database
          await supabase
            .from('scraping_jobs')
            .update({
              status: 'failed',
              error_message: 'The process timed out. ENGIE\'s website was taking too long to respond. Please try again later when their servers might be less busy.'
            })
            .eq('id', jobId);
            
          updateJobStatus(providerId, {
            status: 'failed',
            last_run_at: new Date().toISOString(),
            error_message: 'The process timed out. ENGIE\'s website was taking too long to respond. Please try again later when their servers might be less busy.'
          });
          
          toast({
            variant: "destructive",
            title: "Error",
            description: "The utility bill fetch process timed out. Please try again later when ENGIE's website might be less busy.",
          });
        }
      });
    }, JOB_CHECK_MAX_TIME);
    
    return checkJobInterval;
  }, [checkJobStatus, toast]);

  return {
    checkJobStatus,
    setupJobStatusMonitoring
  };
}
