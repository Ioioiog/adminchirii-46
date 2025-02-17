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

export type Database = {
  public: {
    Tables: {
      // ... other table definitions
    };
    Functions: {
      get_decrypted_credentials: {
        Args: { property_id_input: string };
        Returns: ProviderCredentialsResponse;
      };
      // ... other function definitions
    };
  };
};
