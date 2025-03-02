
/**
 * Constants for the scraping operations
 */

// Job status constants
export const JOB_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// ENGIE Romania website selectors
export const SELECTORS = {
  ENGIE_ROMANIA: {
    LOGIN_PAGE: 'https://agentiaonline.engie.ro/Account/Login',
    USERNAME_SELECTOR: '#Email',
    PASSWORD_SELECTOR: '#Password',
    LOGIN_BUTTON: 'button[type="submit"]',
    INVOICES_PAGE: 'https://agentiaonline.engie.ro/InformatiiFacturi/Facturi',
    INVOICE_TABLE: 'table.table',
    INVOICE_ROW: 'tbody tr',
    INVOICE_NUMBER: 'td:nth-child(1)',
    INVOICE_DATE: 'td:nth-child(2)',
    INVOICE_AMOUNT: 'td:nth-child(3)',
    INVOICE_DUE_DATE: 'td:nth-child(4)',
    INVOICE_STATUS: 'td:nth-child(5)',
    COOKIE_CONSENT: '#CookieScriptDeclineButton',
    ERROR_MESSAGE: '.validation-summary-errors',
  },
  // Add other utility providers here as needed
};

// Browserless API constants
export const BROWSERLESS = {
  API_URL: 'https://chrome.browserless.io',
  TIMEOUT: 60000, // 60 seconds
  VIEWPORT: {
    width: 1366,
    height: 768,
  },
};

// General scraping constants
export const SCRAPING = {
  WAIT_TIME: 5000, // 5 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // 2 seconds
};
