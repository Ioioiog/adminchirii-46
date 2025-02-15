
export interface ContractSchema {
  Tables: {
    contracts: {
      Row: {
        id: string;
        property_id: string;
        landlord_id: string;
        tenant_id: string | null;
        contract_type: string;
        status: 'draft' | 'pending' | 'signed' | 'expired' | 'cancelled';
        content: Record<string, any>;
        valid_from: string | null;
        valid_until: string | null;
        created_at: string;
        updated_at: string;
        signature_request_id: string | null;
        signed_document_url: string | null;
        metadata: Record<string, any>;
        template_id: string | null;
      };
      Insert: {
        id?: string;
        property_id: string;
        landlord_id: string;
        tenant_id?: string | null;
        contract_type: string;
        status?: 'draft' | 'pending' | 'signed' | 'expired' | 'cancelled';
        content: Record<string, any>;
        valid_from?: string | null;
        valid_until?: string | null;
        created_at?: string;
        updated_at?: string;
        signature_request_id?: string | null;
        signed_document_url?: string | null;
        metadata?: Record<string, any>;
        template_id?: string | null;
      };
      Update: {
        id?: string;
        property_id?: string;
        landlord_id?: string;
        tenant_id?: string | null;
        contract_type?: string;
        status?: 'draft' | 'pending' | 'signed' | 'expired' | 'cancelled';
        content?: Record<string, any>;
        valid_from?: string | null;
        valid_until?: string | null;
        created_at?: string;
        updated_at?: string;
        signature_request_id?: string | null;
        signed_document_url?: string | null;
        metadata?: Record<string, any>;
        template_id?: string | null;
      };
    };
    contract_templates: {
      Row: {
        id: string;
        name: string;
        category: string;
        content: Record<string, any>;
        variables: string[];
        is_active: boolean;
        created_at: string;
        updated_at: string;
        created_by: string;
        description: string | null;
      };
      Insert: {
        id?: string;
        name: string;
        category: string;
        content: Record<string, any>;
        variables?: string[];
        is_active?: boolean;
        created_at?: string;
        updated_at?: string;
        created_by: string;
        description?: string | null;
      };
      Update: {
        id?: string;
        name?: string;
        category?: string;
        content?: Record<string, any>;
        variables?: string[];
        is_active?: boolean;
        created_at?: string;
        updated_at?: string;
        created_by?: string;
        description?: string | null;
      };
    };
    contract_signatures: {
      Row: {
        id: string;
        contract_id: string;
        signer_id: string;
        signer_role: string;
        signed_at: string | null;
        signature_data: string | null;
        ip_address: string | null;
        created_at: string;
      };
      Insert: {
        id?: string;
        contract_id: string;
        signer_id: string;
        signer_role: string;
        signed_at?: string | null;
        signature_data?: string | null;
        ip_address?: string | null;
        created_at?: string;
      };
      Update: {
        id?: string;
        contract_id?: string;
        signer_id?: string;
        signer_role?: string;
        signed_at?: string | null;
        signature_data?: string | null;
        ip_address?: string | null;
        created_at?: string;
      };
    };
  };
  Functions: {
    create_default_contract_templates: {
      Args: Record<PropertyKey, never>;
      Returns: void;
    };
  };
}
