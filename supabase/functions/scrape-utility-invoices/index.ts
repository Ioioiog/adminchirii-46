import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Supabase Config
const supabaseUrl = "https://your-supabase-project.supabase.co";
const supabaseKey = "your-service-role-key";
const supabase = createClient(supabaseUrl, supabaseKey);

export default async (req: Request) => {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return new Response(JSON.stringify({ error: "Missing username or password" }), { status: 400 });
    }

    // 1️⃣ Launch Puppeteer Browser
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();

    // 2️⃣ Navigate to Engie Login Page
    await page.goto("http://my.engie.ro/autentificare", { waitUntil: "networkidle2" });

    // 3️⃣ Extract CSRF Token from Meta Tag
    const csrfToken = await page.evaluate(() => {
      return document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
    });

    if (!csrfToken) throw new Error("CSRF Token Not Found");

    // 4️⃣ Fill in Login Credentials
    await page.type('input[name="username"]', username);
    await page.type('input[name="password"]', password);

    // 5️⃣ Solve reCAPTCHA (Manual Step OR Use External Service)
    console.log("Solve the CAPTCHA manually...");

    // Wait for user to solve CAPTCHA manually
    await page.waitForSelector(".g-recaptcha-response", { timeout: 120000 });

    // 6️⃣ Click 'Intra in Cont' and Wait for Redirect
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);

    // 7️⃣ Navigate to Invoice History Page
    await page.goto("http://my.engie.ro/facturi/istoric", { waitUntil: "networkidle2" });

    // 8️⃣ Extract Invoice Data
    const invoices = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".invoice-item")).map(row => ({
        number: row.querySelector(".invoice-number")?.innerText.trim(),
        date: row.querySelector(".invoice-date")?.innerText.trim(),
        total: row.querySelector(".invoice-total")?.innerText.trim(),
      }));
    });

    await browser.close();

    // 9️⃣ Save Invoices to Supabase
    const { error } = await supabase.from("invoices").insert(invoices);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, invoices }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
