
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

  const handleScrape = async (providerId: string) => {
    try {
      const provider = providers.find(p => p.id === providerId);
      
      if (!provider || !provider.property_id) {
        throw new Error('No property associated with this provider');
      }

      console.log('Starting scrape for provider:', providerId, 'property:', provider.property_id);
      setScrapingStates(prev => ({ ...prev, [providerId]: true }));

      // Get the provider details and decrypted credentials
      const { data: credentials, error: credentialsError } = await supabase.rpc(
        'get_decrypted_credentials',
        { property_id_input: provider.property_id }
      );

      if (credentialsError) {
        console.error("Provider credentials error:", credentialsError);
        throw new Error(credentialsError.message || 'Failed to retrieve provider credentials');
      }

      if (!credentials || !credentials.password) {
        console.error("Missing credentials:", credentials);
        throw new Error('No valid utility provider credentials found. Please update the credentials.');
      }

      // Format the request body
      const requestBody = {
        username: credentials.username,
        password: credentials.password,
        utilityId: providerId // Use the provider ID directly
      };

      // Validate request body before sending
      if (!requestBody.username || !requestBody.password || !requestBody.utilityId) {
        console.error("Invalid request body:", {
          hasUsername: !!requestBody.username,
          hasPassword: !!requestBody.password,
          hasUtilityId: !!requestBody.utilityId
        });
        throw new Error('Missing required credentials');
      }

      // Call the edge function with the decrypted credentials
      const { data: scrapeData, error } = await supabase.functions.invoke('scrape-utility-invoices', {
        body: JSON.stringify(requestBody) // Explicitly stringify the request body
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || 'Failed to fetch utility bills');
      }

      // Update scraping job status
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
      console.error('Scraping error:', error);
      
      // Update scraping job with error status
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
    } finally {
      setScrapingStates(prev => ({ ...prev, [providerId]: false }));
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
