
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ErrorNotificationProps {
  errorMessage: string | null;
}

export function ErrorNotification({ errorMessage }: ErrorNotificationProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Reset state when the component unmounts or when errorMessage changes
  useEffect(() => {
    return () => {
      // Cleanup function will be called when component unmounts
    };
  }, [errorMessage]);
  
  if (!errorMessage) return null;
  
  // Format the error message to be more user-friendly
  const getUserFriendlyMessage = () => {
    if (errorMessage.includes('BROWSERLESS_API_KEY')) {
      return "The system is missing the API key required for web scraping. Please contact support.";
    }
    
    if (errorMessage.includes('CAPTCHA submitted')) {
      return "The CAPTCHA was successfully submitted. The system is now proceeding with location selection.";
    }

    if (errorMessage.includes('Waiting for account entry')) {
      return "After CAPTCHA verification, the system is waiting for the account to fully load before changing the consumption location.";
    }

    if (errorMessage.includes('function is shutdown')) {
      return "The process was terminated due to timeout. The ENGIE website was taking too long to respond. Please try again in a few minutes when their servers might be less busy.";
    }
    
    if (errorMessage.includes('Change consumption location') || errorMessage.includes('Schimbă locul de consum') || errorMessage.includes('alege locul de consum')) {
      return "The process encountered an issue while trying to select your consumption location. This is a common step when using the ENGIE Romania website.";
    }
    
    if (errorMessage.includes('CAPTCHA') || errorMessage.includes('captcha')) {
      return "The provider's website requires CAPTCHA verification which could not be automatically solved. Please try again or log in to the provider's website directly.";
    }
    
    if (errorMessage.includes('Edge Function') || errorMessage.includes('500')) {
      return "The utility provider service is temporarily unavailable. Please try again later.";
    }
    
    if (errorMessage.includes('Login failed')) {
      return "Unable to log in to the provider website. Please check your credentials or try again later.";
    }
    
    if (errorMessage.includes('SyntaxError')) {
      return "The provider website returned unexpected data. This often happens when the provider updates their website structure.";
    }
    
    if (errorMessage.includes('timeout')) {
      return "The request timed out. The provider website may be experiencing high traffic or server issues. Please wait a few minutes and try again.";
    }
    
    if (errorMessage.includes('cookie') || errorMessage.includes('session')) {
      return "There was an issue with the session management. The provider website may have expired your session or blocked automated access. Please try clearing browser cookies and try again.";
    }

    if (errorMessage.includes('MyENGIE app popup') || errorMessage.includes('Mai târziu')) {
      return "The process was interrupted by a promotional popup on the ENGIE website asking to use their app. We'll improve our handling of this popup in future updates. Please try again.";
    }
    
    if (errorMessage.includes('shutdown') || errorMessage.includes('interrupted') || errorMessage.includes('EarlyDrop')) {
      return "The scraping process was interrupted due to the provider website's slow response time. ENGIE's website is sometimes slow during peak hours. Please try again during off-peak hours.";
    }

    if (errorMessage.includes('istoric-facturi') || errorMessage.includes('table/tbody')) {
      return "The process timed out while trying to load the invoices table. This often happens when the ENGIE website is slow to respond. Please try again later.";
    }
    
    // Add handling for WebSocket and SSL protocol errors
    if (errorMessage.includes('WebSocket')) {
      if (errorMessage.includes('NoApplicationProtocol')) {
        return "There was a network connection issue due to an SSL/TLS protocol mismatch. This often happens when the provider website has updated their security settings. Please try again later.";
      }
      return "A WebSocket connection error occurred during the scraping process. This may be due to network issues or firewall restrictions. Please try again later.";
    }
    
    // Add handling for ENGIE API endpoint errors
    if (errorMessage.includes('gwss.engie.ro')) {
      if (errorMessage.includes('myservices/v1/invoices/history')) {
        return "Failed to retrieve invoice history from ENGIE. The service might be temporarily unavailable or the date range may be too large.";
      }
      if (errorMessage.includes('myservices/v1/placesofconsumption')) {
        return "Failed to retrieve consumption locations from ENGIE. Please try again later or check if your account has any active consumption places.";
      }
      if (errorMessage.includes('myservices/v1/invoices/download')) {
        return "Failed to download invoice files from ENGIE. The files might be temporarily unavailable or there was a network issue.";
      }
      return "Failed to communicate with ENGIE services. Please try again later.";
    }
    
    return "There was an error fetching your utility bills. Please try again later.";
  };
  
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{getUserFriendlyMessage()}</p>
        
        <Collapsible 
          open={showDetails} 
          onOpenChange={setShowDetails}
          className="mt-2"
        >
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center text-xs">
              <HelpCircle className="h-3 w-3 mr-1" />
              {showDetails ? "Hide Technical Details" : "Show Technical Details"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="bg-rose-950/10 p-2 rounded text-xs font-mono whitespace-pre-wrap">
              {errorMessage}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </AlertDescription>
    </Alert>
  );
}
