
// Status constants for scraping jobs
export const JOB_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Supported utility providers mapping
export const SUPPORTED_PROVIDERS: Record<string, string> = {
  'ENGIE_ROMANIA': 'engie-romania',
  'ENGIE': 'engie-romania',
  'ENEL': 'enel',
  'APA_NOVA': 'apa-nova',
  'DIGI': 'digi',
  'EBLOC': 'ebloc'
};

// Default timeout for browser operations
export const DEFAULT_TIMEOUT = 60000; // 60 seconds

// Default wait time for page loading
export const DEFAULT_WAIT_TIME = 5000; // 5 seconds
