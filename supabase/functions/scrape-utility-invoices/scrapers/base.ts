
import { ScrapingResult } from '../constants';
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

export abstract class BillScraperBase {
  abstract scrape(username: string, password: string): Promise<ScrapingResult>;
  
  // Helper method to set up the browser
  protected async setupBrowser() {
    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    
    if (!browserlessApiKey) {
      console.error('BROWSERLESS_API_KEY environment variable is not set');
      return null;
    }
    
    try {
      const browser = await puppeteer.connect({
        browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessApiKey}`,
      });
      
      return browser;
    } catch (error) {
      console.error('Failed to connect to browserless.io:', error);
      return null;
    }
  }
}
