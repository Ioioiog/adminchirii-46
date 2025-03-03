
import { useToast } from "@/hooks/use-toast";

/**
 * Formats error messages into user-friendly text
 */
export function formatErrorMessage(error: unknown): string {
  let errorMessage = "Failed to connect to utility provider.";
  
  if (error instanceof Error) {
    // Handle Browserless API configuration errors
    if (error.message.includes("400 Bad Request")) {
      errorMessage = "The request to the utility provider's website was invalid. Please check your Browserless API key.";
    } else if (
      error.message.includes("elements is not allowed") || 
      error.message.includes("\"elements\" is not allowed") ||
      error.message.includes("options is not allowed") || 
      error.message.includes("\"options\" is not allowed")
    ) {
      errorMessage = "The scraping service needs to be updated. Please contact your administrator to update the Browserless configuration.";
    } else if (error.message.includes("status code 500") || error.message.includes("non-2xx status")) {
      errorMessage = "The utility provider service is currently unavailable. Please try again later.";
    } else if (error.message.includes("function")) {
      if (error.message.includes("shutdown") || error.message.includes("interrupted")) {
        errorMessage = "The scraping process was interrupted. This is often due to reaching the maximum execution time. Please try again.";
      } else {
        errorMessage = "There was an issue with the database function. Contact support.";
      }
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
    } else if (error.message.includes("\"url\" is required")) {
      errorMessage = "The scraper configuration is missing a required URL parameter. Please contact support.";
    } else if (error.message.includes("Module not found")) {
      errorMessage = "Required module is missing. Please contact support to fix the scraper implementation.";
    } else if (error.message.includes("CAPTCHA submitted")) {
      errorMessage = "The CAPTCHA was successfully submitted, but the process was interrupted afterward. Please try again.";
    } else if (error.message.includes("navigation timeout")) {
      errorMessage = "The system timed out waiting for the provider website to respond. Please try again later.";
    } else if (error.message.includes("reCAPTCHA") || error.message.includes("captcha")) {
      errorMessage = "The provider's website requires CAPTCHA verification which cannot be automated. Please log in to the provider's website directly.";
    } else if (error.message.includes("SyntaxError: Unexpected end of JSON")) {
      errorMessage = "The provider website returned incomplete data. This is often due to a timeout or interrupted connection. Please try again.";
    } else if (error.message.includes("cookie") || error.message.includes("session")) {
      errorMessage = "Session management issue with the provider website. This might be due to expired cookies or session timeout. Please try clearing your browser cookies and try again later.";
    } else if (error.message.includes("Change consumption location") || error.message.includes("Schimbă locul de consum")) {
      errorMessage = "Failed while selecting consumption location. This is a common issue with the ENGIE Romania website. Please try again later or log in directly to the provider website.";
    } else if (error.message.includes("MyENGIE app popup") || error.message.includes("Mai târziu")) {
      errorMessage = "The process was interrupted by a promotional popup on the ENGIE website. We'll improve handling of this in future updates.";
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
  
  // Group Browserless API configuration errors together
  if (errorMessage.includes("options is not allowed") || 
      errorMessage.includes("\"options\" is not allowed") ||
      errorMessage.includes("elements is not allowed") ||
      errorMessage.includes("\"elements\" is not allowed")) {
    return "The scraper needs updating. There's an issue with the Browserless API configuration.";
  }
  
  if (errorMessage.includes("\"url\" is required")) {
    return "The scraper configuration is missing a required URL parameter. Please contact support.";
  }
  
  if (errorMessage.includes("non-2xx status") || errorMessage.includes("Edge Function")) {
    return "The utility provider's website may be down or has changed. Please try again later.";
  }
  
  if (errorMessage.includes("function is shutdown") || errorMessage.includes("interrupted")) {
    return "The scraping process was interrupted. This is often due to reaching the function's maximum execution time or session cookies. Please try again.";
  }
  
  if (errorMessage.includes("navigation timeout")) {
    return "The system timed out waiting for the provider website to respond. Please try again later.";
  }
  
  if (errorMessage.includes("CAPTCHA submitted")) {
    return "The CAPTCHA was successfully submitted, but the process was interrupted. This often happens when the provider website is slow to respond. Please try again.";
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

  if (errorMessage.includes("Module not found")) {
    return "There's a configuration issue with the scraper. Please contact support.";
  }
  
  if (errorMessage.includes("reCAPTCHA") || errorMessage.includes("captcha")) {
    return "The provider's website requires CAPTCHA verification which cannot be automated. Please log in to the provider's website directly.";
  }
  
  if (errorMessage.includes("SyntaxError: Unexpected end of JSON")) {
    return "The provider website returned incomplete data. This is often due to a timeout or interrupted connection. Please try again.";
  }
  
  if (errorMessage.includes("cookie") || errorMessage.includes("session")) {
    return "Session management issue with the provider website. This might be due to expired cookies or session timeout. Please try clearing your browser cookies and try again later.";
  }
  
  if (errorMessage.includes("Change consumption location") || errorMessage.includes("Schimbă locul de consum")) {
    return "The scraping process failed during consumption location selection. This is a common issue with the ENGIE Romania website. Please try again later or log in manually to the provider website.";
  }

  if (errorMessage.includes("MyENGIE app popup") || errorMessage.includes("Mai târziu")) {
    return "The process was interrupted by a promotional popup on the ENGIE website. We'll improve handling of this in future updates.";
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
           error.message.includes("options is not allowed") ||
           error.message.includes("\"options\" is not allowed") ||
           error.message.includes("elements is not allowed") ||
           error.message.includes("\"elements\" is not allowed") ||
           error.message.includes("\"url\" is required") ||
           error.message.includes("usernameSelector is not defined") ||
           error.message.includes("Module not found") ||
           error.message.includes("function is shutdown") ||
           error.message.includes("interrupted") ||
           error.message.includes("CAPTCHA submitted") ||
           error.message.includes("navigation timeout") ||
           error.message.includes("SyntaxError: Unexpected end of JSON") ||
           error.message.includes("cookie") ||
           error.message.includes("session") ||
           error.message.includes("Change consumption location") ||
           error.message.includes("Schimbă locul de consum") ||
           error.message.includes("MyENGIE app popup") ||
           error.message.includes("Mai târziu");
  }
  return false;
}
