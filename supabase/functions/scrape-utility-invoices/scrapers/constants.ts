
/**
 * Constants for scraping utility providers
 */

// Selectors for different provider websites
export const SELECTORS = {
  ENGIE_ROMANIA: {
    loginPage: 'https://my.engie.ro/autentificare',
    usernameSelector: '#username',
    passwordSelector: '#password',
    loginButtonSelector: '#login-form button',
    recaptchaSelector: 'iframe[title="reCAPTCHA"]',
    billsPageUrl: 'https://my.engie.ro/facturi/istoric',
    billsTableSelector: '#istoric-facturi table tbody tr',
    billDownloadSelector: 'td:nth-of-type(16) > a:nth-of-type(1) > span',
    locationSelectorModal: '#lc-select___BV_modal_body_',
    locationRows: 'div.col > div',
    changeLocationButton: 'div.nj-modal__footer > button',
    billsMenuSelector: '#nav-link-facturi',
    // Additional selectors from the flow
    consumptionPageUrl: 'https://my.engie.ro/index-electricitate',
    consumptionDataSelector: 'div.container-fluid > div > div:nth-of-type(2) div.t-deci'
  }
};

// Safe browserless configuration
export const BROWSERLESS_CONFIG = {
  createRequest: (url: string, waitForSelectors: string[] = []) => {
    return {
      url,
      gotoOptions: {
        waitUntil: 'networkidle2',
        timeout: 60000
      },
      elements: waitForSelectors,
      timeout: 60000,
      stealth: true,
      // Avoid options parameter which causes errors
      cookies: [],
      viewport: {
        width: 1280,
        height: 800
      }
    };
  }
};

// Browserless request helper for Deno
export const createBrowserlessRequest = async (
  url: string, 
  browserlessApiKey: string, 
  waitForSelectors: string[] = []
) => {
  const browserlessUrl = `https://chrome.browserless.io/content?token=${browserlessApiKey}`;
  const requestBody = BROWSERLESS_CONFIG.createRequest(url, waitForSelectors);
  
  return fetch(browserlessUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify(requestBody)
  });
};
