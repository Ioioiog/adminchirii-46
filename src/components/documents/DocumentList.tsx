
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentCard } from "./DocumentCard";
import { DocumentType } from "@/integrations/supabase/types/document-types";
import { DocumentListSkeleton } from "./DocumentListSkeleton";
import { EmptyDocumentState } from "./EmptyDocumentState";

interface DocumentListProps {
  userId: string;
  userRole: "landlord" | "tenant";
  propertyFilter: string;
  typeFilter: "all" | DocumentType;
  searchTerm: string;
  viewMode: "grid" | "list";
}

export function DocumentList({ 
  userId, 
  userRole, 
  propertyFilter, 
  typeFilter,
  searchTerm,
  viewMode
}: DocumentListProps) {
  const { data: documents, isLoading } = useQuery({
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

      // Apply search filter on the client side
      return data.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.property?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tenant?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    },
  });

  if (isLoading) {
    return <DocumentListSkeleton viewMode={viewMode} />;
  }

  if (!documents?.length) {
    return <EmptyDocumentState userRole={userRole} />;
  }

  return (
    <div className={`space-y-2 max-w-5xl mx-auto ${
      viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0' : ''
    }`}>
      {documents.map((document) => (
        <div 
          key={document.id}
          className="bg-card hover:bg-accent/5 transition-colors rounded-lg border shadow-sm"
        >
          <DocumentCard 
            document={document} 
            userRole={userRole}
            viewMode={viewMode}
          />
        </div>
      ))}
    </div>
  );
}
