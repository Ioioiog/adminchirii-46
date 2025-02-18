
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { ScrapingStatus } from "../ScrapingStatus";
import { UtilityProvider, ScrapingJob } from "../types";

interface ProviderCardProps {
  provider: UtilityProvider;
  scrapingJob?: ScrapingJob;
  isLoading: boolean;
  isScrapingLoading: boolean;
  onEdit: (provider: UtilityProvider) => void;
  onDelete: (id: string) => void;
  onScrape: (id: string) => void;
}

export function ProviderCard({
  provider,
  scrapingJob,
  isLoading,
  isScrapingLoading,
  onEdit,
  onDelete,
  onScrape
}: ProviderCardProps) {
  return (
    <div className="flex flex-col space-y-2 p-4 border rounded-lg">
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
            disabled={isLoading || isScrapingLoading}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(provider.id)}
            disabled={isLoading || isScrapingLoading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <ScrapingStatus
        status={scrapingJob?.status || 'pending'}
        lastRunAt={scrapingJob?.last_run_at}
        errorMessage={scrapingJob?.error_message}
        onScrape={() => onScrape(provider.id)}
        isLoading={isScrapingLoading}
      />
    </div>
  );
}
