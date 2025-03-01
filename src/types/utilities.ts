
export enum UtilityType {
  Electricity = 'electricity',
  Water = 'water',
  Gas = 'gas',
  Internet = 'internet',
  BuildingMaintenance = 'building maintenance'
}

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
}
