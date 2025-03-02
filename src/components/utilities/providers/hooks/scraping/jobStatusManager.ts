
import { supabase } from "@/integrations/supabase/client";
import { ScrapingJob } from "../../types";
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { JOB_CHECK_INTERVAL, JOB_CHECK_MAX_TIME } from "./constants";

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
      
      // For ENGIE providers that were created as a fallback,
      // we mark them completed with a special message
      const { data: job } = await supabase
        .from('scraping_jobs')
        .select('utility_provider_id, provider')
        .eq('id', jobId)
        .single();
        
      if (job?.provider === 'ENGIE' && status === 'pending' && 
          job.utility_provider_id === providerId) {
        console.log('ENGIE job created as fallback, updating status to completed');
        
        await supabase
          .from('scraping_jobs')
          .update({
            status: 'completed',
            error_message: 'ENGIE bills must be downloaded manually from the provider website',
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId);
          
        updateJobStatus(providerId, {
          status: 'completed',
          last_run_at: new Date().toISOString(),
          error_message: 'ENGIE bills must be downloaded manually from the provider website'
        });
        
        toast({
          title: "Information",
          description: "ENGIE bills must be downloaded manually from the provider website. Auto-scraping is not yet available.",
        });
        
        clearInterval(checkJobInterval);
        return;
      }
      
      if (status === 'completed' || status === 'failed') {
        clearInterval(checkJobInterval);
        
        if (status === 'completed') {
          toast({
            title: "Success",
            description: "Successfully fetched utility bills",
          });
        } else if (status === 'failed') {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to process utility bills. The provider may have changed their website.",
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
