
import { DEFAULT_TIMEOUT, DEFAULT_WAIT_TIME } from "../constants.ts";

const BROWSERLESS_API_URL = "https://chrome.browserless.io/content";

// Define the ENGIE Romania URL constants
const ENGIE_ROMANIA = {
  loginUrl: 'https://my.engie.ro/autentificare',
  invoicesUrl: 'https://my.engie.ro/facturi/istoric',
  fallbackInvoicesUrl: 'https://my.engie.ro/facturi'
};

// Define the ENGIE Romania scraper
export async function scrapeEngieRomania(username: string, password: string) {
  try {
    console.log("Starting ENGIE Romania scraping with Browserless");
    
    // Get the Browserless API key from environment
    const browserlessApiKey = Deno.env.get("BROWSERLESS_API_KEY");
    
    if (!browserlessApiKey) {
      throw new Error("BROWSERLESS_API_KEY environment variable is not set");
    }
    
    // Create the script that will run in the browser
    const script = `
      (async () => {
        try {
          console.log('Starting ENGIE login sequence');
          
          // Wait for the login form to load
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Fill out the login form
          console.log('Filling login form');
          document.querySelector('input[name="username"]').value = '${username}';
          document.querySelector('input[name="password"]').value = '${password}';
          
          // Submit the form
          console.log('Submitting login form');
          document.querySelector('form button[type="submit"]').click();
          
          // Wait for login process
          await new Promise(resolve => setTimeout(resolve, 8000));
          
          // Check if login was successful
          const errorElements = document.querySelectorAll('.login-error, .error-message');
          if (errorElements.length > 0) {
            return {
              success: false,
              error: 'Login failed. Invalid credentials or captcha required.',
            };
          }
          
          // Navigate to the invoices page
          console.log('Navigating to invoices page');
          
          // Try direct navigation to invoice section
          console.log('Direct navigation to invoice section');
          // Use the history URL first, if it fails, try the fallback
          window.location.href = '${ENGIE_ROMANIA.invoicesUrl}';
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Check if we're on the correct page
          if (!document.querySelectorAll('table tr.invoice-row, tr.factura-row').length) {
            console.log('Invoice list not found, trying fallback URL');
            window.location.href = '${ENGIE_ROMANIA.fallbackInvoicesUrl}';
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
          
          // Extract invoice information
          console.log('Extracting invoice information');
          const bills = [];
          
          const invoiceRows = document.querySelectorAll('table tr.invoice-row, tr.factura-row');
          if (invoiceRows.length === 0) {
            return {
              success: true,
              bills: [],
              message: 'No invoices found'
            };
          }
          
          invoiceRows.forEach(row => {
            try {
              const cells = row.querySelectorAll('td');
              if (cells.length >= 5) {
                bills.push({
                  invoice_number: cells[0]?.textContent?.trim() || 'Unknown',
                  amount: parseFloat(cells[2]?.textContent?.trim().replace(/[^0-9.,]/g, '').replace(',', '.')) || 0,
                  due_date: cells[1]?.textContent?.trim() || new Date().toISOString().split('T')[0],
                  type: 'gas',
                  status: 'unpaid'
                });
              }
            } catch (e) {
              console.error('Error parsing invoice row:', e);
            }
          });
          
          return {
            success: true,
            bills
          };
        } catch (error) {
          console.error('Browser script error:', error);
          return {
            success: false,
            error: 'Browser script error: ' + error.message
          };
        }
      })();
    `;
    
    // Log the Browserless request (without showing API key)
    console.log(`Sending request to Browserless for ENGIE Romania scraping`);
    
    // Construct the request to Browserless
    const browserlessResponse = await fetch(`${BROWSERLESS_API_URL}?token=${browserlessApiKey}`, {
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
        evaluate: script,
        waitForFunction: {
          fn: `async () => {
            // Wait for login form to be visible
            return document.querySelector('input[name="username"]') !== null;
          }`,
          polling: 'raf',
          timeout: 10000,
        },
        viewport: {
          width: 1280,
          height: 720,
        },
        stealth: true, // Use stealth mode to avoid detection
        timeout: DEFAULT_TIMEOUT, // 60 seconds timeout
      }),
    });
    
    // Check if the request was successful
    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text();
      console.error(`Browserless error (${browserlessResponse.status}):`, errorText);
      throw new Error(`Browserless request failed: ${browserlessResponse.status} ${browserlessResponse.statusText}`);
    }
    
    // Parse the response
    const result = await browserlessResponse.json();
    
    if (!result || result.error) {
      throw new Error(`ENGIE scraping error: ${result?.error || 'Unknown error'}`);
    }
    
    if (!result.success) {
      throw new Error(`ENGIE scraping failed: ${result.error || 'Unknown error'}`);
    }
    
    // Return the bills
    return {
      success: true,
      bills: result.bills || []
    };
  } catch (error) {
    console.error("ENGIE scraping error:", error);
    throw new Error(`ENGIE scraping failed: ${error.message}`);
  }
}
