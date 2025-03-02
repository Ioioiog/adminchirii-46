
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ErrorNotificationProps {
  errorMessage: string | null;
  retryAction?: () => void;
}

export function ErrorNotification({ errorMessage, retryAction }: ErrorNotificationProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!errorMessage) return null;
  
  // Check if this is a technical error and provide a more helpful message
  let displayMessage = errorMessage;
  let technicalDetails = null;
  
  // Handle various technical errors with user-friendly messages
  if (errorMessage.includes("500") || 
      errorMessage.includes("Internal Server Error") ||
      errorMessage.includes("Edge Function returned a non-2xx status code") ||
      errorMessage.includes("experiencing technical difficulties")) {
    displayMessage = "The utility provider service is temporarily unavailable. This is often due to provider website changes or system maintenance. Please try again later.";
    technicalDetails = errorMessage;
  } else if (errorMessage.includes("WebSocket") || 
            errorMessage.includes("NoApplicationProtocol") ||
            errorMessage.includes("connection failed")) {
    displayMessage = "Could not establish a secure connection to the utility provider. This may be due to network issues or security settings. Please try again later.";
    technicalDetails = errorMessage;
  } else if (errorMessage.includes("CAPTCHA") || errorMessage.includes("captcha")) {
    displayMessage = "The provider's website requires CAPTCHA verification which cannot be automated. Please log in to the provider's website directly to download your bills.";
  } else if (errorMessage.includes("API key") || errorMessage.includes("BROWSERLESS_API_KEY")) {
    displayMessage = "There is a configuration issue with the utility scraping service. Please contact support for assistance.";
  } else if (errorMessage.includes("Authentication failed") || errorMessage.includes("Invalid credentials")) {
    displayMessage = "Login credentials were rejected by the utility provider. Please check your username and password.";
  } else if (errorMessage.includes("timeout")) {
    displayMessage = "The connection to the utility provider timed out. The provider's website may be experiencing high traffic or temporary issues.";
  } else if (errorMessage.includes("SyntaxError") || 
            errorMessage.includes("Unexpected end of JSON input") ||
            errorMessage.includes("Invalid request format")) {
    displayMessage = "There was a communication error with the utility provider service. This is often temporary. Please try again later.";
    technicalDetails = errorMessage;
  } else if (errorMessage.includes("Missing required fields")) {
    displayMessage = "Some required information is missing for the utility provider connection. Please update your provider settings and try again.";
    technicalDetails = errorMessage;
  }
  
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="space-y-2">
        <div>{displayMessage}</div>
        
        {technicalDetails && (
          <Collapsible 
            open={isOpen} 
            onOpenChange={setIsOpen} 
            className="rounded-md overflow-hidden"
          >
            <div className="flex items-center space-x-2 mt-2">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="p-0 h-6 gap-1">
                  {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  <span className="text-xs">{isOpen ? "Hide technical details" : "Show technical details"}</span>
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-2">
              <div className="text-xs bg-destructive/10 p-2 rounded">
                {technicalDetails}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {retryAction && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={retryAction} 
            className="mt-2 border-destructive/20 hover:bg-destructive/10"
          >
            Retry Connection
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
