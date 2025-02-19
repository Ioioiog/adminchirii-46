
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

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
  
  try {
    // First, get the login page to obtain any CSRF tokens
    const loginPageResponse = await fetch('https://my.engie.ro/login', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!loginPageResponse.ok) {
      throw new Error('Failed to access login page');
    }

    const loginPageHtml = await loginPageResponse.text();
    const $ = cheerio.load(loginPageHtml);
    
    // Get CSRF token if it exists
    const csrfToken = $('input[name="_csrf"]').val() || '';
    
    console.log('📝 Attempting login...');
    
    // Perform login
    const loginResponse = await fetch('https://my.engie.ro/j_spring_security_check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cookie': loginPageResponse.headers.get('set-cookie') || ''
      },
      body: new URLSearchParams({
        'j_username': credentials.username,
        'j_password': credentials.password,
        '_csrf': csrfToken
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login request failed');
    }

    const responseUrl = loginResponse.url;
    if (responseUrl.includes('login?error')) {
      throw new Error('Authentication failed: Invalid credentials');
    }

    // Get the session cookie
    const cookies = loginResponse.headers.get('set-cookie');
    if (!cookies) {
      throw new Error('No session cookie received');
    }

    console.log('✅ Successfully logged in');

    // Fetch bills page
    const billsResponse = await fetch('https://my.engie.ro/facturi', {
      headers: {
        'Cookie': cookies,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!billsResponse.ok) {
      throw new Error('Failed to fetch bills');
    }

    const billsHtml = await billsResponse.text();
    const $bills = cheerio.load(billsHtml);

    // Extract bills data
    const bills = [];
    $bills('.invoice-item').each((_, element) => {
      bills.push({
        amount: parseFloat($bills(element).find('.amount').text().replace(/[^0-9.,]/g, '') || '0'),
        due_date: $bills(element).find('.due-date').text().trim(),
        invoice_number: $bills(element).find('.invoice-number').text().trim(),
        period_start: $bills(element).find('.period-start').text().trim(),
        period_end: $bills(element).find('.period-end').text().trim(),
        type: 'gas',
        status: $bills(element).find('.status').text().toLowerCase().includes('platit') ? 'paid' : 'pending'
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
