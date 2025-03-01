
export interface UtilityProvider {
  id: string;
  provider_name: string;
  username: string;
  encrypted_password?: string;
  property_id?: string;
  property?: {
    name: string;
    address: string;
  };
  utility_type?: 'electricity' | 'water' | 'gas' | 'internet' | 'building maintenance';
  start_day?: number;
  end_day?: number;
  location_name?: string;
}

export interface ScrapingJob {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  last_run_at: string | null;
  error_message: string | null;
}

export const PROVIDER_OPTIONS = [
  { value: 'engie_romania', label: 'ENGIE Romania', default_type: 'gas' },
  { value: 'enel', label: 'ENEL', default_type: 'electricity' },
  { value: 'apa_nova', label: 'Apa Nova', default_type: 'water' },
  { value: 'digi', label: 'DIGI', default_type: 'internet' },
  { value: 'ebloc', label: 'E-Bloc', default_type: 'building maintenance' },
  { value: 'custom', label: 'Other (Custom Provider)', default_type: null }
] as const;

export type ProviderName = typeof PROVIDER_OPTIONS[number]['value'];

export type UtilityType = 'electricity' | 'water' | 'gas' | 'internet' | 'building maintenance';
