
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
  { value: 'enel_romania', label: 'ENEL Romania', default_type: 'electricity' },
  { value: 'aqua_nova', label: 'Aqua Nova', default_type: 'water' },
  { value: 'digi', label: 'Digi Romania', default_type: 'internet' },
  { value: 'building_admin', label: 'Building Administration', default_type: 'building maintenance' }
] as const;

export type ProviderName = typeof PROVIDER_OPTIONS[number]['value'];
