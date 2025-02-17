
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrapingStatus } from "./ScrapingStatus";
import { Edit2, Trash2 } from "lucide-react";

interface UtilityProvider {
  id: string;
  provider_name: string;
  username: string;
  password?: string;
  property_id?: string;
  property?: {
    name: string;
    address: string;
  };
  utility_type?: 'electricity' | 'water' | 'gas';
  start_day?: number;
  end_day?: number;
}

interface ScrapingJob {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  last_run_at: string | null;
  error_message: string | null;
}

interface ProviderListProps {
  providers: UtilityProvider[];
  onDelete: (id: string) => void;
  onEdit: (provider: UtilityProvider) => void;
  isLoading: boolean;
}

export function ProviderList({ providers, onDelete, onEdit, isLoading }: ProviderListProps) {
  const [scrapingStates, setScrapingStates] = useState<Record<string, boolean>>({});
  const [scrapingJobs, setScrapingJobs] = useState<Record<string, ScrapingJob>>({});
  const { toast } = useToast();

  console.log('Providers with property details:', providers);

  const handleScrape = async (providerId: string) => {
    try {
      console.log('Starting scrape for provider:', providerId);
      setScrapingStates(prev => ({ ...prev, [providerId]: true }));

      // Get the provider details
      const provider = providers.find(p => p.id === providerId);
      if (!provider?.username) {
        throw new Error('Provider credentials not found');
      }

      // Create or update scraping job
      const { error: jobError } = await supabase
        .from('scraping_jobs')
        .upsert({
          utility_provider_id: providerId,
          status: 'in_progress',
          last_run_at: new Date().toISOString()
        });

      if (jobError) {
        console.error('Error creating scraping job:', jobError);
        throw jobError;
      }

      // Call the edge function to start scraping
      const { data, error } = await supabase.functions.invoke('scrape-utility-invoices', {
        body: { 
          username: provider.username,
          password: provider.password,
          utilityId: providerId
        }
      });

      if (error) {
        console.error('Error invoking edge function:', error);
        throw error;
      }

      console.log('Scraping result:', data);

      // Update scraping job status
      const { error: updateError } = await supabase
        .from('scraping_jobs')
        .update({
          status: 'completed',
          last_run_at: new Date().toISOString(),
          error_message: null
        })
        .eq('utility_provider_id', providerId);

      if (updateError) {
        console.error('Error updating scraping job:', updateError);
        throw updateError;
      }

      setScrapingStates(prev => ({ ...prev, [providerId]: false }));
      setScrapingJobs(prev => ({ 
        ...prev, 
        [providerId]: {
          status: 'completed',
          last_run_at: new Date().toISOString(),
          error_message: null
        }
      }));

      toast({
        title: 'Success',
        description: 'Utility invoices scraped successfully',
      });

    } catch (error: any) {
      console.error('Scraping error:', error);
      
      // Update scraping job with error
      await supabase
        .from('scraping_jobs')
        .update({
          status: 'failed',
          error_message: error.message || 'Failed to scrape invoices',
          last_run_at: new Date().toISOString()
        })
        .eq('utility_provider_id', providerId);

      setScrapingStates(prev => ({ ...prev, [providerId]: false }));
      setScrapingJobs(prev => ({ 
        ...prev, 
        [providerId]: {
          status: 'failed',
          last_run_at: new Date().toISOString(),
          error_message: error.message || 'Failed to scrape invoices'
        }
      }));

      toast({
        title: 'Error',
        description: error.message || 'Failed to scrape invoices',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      {providers.map((provider) => (
        <div
          key={provider.id}
          className="flex flex-col space-y-2 p-4 border rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{provider.provider_name}</p>
              <p className="text-sm text-muted-foreground">
                Username: {provider.username}
              </p>
              {provider.utility_type && (
                <p className="text-sm text-muted-foreground capitalize">
                  Type: {provider.utility_type}
                </p>
              )}
              {provider.property && (
                <p className="text-sm text-muted-foreground">
                  Property: {provider.property.name} ({provider.property.address})
                </p>
              )}
              {provider.start_day && provider.end_day && (
                <p className="text-sm text-muted-foreground">
                  Reading Period: Day {provider.start_day} - {provider.end_day}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(provider)}
                disabled={isLoading || scrapingStates[provider.id]}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(provider.id)}
                disabled={isLoading || scrapingStates[provider.id]}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <ScrapingStatus
            status={scrapingJobs[provider.id]?.status || 'pending'}
            lastRunAt={scrapingJobs[provider.id]?.last_run_at}
            errorMessage={scrapingJobs[provider.id]?.error_message}
            onScrape={() => handleScrape(provider.id)}
            isLoading={scrapingStates[provider.id] || false}
          />
        </div>
      ))}
    </div>
  );
}
