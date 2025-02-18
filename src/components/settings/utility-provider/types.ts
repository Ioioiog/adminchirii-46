
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
  utility_type?: 'electricity' | 'water' | 'gas';
  start_day?: number;
  end_day?: number;
  location_name?: string;
}

export interface ScrapingJob {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  last_run_at: string | null;
  error_message: string | null;
}
