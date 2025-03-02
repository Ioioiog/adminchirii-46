
import { toast } from "sonner";
import { useCallback } from "react";

/**
 * Custom hook for standardized error notification handling
 */
export function useErrorNotification() {
  const showErrorToast = useCallback((error: unknown) => {
    const message = formatErrorMessage(error);
    
    toast.error("Error", {
      description: message,
      duration: 5000,
    });
  }, []);

  return { showErrorToast };
}

/**
 * Formats error messages for user display
 */
export function formatErrorMessage(error: unknown): string {
  let errorMessage = "An unexpected error occurred";
  
  if (error instanceof Error) {
    errorMessage = error.message;
    
    // Handle Edge Function errors
    if (isEdgeFunctionError(error)) {
      return handleEdgeFunctionError(error);
    }
    
    // Special handling for common error types
    if (error.message.includes("pgcrypto")) {
      errorMessage = "Database configuration error: pgcrypto extension missing";
    } else if (error.message.includes("elements is not allowed") || 
               error.message.includes("\"options\" is not allowed")) {
      errorMessage = "The scraping service requires a configuration update. Please contact support.";
    } else if (error.message.includes("Module not found")) {
      errorMessage = "Required module is missing. Please contact support to fix the scraper implementation.";
    } else if (error.message.includes("reCAPTCHA") || error.message.includes("captcha")) {
      errorMessage = "The provider's website requires CAPTCHA verification which cannot be automated. Please log in to the provider's website directly.";
    } else if (error.message.includes("Refused to get unsafe header") || error.message.includes("Set-Cookie")) {
      errorMessage = "The browser is blocking access to website cookies. This is a security feature. Please try again later or use a different browser.";
    } else if (error.message.includes("NoApplicationProtocol") || 
               error.message.includes("WebSocket") || 
               error.message.includes("connection failed")) {
      errorMessage = "Could not establish a secure connection to the utility provider service. This is likely a temporary issue. Please try again later.";
    } else if (error.message.includes("500") || error.message.includes("Internal Server Error")) {
      errorMessage = "The utility scraping service encountered an internal error. Our team has been notified and is working to resolve this issue.";
    }
  }
  
  return errorMessage;
}

/**
 * Handles specific Edge Function error cases
 */
function handleEdgeFunctionError(error: Error): string {
  // Extract any error messages coming from the edge function
  const edgeErrorMatch = error.message.match(/Edge Function error: (.+?)($|\.)/i);
  
  if (edgeErrorMatch && edgeErrorMatch[1]) {
    const actualErrorMessage = edgeErrorMatch[1];
    
    // Check for specific provider-related errors
    if (actualErrorMessage.includes("ENGIE") || actualErrorMessage.includes("Romania")) {
      return `Provider service error: ${actualErrorMessage}. Please try again later or contact customer support.`;
    }
    
    return actualErrorMessage;
  }
  
  // Handle Internal Server Error (500) cases specifically
  if (error.message.includes("500") || error.message.includes("Internal Server Error")) {
    return "The utility provider scraping service is temporarily unavailable. This is often due to provider website changes or maintenance. Please try again later.";
  }
  
  return "The utility provider service encountered an error. Please try again later.";
}

/**
 * Detects Edge Function errors based on error message patterns
 */
export function isEdgeFunctionError(error: unknown): boolean {
  if (error instanceof Error) {
    // Check for common edge function error message patterns
    return error.message.includes("Edge Function returned a non-2xx status code") ||
           error.message.includes("Error in RPC call") ||
           error.message.includes("FunctionsHttpError") ||
           error.message.includes("500") ||
           error.message.includes("Internal Server Error");
  }
  return false;
}

/**
 * Formats Edge Function error messages for better user understanding
 */
export function formatEdgeFunctionError(errorMessage: string): string {
  // If the error message is from an edge function, extract the real error
  if (errorMessage.includes("Edge Function returned a non-2xx status code") ||
      errorMessage.includes("Error in RPC call") ||
      errorMessage.includes("FunctionsHttpError") ||
      errorMessage.includes("500") ||
      errorMessage.includes("Internal Server Error")) {
    
    // Try to extract the actual error message from the edge function response
    const errorPattern = /Error:\s*(.*?)(\.|$)/;
    const match = errorMessage.match(errorPattern);
    
    if (match && match[1]) {
      errorMessage = match[1].trim();
    } else {
      // If we can't extract a specific message, provide a more helpful general one
      return "The utility provider service is experiencing technical difficulties. This is often due to provider website changes or maintenance. Please try again later.";
    }
  }
  
  // Format common error patterns
  if (errorMessage.includes("Authentication failed") || 
      errorMessage.includes("Invalid credentials") ||
      errorMessage.includes("incorrect password")) {
    return "The provider login credentials are incorrect. Please check your username and password.";
  }
  
  if (errorMessage.includes("CAPTCHA") || errorMessage.includes("captcha") || errorMessage.includes("security check")) {
    return "The provider's website requires CAPTCHA verification which cannot be automated. Please log in to the provider's website directly.";
  }
  
  if (errorMessage.includes("Refused to get unsafe header") || errorMessage.includes("Set-Cookie")) {
    return "The browser blocked access to cookies due to security restrictions. Please try again later.";
  }
  
  if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
    return "The connection to the provider website timed out. The site may be slow or temporarily down.";
  }
  
  if (errorMessage.includes("NoApplicationProtocol") || 
      errorMessage.includes("WebSocket") || 
      errorMessage.includes("connection failed")) {
    return "Failed to establish a secure connection to the utility provider service. This is likely a network or configuration issue. Please try again later.";
  }
  
  if (errorMessage.includes("500") || errorMessage.includes("Internal Server Error")) {
    return "The utility provider scraping service encountered an internal error. Our team has been notified. Please try again later.";
  }
  
  return errorMessage;
}

/**
 * Identifies recoverable errors that might succeed with a retry
 */
export function isRecoverableError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("timeout") || 
           error.message.includes("connection reset") ||
           error.message.includes("network error") ||
           error.message.includes("temporarily unavailable") ||
           error.message.includes("too many requests") ||
           error.message.includes("500") ||
           error.message.includes("Internal Server Error");
  }
  return false;
}

/**
 * Identifies fatal errors that should not be retried
 */
export function isFatalError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("elements is not allowed") ||
           error.message.includes("options is not allowed") ||
           error.message.includes("\"elements\" is not allowed") ||
           error.message.includes("\"url\" is required") ||
           error.message.includes("usernameSelector is not defined") ||
           error.message.includes("Module not found") ||
           error.message.includes("Refused to get unsafe header") ||
           error.message.includes("Set-Cookie") ||
           error.message.includes("NoApplicationProtocol") || 
           error.message.includes("WebSocket connection failed");
  }
  return false;
}
