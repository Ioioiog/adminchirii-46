
import { SELECTORS, DEFAULT_TIMEOUT, DEFAULT_WAIT_TIME } from './constants';

interface EngieCredentials {
  username: string;
  password: string;
}

interface Invoice {
  number: string;
  date: string;
  amount: number;
  status: string;
  pdfUrl?: string;
}

/**
 * Scrape ENGIE Romania website for invoices
 */
export async function scrapeEngieRomania(
  credentials: EngieCredentials,
  apiKey: string
): Promise<Invoice[]> {
  console.log('Starting ENGIE Romania scraping...');
  
  const { username, password } = credentials;
  
  if (!username || !password) {
    throw new Error('Missing credentials for ENGIE Romania');
  }
  
  if (!apiKey) {
    throw new Error('BROWSERLESS_API_KEY is not configured');
  }
  
  try {
    // Define the Browserless API endpoint
    const browserlessEndpoint = 'https://chrome.browserless.io/content';
    
    // We'll extract selectors for easier access
    const selectors = SELECTORS.ENGIE_ROMANIA;
    
    // Define the browser automation script that will be executed
    const content = `
      const { username, password } = ${JSON.stringify({ username, password })};
      
      // Selectors for the ENGIE Romania website
      const selectors = ${JSON.stringify(selectors)};
      
      console.log('Starting browser automation for ENGIE Romania');
      
      // Wait for an element to be present in the DOM
      async function waitForElement(selector, timeoutMs = 10000) {
        console.log('Waiting for element:', selector);
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
          const element = document.querySelector(selector);
          if (element) {
            console.log('Element found:', selector);
            return element;
          }
          await new Promise(r => setTimeout(r, 100));
        }
        console.log('Element not found within timeout:', selector);
        return null;
      }
      
      // Handle cookie consent popup if present
      async function handleCookieConsent() {
        console.log('Checking for cookie consent dialog...');
        // Wait a bit for any cookie consent to appear
        await new Promise(r => setTimeout(r, 1000));
        
        const consentModal = document.querySelector(selectors.cookieConsentModal);
        if (consentModal) {
          console.log('Cookie consent modal found');
          const acceptButton = document.querySelector(selectors.acceptCookiesButton) || 
                              document.querySelector(selectors.alternativeAcceptButton);
          
          if (acceptButton) {
            console.log('Clicking accept cookies button');
            acceptButton.click();
            await new Promise(r => setTimeout(r, 1000));
          }
        } else {
          console.log('No cookie consent modal found');
        }
      }
      
      // Close any popups that might appear
      async function closePopups() {
        console.log('Checking for popups...');
        const closeButtons = document.querySelectorAll(selectors.popupCloseButtons);
        
        if (closeButtons.length > 0) {
          console.log('Found', closeButtons.length, 'popup close buttons');
          for (const button of closeButtons) {
            console.log('Closing popup');
            button.click();
            await new Promise(r => setTimeout(r, 500));
          }
        } else {
          console.log('No popups found');
        }
      }
      
      // Login to the ENGIE account
      async function login() {
        console.log('Starting login process...');
        
        // Wait for the username field
        const usernameField = await waitForElement(selectors.usernameField);
        if (!usernameField) {
          throw new Error('Username field not found: ' + selectors.usernameField);
        }
        
        // Fill in the username
        console.log('Entering username');
        usernameField.value = username;
        usernameField.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 500));
        
        // Wait for the password field
        const passwordField = await waitForElement(selectors.passwordField);
        if (!passwordField) {
          throw new Error('Password field not found: ' + selectors.passwordField);
        }
        
        // Fill in the password
        console.log('Entering password');
        passwordField.value = password;
        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 500));
        
        // Find and click the login button
        const loginButton = await waitForElement(selectors.loginButton);
        if (!loginButton) {
          throw new Error('Login button not found: ' + selectors.loginButton);
        }
        
        console.log('Clicking login button');
        loginButton.click();
        
        // Wait a bit for login to complete
        await new Promise(r => setTimeout(r, 3000));
        
        // Check for error messages
        const errorMessage = document.querySelector(selectors.errorMessage);
        if (errorMessage && errorMessage.textContent.trim()) {
          throw new Error('Login failed: ' + errorMessage.textContent.trim());
        }
        
        console.log('Login completed');
      }
      
      // Navigate to the invoices page
      async function navigateToInvoicesPage() {
        console.log('Navigating to invoices page...');
        
        // We are already on the invoices page or will be redirected there
        // after login in most cases, but wait for the invoice table to appear
        const invoiceTable = await waitForElement(selectors.invoiceTable, 15000);
        if (!invoiceTable) {
          throw new Error('Invoice table not found after login. You may need to navigate to the invoices page manually.');
        }
        
        console.log('Invoice table found');
      }
      
      // Extract invoice data from the table
      function extractInvoiceData() {
        console.log('Extracting invoice data...');
        
        const tableRows = document.querySelectorAll(selectors.tableRows);
        console.log('Found', tableRows.length, 'invoice rows');
        
        if (tableRows.length === 0) {
          return [];
        }
        
        const invoices = [];
        
        for (const row of tableRows) {
          try {
            const cells = row.querySelectorAll(selectors.tableCells);
            
            if (cells.length < 3) {
              console.log('Skipping row with insufficient cells:', cells.length);
              continue;
            }
            
            // Extract data from cells (assuming structure: number, date, amount, status)
            const invoiceNumber = cells[0]?.textContent.trim() || '';
            const invoiceDate = cells[1]?.textContent.trim() || '';
            
            // Parse amount, removing currency and using dot as decimal separator
            let amountText = cells[2]?.textContent.trim() || '0';
            amountText = amountText.replace(/[^0-9,.-]/g, '').replace(',', '.');
            const amount = parseFloat(amountText) || 0;
            
            // Get status (may be in a different cell or require parsing)
            const status = cells[3]?.textContent.trim() || 'unknown';
            
            // Check for PDF download link
            let pdfUrl = null;
            const pdfLink = row.querySelector(selectors.pdfDownloadLink) || 
                          row.querySelector(selectors.specificInvoiceLink.replace('${invoiceNumber}', invoiceNumber));
            
            if (pdfLink && pdfLink.href) {
              pdfUrl = pdfLink.href;
            }
            
            invoices.push({
              number: invoiceNumber,
              date: invoiceDate,
              amount: amount,
              status: status,
              pdfUrl: pdfUrl
            });
            
            console.log('Extracted invoice:', { number: invoiceNumber, date: invoiceDate, amount: amount });
          } catch (error) {
            console.error('Error extracting data from row:', error);
          }
        }
        
        return invoices;
      }
      
      try {
        // Execute the scraping steps
        await handleCookieConsent();
        await closePopups();
        await login();
        await closePopups(); // Close popups that may appear after login
        await navigateToInvoicesPage();
        const invoices = extractInvoiceData();
        
        console.log('Scraping completed successfully');
        return invoices;
      } catch (error) {
        console.error('Error during ENGIE Romania scraping:', error);
        throw new Error(error.message);
      }
    `;
    
    // Prepare the request payload - without the options property that causes the 400 error
    const payload = {
      url: 'https://client.engie.ro/login',
      gotoOptions: {
        waitUntil: 'networkidle0',
        timeout: DEFAULT_TIMEOUT
      },
      html: content,
      waitFor: DEFAULT_WAIT_TIME,
    };
    
    console.log('Sending request to Browserless...');
    
    // Make the request to Browserless
    const response = await fetch(browserlessEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Browserless-API-Key': apiKey
      },
      body: JSON.stringify(payload)
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Browserless API error:', response.status, errorText);
      throw new Error(`Browserless request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    // Parse the response as text
    const responseText = await response.text();
    
    // Look for JSON data in the response
    const jsonMatch = responseText.match(/\[\s*{[\s\S]*}\s*\]/);
    if (!jsonMatch) {
      console.error('No invoice data found in response');
      return [];
    }
    
    try {
      // Parse the matched JSON data
      const invoices = JSON.parse(jsonMatch[0]);
      console.log('Successfully extracted', invoices.length, 'invoices');
      return invoices;
    } catch (error) {
      console.error('Error parsing invoice data:', error);
      throw new Error('Failed to parse invoice data from ENGIE Romania');
    }
  } catch (error) {
    console.error('ENGIE Romania scraper error:', error);
    throw new Error(`ENGIE scraping failed: ${error.message}`);
  }
}
