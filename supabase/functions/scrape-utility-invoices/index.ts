
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let browser = null;

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { username, password, provider, utilityId, type, location } = await req.json();

    console.log('Starting scraping process:', {
      provider,
      type,
      location,
      utilityId,
      hasUsername: !!username,
      hasPassword: !!password
    });

    if (!username || !password) {
      console.error('Missing credentials');
      throw new Error('Missing required credentials');
    }

    if (provider !== 'engie_romania') {
      console.error('Unsupported provider:', provider);
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Launch browser with more specific configurations
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--headless'
      ]
    });

    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Add more detailed error logging
    page.on('console', msg => console.log('Browser console:', msg.text()));
    page.on('pageerror', err => console.error('Browser page error:', err));

    console.log('Navigating to ENGIE login page...');
    const response = await page.goto('https://my.engie.ro/login', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    if (!response?.ok()) {
      throw new Error(`Failed to load login page: ${response?.status()} ${response?.statusText()}`);
    }

    // Wait for login form to be present
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });

    console.log('Login form found, filling credentials...');

    // Type credentials with delay
    await page.type('input[name="username"]', username, { delay: 100 });
    await page.type('input[name="password"]', password, { delay: 100 });

    console.log('Submitting login form...');
    
    // Click submit and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);

    // Check for login errors
    const errorElement = await page.$('.alert-danger');
    if (errorElement) {
      const errorText = await page.evaluate(el => el.textContent, errorElement);
      throw new Error(`Login failed: ${errorText}`);
    }

    console.log('Successfully logged in, navigating to bills page...');

    // Navigate to bills page
    const billsResponse = await page.goto('https://my.engie.ro/facturi-plati', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    if (!billsResponse?.ok()) {
      throw new Error(`Failed to load bills page: ${billsResponse?.status()} ${billsResponse?.statusText()}`);
    }

    // Wait for bills to load
    await page.waitForSelector('.factura-item', { timeout: 30000 });

    console.log('Extracting bill information...');
    const bills = await page.evaluate(() => {
      const billElements = document.querySelectorAll('.factura-item');
      return Array.from(billElements).map(element => {
        try {
          const amountText = element.querySelector('.suma')?.textContent || '0';
          const amount = parseFloat(amountText.replace(/[^\d,]/g, '').replace(',', '.'));
          
          const dueDateElement = element.querySelector('.scadenta');
          const dueDate = dueDateElement ? 
            new Date(dueDateElement.textContent.trim().split(':')[1].trim()).toISOString().split('T')[0] : 
            null;

          const periodElement = element.querySelector('.perioada');
          const periodText = periodElement ? periodElement.textContent.trim().split(':')[1].trim() : '';
          const [startStr, endStr] = periodText.split('-').map(d => d.trim());
          
          const invoiceElement = element.querySelector('.numar');
          const invoiceNumber = invoiceElement ? 
            invoiceElement.textContent.trim().split(':')[1].trim() : 
            null;

          if (!amount || !dueDate || !invoiceNumber) {
            throw new Error('Missing required bill information');
          }

          return {
            amount,
            due_date: dueDate,
            invoice_number: invoiceNumber,
            period_start: startStr ? new Date(startStr).toISOString().split('T')[0] : null,
            period_end: endStr ? new Date(endStr).toISOString().split('T')[0] : null,
            type: 'gas',
            status: 'pending'
          };
        } catch (error) {
          console.error('Error parsing bill element:', error);
          return null;
        }
      }).filter(bill => bill !== null);
    });

    console.log('Extracted bills:', {
      count: bills.length,
      location,
      firstBill: bills[0]
    });

    if (bills.length === 0) {
      throw new Error('No bills found on the page');
    }

    await browser.close();
    console.log('Browser closed successfully');

    return new Response(JSON.stringify({
      success: true,
      bills
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in scrape-utility-invoices function:', error);
    
    // Ensure browser is closed even if there's an error
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed after error');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false,
      bills: []
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
