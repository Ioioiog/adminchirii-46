
import { SELECTORS, solveCaptcha, romanianDateToISO } from "../constants.ts";
import puppeteer from "puppeteer";

interface Credentials {
  username: string;
  password: string;
}

interface Invoice {
  amount: number;
  due_date: string;
  invoice_number: string;
  type: string;
  status: string;
  pdf_url?: string;
}

/**
 * Scrapes ENGIE Romania bills using Browserless
 */
export async function scrapeEngieRomania(
  credentials: Credentials,
  browserlessApiKey: string,
  captchaApiKey: string
): Promise<Invoice[]> {
  if (!browserlessApiKey) {
    throw new Error("BROWSERLESS_API_KEY is required for scraping ENGIE Romania");
  }
  
  if (!captchaApiKey) {
    throw new Error("CAPTCHA_API_KEY is required for solving reCAPTCHA");
  }

  console.log('Starting ENGIE Romania scraping with Browserless');

  let browser;
  try {
    // Connect to Browserless using proper configuration
    browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessApiKey}`,
      defaultViewport: { width: 1280, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36');
    
    // Navigate to the login page
    console.log("Navigating to ENGIE Romania login page...");
    await page.goto(SELECTORS.ENGIE_ROMANIA.loginPage, { 
      waitUntil: "networkidle2",
      timeout: 60000 
    });

    // Fill login form
    console.log("Filling login form...");
    await page.type(SELECTORS.ENGIE_ROMANIA.usernameSelector, credentials.username);
    await page.type(SELECTORS.ENGIE_ROMANIA.passwordSelector, credentials.password);
    
    // Check for CAPTCHA before clicking login
    const captchaExists = await page.$(SELECTORS.ENGIE_ROMANIA.captchaSelector);
    if (captchaExists) {
      console.log("CAPTCHA detected, solving with 2captcha...");
      const solution = await solveCaptcha(
        SELECTORS.ENGIE_ROMANIA.sitekey,
        captchaApiKey,
        page.url()
      );
      
      // Execute script to set the CAPTCHA solution
      await page.evaluate(`
        document.querySelector('textarea[name="g-recaptcha-response"]').innerHTML = "${solution}";
        try {
          ___grecaptcha_cfg.clients[0].U.U.callback("${solution}");
        } catch (e) {
          console.error("Error executing callback:", e);
        }
      `);
      
      // Wait for CAPTCHA to be applied
      await page.waitForTimeout(2000);
    }
    
    // Explicitly click the login button
    console.log("Clicking login button...");
    try {
      // First try to click using the selector
      await Promise.race([
        page.click(SELECTORS.ENGIE_ROMANIA.loginButtonSelector),
        page.waitForTimeout(5000) // Give it 5 seconds to click
      ]);
    } catch (clickError) {
      console.log("Regular click failed, trying with evaluate:", clickError);
      // If that fails, try using page.evaluate for a more direct approach
      await page.evaluate((selector) => {
        const button = document.querySelector(selector);
        if (button) {
          (button as HTMLElement).click();
        } else {
          console.error("Login button not found");
        }
      }, SELECTORS.ENGIE_ROMANIA.loginButtonSelector);
    }
    
    // Wait for navigation to complete after login
    console.log("Waiting for login navigation...");
    await Promise.race([
      page.waitForNavigation({ 
        waitUntil: "networkidle2",
        timeout: 60000
      }),
      page.waitForSelector('div.nj-sidebar', { timeout: 60000 })
    ]);
    
    // Check if we're logged in by looking for a dashboard element
    const isLoggedIn = await page.evaluate(() => {
      return document.querySelector('div.nj-sidebar') !== null;
    });
    
    if (!isLoggedIn) {
      throw new Error("Login failed - could not access dashboard");
    }
    
    console.log("Successfully logged in, navigating to invoices...");
    
    // Navigate to the invoices page
    await page.goto("https://my.engie.ro/facturi/istoric", { 
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // Extract invoice data
    console.log("Extracting invoices...");
    const invoices = await page.evaluate((tableSelector) => {
      const invoiceRows = Array.from(document.querySelectorAll(tableSelector));
      
      return invoiceRows.map(row => {
        const columns = row.querySelectorAll("td");
        const amount = columns[3]?.textContent?.trim().replace("Lei", "").replace(",", ".") || "0";
        const dueDate = columns[5]?.textContent?.trim() || "N/A";
        const invoiceNumber = columns[1]?.textContent?.trim() || "Unknown";
        const status = columns[6]?.textContent?.trim() || "Unknown";
        const pdfLink = columns[15]?.querySelector("a")?.href || "";
        
        return {
          amount: parseFloat(amount),
          due_date: dueDate,
          invoice_number: invoiceNumber,
          type: "electricity", // Default to electricity, can be overridden based on other data
          status: status,
          pdf_url: pdfLink
        };
      });
    }, SELECTORS.ENGIE_ROMANIA.invoiceTableSelector);

    console.log(`Extracted ${invoices.length} invoices`);
    
    // Process invoice dates to ISO format
    const processedInvoices = invoices.map(invoice => ({
      ...invoice,
      due_date: romanianDateToISO(invoice.due_date)
    }));

    await browser.close();
    return processedInvoices;
  } catch (error) {
    console.error("Error in ENGIE Romania scraper:", error);
    throw new Error(`ENGIE Romania scraping failed: ${error.message}`);
  } finally {
    if (browser) {
      console.log("Closing browser...");
      await browser.close();
    }
  }
}
