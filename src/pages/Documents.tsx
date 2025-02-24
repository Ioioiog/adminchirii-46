
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, List, Plus, FileText, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentDialog } from "@/components/documents/DocumentDialog";
import { DocumentType } from "@/integrations/supabase/types/document-types";
import { DocumentFilters } from "@/components/documents/DocumentFilters";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { NavigationTabs } from "@/components/layout/NavigationTabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ContractDetailsDialog } from "@/components/contracts/ContractDetailsDialog";

const Documents = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"landlord" | "tenant" | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | DocumentType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [activeTab, setActiveTab] = useState("contracts");
  const [selectedContract, setSelectedContract] = useState(null);
  const [showContractDetails, setShowContractDetails] = useState(false);

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

  const { data: contracts, isLoading: isLoadingContracts } = useQuery({
    queryKey: ["contracts", userId, userRole],
    queryFn: async () => {
      console.log("Fetching contracts for:", { userId, userRole });
      
      let query = supabase
        .from("contracts")
        .select(`
          id,
          contract_type,
          status,
          valid_from,
          valid_until,
          tenant_id,
          properties(name)
        `);

      // For tenants, only show their contracts
      if (userRole === "tenant") {
        query = query.eq("tenant_id", userId);
      }
      // For landlords, show contracts for their properties
      else if (userRole === "landlord") {
        query = query.eq("landlord_id", userId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching contracts:", error);
        throw error;
      }

      console.log("Contracts fetched:", data);
      return data;
    },
    enabled: !!userId && !!userRole
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("No active session found, redirecting to auth");
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile?.role) {
        setUserRole(profile.role as "landlord" | "tenant");
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  if (!userId || !userRole) return null;

  const navigationItems = [{
    id: 'documents',
    label: 'Documents',
    icon: FileText
  }, {
    id: 'contracts',
    label: 'Contracts',
    icon: CreditCard
  }];

  const renderSection = () => {
    switch (activeTab) {
      case 'documents':
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
      case 'contracts':
        return (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid From</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingContracts ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Loading contracts...
                    </TableCell>
                  </TableRow>
                ) : contracts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No contracts found
                    </TableCell>
                  </TableRow>
                ) : (
                  contracts?.map(contract => (
                    <TableRow key={contract.id}>
                      <TableCell>{contract.properties?.name || 'Untitled Property'}</TableCell>
                      <TableCell className="capitalize">{contract.contract_type}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          contract.status === 'signed' ? 'bg-green-100 text-green-800' : 
                          contract.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {contract.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {contract.valid_from ? format(new Date(contract.valid_from), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {contract.valid_until ? format(new Date(contract.valid_until), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/documents/contracts/${contract.id}`)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-semibold">
                    {activeTab === 'contracts' ? 'Contracts' : 'Documents'}
                  </h1>
                </div>
                <p className="text-gray-500">
                  Manage and track all your property-related documents and contracts.
                </p>
              </div>

              {userRole === "landlord" && (
                <div className="flex gap-2">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700" 
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {activeTab === 'contracts' ? 'Upload Contract' : 'Upload Document'}
                  </Button>
                  {activeTab === "contracts" && (
                    <Button 
                      onClick={() => navigate("/generate-contract")} 
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Contract
                    </Button>
                  )}
                </div>
              )}
            </div>
            
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
};

export default Documents;
