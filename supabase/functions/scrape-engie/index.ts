
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScraperCredentials {
  username: string;
  password: string;
}

async function scrapeEngie(credentials: ScraperCredentials): Promise<any> {
  console.log('🚀 Starting ENGIE Romania scraping process');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);
    
    console.log('🔑 Navigating to login page...');
    await page.goto('https://my.engie.ro/login', { waitUntil: 'networkidle0' });
    
    // Wait for login form elements with longer timeout
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.waitForSelector('#password', { timeout: 10000 });
    
    console.log('📝 Entering credentials...');
    await page.type('#username', credentials.username);
    await page.type('#password', credentials.password);
    
    console.log('🔓 Submitting login form...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);

    // Check if login was successful by looking for dashboard elements
    const isLoggedIn = await page.evaluate(() => {
      const errorElement = document.querySelector('.alert-danger');
      if (errorElement) {
        throw new Error(`Login failed: ${errorElement.textContent}`);
      }
      return document.querySelector('.dashboard') !== null;
    });

    if (!isLoggedIn) {
      throw new Error('Authentication failed');
    }

    console.log('✅ Successfully logged in');
    
    // Navigate to invoices page
    await page.goto('https://my.engie.ro/facturi', { waitUntil: 'networkidle0' });
    
    // Extract bills data
    const bills = await page.evaluate(() => {
      const billElements = document.querySelectorAll('.invoice-item');
      return Array.from(billElements).map(bill => {
        return {
          amount: parseFloat(bill.querySelector('.amount')?.textContent?.replace(/[^0-9.,]/g, '') || '0'),
          due_date: bill.querySelector('.due-date')?.textContent?.trim() || '',
          invoice_number: bill.querySelector('.invoice-number')?.textContent?.trim() || '',
          period_start: bill.querySelector('.period-start')?.textContent?.trim() || '',
          period_end: bill.querySelector('.period-end')?.textContent?.trim() || '',
          type: 'gas',
          status: bill.querySelector('.status')?.textContent?.toLowerCase().includes('platit') ? 'paid' : 'pending'
        };
      });
    });

    return { success: true, bills };

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    return {
      success: false,
      bills: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const requestData = await req.json();
    console.log('📨 Received scraping request');

    if (!requestData.username || !requestData.password) {
      throw new Error('Missing credentials');
    }

    const result = await scrapeEngie({
      username: requestData.username,
      password: requestData.password
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Error in scrape-engie function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        bills: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
