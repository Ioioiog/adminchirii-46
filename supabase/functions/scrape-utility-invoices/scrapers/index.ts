
import { BaseScraper, ScraperCredentials } from './base.ts';
import { ExampleProviderScraper } from './example-provider.ts';

export function createScraper(
  providerName: string, 
  credentials: ScraperCredentials
): BaseScraper {
  switch (providerName.toLowerCase()) {
    case 'example_provider':
      return new ExampleProviderScraper(credentials);
    // Add more cases for different providers
    default:
      throw new Error(`Unsupported provider: ${providerName}`);
  }
}
