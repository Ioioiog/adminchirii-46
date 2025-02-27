
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useToast } from "@/hooks/use-toast";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentDialog } from "@/components/documents/DocumentDialog";
import { DocumentType } from "@/integrations/supabase/types/document-types";
import { DocumentFilters } from "@/components/documents/DocumentFilters";
import { useQuery } from "@tanstack/react-query";
import { NavigationTabs } from "@/components/layout/NavigationTabs";
import { ContractDetailsDialog } from "@/components/contracts/ContractDetailsDialog";
import { ContractsTable } from "@/components/documents/ContractsTable";
import { DocumentPageHeader } from "@/components/documents/DocumentPageHeader";
import { useDocuments } from "@/hooks/useDocuments";
import { ContractOrDocument, LeaseDocument } from "@/types/document";

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
  const [activeTab, setActiveTab] = useState("documents");
  const [selectedContract, setSelectedContract] = useState(null);
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    startDate: string | null;
    endDate: string | null;
  }>({ startDate: null, endDate: null });

  // Fetch properties data
  const { data: properties } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name");
      if (error) throw error;
      return data;
    },
    enabled: userRole === "landlord"
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

  // Filter contracts based on all filters
  const filteredContracts = contracts.filter(contract => {
    // Status filter
    if (statusFilter !== "all" && contract.status !== statusFilter) {
      return false;
    }

    // Property filter
    if (propertyFilter !== "all") {
      // For document type with property field
      if ('property' in contract && contract.property && contract.property.id !== propertyFilter) {
        return false;
      }
      // For contract type with property_id field (handle if property_id exists)
      if (!('property' in contract) && 'property_id' in (contract as any) && (contract as any).property_id !== propertyFilter) {
        return false;
      }
    }

    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const contractName = contract.contract_type?.toLowerCase() || '';
      const propertyName = contract.properties?.name?.toLowerCase() || '';
      
      // Only access tenant email if it exists
      let tenantEmail = '';
      if ('tenant' in (contract as any) && (contract as any).tenant && (contract as any).tenant.email) {
        tenantEmail = (contract as any).tenant.email.toLowerCase();
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
      const contractDate = 'valid_from' in contract && contract.valid_from 
        ? new Date(contract.valid_from) 
        : 'created_at' in contract && contract.created_at 
          ? new Date(contract.created_at)
          : new Date();
      
      if (contractDate < startDate) {
        return false;
      }
    }

    // Date range filter - end date
    if (dateRangeFilter.endDate) {
      const endDate = new Date(dateRangeFilter.endDate);
      const contractDate = 'valid_from' in contract && contract.valid_from 
        ? new Date(contract.valid_from) 
        : 'created_at' in contract && contract.created_at 
          ? new Date(contract.created_at)
          : new Date();
      
      if (contractDate > endDate) {
        return false;
      }
    }

    return true;
  });

  if (!userId || !userRole) return null;

  const navigationItems = [{
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    showForTenant: true
  }, {
    id: 'contracts',
    label: 'Contracts',
    icon: CreditCard,
    showForTenant: true
  }];

  const renderSection = () => {
    const sharedFilters = (
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
    );

    switch (activeTab) {
      case 'documents':
        return (
          <div className="space-y-4">
            {sharedFilters}
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
      case 'contracts':
        return (
          <div className="space-y-4">
            {sharedFilters}
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
      default:
        return null;
    }
  };

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <NavigationTabs 
            tabs={navigationItems} 
            activeTab={activeTab} 
            onTabChange={id => setActiveTab(id)} 
          />
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <DocumentPageHeader 
              activeTab={activeTab}
              userRole={userRole}
              onUploadClick={() => setShowAddModal(true)}
            />
            
            <div className="mt-6">
              {renderSection()}
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
