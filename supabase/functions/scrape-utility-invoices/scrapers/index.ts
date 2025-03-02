
import { ScrapingResult } from '../constants';
import { ExampleProviderScraperImpl } from './example-provider';
import { EngieRomaniaScraperImpl } from './engie-romania';

export interface BillScraper {
  scrape(username: string, password: string): Promise<ScrapingResult>;
}

// Factory function to get the appropriate scraper
export function getScraperForProvider(provider: string): BillScraper | null {
  console.log(`Getting scraper for provider: ${provider}`);
  
  switch (provider?.toLowerCase()) {
    case 'engie':
    case 'engie romania':
    case 'engie_romania':
      console.log('Using ENGIE Romania scraper');
      return new EngieRomaniaScraperImpl();
      
    case 'example_provider':
      console.log('Using example provider scraper');
      return new ExampleProviderScraperImpl();
      
    default:
      console.log(`No scraper found for provider: ${provider}`);
      return null;
  }
}
