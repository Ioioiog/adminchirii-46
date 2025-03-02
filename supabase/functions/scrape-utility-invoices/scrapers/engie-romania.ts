
// Import necessary dependencies
import { DEFAULT_TIMEOUT, DEFAULT_WAIT_TIME } from "../constants.ts";

// Define the ENGIE Romania URL constants
const ENGIE_ROMANIA = {
  loginUrl: 'https://my.engie.ro/autentificare',
  invoicesUrl: 'https://my.engie.ro/facturi/istoric',
  fallbackInvoicesUrl: 'https://my.engie.ro/facturi'
};

// Define the selectors for various page elements
const SELECTORS = {
  LOGIN: {
    username: '#username',
    password: '#password',
    loginButton: 'button.nj-btn.nj-btn--primary',
    errorMessage: '.error-message, .alert-danger'
  },
  COOKIE_CONSENT: {
    modal: '#responsive-cookies-consent-modal___BV_modal_outer_',
    acceptButton: 'button#cookieConsentBtnRight',
    alternativeAcceptButton: 'button[class*="cookie"][class*="accept"], button:contains("Acceptă toate")'
  },
  INVOICE_TABLE: {
    table: 'table.nj-table.nj-table--cards',
    rows: 'table.nj-table.nj-table--cards tbody tr',
    cells: 'td',
    pdfDownloadLink: 'a[href*="facturi"][href*=".pdf"], a[href*="invoice"][href*=".pdf"]',
    specificInvoiceDownloadLink: (invoiceNumber: string) => `a[title="Descarcă factura ${invoiceNumber}"]`
  },
  POPUP: {
    closeButtons: 'button.close, .myengie-popup-close, button.myengie-close'
  },
  CAPTCHA: {
    iframe: 'iframe[title="reCAPTCHA"]',
    responseField: 'textarea[name="g-recaptcha-response"]',
    defaultSiteKey: '6LeqYkkgAAAAAGa5Jl5qmTHK_Nl4_40-YfU4NN71'
  }
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
          selector: SELECTORS.LOGIN.username + ', ' + SELECTORS.LOGIN.password + ', form, .login-form',
          timeout: DEFAULT_TIMEOUT
        },
        function: `async ({ page }) => {
          console.log('Page loaded, waiting for login form');
          
          // Function to handle cookie consent if it appears
          async function handleCookieConsent() {
            try {
              // Check if cookie consent is visible
              const consentVisible = await page.evaluate((consentSelector) => {
                return !!document.querySelector(consentSelector);
              }, '${SELECTORS.COOKIE_CONSENT.modal}');
              
              if (consentVisible) {
                console.log('Cookie consent dialog found, trying to accept');
                await page.evaluate((acceptBtnSelector, altAcceptBtnSelector) => {
                  const acceptBtn = document.querySelector(acceptBtnSelector);
                  if (acceptBtn) {
                    acceptBtn.click();
                    return;
                  }
                  
                  const altBtn = document.querySelector(altAcceptBtnSelector);
                  if (altBtn) {
                    altBtn.click();
                  }
                }, '${SELECTORS.COOKIE_CONSENT.acceptButton}', '${SELECTORS.COOKIE_CONSENT.alternativeAcceptButton}');
                
                // Wait for cookie consent to disappear
                await page.waitForTimeout(2000);
              }
            } catch (e) {
              console.log('Error handling cookie consent:', e.message);
            }
          }
          
          // Function to close any popups that might appear
          async function closePopups() {
            try {
              await page.evaluate((closeButtonsSelector) => {
                const buttons = document.querySelectorAll(closeButtonsSelector);
                buttons.forEach(btn => {
                  if (btn && btn instanceof HTMLElement) btn.click();
                });
              }, '${SELECTORS.POPUP.closeButtons}');
            } catch (e) {
              console.log('Error closing popups:', e.message);
            }
          }
          
          // Handle any cookie consent that might appear
          await handleCookieConsent();
          
          // Wait a moment for the page to stabilize
          await page.waitForTimeout(${DEFAULT_WAIT_TIME});
          
          // Close any popups
          await closePopups();
          
          // Attempt to fill in the login form
          console.log('Filling login credentials');
          
          try {
            await page.evaluate((usernameSelector, passwordSelector, loginBtnSelector, user, pass) => {
              // Find input fields
              const usernameField = document.querySelector(usernameSelector);
              const passwordField = document.querySelector(passwordSelector);
              
              if (!usernameField || !passwordField) {
                throw new Error('Login form fields not found');
              }
              
              // Set field values
              usernameField.value = user;
              passwordField.value = pass;
              
              // Dispatch events to trigger any listeners
              usernameField.dispatchEvent(new Event('input', { bubbles: true }));
              passwordField.dispatchEvent(new Event('input', { bubbles: true }));
              
              // Submit the form
              const loginButton = document.querySelector(loginBtnSelector);
              
              if (loginButton) {
                loginButton.click();
              } else {
                // Try submitting the form directly
                const form = document.querySelector('form');
                if (form) form.submit();
              }
            }, '${SELECTORS.LOGIN.username}', '${SELECTORS.LOGIN.password}', '${SELECTORS.LOGIN.loginButton}', "${username}", "${password}");
          } catch (error) {
            console.error('Error filling login form:', error);
            throw new Error('Failed to fill login form: ' + error.message);
          }
          
          // Wait for login to complete
          console.log('Waiting for login to complete');
          try {
            // Wait for navigation to complete
            await page.waitForNavigation({ 
              waitUntil: 'networkidle2', 
              timeout: ${DEFAULT_TIMEOUT} 
            });
          } catch (e) {
            // Check if we're still on the login page
            const onLoginPage = await page.evaluate((errorSelector) => {
              return !!document.querySelector(errorSelector);
            }, '${SELECTORS.LOGIN.errorMessage}');
            
            if (onLoginPage) {
              const errorMsg = await page.evaluate((errorSelector) => {
                const errorEl = document.querySelector(errorSelector);
                return errorEl ? errorEl.textContent.trim() : 'Unknown login error';
              }, '${SELECTORS.LOGIN.errorMessage}');
              
              throw new Error('Login failed: ' + errorMsg);
            }
          }
          
          // Navigate to the invoices page
          console.log('Navigating to invoices page');
          
          try {
            // Use the history URL first
            console.log('Direct navigation to invoice section');
            await page.goto('${ENGIE_ROMANIA.invoicesUrl}', { 
              waitUntil: 'networkidle2', 
              timeout: ${DEFAULT_TIMEOUT} 
            });
            
            // Handle cookie consent if it appears after login
            await handleCookieConsent();
            
            // Close any popups
            await closePopups();
            
            // Check if we're on the correct page
            const hasInvoiceTable = await page.evaluate((tableSelector) => {
              return !!document.querySelector(tableSelector);
            }, '${SELECTORS.INVOICE_TABLE.table}');
            
            // If not, try the fallback URL
            if (!hasInvoiceTable) {
              console.log('Invoice list not found, trying fallback URL');
              await page.goto('${ENGIE_ROMANIA.fallbackInvoicesUrl}', { 
                waitUntil: 'networkidle2', 
                timeout: ${DEFAULT_TIMEOUT} 
              });
              
              // Handle cookie consent again if needed
              await handleCookieConsent();
              
              // Close any popups
              await closePopups();
            }
          } catch (e) {
            console.error('Error navigating to invoices page:', e);
            throw new Error('Failed to navigate to invoices page: ' + e.message);
          }
          
          // Wait for the invoice table to load
          await page.waitForTimeout(${DEFAULT_WAIT_TIME});
          
          // Extract invoice information
          console.log('Extracting invoice data');
          try {
            return await page.evaluate((tableSelector, rowsSelector, cellsSelector) => {
              // Look for the invoice table
              const table = document.querySelector(tableSelector);
              if (!table) {
                return { 
                  success: false, 
                  invoices: [],
                  message: 'Invoice table not found' 
                };
              }
              
              // Look for invoice rows
              const rows = document.querySelectorAll(rowsSelector);
              if (!rows.length) {
                return { 
                  success: false, 
                  invoices: [],
                  message: 'No invoice rows found in table' 
                };
              }
              
              const invoices = [];
              
              // Process each row as an invoice
              rows.forEach((row, index) => {
                try {
                  // Extract data from cells
                  const cells = row.querySelectorAll(cellsSelector);
                  if (cells.length >= 3) {
                    // Determine the cell indices based on the structure
                    // This may need adjustment based on the actual table structure
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
                    
                    // Look for download link
                    let downloadUrl = '';
                    const links = row.querySelectorAll('a[href*="facturi"][href*=".pdf"], a[href*="invoice"][href*=".pdf"]');
                    if (links.length > 0) {
                      downloadUrl = links[0].getAttribute('href') || '';
                    }
                    
                    // Add to invoices if we have meaningful data
                    if (invoiceNumber || date) {
                      invoices.push({
                        invoiceNumber,
                        date,
                        amount,
                        downloadUrl,
                        status: 'processed'
                      });
                    }
                  }
                } catch (error) {
                  console.error('Error processing invoice row:', error);
                }
              });
              
              return { 
                success: true, 
                invoices: invoices,
                message: invoices.length ? 'Successfully extracted invoices' : 'No invoices found'
              };
            }, '${SELECTORS.INVOICE_TABLE.table}', '${SELECTORS.INVOICE_TABLE.rows}', '${SELECTORS.INVOICE_TABLE.cells}');
          } catch (e) {
            console.error('Error extracting invoice data:', e);
            throw new Error('Failed to extract invoice data: ' + e.message);
          }
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
