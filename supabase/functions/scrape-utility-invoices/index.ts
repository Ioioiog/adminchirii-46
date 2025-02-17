
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Supabase Config using environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

      // For debugging - take screenshot of the login page
      await page.screenshot({ path: '/tmp/login-page.png' });
      console.log("Login page screenshot saved");

      // Extract CSRF Token from Meta Tag
      console.log("Extracting CSRF token...");
      const csrfToken = await page.evaluate(() => {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        return metaTag?.getAttribute("content") || null;
      });

      if (!csrfToken) {
        throw new Error("CSRF Token Not Found");
      }

      // Fill in Login Credentials
      console.log("Filling login credentials...");
      await page.type('input[name="username"]', username);
      await page.type('input[name="password"]', password);

      // Wait for reCAPTCHA to load
      console.log("Waiting for CAPTCHA to load...");
      try {
        await page.waitForSelector(".g-recaptcha", { 
          timeout: 10000,
          visible: true 
        });
      } catch (error) {
        console.error("CAPTCHA selector not found:", error);
        throw new Error("CAPTCHA not found on page");
      }

      // For now, return early with a message about manual CAPTCHA
      return new Response(
        JSON.stringify({ 
          error: "Manual CAPTCHA verification required. Please try again in a few minutes.",
          status: "manual_captcha_required"
        }), 
        { 
          status: 200,
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
