
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
        return 'text-gray-500';
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Fetching...';
    if (status === 'failed') return 'Retry Fetch';
    return 'Fetch Bills';
  };

  const getErrorMessage = () => {
    if (!errorMessage) return 'Failed to fetch utility bills';
    
    if (errorMessage.includes('Edge Function returned a non-2xx status code')) {
      return 'The utility provider service is currently unavailable. Please try again later.';
    }
    
    if (errorMessage.includes('SyntaxError: Unexpected end of JSON input')) {
      return 'The scraping service returned invalid data. This is often due to provider website changes.';
    }
    
    if (errorMessage.includes('Waiting for login navigation') || errorMessage.includes('function is shutdown')) {
      return 'The system timed out while waiting for the login page to respond. Please try again later.';
    }

    if (errorMessage.includes('CAPTCHA')) {
      if (errorMessage.includes('submitted')) {
        return 'CAPTCHA was submitted but the login process timed out. Please try again.';
      }
      return 'The provider website has CAPTCHA protection which could not be solved automatically.';
    }
    
    if (errorMessage.includes('Login failed')) {
      return 'Login to the provider website failed. Please check your credentials.';
    }
    
    if (errorMessage.includes('function is shutdown') || errorMessage.includes('EarlyDrop')) {
      return 'The scraping process was interrupted due to resource limitations. Please try again with a shorter date range or during off-peak hours.';
    }
    
    if (errorMessage.includes('Change consumption location') || errorMessage.includes('Schimbă locul de consum')) {
      return 'Failed while selecting consumption location. This is a common issue with ENGIE Romania. Please try again later.';
    }
    
    if (errorMessage.includes('cookie') || errorMessage.includes('session')) {
      return 'Session management issue detected. Provider website may have expired your session. Please try clearing cookies and try again.';
    }

    if (errorMessage.includes('MyENGIE app popup') || errorMessage.includes('Mai târziu')) {
      return 'The process was interrupted by a promotional popup on the ENGIE website. We\'ll improve handling of this in future updates.';
    }

    if (errorMessage.includes('istoric-facturi') || errorMessage.includes('table/tbody')) {
      return 'The process timed out while trying to load the invoices table. The ENGIE website may be slow to respond.';
    }
    
    // Handle WebSocket and SSL protocol errors
    if (errorMessage.includes('WebSocket')) {
      if (errorMessage.includes('NoApplicationProtocol')) {
        return 'Network connection issue due to SSL/TLS protocol mismatch. The provider website may have updated its security settings. Please try again later.';
      }
      return 'WebSocket connection error occurred. This may be due to network issues or firewall restrictions. Please try again later.';
    }
    
    return errorMessage;
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-2 text-sm space-y-2 md:space-y-0">
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
          <div className="flex items-start mt-1 text-red-600">
            <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
            <p className="text-xs">{getErrorMessage()}</p>
          </div>
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
  );
}
