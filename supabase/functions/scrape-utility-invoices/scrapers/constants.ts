
// Constants for the scraping process

// Available provider types
export enum PROVIDER {
  ENGIE_ROMANIA = 'ENGIE Romania',
  // Add other providers here as needed
}

// Job status values
export enum JOB_STATUS {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// DOM selectors for different provider websites
export const SELECTORS = {
  // ENGIE Romania selectors
  ENGIE_ROMANIA: {
    loginPage: 'https://www.engie.ro/myaccount/login/',
    usernameSelector: '#username',
    passwordSelector: '#password',
    loginButtonSelector: '#kc-login',
    invoicesSelector: '.table-contracts tr',
    invoiceAmountSelector: 'td:nth-child(3)',
    invoiceDateSelector: 'td:nth-child(4)',
    invoiceNumberSelector: 'td:nth-child(2)',
    invoiceDownloadSelector: 'td:nth-child(7) a'
  }
};

// Configuration for Browserless API
export const BROWSERLESS_CONFIG = {
  // Function to create a request to browserless API that avoids the "options is not allowed" error
  createRequest: (url: string, blocks?: string[], cookies?: any[]) => {
    return {
      url,
      // Only include these basic parameters to avoid errors
      waitForSelector: blocks?.join(',') || 'body',
      elements: blocks || [],
      cookies
    };
  }
};
