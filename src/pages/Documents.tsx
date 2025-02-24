import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, List, Plus, FileText, CreditCard, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentDialog } from "@/components/documents/DocumentDialog";
import { DocumentType } from "@/integrations/supabase/types/document-types";
import { DocumentFilters } from "@/components/documents/DocumentFilters";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { NavigationTabs } from "@/components/layout/NavigationTabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ContractDetailsDialog } from "@/components/contracts/ContractDetailsDialog";
import { Json } from "@/integrations/supabase/types/json";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ContractStatus = 'draft' | 'pending_signature' | 'signed' | 'expired' | 'cancelled';

interface Contract {
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

function Documents() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  const { data: contracts = [], isLoading: isLoadingContracts } = useQuery({
    queryKey: ["contracts", userId, userRole],
    queryFn: async () => {
      console.log("Fetching contracts for:", { userId, userRole });
      
      if (!userId) {
        throw new Error("No user ID available");
      }

      if (userRole === "tenant") {
        const { data: { session } } = await supabase.auth.getSession();
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', session?.user?.id)
          .single();

        console.log("Tenant profile:", userProfile);

        // First try to get contracts by tenant_id
        const { data: assignedContracts, error: assignedError } = await supabase
          .from('contracts')
          .select(`
            id,
            contract_type,
            status,
            valid_from,
            valid_until,
            tenant_id,
            landlord_id,
            properties(name),
            metadata
          `)
          .eq('tenant_id', userId);

        if (assignedError) {
          console.error("Error fetching assigned contracts:", assignedError);
          throw assignedError;
        }

        // Then get pending contracts that match the tenant's email
        const { data: pendingContracts, error: pendingError } = await supabase
          .from('contracts')
          .select(`
            id,
            contract_type,
            status,
            valid_from,
            valid_until,
            tenant_id,
            landlord_id,
            properties(name),
            metadata
          `)
          .eq('status', 'pending_signature')
          .eq('metadata->tenantEmail', userProfile?.email);

        if (pendingError) {
          console.error("Error fetching pending contracts:", pendingError);
          throw pendingError;
        }

        console.log("Found contracts:", {
          assigned: assignedContracts,
          pending: pendingContracts,
          tenantEmail: userProfile?.email
        });

        return [...(assignedContracts || []), ...(pendingContracts || [])] as Contract[];

      } else if (userRole === "landlord") {
        const { data, error } = await supabase
          .from("contracts")
          .select(`
            id,
            contract_type,
            status,
            valid_from,
            valid_until,
            tenant_id,
            landlord_id,
            properties(name),
            metadata
          `)
          .eq("landlord_id", userId);

        if (error) {
          console.error("Error fetching landlord contracts:", error);
          throw error;
        }

        return data as Contract[];
      }

      return [] as Contract[];
    },
    enabled: !!userId && !!userRole
  });

  const deleteContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      const { error: contractError } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractId);
      
      if (contractError) {
        console.error("Error deleting contract:", contractError);
        throw contractError;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contract deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete contract. Please try again.",
        variant: "destructive",
      });
      console.error("Delete error:", error);
    },
  });

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
                      {userRole === 'tenant' 
                        ? 'No contracts available for you yet'
                        : 'No contracts found'}
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
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/documents/contracts/${contract.id}`)}
                        >
                          View Details
                        </Button>
                        {userRole === 'landlord' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the contract.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <Button 
                                  variant="destructive"
                                  onClick={() => deleteContractMutation.mutate(contract.id)}
                                >
                                  Delete
                                </Button>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
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
                  {userRole === 'tenant' 
                    ? 'View and sign your rental contracts'
                    : 'Manage and track all your property-related documents and contracts'}
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
              {isLoadingContracts ? (
                <div className="text-center py-4">Loading contracts...</div>
              ) : contracts?.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {userRole === 'tenant' 
                    ? 'No contracts available for you yet'
                    : 'No contracts found'}
                </div>
              ) : (
                renderSection()
              )}
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
