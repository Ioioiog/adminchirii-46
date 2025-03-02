
/**
 * Common utility functions and constants for scrapers
 */

export const SELECTORS = {
  ENGIE_ROMANIA: {
    usernameSelector: "#username",
    passwordSelector: "#password",
    loginButtonSelector: "button[type='submit']",
    invoiceTableSelector: "#istoric-facturi table tbody tr",
    captchaSelector: "iframe[src*='recaptcha']",
    sitekey: "6LeqYkkgAAAAAGa5Jl5qmTHK_Nl4_40-YfU4NN71" // ENGIE Romania reCAPTCHA site key
  }
};

// Maximum retries for operations
export const MAX_RETRIES = 3;

// Delay between retries in milliseconds
export const RETRY_DELAY = 2000;

/**
 * Solves reCAPTCHA using 2captcha service
 */
export async function solveCaptcha(page: any, sitekey: string, captchaApiKey: string, pageUrl: string): Promise<string> {
  console.log("Solving CAPTCHA with 2captcha...");
  
  try {
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
    
    return solution;
  } catch (error) {
    console.error("Error solving CAPTCHA:", error);
    throw new Error(`CAPTCHA solving failed: ${error.message}`);
  }
}

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Convert Romanian date format (DD.MM.YYYY) to ISO format (YYYY-MM-DD)
 */
export const romanianDateToISO = (dateString: string): string => {
  if (!dateString || dateString === 'N/A') return '';
  
  const parts = dateString.split('.');
  if (parts.length !== 3) return '';
  
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};
