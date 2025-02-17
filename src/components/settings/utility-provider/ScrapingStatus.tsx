
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ScrapingStatusProps {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  lastRunAt: string | null;
  errorMessage: string | null;
  onScrape: () => void;
  isLoading: boolean;
}

export function ScrapingStatus({
  status,
  lastRunAt,
  errorMessage,
  onScrape,
  isLoading
}: ScrapingStatusProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'in_progress':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex items-center justify-between mt-2 text-sm">
      <div>
        <span className={getStatusColor()}>
          Status: {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        {lastRunAt && (
          <span className="text-muted-foreground ml-2">
            (Last run: {formatDistanceToNow(new Date(lastRunAt), { addSuffix: true })})
          </span>
        )}
        {errorMessage && status === 'failed' && (
          <p className="text-red-600 mt-1">{errorMessage}</p>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onScrape}
        disabled={isLoading || status === 'in_progress'}
        className="ml-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        <span className="ml-2">{isLoading ? 'Fetching...' : 'Fetch Bills'}</span>
      </Button>
    </div>
  );
}
