
import { UtilityProvider } from "../types";
import { useScrapingQueue } from "./scraping/queueManager";

/**
 * Main hook for utility bill scraping functionality
 * This is now a thin wrapper around the refactored modules
 */
export function useScraping(providers: UtilityProvider[]) {
  const {
    scrapingStates,
    scrapingJobs,
    addToQueue,
    isProcessingQueue
  } = useScrapingQueue(providers);

  return {
    scrapingStates,
    scrapingJobs,
    addToQueue,
    isProcessingQueue
  };
}
