
export interface UtilityProvider {
  id: string;
  provider_name: string;
  username?: string; // Make username optional to match database structure
  encrypted_password?: string;
  password?: string;
  property_id?: string;
  property?: {
    name: string;
    address: string;
  };
  utility_type?: 'electricity' | 'water' | 'gas' | 'internet' | 'building maintenance';
  start_day?: number;
  end_day?: number;
  location_name?: string;
  landlord_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ScrapingJob {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  last_run_at: string | null;
  error_message: string | null;
}

export const PROVIDER_OPTIONS = [
  { value: 'engie_romania', label: 'ENGIE Romania', default_type: 'gas' },
  { value: 'engie_romania', label: 'ENGIE Romania', default_type: 'electricity' },
  { value: 'apa_nova', label: 'Apa Nova', default_type: 'water' },
  { value: 'digi', label: 'Digi Romania', default_type: 'internet' },
  { value: 'e-bloc', label: 'building maintenance', default_type: 'building maintenance' }
] as const;

export type ProviderName = typeof PROVIDER_OPTIONS[number]['value'];
