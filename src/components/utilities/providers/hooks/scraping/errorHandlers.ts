
import { useToast } from "@/hooks/use-toast";

/**
 * Formats error messages into user-friendly text
 */
export function formatErrorMessage(error: unknown): string {
  let errorMessage = "Failed to connect to utility provider.";
  
  if (error instanceof Error) {
    if (error.message.includes("400 Bad Request")) {
      errorMessage = "The request to the utility provider's website was invalid. Please check your Browserless API key.";
    } else if (error.message.includes("status code 500") || error.message.includes("non-2xx status")) {
      errorMessage = "The utility provider service is currently unavailable. Please try again later.";
    } else if (error.message.includes("function")) {
      errorMessage = "There was an issue with the database function. Contact support.";
    } else if (error.message.includes("timeout")) {
      errorMessage = "Connection to the utility provider timed out. Try again later.";
    } else if (error.message.includes("credential")) {
      errorMessage = "Invalid credentials. Please check your username and password.";
    } else if (error.message.includes("pgcrypto")) {
      errorMessage = "The pgcrypto extension is not enabled in the database. Please contact your administrator.";
    } else if (error.message.includes("Edge Function")) {
      errorMessage = "The utility provider service is temporarily unavailable. We're working on fixing this issue.";
    } else if (error.message.includes("provider's website")) {
      errorMessage = error.message;
    } else if (error.message.includes("Unsupported provider")) {
      errorMessage = "This utility provider is not yet fully supported. We're working on adding support for it.";
    } else if (error.message.includes("BROWSERLESS_API_KEY")) {
      errorMessage = "Missing Browserless API key. Contact your administrator to set this up.";
    } else if (error.message.includes("usernameSelector is not defined")) {
      errorMessage = "The login selectors for this provider need to be updated. Please contact support.";
    }
  }
  
  return errorMessage;
}

/**
 * Handles displaying error toasts
 */
export function useErrorNotification() {
  const { toast } = useToast();
  
  const showErrorToast = (error: unknown) => {
    const message = formatErrorMessage(error);
    
    toast({
      variant: "destructive",
      title: "Error",
      description: message,
    });
  };
  
  return { showErrorToast };
}

/**
 * Formats specific error messages for edge function errors
 */
export function formatEdgeFunctionError(errorMessage: string | undefined): string {
  if (!errorMessage) return "Failed to fetch utility bills";
  
  if (errorMessage.includes("400 Bad Request")) {
    return "The request to Browserless was invalid. Please check your Browserless API key.";
  }
  
  if (errorMessage.includes("non-2xx status") || errorMessage.includes("Edge Function")) {
    return "The utility provider's website may be down or has changed. Please try again later.";
  }
  
  if (errorMessage.includes("Unsupported provider")) {
    return "This utility provider is not yet supported for automated bill fetching.";
  }
  
  if (errorMessage.includes("BROWSERLESS_API_KEY")) {
    return "The Browserless API key is missing. Please contact your administrator.";
  }
  
  if (errorMessage.includes("usernameSelector is not defined")) {
    return "The scraper needs updating. Please contact support with the error details.";
  }
  
  return errorMessage;
}

/**
 * Check if the error is related to a Supabase Edge Function failure
 */
export function isEdgeFunctionError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("Edge Function") || 
           error.message.includes("non-2xx status") || 
           error.message.includes("status code 500") ||
           error.message.includes("provider's website") ||
           error.message.includes("400 Bad Request") ||
           error.message.includes("usernameSelector is not defined");
  }
  return false;
}
