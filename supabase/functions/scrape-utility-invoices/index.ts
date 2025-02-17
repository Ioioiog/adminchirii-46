
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
      status: 204, // Use 204 for OPTIONS requests
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

    // Launch Puppeteer Browser
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();

    try {
      // Navigate to Engie Login Page
      console.log("Navigating to login page...");
      await page.goto("http://my.engie.ro/autentificare", { waitUntil: "networkidle2" });

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

      // Solve reCAPTCHA (Manual Step OR Use External Service)
      console.log("Waiting for CAPTCHA solution...");
      await page.waitForSelector(".g-recaptcha-response", { timeout: 120000 });

      // Click 'Intra in Cont' and Wait for Redirect
      console.log("Submitting login form...");
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);

      // Navigate to Invoice History Page
      console.log("Navigating to invoice history...");
      await page.goto("http://my.engie.ro/facturi/istoric", { waitUntil: "networkidle2" });

      // Extract Invoice Data
      console.log("Extracting invoice data...");
      const invoices = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".invoice-item")).map(row => ({
          invoice_number: row.querySelector(".invoice-number")?.innerText.trim() || null,
          due_date: row.querySelector(".invoice-date")?.innerText.trim() || null,
          amount: parseFloat(row.querySelector(".invoice-total")?.innerText.trim().replace(/[^0-9.]/g, '') || '0'),
          pdf_path: row.querySelector(".invoice-download")?.getAttribute("href") || null,
        }));
      });

      if (!invoices.length) {
        throw new Error("No invoices found");
      }

      // Validate and format invoice data
      const validInvoices = invoices
        .filter(invoice => 
          invoice.invoice_number && 
          invoice.due_date && 
          invoice.amount && 
          !isNaN(invoice.amount)
        )
        .map(invoice => ({
          utility_id: utilityId,
          invoice_number: invoice.invoice_number,
          due_date: new Date(invoice.due_date).toISOString(),
          amount: invoice.amount,
          pdf_path: invoice.pdf_path,
          status: 'pending'
        }));

      // Save Invoices to Supabase
      console.log("Saving invoices to database...");
      const { error: dbError } = await supabase
        .from("utility_invoices")
        .insert(validInvoices);
      
      if (dbError) throw dbError;

      return new Response(
        JSON.stringify({ success: true, invoices: validInvoices }), 
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
        error: error.message || "An error occurred while scraping invoices" 
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};
