
/**
 * Common utility functions and constants for scrapers
 */

export const SELECTORS = {
  ENGIE_ROMANIA: {
    usernameSelector: "#username",
    passwordSelector: "#password",
    loginButtonSelector: "button[type='submit']",
    invoiceTableSelector: "#istoric-facturi table tbody tr",
    captchaSelector: "iframe[src*='recaptcha']",
    sitekey: "6LeqYkkgAAAAAGa5Jl5qmTHK_Nl4_40-YfU4NN71" // ENGIE Romania reCAPTCHA site key
  }
};

// Maximum retries for operations
export const MAX_RETRIES = 3;

// Delay between retries in milliseconds
export const RETRY_DELAY = 2000;

/**
 * Creates a Browserless request configuration
 */
export const createBrowserlessRequest = (browserlessApiKey: string) => {
  if (!browserlessApiKey) {
    throw new Error("Browserless API key is required");
  }
  
  return {
    browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessApiKey}`,
    defaultViewport: { width: 1280, height: 800 }
  };
};

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Convert Romanian date format (DD.MM.YYYY) to ISO format (YYYY-MM-DD)
 */
export const romanianDateToISO = (dateString: string): string => {
  if (!dateString || dateString === 'N/A') return '';
  
  const parts = dateString.split('.');
  if (parts.length !== 3) return '';
  
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};
