
/**
 * Selectors for various website elements used in scrapers
 */
export const SELECTORS = {
  ENGIE_ROMANIA: {
    // Login selectors
    loginForm: 'form[action*="login"]',
    usernameField: '#username',
    passwordField: '#password',
    loginButton: 'button.nj-btn.nj-btn--primary',
    errorMessage: '.error-message, .alert-danger',
    
    // Cookie consent selectors
    cookieConsentModal: '#responsive-cookies-consent-modal___BV_modal_outer_',
    acceptCookiesButton: 'button#cookieConsentBtnRight',
    alternativeAcceptButton: 'button[class*="cookie"][class*="accept"], button:contains("Acceptă toate")',
    
    // Invoice table selectors
    invoiceTable: 'table.nj-table.nj-table--cards',
    tableRows: 'table.nj-table.nj-table--cards tbody tr',
    tableCells: 'td',
    pdfDownloadLink: 'a[href*="facturi"][href*=".pdf"], a[href*="invoice"][href*=".pdf"]',
    specificInvoiceLink: 'a[title="Descarcă factura ${invoiceNumber}"]',
    
    // Popup handling selectors
    popupCloseButtons: 'button.close, .myengie-popup-close, button.myengie-close',
    
    // CAPTCHA elements
    recaptchaIframe: 'iframe[title="reCAPTCHA"]',
    recaptchaResponse: 'textarea[name="g-recaptcha-response"]',
    defaultCaptchaSiteKey: '6LeqYkkgAAAAAGa5Jl5qmTHK_Nl4_40-YfU4NN71'
  }
};

// Status constants for scraping jobs
export const JOB_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Default timeout for browser operations
export const DEFAULT_TIMEOUT = 60000; // 60 seconds

// Default wait time for page loading
export const DEFAULT_WAIT_TIME = 5000; // 5 seconds
