
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentCard } from "./DocumentCard";
import { DocumentType } from "@/integrations/supabase/types/document-types";
import { DocumentListSkeleton } from "./DocumentListSkeleton";
import { EmptyDocumentState } from "./EmptyDocumentState";
import { ContractStatus } from "@/types/contract";

interface DocumentListProps {
  userId: string;
  userRole: "landlord" | "tenant";
  propertyFilter: string;
  typeFilter: "all" | DocumentType;
  searchTerm: string;
  viewMode: "grid" | "list";
}

interface DocumentFromDB {
  id: string;
  name: string;
  file_path: string;
  document_type: string;
  property_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  uploaded_by: string;
  property: {
    id: string;
    name: string;
    address: string;
  } | null;
  tenant: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

interface ContractDocument {
  id: string;
  name: string;
  file_path?: string;
  document_type: string;
  property_id: string;
  created_at: string;
  uploaded_by: string;
  property: {
    id: string;
    name: string;
    address: string;
  } | null;
  tenant: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  isContract: boolean;
  contract_type: string;
  status: ContractStatus;
}

type CombinedDocument = DocumentFromDB | ContractDocument;

function isValidDocumentType(type: string): type is DocumentType {
  return ['lease_agreement', 'invoice', 'receipt', 'other'].includes(type);
}

export function DocumentList({ 
  userId, 
  userRole, 
  propertyFilter, 
  typeFilter,
  searchTerm,
  viewMode
}: DocumentListProps) {
  // Fetch regular documents
  const { data: regularDocuments = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["documents", propertyFilter, typeFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("documents")
        .select(`
          *,
          property:properties (
            id,
            name,
            address
          ),
          uploaded_by:profiles!documents_uploaded_by_fkey (
            email,
            first_name,
            last_name
          ),
          tenant:profiles!documents_tenant_id_fkey (
            first_name,
            last_name,
            email
          )
        `);

      if (userRole === "landlord") {
        query = query.eq("uploaded_by", userId);
      } else if (userRole === "tenant") {
        query = query.eq("tenant_id", userId);
      }

      if (propertyFilter && propertyFilter !== "all") {
        query = query.eq("property_id", propertyFilter);
      }

      if (typeFilter && typeFilter !== "all") {
        query = query.eq("document_type", typeFilter);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Apply search filter on the client side and validate document types
      return (data as DocumentFromDB[]).filter(doc => {
        const matchesSearch = 
          doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.tenant?.email?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch && isValidDocumentType(doc.document_type);
      });
    },
  });

  // Fetch contracts
  const { data: contracts = [], isLoading: isLoadingContracts } = useQuery({
    queryKey: ["document-contracts", propertyFilter, searchTerm, userId, userRole],
    queryFn: async () => {
      if (!userId) return [];
      
      let query = supabase
        .from("contracts")
        .select(`
          id,
          contract_type,
          status,
          valid_from,
          valid_until,
          content,
          property_id,
          properties(id, name, address),
          tenant:profiles!contracts_tenant_id_fkey(
            first_name,
            last_name,
            email
          ),
          created_at
        `);

      if (userRole === "landlord") {
        query = query.eq("landlord_id", userId);
      } else if (userRole === "tenant") {
        query = query.eq("tenant_id", userId);
      }

      if (propertyFilter && propertyFilter !== "all") {
        query = query.eq("property_id", propertyFilter);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transform contracts into document format
      return data.map(contract => ({
        id: contract.id,
        name: `${contract.contract_type.replace('_', ' ')} - ${contract.properties?.name || 'Untitled Property'}`,
        document_type: "lease_agreement",
        property_id: contract.property_id,
        created_at: contract.created_at,
        uploaded_by: userId,
        property: contract.properties,
        tenant: contract.tenant,
        isContract: true,
        contract_type: contract.contract_type,
        status: contract.status
      })) as ContractDocument[];
    },
    enabled: !!userId
  });

  const isLoading = isLoadingDocuments || isLoadingContracts;

  // Combine and filter the documents
  const filteredDocuments = [...regularDocuments, ...contracts].filter(doc => {
    // Apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        doc.name.toLowerCase().includes(searchLower) ||
        doc.property?.name?.toLowerCase().includes(searchLower) ||
        (doc.tenant?.email && doc.tenant.email.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  if (isLoading) {
    return <DocumentListSkeleton viewMode={viewMode} />;
  }

  if (!filteredDocuments.length) {
    return <EmptyDocumentState userRole={userRole} />;
  }

  return (
    <div className={`space-y-2 max-w-5xl mx-auto ${
      viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0' : ''
    }`}>
      {filteredDocuments.map((document) => (
        <div 
          key={document.id}
          className="bg-card hover:bg-accent/5 transition-colors rounded-lg border shadow-sm"
        >
          <DocumentCard 
            document={{
              ...document,
              document_type: document.document_type as DocumentType,
              isContract: 'isContract' in document ? document.isContract : false
            }}
            userRole={userRole}
            viewMode={viewMode}
          />
        </div>
      ))}
    </div>
  );
}
