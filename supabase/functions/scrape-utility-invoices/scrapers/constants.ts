
/**
 * Constants and helper functions for scrapers
 */

/**
 * Selectors for each supported provider
 */
export const SELECTORS = {
  ENGIE_ROMANIA: {
    loginPage: "https://my.engie.ro/autentificare",
    usernameSelector: "#username",
    passwordSelector: "#password",
    loginButtonSelector: "button",
    // Selectors from the recorded user flow
    billsPageSelector: "https://my.engie.ro/facturi/istoric",
    billsTableSelector: "#istoric-facturi table tbody tr",
    downloadBillSelector: "td:nth-of-type(16) a:nth-of-type(1) span",
    // The location selector from user flow
    locationSelector: "div:nth-of-type(5) div.col > div",
    locationSwitchButton: "div.nj-modal__footer > button"
  }
};

/**
 * Utility function to make a request to Browserless content API
 */
export async function createBrowserlessRequest(
  url: string,
  apiKey: string,
  selectors: string[]
): Promise<Response> {
  const endpoint = `https://chrome.browserless.io/content?token=${apiKey}`;
  
  const options = {
    url: url,
    elements: selectors
  };
  
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(options)
  });
}

/**
 * Map of provider names to their scraper IDs
 */
export const SUPPORTED_PROVIDERS = {
  'ENGIE': 'engie-romania',
  'ENGIE ROMANIA': 'engie-romania'
};
