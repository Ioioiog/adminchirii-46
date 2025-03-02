
/**
 * Constants for web scraping
 */

// Status constants for scraping jobs
export const JOB_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Selectors for ENGIE Romania website
export const SELECTORS = {
  ENGIE_ROMANIA: {
    // Login page selectors
    LOGIN_PAGE: 'https://www.engie.ro/myaccount/login/',
    USERNAME_SELECTOR: '#username',
    PASSWORD_SELECTOR: '#password',
    LOGIN_BUTTON: 'button[type="submit"]',
    
    // Invoice page selectors
    INVOICES_PAGE: 'https://www.engie.ro/myaccount/facturi-plati/facturi/',
    INVOICE_TABLE: '.factTable',
    INVOICE_ROWS: '.factTable tr:not(:first-child)',
    INVOICE_NUMBER_SELECTOR: 'td:nth-child(1)',
    INVOICE_DATE_SELECTOR: 'td:nth-child(2)',
    INVOICE_AMOUNT_SELECTOR: 'td:nth-child(3)',
    INVOICE_DUE_DATE_SELECTOR: 'td:nth-child(4)',
    INVOICE_STATUS_SELECTOR: 'td:nth-child(5)',
    INVOICE_DOWNLOAD_SELECTOR: 'td:nth-child(6) a'
  }
};

// Browserless API configuration
export const BROWSERLESS_CONFIG = {
  endpoint: 'https://chrome.browserless.io/content',
  defaultTimeout: 60000,
  waitingTimeout: 30000
};
