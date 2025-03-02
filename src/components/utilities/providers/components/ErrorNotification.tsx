
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ErrorNotificationProps {
  errorMessage: string | null;
}

export function ErrorNotification({ errorMessage }: ErrorNotificationProps) {
  if (!errorMessage) return null;
  
  // Check if this is a 500 error and provide a more helpful message
  let displayMessage = errorMessage;
  
  if (errorMessage.includes("500") || 
      errorMessage.includes("Internal Server Error") ||
      errorMessage.includes("Edge Function returned a non-2xx status code")) {
    displayMessage = "The utility provider service is temporarily unavailable. This is often due to provider website changes or system maintenance. Please try again later.";
  }
  
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{displayMessage}</AlertDescription>
    </Alert>
  );
}
