
import { ProviderCard } from "./components/ProviderCard";
import { useScraping } from "./hooks/useScraping";
import { UtilityProvider } from "./types";

interface ProviderListProps {
  providers: UtilityProvider[];
  onDelete: (id: string) => void;
  onEdit: (provider: UtilityProvider) => void;
  isLoading: boolean;
}

export function ProviderList({ providers, onDelete, onEdit, isLoading }: ProviderListProps) {
  const { scrapingStates, scrapingJobs, addToQueue, isProcessingQueue } = useScraping(providers);

  return (
    <div className="space-y-4">
      {providers.map((provider) => (
        <ProviderCard
          key={provider.id}
          provider={provider}
          scrapingJob={scrapingJobs[provider.id]}
          isLoading={isLoading}
          isScrapingLoading={scrapingStates[provider.id] || false}
          onEdit={onEdit}
          onDelete={onDelete}
          onScrape={addToQueue}
        />
      ))}
    </div>
  );
}
