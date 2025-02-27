
export type DocumentType = "lease_agreement" | "invoice" | "receipt" | "other" | "general" | "maintenance" | "legal" | "notice" | "inspection" | "lease";

export interface Document {
  Row: {
    id: string;
    name: string;
    file_path: string;
    property_id: string | null;
    tenant_id: string | null;
    uploaded_by: string;
    created_at: string;
    updated_at: string;
    document_type: DocumentType;
  };
  Insert: {
    id?: string;
    name: string;
    file_path: string;
    property_id?: string | null;
    tenant_id?: string | null;
    uploaded_by: string;
    document_type?: DocumentType;
  };
  Update: {
    name?: string;
    file_path?: string;
    property_id?: string | null;
    tenant_id?: string | null;
    document_type?: DocumentType;
  };
}
