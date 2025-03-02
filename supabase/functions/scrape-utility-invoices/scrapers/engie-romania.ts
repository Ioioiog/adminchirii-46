
import { SELECTORS, createBrowserlessRequest, romanianDateToISO } from "../constants";
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
  pdf_url: string;
}

/**
 * Solves reCAPTCHA using 2captcha service
 */
async function solveCaptcha(page: puppeteer.Page, sitekey: string, captchaApiKey: string): Promise<string> {
  console.log("Solving CAPTCHA with 2captcha...");
  
  try {
    // Get the page URL for the 2captcha request
    const pageUrl = page.url();
    
    // Make request to 2captcha to solve the CAPTCHA
    const requestUrl = `https://2captcha.com/in.php?key=${captchaApiKey}&method=userrecaptcha&googlekey=${sitekey}&pageurl=${pageUrl}&json=1`;
    const response = await fetch(requestUrl);
    const requestData = await response.json();
    
    if (!requestData.status) {
      throw new Error(`Failed to submit CAPTCHA: ${requestData.error_text}`);
    }
    
    const captchaId = requestData.request;
    console.log(`CAPTCHA submitted, ID: ${captchaId}`);
    
    // Poll for the CAPTCHA solution
    let solved = false;
    let solution = '';
    let attempts = 0;
    
    while (!solved && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
      
      const resultUrl = `https://2captcha.com/res.php?key=${captchaApiKey}&action=get&id=${captchaId}&json=1`;
      const resultResponse = await fetch(resultUrl);
      const resultData = await resultResponse.json();
      
      if (resultData.status === 1) {
        solution = resultData.request;
        solved = true;
        console.log("CAPTCHA solved successfully");
      } else if (resultData.request !== "CAPCHA_NOT_READY") {
        throw new Error(`Failed to solve CAPTCHA: ${resultData.request}`);
      }
      
      attempts++;
    }
    
    if (!solved) {
      throw new Error("CAPTCHA solving timed out");
    }
    
    // Execute script to set the CAPTCHA solution
    await page.evaluate(`
      document.querySelector('textarea[name="g-recaptcha-response"]').innerHTML = "${solution}";
      ___grecaptcha_cfg.clients[0].U.U.callback("${solution}");
    `);
    
    return solution;
  } catch (error) {
    console.error("Error solving CAPTCHA:", error);
    throw new Error(`CAPTCHA solving failed: ${error.message}`);
  }
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
    browser = await puppeteer.connect(createBrowserlessRequest(browserlessApiKey));
    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36');
    
    // Enable request interception for better logging
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Navigate to the login page
    console.log("Navigating to ENGIE Romania login page...");
    await page.goto("https://my.engie.ro/autentificare", { 
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
      await solveCaptcha(page, SELECTORS.ENGIE_ROMANIA.sitekey, captchaApiKey);
    }
    
    // Click login and wait for navigation
    await page.click(SELECTORS.ENGIE_ROMANIA.loginButtonSelector);
    await page.waitForNavigation({ 
      waitUntil: "networkidle2",
      timeout: 60000
    });
    
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
          type: "gas", // Default to gas, can be overridden based on other data
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
