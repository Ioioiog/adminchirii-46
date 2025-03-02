
// Import necessary dependencies
import { DEFAULT_TIMEOUT, DEFAULT_WAIT_TIME } from "../constants.ts";

// Define the ENGIE Romania URL constants
const ENGIE_ROMANIA = {
  loginUrl: 'https://my.engie.ro/autentificare',
  invoicesUrl: 'https://my.engie.ro/facturi/istoric',
  fallbackInvoicesUrl: 'https://my.engie.ro/facturi'
};

/**
 * Scrapes invoices from the ENGIE Romania website
 */
export async function scrapeEngieRomania(username: string, password: string) {
  console.log('Starting ENGIE Romania scraper');
  
  // Get the Browserless API key from environment
  const browserlessApiKey = Deno.env.get("BROWSERLESS_API_KEY");
  if (!browserlessApiKey) {
    throw new Error("BROWSERLESS_API_KEY environment variable is not set");
  }
  
  const BROWSERLESS_API_URL = `https://chrome.browserless.io/content?token=${browserlessApiKey}`;
  
  try {
    // Log the scraping attempt (without credentials)
    console.log(`Attempting to scrape ENGIE Romania for user: ${username.substring(0, 3)}***`);
    
    const response = await fetch(BROWSERLESS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        url: ENGIE_ROMANIA.loginUrl,
        gotoOptions: {
          waitUntil: 'networkidle2',
          timeout: DEFAULT_TIMEOUT,
        },
        options: {
          delay: 300,
          stealth: true,
        },
        waitFor: {
          selector: 'input[type="password"], form, .login-form',
          timeout: DEFAULT_TIMEOUT
        },
        function: `async ({ page }) => {
          console.log('Page loaded, waiting for login form');
          
          // Wait for the login form to be fully loaded
          await new Promise(resolve => setTimeout(resolve, ${DEFAULT_WAIT_TIME}));
          
          // Attempt to fill in the login form
          console.log('Filling login credentials');
          const usernameSelector = 'input[type="text"], input[type="email"], input[name="username"]';
          const passwordSelector = 'input[type="password"]';
          
          await page.evaluate((user, pass, userSelector, passSelector) => {
            // Find input fields
            const usernameField = document.querySelector(userSelector);
            const passwordField = document.querySelector(passSelector);
            
            if (!usernameField || !passwordField) {
              throw new Error('Login form fields not found');
            }
            
            // Set field values
            usernameField.value = user;
            passwordField.value = pass;
            
            // Submit the form
            const loginButton = Array.from(document.querySelectorAll('button'))
              .find(el => 
                el.textContent.toLowerCase().includes('autentifica') || 
                el.textContent.toLowerCase().includes('login') ||
                el.textContent.toLowerCase().includes('intra') ||
                el.textContent.toLowerCase().includes('conectare')
              );
              
            if (loginButton) {
              loginButton.click();
            } else {
              // Try submitting the form directly
              const form = document.querySelector('form');
              if (form) form.submit();
            }
          }, "${username}", "${password}", "${usernameSelector}", "${passwordSelector}");
          
          // Wait for login to complete
          console.log('Waiting for login to complete');
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: ${DEFAULT_TIMEOUT} });
          
          // Navigate to the invoices page
          console.log('Navigating to invoices page');
          
          // Try direct navigation to invoice section
          console.log('Direct navigation to invoice section');
          // Use the history URL first, if it fails, try the fallback
          await page.goto('${ENGIE_ROMANIA.invoicesUrl}', { waitUntil: 'networkidle2', timeout: ${DEFAULT_TIMEOUT} });
          
          // Check if we're on the correct page
          const hasInvoiceTable = await page.evaluate(() => {
            return !!document.querySelectorAll('table tr.invoice-row, tr.factura-row').length;
          });
          
          // If not, try the fallback URL
          if (!hasInvoiceTable) {
            console.log('Invoice list not found, trying fallback URL');
            await page.goto('${ENGIE_ROMANIA.fallbackInvoicesUrl}', { waitUntil: 'networkidle2', timeout: ${DEFAULT_TIMEOUT} });
          }
          
          // Wait for the invoice table to load
          await new Promise(resolve => setTimeout(resolve, ${DEFAULT_WAIT_TIME}));
          
          // Extract invoice information
          console.log('Extracting invoice data');
          return await page.evaluate(() => {
            // Look for tables with invoices
            const tables = document.querySelectorAll('table');
            const invoices = [];
            
            // Process each table
            tables.forEach(table => {
              // Look for invoice rows
              const rows = table.querySelectorAll('tr.invoice-row, tr.factura-row, tbody > tr');
              
              if (rows.length) {
                // Process each row as an invoice
                rows.forEach(row => {
                  try {
                    // Extract data from cells
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 3) {
                      // Extract data - adjust selectors based on the actual page structure
                      const invoiceNumber = cells[0]?.textContent?.trim() || '';
                      const date = cells[1]?.textContent?.trim() || '';
                      
                      // Look for amount - it may be in different formats
                      let amount = '';
                      for (const cell of cells) {
                        const text = cell.textContent?.trim() || '';
                        if (text.includes('RON') || text.includes('LEI') || /\\d+[.,]\\d{2}/.test(text)) {
                          amount = text;
                          break;
                        }
                      }
                      
                      // Add to invoices if we have meaningful data
                      if (invoiceNumber || date) {
                        invoices.push({
                          invoiceNumber,
                          date,
                          amount,
                          downloadUrl: '',  // We would need to extract download links if available
                          status: 'processed'
                        });
                      }
                    }
                  } catch (error) {
                    console.error('Error processing invoice row:', error);
                  }
                });
              }
            });
            
            return { 
              success: true, 
              invoices: invoices,
              message: invoices.length ? 'Successfully extracted invoices' : 'No invoices found'
            };
          });
        }`
      })
    });
    
    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Browserless API error (${response.status}): ${errorText}`);
      throw new Error(`Browserless request failed: ${response.status} ${response.statusText}`);
    }
    
    // Parse response
    const result = await response.json();
    
    if (!result || !result.data || !result.data.success) {
      const errorMessage = result?.data?.message || 'Unknown error';
      throw new Error(`Scraping failed: ${errorMessage}`);
    }
    
    return result.data;
  } catch (error) {
    console.error('ENGIE Romania scraper error:', error);
    throw new Error(`ENGIE scraping failed: ${error.message}`);
  }
}
