import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentCard } from "./DocumentCard";
import { DocumentType } from "@/integrations/supabase/types/document-types";
import { DocumentListSkeleton } from "./DocumentListSkeleton";
import { EmptyDocumentState } from "./EmptyDocumentState";
import { ContractStatus } from "@/types/contract";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download } from "lucide-react";
import { format, isValid } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { generateContractPdf } from "@/utils/contractPdfGenerator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { UseMutationResult } from "@tanstack/react-query";

interface DocumentListProps {
  userId: string;
  userRole: "landlord" | "tenant";
  propertyFilter: string;
  typeFilter: "all" | DocumentType;
  searchTerm: string;
  viewMode: "grid" | "list";
  contracts?: any[];
  isLoadingContracts?: boolean;
  handleDownloadDocument?: (filePath: string) => Promise<void>;
  handleGeneratePDF?: (contract: any) => void;
  deleteContractMutation?: UseMutationResult<void, Error, string, unknown>;
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
  valid_from?: string | null;
  valid_until?: string | null;
  metadata?: any;
}

type CombinedDocument = DocumentFromDB | ContractDocument;

function isValidDocumentType(type: string): type is DocumentType {
  return ['lease_agreement', 'invoice', 'receipt', 'other', 'general', 'maintenance', 'legal', 'notice', 'inspection', 'lease'].includes(type);
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (!isValid(date)) return '-';
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    console.error("Invalid date format:", dateString, error);
    return '-';
  }
};

