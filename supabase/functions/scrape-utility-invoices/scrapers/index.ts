
import { BaseScraper, ScraperCredentials } from './base.ts';
import { ExampleProviderScraper } from './example-provider.ts';
import { EngieRomaniaScraper } from './engie-romania.ts';

export function createScraper(
  providerName: string, 
  credentials: ScraperCredentials
): BaseScraper {
  switch (providerName.toLowerCase()) {
    case 'example_provider':
      return new ExampleProviderScraper(credentials);
    case 'engie_romania':
      return new EngieRomaniaScraper(credentials);
    default:
      throw new Error(`Unsupported provider: ${providerName}`);
  }
}
