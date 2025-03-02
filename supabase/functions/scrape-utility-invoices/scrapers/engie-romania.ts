
interface ScrapingParams {
  username: string;
  password: string;
  utilityId: string;
  type: string;
  location: string;
  browserlessApiKey?: string;
}

interface Bill {
  amount: number;
  due_date: string;
  invoice_number: string;
  type: string;
  status: string;
}

// ENGIE Romania configuration
const engieConfig = {
  url: "https://my.engie.ro/autentificare",
  loginSelector: "#username",
  passSelector: "#password",
  submitButton: "button[type=submit]",
  invoicePage: "https://my.engie.ro/facturi/istoric",
  invoiceLinkSelector: "a[href$='.pdf']",
};

export async function scrapeEngieRomania({
  username,
  password,
  type,
  browserlessApiKey
}: ScrapingParams): Promise<Bill[]> {
  if (!browserlessApiKey) {
    throw new Error('Browserless API key is required');
  }

  console.log('Starting Engie Romania scraping using updated selectors...');
  
  try {
    // Login step
    console.log('Attempting to login to ENGIE portal...');
    const loginScript = `
      // Fill in credentials and submit
      document.querySelector('${engieConfig.loginSelector}').value = '${username}';
      document.querySelector('${engieConfig.passSelector}').value = '${password}';
      document.querySelector('${engieConfig.submitButton}').click();
      
      // Wait for navigation to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
    `;

    const loginResponse = await fetch('https://chrome.browserless.io/function', {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${browserlessApiKey}`,
      },
      body: JSON.stringify({
        code: async ({ page }) => {
          await page.goto(engieConfig.url, { waitUntil: 'networkidle2' });
          await page.evaluate(loginScript);
          return { success: true };
        }
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.statusText}`);
    }
    
    console.log('Login successful, navigating to invoices page...');

    // Navigate to invoices page and extract data
    const scrapeResponse = await fetch('https://chrome.browserless.io/function', {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${browserlessApiKey}`,
      },
      body: JSON.stringify({
        code: async ({ page }) => {
          // Navigate to the invoice page
          await page.goto(engieConfig.invoicePage, { waitUntil: 'networkidle2' });
          
          // Extract invoice data
          const invoices = await page.evaluate((selector) => {
            const invoiceLinks = Array.from(document.querySelectorAll(selector));
            
            return invoiceLinks.map(link => {
              // Get the invoice row which is the parent element
              const row = link.closest('tr');
              if (!row) return null;
              
              // Extract data from the row
              const columns = Array.from(row.querySelectorAll('td'));
              
              // Format might vary based on the actual ENGIE website
              // Adjust indices based on the actual table structure
              const invoiceNumber = columns[0]?.textContent?.trim() || 'Unknown';
              const amountText = columns[2]?.textContent?.trim() || '0';
              const dueDateText = columns[1]?.textContent?.trim() || new Date().toISOString().split('T')[0];
              
              // Clean up and convert amount (remove currency symbol, etc.)
              const amount = parseFloat(amountText.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
              
              // Parse date - format may need adjustment
              let dueDate;
              try {
                // Try to parse date in format DD.MM.YYYY
                const dateParts = dueDateText.split('.');
                if (dateParts.length === 3) {
                  dueDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                } else {
                  dueDate = new Date().toISOString().split('T')[0]; // fallback
                }
              } catch (e) {
                dueDate = new Date().toISOString().split('T')[0]; // fallback
              }
              
              return {
                invoice_number: invoiceNumber,
                amount: amount,
                due_date: dueDate
              };
            }).filter(Boolean);
          }, engieConfig.invoiceLinkSelector);
          
          return { invoices };
        }
      }),
    });

    if (!scrapeResponse.ok) {
      throw new Error(`Failed to scrape invoices: ${scrapeResponse.statusText}`);
    }

    const scrapeData = await scrapeResponse.json();
    const invoices = scrapeData.data?.invoices || [];
    
    console.log(`Successfully scraped ${invoices.length} invoices`);

    if (invoices.length === 0) {
      console.warn('No invoices found - this could indicate a scraping issue');
    }

    // Map the scraped data to the expected Bill format
    return invoices.map((invoice: any) => ({
      amount: invoice.amount,
      due_date: invoice.due_date,
      invoice_number: invoice.invoice_number,
      type: type,
      status: 'pending'
    }));

  } catch (error) {
    console.error('Engie Romania scraping error:', error);
    throw new Error(`Failed to scrape Engie Romania: ${error.message}`);
  }
}
