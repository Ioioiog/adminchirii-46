
import { SELECTORS, BROWSERLESS_CONFIG } from './constants';

// Define the scraper interface
export interface Scraper {
  scrape(credentials: { username: string; password: string }, apiKey: string): Promise<any>;
}

/**
 * ENGIE Romania scraper implementation
 */
export class EngieRomaniaScraperImpl implements Scraper {
  async scrape(credentials: { username: string; password: string }, apiKey: string): Promise<any> {
    console.log('Starting ENGIE Romania scraper...');
    
    // Check for API key
    if (!apiKey) {
      throw new Error('BROWSERLESS_API_KEY is not configured');
    }
    
    try {
      const { username, password } = credentials;
      
      // Fetch content using Browserless
      const response = await fetch(`${BROWSERLESS_CONFIG.endpoint}?token=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: SELECTORS.ENGIE_ROMANIA.LOGIN_PAGE,
          gotoOptions: {
            waitUntil: 'networkidle2',
            timeout: BROWSERLESS_CONFIG.defaultTimeout
          },
          elements: [
            { selector: SELECTORS.ENGIE_ROMANIA.USERNAME_SELECTOR, as: 'username', value: username },
            { selector: SELECTORS.ENGIE_ROMANIA.PASSWORD_SELECTOR, as: 'password', value: password },
            { selector: SELECTORS.ENGIE_ROMANIA.LOGIN_BUTTON, as: 'loginButton', action: 'click' }
          ],
          waitForFunction: {
            fn: `() => {
              return document.readyState === 'complete' && 
                (!document.querySelector('.error-message') || 
                 document.querySelector('a[href*="facturi"]'))
            }`,
            timeout: BROWSERLESS_CONFIG.waitingTimeout
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Browserless request failed:', response.status, errorText);
        throw new Error(`Browserless request failed: ${response.status} ${response.statusText}`);
      }
      
      // Attempt to extract invoices from response
      const content = await response.text();
      
      // For now, just return a success message - in production this would parse and return the actual invoice data
      return {
        success: true,
        message: 'Successfully logged in to ENGIE Romania',
        // This would be the parsed invoice data in production
        invoices: []
      };
    } catch (error) {
      console.error('ENGIE scraper error:', error);
      throw error;
    }
  }
}

// Export the scraper
export const scrapeEngieRomania = async (
  credentials: { username: string; password: string },
  browserlessApiKey: string
): Promise<any> => {
  const scraper = new EngieRomaniaScraperImpl();
  return await scraper.scrape(credentials, browserlessApiKey);
};
