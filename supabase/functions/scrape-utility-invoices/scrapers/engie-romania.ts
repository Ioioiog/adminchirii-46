
import { BillScraperBase } from './base';
import { ScrapingResult } from '../constants';

// Configuration for ENGIE Romania
const engieConfig = {
  url: "https://my.engie.ro/autentificare",
  loginSelector: "#username",
  passSelector: "#password",
  submitButton: "button[type=submit]",
  invoicePage: "https://my.engie.ro/facturi/istoric",
  invoiceLinkSelector: "a[href$='.pdf']",
};

export class EngieRomaniaScraperImpl extends BillScraperBase {
  async scrape(username: string, password: string): Promise<ScrapingResult> {
    console.log("Starting ENGIE Romania scraping process");
    
    try {
      // Setup browser with Browserless.io API key
      const browser = await this.setupBrowser();
      
      if (!browser) {
        return {
          success: false,
          error: "Failed to initialize browser for scraping"
        };
      }
      
      const page = await browser.newPage();
      console.log("Browser and page initialized");
      
      // Set a reasonable navigation timeout
      await page.setDefaultNavigationTimeout(60000);
      
      // Navigate to the login page
      console.log("Navigating to login page:", engieConfig.url);
      await page.goto(engieConfig.url, { waitUntil: 'networkidle2' });
      
      // Wait for the login form to be loaded
      await page.waitForSelector(engieConfig.loginSelector);
      console.log("Login form loaded");
      
      // Fill the login form
      await page.type(engieConfig.loginSelector, username);
      await page.type(engieConfig.passSelector, password);
      console.log("Filled login form");
      
      // Submit the form
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.click(engieConfig.submitButton)
      ]);
      console.log("Submitted login form");
      
      // Check if login was successful by looking for elements that should be present on the dashboard
      // We can modify this based on ENGIE's website structure
      const isLoggedIn = await page.evaluate(() => {
        // Check for elements that would indicate successful login
        return !document.querySelector('.error-message') && 
               !document.title.includes('Autentificare');
      });
      
      if (!isLoggedIn) {
        console.log("Login failed for ENGIE Romania");
        await browser.close();
        return {
          success: false,
          error: "Login failed. Please check your credentials and try again."
        };
      }
      
      console.log("Successfully logged in. Navigating to invoices page");
      
      // Navigate to the invoices page
      await page.goto(engieConfig.invoicePage, { waitUntil: 'networkidle2' });
      await page.waitForSelector(engieConfig.invoiceLinkSelector, { timeout: 10000 })
        .catch(() => console.log("Invoice links not found immediately, continuing anyway"));
      
      // Extract invoice data
      const bills = await page.evaluate((selector) => {
        const invoiceLinks = Array.from(document.querySelectorAll(selector));
        return invoiceLinks.map((link) => {
          const element = link as HTMLAnchorElement;
          // Extract data from the invoice element
          // We need to adjust this based on ENGIE's actual HTML structure
          const row = element.closest('tr');
          
          let amount = 0;
          let dueDate = '';
          let invoiceNumber = '';
          
          if (row) {
            // Get invoice number - this is often in the PDF filename or in a nearby element
            invoiceNumber = element.href.split('/').pop()?.replace('.pdf', '') || '';
            
            // Try to find amount and due date in nearby cells
            const cells = Array.from(row.querySelectorAll('td'));
            if (cells.length >= 3) {
              // This is just an example. The actual structure may be different
              const amountText = cells[1]?.textContent || '';
              const dueDateText = cells[2]?.textContent || '';
              
              // Extract amount by removing non-numeric characters except decimal point
              const amountMatch = amountText.match(/[\d,.]+/);
              if (amountMatch) {
                amount = parseFloat(amountMatch[0].replace(',', '.'));
              }
              
              // Extract due date by finding date pattern
              const dateMatch = dueDateText.match(/\d{2}[./-]\d{2}[./-]\d{4}/);
              if (dateMatch) {
                dueDate = dateMatch[0];
              }
            }
          }
          
          // If we couldn't extract structured data, we can at least get the PDF link
          return {
            amount: amount || 0,
            due_date: dueDate || new Date().toISOString().split('T')[0], // Default to today if not found
            invoice_number: invoiceNumber || 'Unknown',
            url: element.href,
            type: 'gas', // Default type for ENGIE Romania
            status: 'pending'
          };
        });
      }, engieConfig.invoiceLinkSelector);
      
      console.log(`Found ${bills.length} bills`);
      
      // Close the browser
      await browser.close();
      
      // Return the results
      if (bills.length === 0) {
        return {
          success: true,
          bills: [],
          message: "No new bills found"
        };
      }
      
      return {
        success: true,
        bills
      };
      
    } catch (error) {
      console.error("Error scraping ENGIE Romania:", error);
      return {
        success: false,
        error: `Failed to scrape ENGIE Romania: ${error.message}`
      };
    }
  }
}
