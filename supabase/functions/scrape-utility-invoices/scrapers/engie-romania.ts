
import { SELECTORS, DEFAULT_TIMEOUT, DEFAULT_WAIT_TIME } from "./constants";

/**
 * Interface for credentials
 */
interface Credentials {
  username: string;
  password: string;
}

/**
 * Interface for invoice data
 */
interface Invoice {
  number: string;
  date: string;
  amount: number;
  currency: string;
  pdf_url?: string;
}

/**
 * Scrapes ENGIE Romania website for invoice data
 * 
 * @param credentials User credentials
 * @param browserlessApiKey API key for browserless.io
 * @returns Array of invoice objects
 */
export async function scrapeEngieRomania(
  credentials: Credentials,
  browserlessApiKey: string
): Promise<Invoice[]> {
  console.log('Starting ENGIE Romania scraper...');
  
  // Validate input
  if (!credentials.username || !credentials.password) {
    throw new Error('Username and password are required');
  }
  
  if (!browserlessApiKey) {
    throw new Error('Browserless API key is required');
  }
  
  try {
    // Construct the API URL for browserless
    const browserlessUrl = `https://chrome.browserless.io/content?token=${browserlessApiKey}`;
    
    // Prepare the request
    const browser_script = `
      const selectors = ${JSON.stringify(SELECTORS.ENGIE_ROMANIA)};
      
      async function run() {
        // Handle cookie consent if it appears
        try {
          const cookieConsentModal = document.querySelector(selectors.cookieConsentModal);
          if (cookieConsentModal) {
            console.log('Cookie consent modal detected');
            const acceptButton = document.querySelector(selectors.acceptCookiesButton) || 
                               document.querySelector(selectors.alternativeAcceptButton);
            if (acceptButton) {
              console.log('Clicking accept cookies button');
              acceptButton.click();
              await new Promise(r => setTimeout(r, 1000));
            }
          }
        } catch (e) {
          console.log('Error handling cookie consent:', e);
        }
        
        // Close any popups that might appear
        try {
          const popupButtons = document.querySelectorAll(selectors.popupCloseButtons);
          if (popupButtons.length > 0) {
            console.log('Found popup(s), closing...');
            popupButtons.forEach(button => button.click());
            await new Promise(r => setTimeout(r, 1000));
          }
        } catch (e) {
          console.log('Error closing popups:', e);
        }
        
        // Find login form
        const loginForm = document.querySelector(selectors.loginForm);
        if (!loginForm) {
          throw new Error('Login form not found');
        }
        
        // Fill in credentials
        console.log('Filling in login credentials');
        const usernameField = document.querySelector(selectors.usernameField);
        const passwordField = document.querySelector(selectors.passwordField);
        
        if (!usernameField || !passwordField) {
          throw new Error('Username or password field not found');
        }
        
        usernameField.value = '${credentials.username}';
        passwordField.value = '${credentials.password}';
        
        // Submit login form
        console.log('Submitting login form');
        const loginButton = document.querySelector(selectors.loginButton);
        if (!loginButton) {
          throw new Error('Login button not found');
        }
        
        loginButton.click();
        
        // Wait for navigation to complete (adjust timeout as needed)
        await new Promise(r => setTimeout(r, 5000));
        
        // Check for login errors
        const errorElement = document.querySelector(selectors.errorMessage);
        if (errorElement && errorElement.textContent.trim()) {
          throw new Error('Login failed: ' + errorElement.textContent.trim());
        }
        
        // Wait for invoice table to load
        console.log('Waiting for invoice table to load');
        await new Promise(r => setTimeout(r, 3000));
        
        // Find invoice table
        const invoiceTable = document.querySelector(selectors.invoiceTable);
        if (!invoiceTable) {
          throw new Error('Invoice table not found');
        }
        
        // Extract invoice data
        console.log('Extracting invoice data');
        const invoiceRows = document.querySelectorAll(selectors.tableRows);
        
        const invoices = [];
        
        for (let i = 0; i < invoiceRows.length; i++) {
          const row = invoiceRows[i];
          const cells = row.querySelectorAll(selectors.tableCells);
          
          if (cells.length >= 4) {
            const invoiceNumber = cells[0]?.textContent?.trim() || '';
            const invoiceDate = cells[1]?.textContent?.trim() || '';
            const amountText = cells[2]?.textContent?.trim() || '0';
            
            // Extract amount and currency
            const amountMatch = amountText.match(/([0-9.,]+)\\s*([A-Za-z]+)/);
            let amount = 0;
            let currency = 'RON';
            
            if (amountMatch && amountMatch.length >= 3) {
              amount = parseFloat(amountMatch[1].replace(',', '.'));
              currency = amountMatch[2];
            }
            
            // Get PDF link if available
            let pdfUrl = '';
            const pdfLink = row.querySelector(selectors.pdfDownloadLink);
            if (pdfLink && pdfLink.getAttribute('href')) {
              pdfUrl = pdfLink.getAttribute('href');
              if (!pdfUrl.startsWith('http')) {
                pdfUrl = new URL(pdfUrl, window.location.origin).href;
              }
            }
            
            invoices.push({
              number: invoiceNumber,
              date: invoiceDate,
              amount: amount,
              currency: currency,
              pdf_url: pdfUrl
            });
          }
        }
        
        return invoices;
      }
      
      return await run();
    `;
    
    // Make the request to browserless
    console.log('Sending request to browserless.io');
    const response = await fetch(browserlessUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        url: 'https://www.engie.ro/myaccount/login/',
        gotoOptions: {
          waitUntil: 'networkidle2',
        },
        evaluate: browser_script,
      }),
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Browserless API error:', response.status, errorBody);
      throw new Error(`Browserless request failed: ${response.status} ${response.statusText}`);
    }
    
    const invoices = await response.json() as Invoice[];
    console.log(`Successfully extracted ${invoices.length} invoices`);
    
    return invoices;
  } catch (error) {
    console.error('ENGIE Romania scraper error:', error);
    throw new Error(`ENGIE scraping failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
