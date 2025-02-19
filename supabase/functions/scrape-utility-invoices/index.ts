
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let browser = null;

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { username, password, provider, utilityId, type, location } = await req.json();

    console.log('Starting real scraping process:', {
      provider,
      type,
      location,
      utilityId,
      hasUsername: !!username,
      hasPassword: !!password
    });

    if (!username || !password) {
      throw new Error('Missing required credentials');
    }

    if (provider !== 'engie_romania') {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Launch browser with specific configurations for Deno Deploy
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--headless'
      ]
    });

    const page = await browser.newPage();
    
    // Configure viewport and user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Enable request interception
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Add detailed logging
    page.on('console', msg => console.log('Browser console:', msg.text()));
    page.on('pageerror', err => console.error('Browser page error:', err));

    console.log('Navigating to ENGIE login page...');
    await page.goto('https://my.engie.ro', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('Waiting for login form...');
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.waitForSelector('#password', { timeout: 10000 });

    console.log('Filling login credentials...');
    await page.type('#username', username, { delay: 100 });
    await page.type('#password', password, { delay: 100 });

    console.log('Submitting login form...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);

    // Check for login errors
    const errorSelector = '.alert-danger, .error-message';
    const hasError = await page.$(errorSelector);
    if (hasError) {
      const errorText = await page.evaluate(el => el.textContent, hasError);
      throw new Error(`Login failed: ${errorText}`);
    }

    console.log('Successfully logged in, navigating to bills page...');
    await page.goto('https://my.engie.ro/facturi', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for bills container
    await page.waitForSelector('.facturi-container', { timeout: 30000 });

    console.log('Extracting bill information...');
    const bills = await page.evaluate(() => {
      const billElements = document.querySelectorAll('.factura-item');
      return Array.from(billElements).map(element => {
        try {
          const amountEl = element.querySelector('.suma');
          const amount = amountEl ? 
            parseFloat(amountEl.textContent.replace(/[^\d,]/g, '').replace(',', '.')) : 
            null;

          const dueDateEl = element.querySelector('.scadenta');
          const dueDate = dueDateEl ? 
            new Date(dueDateEl.textContent.split(':')[1].trim()).toISOString().split('T')[0] : 
            null;

          const invoiceEl = element.querySelector('.numar-factura');
          const invoiceNumber = invoiceEl ? 
            invoiceEl.textContent.trim() : 
            null;

          const periodEl = element.querySelector('.perioada');
          const periodText = periodEl ? periodEl.textContent : '';
          const [startStr, endStr] = periodText.split('-').map(d => d.trim());

          if (!amount || !dueDate || !invoiceNumber) {
            console.log('Skipping bill due to missing required information:', { amount, dueDate, invoiceNumber });
            return null;
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

    return new Response(
      JSON.stringify({
        success: true,
        bills
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

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
    
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
        bills: []
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
