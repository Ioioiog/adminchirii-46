import { Json } from './json';

export interface RpcResponse<T> {
  data: T;
  error: Error | null;
}

export interface SetClaimParams {
  name: string;
  value: string;
}

export interface SetClaimRequest {
  params: {
    name: string;
    value: string;
  };
}

export interface ProviderCredentialsResponse {
  id: string;
  username: string;
  password: string;
}

// Extend the Database type to include our RPC functions
export interface Database {
  public: {
    Tables: {
      // ... other table definitions
    };
    Functions: {
      create_default_contract_templates: {
        Args: Record<string, never>;
        Returns: void;
      };
      delete_tenant_invitation: {
        Args: { invitation_id: string };
        Returns: void;
      };
      generate_monthly_invoices: {
        Args: Record<string, never>;
        Returns: void;
      };
      get_decrypted_credentials: {
        Args: { property_id_input: string };
        Returns: ProviderCredentialsResponse;
      };
      get_latest_tenancy: {
        Args: { p_tenant_id: string };
        Returns: {
          tenancy_id: string;
          status: string;
          start_date: string;
          end_date: string;
          property_id: string;
          property_name: string;
          property_address: string;
        }[];
      };
      get_property_utility_stats: {
        Args: { property_id: string };
        Returns: Json;
      };
      set_claim: {
        Args: { params: Json };
        Returns: void;
      };
      toggle_message_reaction: {
        Args: { p_message_id: string; p_emoji: string };
        Returns: boolean;
      };
    };
  };
}
