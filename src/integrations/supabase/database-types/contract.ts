
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
}
