
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useToast } from "@/hooks/use-toast";
import { DocumentDialog } from "@/components/documents/DocumentDialog";
import { DocumentType } from "@/integrations/supabase/types/document-types";
import { DocumentFilters } from "@/components/documents/DocumentFilters";
import { useQuery } from "@tanstack/react-query";
import { ContractDetailsDialog } from "@/components/contracts/ContractDetailsDialog";
import { ContractsTable } from "@/components/documents/ContractsTable";
import { DocumentPageHeader } from "@/components/documents/DocumentPageHeader";
import { useDocuments } from "@/hooks/useDocuments";
import { ContractOrDocument } from "@/types/document";
import { ContractStatus } from "@/types/contract";
import { DocumentList } from "@/components/documents/DocumentList";

interface Property {
  id: string;
  name: string;
}

interface Document {
  id: string;
  name: string;
  file_path: string;
  document_type: string;
  property_id: string | null;
  tenant_id: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  properties?: { name: string } | null;
}

function Documents() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"landlord" | "tenant" | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | DocumentType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedContract, setSelectedContract] = useState(null);
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"contracts" | "documents">("documents");
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    startDate: string | null;
    endDate: string | null;
  }>({ startDate: null, endDate: null });

  // Fetch properties data
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name");
      if (error) throw error;
      return data as Property[];
    },
    enabled: userRole === "landlord"
  });

  // Fetch all documents
  const { data: documents = [], isLoading: isLoadingDocuments, refetch: refetchDocuments } = useQuery<Document[]>({
    queryKey: ["documents", userId, userRole],
    queryFn: async () => {
      if (!userId || !userRole) return [];
      
      try {
        let query = supabase
          .from("documents")
          .select(`
            id, 
            name, 
            file_path, 
            document_type, 
            property_id, 
            tenant_id, 
            uploaded_by,
            created_at,
            updated_at,
            properties:property_id (
              name
            )
          `);
        
        if (userRole === "landlord") {
          query = query.eq("uploaded_by", userId);
        } else if (userRole === "tenant") {
          query = query.eq("tenant_id", userId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        console.log("Fetched documents:", data?.length);
        return data as Document[];
      } catch (error) {
        console.error("Error fetching documents:", error);
        return [];
      }
    },
    enabled: !!userId && !!userRole
  });

  // Use our custom hook for document operations
  const { 
    contracts, 
    isLoadingContracts, 
    deleteContractMutation,
    handleGeneratePDF,
    handleDownloadDocument
  } = useDocuments(userId, userRole);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log("No active session found, redirecting to auth");
          navigate("/auth");
          return;
        }
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, email")
          .eq("id", session.user.id)
          .maybeSingle();
        
        if (profile?.role) {
          setUserRole(profile.role as "landlord" | "tenant");
          console.log("User role set:", profile.role);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive"
        });
      }
    };

    checkUser();
  }, [navigate, toast]);

  const resetFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setPropertyFilter("all");
    setStatusFilter("all");
    setDateRangeFilter({ startDate: null, endDate: null });
  };

  // Filter documents based on filters
  const filteredDocuments = documents.filter(document => {
    // Type filter
    if (typeFilter !== "all" && document.document_type !== typeFilter) {
      return false;
    }

    // Property filter
    if (propertyFilter !== "all" && document.property_id !== propertyFilter) {
      return false;
    }

    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const documentName = document.name.toLowerCase();
      const documentType = document.document_type.toLowerCase();
      const propertyName = document.properties?.name?.toLowerCase() || '';
      
      if (!documentName.includes(searchLower) && 
          !documentType.includes(searchLower) && 
          !propertyName.includes(searchLower)) {
        return false;
      }
    }

    // Date filter
    if (dateRangeFilter.startDate) {
      const startDate = new Date(dateRangeFilter.startDate);
      const documentDate = new Date(document.created_at);
      if (documentDate < startDate) {
        return false;
      }
    }

    if (dateRangeFilter.endDate) {
      const endDate = new Date(dateRangeFilter.endDate);
      const documentDate = new Date(document.created_at);
      if (documentDate > endDate) {
        return false;
      }
    }

    return true;
  });

  // Filter contracts based on all filters
  const filteredContracts = contracts.filter(contract => {
    // Status filter
    if (statusFilter !== "all" && contract.status !== statusFilter) {
      return false;
    }

    // Property filter
    if (propertyFilter !== "all") {
      // For document type with property field
      if ('property' in contract && contract.property && 'id' in contract.property && contract.property.id === propertyFilter) {
        return true;
      }
      // For contract type with property_id field
      if ('property_id' in contract && contract.property_id === propertyFilter) {
        return true;
      }
      return false;
    }

    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const contractName = contract.contract_type?.toLowerCase() || '';
      const propertyName = contract.properties?.name?.toLowerCase() || '';
      
      // Only access tenant email if it exists
      let tenantEmail = '';
      if ('tenant' in contract && contract.tenant && typeof contract.tenant === 'object' && contract.tenant !== null && 'email' in contract.tenant) {
        tenantEmail = (contract.tenant.email as string).toLowerCase();
      }
      
      if (!contractName.includes(searchLower) && 
          !propertyName.includes(searchLower) && 
          !tenantEmail.includes(searchLower)) {
        return false;
      }
    }

    // Date range filter - start date
    if (dateRangeFilter.startDate) {
      const startDate = new Date(dateRangeFilter.startDate);
      let contractDate = new Date();
      
      if ('valid_from' in contract && contract.valid_from) {
        contractDate = new Date(contract.valid_from);
      } else if ('created_at' in contract && contract.created_at) {
        contractDate = new Date(contract.created_at);
      }
      
      if (contractDate < startDate) {
        return false;
      }
    }

    // Date range filter - end date
    if (dateRangeFilter.endDate) {
      const endDate = new Date(dateRangeFilter.endDate);
      let contractDate = new Date();
      
      if ('valid_from' in contract && contract.valid_from) {
        contractDate = new Date(contract.valid_from);
      } else if ('created_at' in contract && contract.created_at) {
        contractDate = new Date(contract.created_at);
      }
      
      if (contractDate > endDate) {
        return false;
      }
    }

    return true;
  });

  if (!userId || !userRole) return null;

  const navigationItems = [
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      showForTenant: true
    },
    {
      id: 'contracts',
      label: 'Contracts',
      icon: CreditCard,
      showForTenant: true
    }
  ];

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);
      
      if (error) throw error;
      
      toast({
        title: "Document deleted",
        description: "The document has been deleted successfully",
        variant: "default"
      });
      
      refetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const renderContent = () => {
    if (activeTab === "contracts") {
      return (
        <div className="space-y-4">
          <DocumentFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            propertyFilter={propertyFilter}
            setPropertyFilter={setPropertyFilter}
            properties={properties}
            dateRangeFilter={dateRangeFilter}
            setDateRangeFilter={setDateRangeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            resetFilters={resetFilters}
          />
          <ContractsTable 
            contracts={filteredContracts}
            isLoading={isLoadingContracts}
            userRole={userRole}
            handleDownloadDocument={handleDownloadDocument}
            handleGeneratePDF={handleGeneratePDF}
            deleteContractMutation={deleteContractMutation}
          />
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <DocumentFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            propertyFilter={propertyFilter}
            setPropertyFilter={setPropertyFilter}
            properties={properties}
            dateRangeFilter={dateRangeFilter}
            setDateRangeFilter={setDateRangeFilter}
            resetFilters={resetFilters}
          />
          <DocumentList
            userId={userId}
            userRole={userRole}
            propertyFilter={propertyFilter}
            typeFilter={typeFilter}
            searchTerm={searchTerm}
            viewMode={viewMode}
          />
        </div>
      );
    }
  };

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <DocumentPageHeader 
              activeTab={activeTab}
              userRole={userRole}
              onUploadClick={() => setShowAddModal(true)}
            />
            
            <div className="flex space-x-4 mb-6 border-b">
              {navigationItems.map(item => (
                <button
                  key={item.id}
                  className={`pb-2 px-1 ${
                    activeTab === item.id
                      ? 'border-b-2 border-blue-600 font-medium text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab(item.id as "documents" | "contracts")}
                >
                  <div className="flex items-center">
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>

      <DocumentDialog 
        open={showAddModal} 
        onOpenChange={setShowAddModal} 
        userId={userId} 
        userRole={userRole} 
      />

      <ContractDetailsDialog 
        open={showContractDetails} 
        onOpenChange={setShowContractDetails} 
        contract={selectedContract} 
      />
    </div>
  );
}

export default Documents;
