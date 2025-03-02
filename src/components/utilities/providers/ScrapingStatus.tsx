
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ErrorNotification } from "./components/ErrorNotification";

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

  const getButtonText = () => {
    if (isLoading) return 'Fetching...';
    if (status === 'failed') return 'Retry Fetch';
    return 'Fetch Bills';
  };
  
  const formatStatus = (status: string): string => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between text-sm space-y-2 md:space-y-0">
        <div>
          <span className={getStatusColor()}>
            Status: {formatStatus(status)}
          </span>
          {lastRunAt && (
            <span className="text-muted-foreground ml-2">
              (Last run: {formatDistanceToNow(new Date(lastRunAt), { addSuffix: true })})
            </span>
          )}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onScrape}
                disabled={isLoading || status === 'in_progress'}
                className={`ml-2 ${status === 'failed' ? 'border-red-300 hover:border-red-400' : ''}`}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className={`h-4 w-4 ${status === 'failed' ? 'text-red-500' : ''}`} />
                )}
                <span className="ml-2">{getButtonText()}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {status === 'in_progress' 
                ? "Bill fetching is in progress" 
                : "Fetch latest bills from utility provider"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {errorMessage && status === 'failed' && (
        <ErrorNotification 
          errorMessage={errorMessage} 
          retryAction={onScrape}
        />
      )}
    </div>
  );
}
