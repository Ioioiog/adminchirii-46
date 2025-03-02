
/**
 * Utility provider types and related definitions
 * This file contains type definitions and constants for the utility provider functionality
 */

/**
 * Represents the different types of utilities that can be managed
 */
export type UtilityType = 'electricity' | 'water' | 'gas' | 'internet' | 'building maintenance';

/**
 * Constants for utility types to be used in place of the enum
 */
export const UTILITY_TYPES = {
  ELECTRICITY: 'electricity' as UtilityType,
  WATER: 'water' as UtilityType,
  GAS: 'gas' as UtilityType,
  INTERNET: 'internet' as UtilityType,
  BUILDING_MAINTENANCE: 'building maintenance' as UtilityType
};

/**
 * Represents a utility provider with its credentials and related information
 */
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
  utility_type?: UtilityType;
  start_day?: number;
  end_day?: number;
  location_name?: string;
  landlord_id?: string;
  password?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Represents the status and metadata of a scraping job
 */
export interface ScrapingJob {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  last_run_at: string | null;
  error_message: string | null;
}

/**
 * Available provider options with their display labels and default utility types
 */
export const PROVIDER_OPTIONS = [
  { value: 'engie_romania', label: 'ENGIE Romania', default_type: 'gas' },
  { value: 'enel', label: 'ENEL', default_type: 'electricity' },
  { value: 'apa_nova', label: 'Apa Nova', default_type: 'water' },
  { value: 'digi', label: 'DIGI', default_type: 'internet' },
  { value: 'ebloc', label: 'E-Bloc', default_type: 'building maintenance' },
  { value: 'custom', label: 'Other (Custom Provider)', default_type: null }
] as const;

/**
 * Type representing valid provider name values
 */
export type ProviderName = typeof PROVIDER_OPTIONS[number]['value'];

/**
 * Props interface for the ProviderList component
 */
export interface ProviderListProps {
  providers: UtilityProvider[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (provider: UtilityProvider) => void;
  isLoading: boolean;
}
