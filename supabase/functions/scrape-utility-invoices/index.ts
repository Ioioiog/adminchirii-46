
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

    // Launch browser
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      console.log('Navigating to ENGIE login page...');
      
      // Navigate to login page
      await page.goto('https://my.engie.ro/login', { waitUntil: 'networkidle0' });
      
      // Accept cookies if present
      try {
        const cookieButton = await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
        if (cookieButton) {
          await cookieButton.click();
          console.log('Accepted cookies');
        }
      } catch (error) {
        console.log('No cookie banner found or already accepted');
      }

      // Fill login form
      console.log('Filling login credentials...');
      await page.type('input[name="username"]', username);
      await page.type('input[name="password"]', password);
      
      // Submit login form
      console.log('Submitting login form...');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.click('button[type="submit"]')
      ]);

      // Check for login errors
      const errorElement = await page.$('.alert-danger');
      if (errorElement) {
        const errorText = await page.evaluate(el => el.textContent, errorElement);
        throw new Error(`Login failed: ${errorText}`);
      }

      // Navigate to bills page
      console.log('Navigating to bills page...');
      await page.goto('https://my.engie.ro/facturi-plati', { waitUntil: 'networkidle0' });

      // Extract bill information
      console.log('Extracting bill information...');
      const bills = await page.evaluate(() => {
        const billElements = document.querySelectorAll('.factura-item');
        return Array.from(billElements).map(element => {
          const amountText = element.querySelector('.suma')?.textContent || '0';
          const amount = parseFloat(amountText.replace(/[^\d,]/g, '').replace(',', '.'));
          
          const dueDateElement = element.querySelector('.scadenta');
          const dueDate = dueDateElement ? 
            new Date(dueDateElement.textContent.trim().split(':')[1].trim()).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0];

          const periodElement = element.querySelector('.perioada');
          const periodText = periodElement ? periodElement.textContent.trim().split(':')[1].trim() : '';
          const [startStr, endStr] = periodText.split('-').map(d => d.trim());
          
          const invoiceElement = element.querySelector('.numar');
          const invoiceNumber = invoiceElement ? 
            invoiceElement.textContent.trim().split(':')[1].trim() : 
            `ENGIE-${Math.random().toString(36).substring(7)}`;

          return {
            amount,
            due_date: dueDate,
            invoice_number: invoiceNumber,
            period_start: startStr ? new Date(startStr).toISOString().split('T')[0] : null,
            period_end: endStr ? new Date(endStr).toISOString().split('T')[0] : null,
            type: 'gas',
            status: 'pending'
          };
        });
      });

      console.log('Extracted bills:', {
        count: bills.length,
        location,
        firstBill: bills[0]
      });

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
      console.error('Error during scraping:', error);
      await browser.close();
      throw error;
    }

  } catch (error) {
    console.error('Error in scrape-utility-invoices function:', error);
    
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
