
import { SELECTORS, BROWSERLESS, SCRAPING } from "./constants";

interface Credentials {
  username: string;
  password: string;
}

interface Invoice {
  invoice_number: string;
  issued_date: string;
  amount: number;
  due_date: string;
  status: string;
}

/**
 * Scraper for ENGIE Romania utility bills
 */
export async function scrapeEngieRomania(
  credentials: Credentials, 
  browserlessApiKey: string
): Promise<Invoice[]> {
  console.log('Starting ENGIE Romania scraper');
  
  // Define the selectors for ENGIE Romania
  const selectors = SELECTORS.ENGIE_ROMANIA;
  
  // Create the request payload for Browserless
  const payload = {
    url: selectors.LOGIN_PAGE,
    // Remove the options that cause the error
    // options: {
    //   delay: 300,
    //   stealth: true,
    // },
    cookies: [],
    gotoOptions: {
      waitUntil: 'networkidle2',
      timeout: BROWSERLESS.TIMEOUT,
    },
    viewport: BROWSERLESS.VIEWPORT,
    code: `
      async ({page, context}) => {
        try {
          console.log('Page loaded');
          
          // Check for and dismiss cookie consent if it exists
          try {
            if (await page.$(${JSON.stringify(selectors.COOKIE_CONSENT)})) {
              await page.click(${JSON.stringify(selectors.COOKIE_CONSENT)});
              console.log('Cookie consent dismissed');
            }
          } catch (e) {
            console.log('No cookie consent found or error dismissing it', e);
          }
          
          // Fill in login credentials
          await page.type(${JSON.stringify(selectors.USERNAME_SELECTOR)}, ${JSON.stringify(credentials.username)});
          await page.type(${JSON.stringify(selectors.PASSWORD_SELECTOR)}, ${JSON.stringify(credentials.password)});
          
          // Click login button
          await Promise.all([
            page.click(${JSON.stringify(selectors.LOGIN_BUTTON)}),
            page.waitForNavigation({waitUntil: 'networkidle2', timeout: ${BROWSERLESS.TIMEOUT}}),
          ]);
          
          // Check for login errors
          const errorElement = await page.$(${JSON.stringify(selectors.ERROR_MESSAGE)});
          if (errorElement) {
            const errorText = await page.evaluate(el => el.textContent, errorElement);
            throw new Error('Login failed: ' + errorText);
          }
          
          // Navigate to invoices page
          await page.goto(${JSON.stringify(selectors.INVOICES_PAGE)}, {
            waitUntil: 'networkidle2',
            timeout: ${BROWSERLESS.TIMEOUT}
          });
          
          console.log('Navigated to invoices page');
          
          // Wait for the table to be loaded
          await page.waitForSelector(${JSON.stringify(selectors.INVOICE_TABLE)}, {
            timeout: ${BROWSERLESS.TIMEOUT}
          });
          
          // Extract invoice data
          const invoices = await page.evaluate((selectors) => {
            const rows = document.querySelectorAll(selectors.INVOICE_ROW);
            return Array.from(rows).map(row => {
              const invoiceNumber = row.querySelector(selectors.INVOICE_NUMBER)?.textContent?.trim() || '';
              const issuedDate = row.querySelector(selectors.INVOICE_DATE)?.textContent?.trim() || '';
              
              // Extract amount and convert to number
              const amountText = row.querySelector(selectors.INVOICE_AMOUNT)?.textContent?.trim() || '0';
              const amountMatch = amountText.match(/[0-9.,]+/);
              const amount = amountMatch ? parseFloat(amountMatch[0].replace(',', '.')) : 0;
              
              const dueDate = row.querySelector(selectors.INVOICE_DUE_DATE)?.textContent?.trim() || '';
              const status = row.querySelector(selectors.INVOICE_STATUS)?.textContent?.trim() || '';
              
              return {
                invoice_number: invoiceNumber,
                issued_date: issuedDate,
                amount: amount,
                due_date: dueDate,
                status: status
              };
            });
          }, ${JSON.stringify(selectors)});
          
          console.log('Extracted invoices:', invoices);
          return invoices;
        } catch (error) {
          console.error('Error in browser script:', error);
          throw new Error('ENGIE scraping failed: ' + error.message);
        }
      }
    `
  };

  try {
    console.log('Sending request to Browserless API');
    
    // Make the request to Browserless
    const response = await fetch(`${BROWSERLESS.API_URL}/function?token=${browserlessApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(payload),
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Browserless API error:', response.status, errorText);
      throw new Error(`Browserless request failed: ${response.status} ${response.statusText}`);
    }

    // Parse the response
    const result = await response.json();
    
    if (result.error) {
      console.error('ENGIE Romania scraper error:', result.error);
      throw new Error(result.error);
    }
    
    console.log('ENGIE Romania scraper completed successfully');
    return result.data || [];
  } catch (error) {
    console.error('ENGIE Romania scraper error:', error);
    throw error;
  }
}
