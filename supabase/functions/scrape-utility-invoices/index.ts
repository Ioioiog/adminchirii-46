
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Supabase Config using environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const CAPTCHA_API_KEY = Deno.env.get("CAPTCHA_API_KEY")!;

async function solveCaptcha(siteKey: string, pageUrl: string): Promise<string> {
  console.log("Solving CAPTCHA using 2captcha...");
  
  // Submit CAPTCHA to 2captcha
  const submitResponse = await fetch(`http://2captcha.com/in.php?key=${CAPTCHA_API_KEY}&method=userrecaptcha&googlekey=${siteKey}&pageurl=${pageUrl}&json=1`);
  const submitData = await submitResponse.json();
  
  if (!submitData.status) {
    throw new Error(`Failed to submit CAPTCHA: ${submitData.error_text}`);
  }
  
  const captchaId = submitData.request;
  
  // Wait for CAPTCHA to be solved (check every 5 seconds, timeout after 3 minutes)
  for (let i = 0; i < 36; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const resultResponse = await fetch(`http://2captcha.com/res.php?key=${CAPTCHA_API_KEY}&action=get&id=${captchaId}&json=1`);
    const resultData = await resultResponse.json();
    
    if (resultData.status === 1) {
      console.log("CAPTCHA solved successfully!");
      return resultData.request;
    }
    
    if (resultData.request !== "CAPCHA_NOT_READY") {
      throw new Error(`Failed to solve CAPTCHA: ${resultData.request}`);
    }
  }
  
  throw new Error("CAPTCHA solving timeout");
}

export default async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    console.log("Starting scraping process...");
    const { username, password, utilityId } = await req.json();
    
    if (!username || !password || !utilityId) {
      return new Response(
        JSON.stringify({ error: "Missing username, password or utility ID" }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Launch Puppeteer Browser with increased timeout
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ 
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920x1080"
      ],
      timeout: 60000 // 60 second timeout
    });

    try {
      console.log("Creating new page...");
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Set default navigation timeout
      page.setDefaultNavigationTimeout(30000);

      // Navigate to Engie Login Page
      console.log("Navigating to login page...");
      await page.goto("http://my.engie.ro/autentificare", { 
        waitUntil: "networkidle2",
        timeout: 30000
      });

      // Extract CSRF Token and reCAPTCHA site key
      console.log("Extracting CSRF token and reCAPTCHA site key...");
      const { csrfToken, siteKey } = await page.evaluate(() => {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        const recaptchaDiv = document.querySelector('.g-recaptcha');
        return {
          csrfToken: metaTag?.getAttribute("content") || null,
          siteKey: recaptchaDiv?.getAttribute("data-sitekey") || null
        };
      });

      if (!csrfToken) {
        throw new Error("CSRF Token Not Found");
      }

      if (!siteKey) {
        throw new Error("reCAPTCHA site key not found");
      }

      // Fill in Login Credentials
      console.log("Filling login credentials...");
      await page.type('input[name="username"]', username);
      await page.type('input[name="password"]', password);

      // Solve CAPTCHA
      console.log("Solving CAPTCHA...");
      const captchaSolution = await solveCaptcha(siteKey, page.url());

      // Insert CAPTCHA solution
      await page.evaluate((solution) => {
        (window as any).grecaptcha.getResponse = () => solution;
      }, captchaSolution);

      // Submit form and wait for navigation
      console.log("Submitting login form...");
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: "networkidle2" })
      ]);

      // Navigate to Invoice History Page
      console.log("Navigating to invoice history...");
      await page.goto("http://my.engie.ro/facturi/istoric", { waitUntil: "networkidle2" });

      // Extract Invoice Data
      console.log("Extracting invoice data...");
      const bills = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".invoice-item")).map(row => ({
          invoice_number: row.querySelector(".invoice-number")?.innerText.trim() || null,
          due_date: row.querySelector(".invoice-date")?.innerText.trim() || null,
          amount: parseFloat(row.querySelector(".invoice-total")?.innerText.trim().replace(/[^0-9.]/g, '') || '0'),
          pdf_path: row.querySelector(".invoice-download")?.getAttribute("href") || null,
          status: 'pending',
          currency: 'RON',
          consumption_period: row.querySelector(".invoice-period")?.innerText.trim() || null
        }));
      });

      if (!bills.length) {
        throw new Error("No bills found");
      }

      // Validate and format bill data
      const validBills = bills
        .filter(bill => 
          bill.invoice_number && 
          bill.due_date && 
          bill.amount && 
          !isNaN(bill.amount)
        )
        .map(bill => ({
          provider_id: utilityId,
          invoice_number: bill.invoice_number,
          due_date: new Date(bill.due_date).toISOString(),
          amount: bill.amount,
          pdf_path: bill.pdf_path,
          status: bill.status,
          currency: bill.currency,
          consumption_period: bill.consumption_period
        }));

      // Save Bills to Supabase
      console.log("Saving bills to database...");
      const { error: dbError } = await supabase
        .from("utility_bills")
        .upsert(validBills, {
          onConflict: 'invoice_number,provider_id'
        });
      
      if (dbError) throw dbError;

      return new Response(
        JSON.stringify({ success: true, bills: validBills }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } finally {
      // Ensure browser is closed even if there's an error
      console.log("Closing browser...");
      await browser.close();
    }

  } catch (error) {
    console.error("Error in scrape-utility-invoices:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An error occurred while scraping invoices",
        details: error.stack
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};
