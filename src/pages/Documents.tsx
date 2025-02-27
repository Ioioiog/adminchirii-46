import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, List, Plus, FileText, CreditCard, Trash2, Download } from "lucide-react";
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
import { ContractStatus, FormData } from "@/types/contract";
import { generateContractPdf } from "@/utils/contractPdfGenerator";

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

interface LeaseDocument {
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
  metadata?: Json; // Add metadata property to the LeaseDocument interface
}

type ContractOrDocument = Contract | LeaseDocument;

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

  const fetchContracts = async (): Promise<ContractOrDocument[]> => {
    if (!userId) {
      throw new Error("No user ID available");
    }

    let regularContracts: Contract[] = [];
    
    if (userRole === "tenant") {
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          throw profileError;
        }

        if (!userProfile?.email) {
          console.error("No email found for user");
          throw new Error("User email not found");
        }

        console.log("Found user profile:", userProfile);

        const query = supabase
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
          `);

        query.or(`tenant_id.eq.${userId},invitation_email.eq.${userProfile.email}`);

        const { data: contracts, error: contractsError } = await query;

        if (contractsError) {
          console.error("Error fetching contracts:", contractsError);
          throw contractsError;
        }

        console.log("Found contracts for tenant:", contracts);
        regularContracts = (contracts || []) as Contract[];
      } catch (error) {
        console.error("Error in fetchContracts:", error);
        throw error;
      }
    }

    if (userRole === "landlord") {
      try {
        const { data: contracts, error: contractsError } = await supabase
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

        if (contractsError) {
          console.error("Error fetching landlord contracts:", contractsError);
          throw contractsError;
        }

        console.log("Found contracts for landlord:", contracts);
        regularContracts = (contracts || []) as Contract[];
      } catch (error) {
        console.error("Error fetching landlord contracts:", error);
        throw error;
      }
    }

    // Fetch all document types specified
    const documentQuery = supabase
      .from("documents")
      .select(`
        id,
        name,
        file_path,
        document_type,
        created_at,
        property:properties (
          id,
          name
        )
      `)
      .or('document_type.eq.lease_agreement,document_type.eq.general,document_type.eq.invoice,document_type.eq.receipt,document_type.eq.maintenance,document_type.eq.legal,document_type.eq.notice,document_type.eq.inspection');

    if (userRole === "landlord") {
      documentQuery.eq("uploaded_by", userId);
    } else if (userRole === "tenant") {
      documentQuery.eq("tenant_id", userId);
    }

    const { data: documents, error: documentsError } = await documentQuery;

    if (documentsError) {
      console.error("Error fetching documents:", documentsError);
      throw documentsError;
    }

    console.log("Found documents:", documents);

    // Convert documents to our common format
    const documentContracts: LeaseDocument[] = documents?.map(doc => ({
      id: doc.id,
      name: doc.name,
      file_path: doc.file_path,
      document_type: doc.document_type,
      property: doc.property,
      created_at: doc.created_at,
      contract_type: `${doc.document_type}_document`,
      status: "signed" as ContractStatus,
      valid_from: null,
      valid_until: null,
      properties: doc.property ? { name: doc.property.name } : null,
      document_name: doc.name,
      metadata: {} // Initialize with empty metadata for LeaseDocument
    })) || [];

    return [...regularContracts, ...documentContracts];
  };

  const { data: contracts = [], isLoading: isLoadingContracts } = useQuery({
    queryKey: ["contracts", userId, userRole] as const,
    queryFn: fetchContracts,
    enabled: !!userId && !!userRole
  });

  // Helper function to format document type for display
  const formatDocumentType = (type: string): string => {
    // First remove _document suffix if present
    let formattedType = type.replace('_document', '');
    
    // Handle special cases
    switch (formattedType) {
      case 'lease_agreement':
        return 'Lease Agreement';
      case 'lease':
        return 'Lease';
      case 'general':
        return 'General Document';
      case 'invoice':
        return 'Invoice';
      case 'receipt':
        return 'Receipt';
      case 'maintenance':
        return 'Maintenance Document';
      case 'legal':
        return 'Legal Document';
      case 'notice':
        return 'Notice';
      case 'inspection':
        return 'Inspection Report';
      default:
        // Format any other type by replacing underscores and capitalizing words
        return formattedType
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    }
  };

  const deleteContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      const contractToDelete = contracts.find(c => c.id === contractId);
      const isDocument = contractToDelete && 'document_name' in contractToDelete;
      
      if (isDocument) {
        const { error: documentError } = await supabase
          .from('documents')
          .delete()
          .eq('id', contractId);
        
        if (documentError) {
          console.error("Error deleting document:", documentError);
          throw documentError;
        }
      } else {
        const { error: contractError } = await supabase
          .from('contracts')
          .delete()
          .eq('id', contractId);
        
        if (contractError) {
          console.error("Error deleting contract:", contractError);
          throw contractError;
        }
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
    icon: FileText,
    showForTenant: true
  }, {
    id: 'contracts',
    label: 'Contracts',
    icon: CreditCard,
    showForTenant: true
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
                  <TableHead>Download</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingContracts ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Loading documents...
                    </TableCell>
                  </TableRow>
                ) : contracts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      {userRole === 'tenant' 
                        ? 'No documents available for you yet'
                        : 'No documents found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  contracts.map(contract => {
                    // Check if it's a document (has document_name property)
                    const isDocument = 'document_name' in contract;
                    
                    return (
                      <TableRow key={contract.id}>
                        <TableCell>{contract.properties?.name || 'Untitled Property'}</TableCell>
                        <TableCell className="capitalize">
                          {formatDocumentType(contract.contract_type)}
                        </TableCell>
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
                          {contract.valid_from ? format(new Date(contract.valid_from), 'MMM d, yyyy') : 
                            ('created_at' in contract ? format(new Date(contract.created_at), 'MMM d, yyyy') : '-')}
                        </TableCell>
                        <TableCell>
                          {contract.valid_until ? format(new Date(contract.valid_until), 'MMM d, yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          {isDocument ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDownloadDocument(contract.file_path)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                handleGeneratePDF(contract);
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              PDF
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {isDocument ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDownloadDocument(contract.file_path)}
                            >
                              View
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                navigate(`/documents/contracts/${contract.id}`);
                              }}
                            >
                              View Details
                            </Button>
                          )}
                          
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
                                    This action cannot be undone. This will permanently delete the document.
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        );
      default:
        return null;
    }
  };

  // Create a proper function to handle PDF generation
  const handleGeneratePDF = (contract: ContractOrDocument) => {
    // Check if this is a document with file_path (LeaseDocument) or a contract
    if ('file_path' in contract && contract.file_path) {
      // If it's a document with a file path, download it directly
      handleDownloadDocument(contract.file_path);
      return;
    }

    // Otherwise it's a contract that needs PDF generation
    try {
      if (!contract.metadata) {
        throw new Error("No metadata available for this contract");
      }

      // Convert the contract to the needed type
      const contractData = contract as Contract;
      
      // Extract contract number if it exists in the metadata
      let contractNumber: string | undefined;

      if (typeof contractData.metadata === 'object') {
        const metadataObj = contractData.metadata as Record<string, any>;
        if (metadataObj && 'contractNumber' in metadataObj) {
          contractNumber = metadataObj.contractNumber as string;
        }
      }

      generateContractPdf({
        metadata: contractData.metadata as any as FormData,
        contractId: contractData.id,
        contractNumber
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Could not generate PDF for this document",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = async (filePath: string) => {
    try {
      const cleanFilePath = filePath.replace(/^\/+/, '');
      
      const folderPath = cleanFilePath.split('/').slice(0, -1).join('/');
      const fileName = cleanFilePath.split('/').pop();

      const { data, error } = await supabase.storage
        .from('documents')
        .download(cleanFilePath);
          
      if (error) {
        console.error("Error with download:", error);
        throw error;
      }
          
      if (data) {
        const url = window.URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName || 'document';
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Success",
          description: "Document downloaded successfully",
        });
      }
    } catch (error: any) {
      console.error("Error downloading document:", error);
      
      toast({
        title: "Error",
        description: error.message || "Could not download the document. Please try again later.",
        variant: "destructive",
      });
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
                    ? 'View your property related documents'
                    : 'Manage and track all your property-related documents'}
                </p>
              </div>

              {userRole === "landlord" && (
                <div className="flex gap-2">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700" 
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Document
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
}

export default Documents;
