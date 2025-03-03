
/**
 * Error handling utilities for the scraping process
 */
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Determines if an error is from the Edge Function
 */
export function isEdgeFunctionError(error: any): boolean {
  if (!error) return false;
  
  // Check for edge function 500 error
  if (error instanceof Error) {
    return error.message.includes('Edge Function returned a non-2xx status code') || 
           error.message.includes('500') ||
           error.message.includes('function is shutdown') ||
           error.message.includes('timeout');
  }
  
  return false;
}

/**
 * Formats edge function errors into more user-friendly messages
 */
export function formatEdgeFunctionError(message: string): string {
  if (!message) return 'An unknown error occurred';
  
  // Handle Edge function errors
  if (message.includes('Edge Function returned a non-2xx status code')) {
    return 'The utility provider service is temporarily unavailable. Please try again later.';
  }
  
  // Handle shutdown errors
  if (message.includes('function is shutdown') || message.includes('EarlyDrop')) {
    return 'The scraping process was terminated due to ENGIE\'s website slow response. Please try again in a few minutes when their servers might be less busy.';
  }
  
  // Handle login errors
  if (message.includes('Login failed')) {
    return 'Failed to log in to the provider website. Please check your credentials and try again.';
  }
  
  // Handle successful login but navigation issues
  if (message.includes('Waiting for login navigation') || message.includes('/prima-pagina')) {
    return 'Successfully logged in but the process timed out when navigating to the invoices page. ENGIE\'s website is responding slowly. Please try again during off-peak hours.';
  }
  
  // Handle CAPTCHA errors
  if (message.includes('CAPTCHA')) {
    if (message.includes('submitted')) {
      return 'CAPTCHA was submitted but the process was interrupted afterward. Please try again.';
    }
    return 'The provider website requires CAPTCHA verification which could not be solved automatically.';
  }
  
  // Handle navigation issues
  if (message.includes('navigation timeout') || message.includes('timeout')) {
    return 'The provider website is responding slowly or is temporarily down. Please try again later.';
  }
  
  // Handle server-side validation errors
  if (message.includes('options is not allowed') || message.includes('elements is not allowed')) {
    return 'There is a configuration issue with the scraping service. Please contact support.';
  }
  
  // Handle session issues
  if (message.includes('cookie') || message.includes('session')) {
    return 'Session management issue with the provider website. Please try clearing your browser cookies and try again.';
  }
  
  // Handle consumption location selection issues
  if (message.includes('Change consumption location') || 
      message.includes('Schimbă locul de consum') ||
      message.includes('alege locul de consum')) {
    return 'The process encountered an issue while selecting the consumption location. This is a common issue with the ENGIE Romania website.';
  }
  
  // Handle MyENGIE app popup issues
  if (message.includes('MyENGIE app popup') || message.includes('Mai târziu')) {
    return 'The process was interrupted by a promotional popup on the ENGIE website. Please try again later.';
  }
  
  // Handle API endpoint errors
  if (message.includes('gwss.engie.ro')) {
    if (message.includes('myservices/v1/invoices/history')) {
      return 'Failed to retrieve invoice history from ENGIE. The service might be temporarily unavailable.';
    }
    if (message.includes('myservices/v1/placesofconsumption')) {
      return 'Failed to retrieve consumption locations from ENGIE. Please try again later.';
    }
    if (message.includes('myservices/v1/invoices/download')) {
      return 'Failed to download invoice files from ENGIE. Please try again later.';
    }
    return 'Failed to communicate with ENGIE services. Please try again later.';
  }
  
  // Return original message if no specific error pattern is matched
  return message;
}

/**
 * Format any error into a user-friendly message
 */
export function formatErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred';
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return formatEdgeFunctionError(errorMessage);
}

/**
 * Hook for displaying error notifications to the user
 */
export function useErrorNotification() {
  const [error, setError] = useState<string | null>(null);
  
  const showErrorToast = (errorData: any) => {
    const errorMessage = formatErrorMessage(errorData);
    setError(errorMessage);
    
    // Show toast notification
    toast.error('Error fetching utility bills', {
      description: errorMessage,
      duration: 5000,
    });
  };
  
  return {
    error,
    setError,
    showErrorToast,
  };
}
