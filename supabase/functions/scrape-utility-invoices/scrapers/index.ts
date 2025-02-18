
import { BaseScraper } from './base.ts';
import { EngieRomaniaScraper } from './engie-romania.ts';

interface ScraperCredentials {
  username: string;
  password: string;
}

export function createScraper(provider: string, credentials: ScraperCredentials): BaseScraper {
  switch (provider) {
    case 'engie_romania':
      return new EngieRomaniaScraper(credentials);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
