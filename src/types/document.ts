
import { ContractStatus } from "./contract";
import { Json } from "@/integrations/supabase/types/json";

export interface Contract {
  id: string;
  contract_type: string;
  status: ContractStatus;
  valid_from: string | null;
  valid_until: string | null;
  tenant_id: string | null;
  landlord_id: string;
  properties: { name: string } | null;
  metadata: Json;
}

export interface LeaseDocument {
  id: string;
  name: string;
  file_path: string;
  document_type: string;
  property: { 
    id: string;
    name: string;
  } | null;
  created_at: string;
  contract_type: string;
  status: ContractStatus;
  valid_from: string | null;
  valid_until: string | null;
  properties: { name: string } | null;
  document_name?: string;
  metadata?: Json;
}

export type ContractOrDocument = Contract | LeaseDocument;