export function DocumentList({ 
  userId, 
  userRole, 
  propertyFilter, 
  typeFilter,
  searchTerm,
  viewMode,
  contracts = [],
  isLoadingContracts = false,
  handleDownloadDocument: propHandleDownloadDocument,
  handleGeneratePDF: propHandleGeneratePDF,
  deleteContractMutation: propDeleteContractMutation
}: DocumentListProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [documentToDelete, setDocumentToDelete] = useState<CombinedDocument | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { data: regularDocuments = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["documents", propertyFilter, typeFilter, searchTerm],
    queryFn: async () => {
      console.log("Fetching documents with filter:", { typeFilter, propertyFilter });
      
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

      if (typeFilter && typeFilter !== "all" && typeFilter !== "lease") {
        query = query.eq("document_type", typeFilter);
      } else if (typeFilter === "lease") {
        query = query.eq("document_type", "lease");
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching documents:", error);
        throw error;
      }

      console.log("Regular documents fetched:", data);

      return (data as DocumentFromDB[]).filter(doc => {
        const matchesSearch = 
          doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.tenant?.email?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch && isValidDocumentType(doc.document_type);
      });
    },
  });

  const useProvidedContracts = contracts && contracts.length > 0;
  
  const { data: fetchedContracts = [], isLoading: isLoadingFetchedContracts } = useQuery({
    queryKey: ["document-contracts", propertyFilter, searchTerm, userId, userRole, typeFilter],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log("Fetching contracts with filter:", { typeFilter, propertyFilter });
      
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
          metadata,
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
        console.error("Error fetching contracts:", error);
        throw error;
      }

      console.log("Contracts fetched:", data);

      const transformedContracts = data.map(contract => {
        let documentType: string;
        if (contract.contract_type === "lease") {
          documentType = "lease";
        } else {
          documentType = "lease_agreement";
        }
        
        return {
          id: contract.id,
          name: `${contract.contract_type.replace('_', ' ')} - ${contract.properties?.name || 'Untitled Property'}`,
          document_type: documentType,
          property_id: contract.property_id,
          created_at: contract.created_at,
          uploaded_by: userId,
          property: contract.properties,
          tenant: contract.tenant,
          isContract: true,
          contract_type: contract.contract_type,
          status: contract.status,
          valid_from: contract.valid_from,
          valid_until: contract.valid_until,
          metadata: contract.metadata
        };
      }) as ContractDocument[];
      
      console.log("Transformed contracts:", transformedContracts);
      
      if (typeFilter !== "all") {
        return transformedContracts.filter(doc => doc.document_type === typeFilter);
      }
      
      return transformedContracts;
    },
    enabled: !!userId && !useProvidedContracts
  });

  const contractsData = useProvidedContracts ? contracts : fetchedContracts;
  const contractsLoading = useProvidedContracts ? isLoadingContracts : isLoadingFetchedContracts;

  const localDeleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const docToDelete = getMergedDocuments().find(doc => doc.id === documentId);
      
      if (!docToDelete) throw new Error("Document not found");
      
      if ('isContract' in docToDelete) {
        const { error } = await supabase
          .from('contracts')
          .delete()
          .eq('id', docToDelete.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('documents')
          .delete()
          .eq('id', docToDelete.id);
          
        if (error) throw error;
        
        if (docToDelete.file_path) {
          const cleanFilePath = docToDelete.file_path.replace(/^\/+/, '');
          const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([cleanFilePath]);
            
          if (storageError) {
            console.error("Error deleting file from storage:", storageError);
          }
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document-contracts"] });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deleteContractMutation = propDeleteContractMutation || localDeleteMutation;

  const isLoading = isLoadingDocuments || contractsLoading;

  const getMergedDocuments = () => {
    const result: CombinedDocument[] = [...contractsData];
    const documentIdsToSkip = new Set<string>();
    
    contractsData.forEach(contract => {
      if (contract.metadata && typeof contract.metadata === 'object' && 'document_id' in contract.metadata) {
        documentIdsToSkip.add(contract.metadata.document_id as string);
      }
    });
    
    regularDocuments.forEach(doc => {
      if (!documentIdsToSkip.has(doc.id)) {
        result.push(doc);
      }
    });
    
    return result;
  };

  const filteredDocuments = getMergedDocuments().filter(doc => {
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

  const formatDocumentType = (type: string): string => {
    let formattedType = type.replace('_document', '');
    
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
      case 'other':
        return 'Other Document';
      default:
        return formattedType
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    }
  };

  const handleDownloadDocument = async (filePath: string | undefined) => {
    if (propHandleDownloadDocument) {
      return propHandleDownloadDocument(filePath as string);
    }
    
    try {
      console.log("Attempting to download document with path:", filePath);
      
      if (!filePath) {
        console.log("No file path available for document");
        throw new Error("No file path available for this document");
      }
      
      const cleanFilePath = filePath.replace(/^\/+/, '');
      console.log("Cleaned file path:", cleanFilePath);
      
      const folderPath = cleanFilePath.split('/').slice(0, -1).join('/');
      const fileName = cleanFilePath.split('/').pop();
      console.log("Folder path:", folderPath);
      console.log("File name:", fileName);

      const { data, error } = await supabase.storage
        .from('documents')
        .download(cleanFilePath);
          
      if (error) {
        console.error("Supabase storage error:", error);
        throw error;
      }
          
      if (data) {
        console.log("File downloaded successfully, creating blob URL");
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

  const handleGeneratePDF = (doc: ContractDocument) => {
    if (propHandleGeneratePDF) {
      return propHandleGeneratePDF(doc);
    }
    
    try {
      if (!doc.metadata) {
        throw new Error("No metadata available for this contract");
      }

      generateContractPdf({
        metadata: doc.metadata,
        contractId: doc.id,
        contractNumber: doc.metadata.contractNumber
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

  const handleDocumentAction = (doc: CombinedDocument) => {
    console.log("Document action triggered for:", {
      id: doc.id,
      type: doc.document_type,
      isContract: 'isContract' in doc,
      hasFilePath: 'file_path' in doc && !!doc.file_path,
      filePath: 'file_path' in doc ? doc.file_path : undefined,
      metadata: 'metadata' in doc ? doc.metadata : undefined
    });

    if ('file_path' in doc && doc.file_path && !('isContract' in doc)) {
      handleDownloadDocument(doc.file_path);
    } else if ('isContract' in doc) {
      if (doc.metadata && typeof doc.metadata === 'object' && 'file_path' in doc.metadata) {
        handleDownloadDocument(doc.metadata.file_path as string);
      } else {
        handleGeneratePDF(doc);
      }
    }
  };

  const handleDeleteDocument = (doc: CombinedDocument) => {
    setDocumentToDelete(doc);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      deleteContractMutation.mutate(documentToDelete.id);
    }
    setShowDeleteDialog(false);
    setDocumentToDelete(null);
  };

  const canDownloadDocument = (doc: CombinedDocument): boolean => {
    if ('file_path' in doc && doc.file_path && !('isContract' in doc)) {
      return true;
    }
    
    if ('isContract' in doc) {
      return true;
    }
    
    return false;
  };

  if (isLoading) {
    return <DocumentListSkeleton viewMode={viewMode} />;
  }

  if (!filteredDocuments.length) {
    return <EmptyDocumentState userRole={userRole} />;
  }

  if (viewMode === 'list') {
    return (
      <>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created/Valid From</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Download</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map(doc => {
                const isContractDocument = 'isContract' in doc;
                
                return (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>{doc.property?.name || 'Untitled Property'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatDocumentType(doc.document_type || (isContractDocument ? doc.contract_type : 'other'))}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isContractDocument ? (
                        <Badge variant="secondary" className={
                          doc.status === 'signed' ? 'bg-green-100 text-green-800' : 
                          doc.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {doc.status}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Complete
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isContractDocument && 'valid_from' in doc && doc.valid_from 
                        ? formatDate(doc.valid_from)
                        : formatDate(doc.created_at)}
                    </TableCell>
                    <TableCell>
                      {isContractDocument && 'valid_until' in doc && doc.valid_until 
                        ? formatDate(doc.valid_until)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDocumentAction(doc)}
                        disabled={!canDownloadDocument(doc)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      {isContractDocument && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/documents/contracts/${doc.id}`)}
                          className="mr-2"
                        >
                          View Details
                        </Button>
                      )}
                      {userRole === 'landlord' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteDocument(doc)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the document 
                {documentToDelete?.name ? ` "${documentToDelete.name}"` : ''}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
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
