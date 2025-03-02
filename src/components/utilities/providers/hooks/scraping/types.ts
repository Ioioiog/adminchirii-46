
import { ScrapingJob, UtilityProvider } from "../../types";

export interface Credentials {
  id: string;
  username: string;
  password: string;
}

export interface ScrapingResponse {
  success: boolean;
  error?: string;
  jobId?: string;
  bills?: Array<{
    amount: number;
    due_date: string;
    invoice_number: string;
    type: string;
    status: string;
  }>;
}

export interface ScrapingState {
  scrapingStates: Record<string, boolean>;
  scrapingJobs: Record<string, ScrapingJob>;
  scrapingQueue: string[];
  isProcessingQueue: boolean;
}
