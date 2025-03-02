
// Import all available scraper modules
import { scrapeEngieRomania } from "./engie-romania";
import { SUPPORTED_PROVIDERS } from "../constants";

// Function to get the appropriate scraper based on provider name
export function getScraper(provider: string) {
  const scraperId = SUPPORTED_PROVIDERS[provider.toUpperCase()];
  
  if (!scraperId) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  
  // Return the appropriate scraper function
  switch (scraperId) {
    case "engie-romania":
      return scrapeEngieRomania;
    default:
      throw new Error(`No scraper implementation for: ${provider}`);
  }
}
