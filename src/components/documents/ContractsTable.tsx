
import React from "react";
import { useNavigate } from "react-router-dom";
import { Download, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ContractStatus } from "@/types/contract";
import { Json } from "@/integrations/supabase/types/json";
import { UseMutationResult } from "@tanstack/react-query";

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
  metadata?: Json;
}

type ContractOrDocument = Contract | LeaseDocument;

interface ContractsTableProps {
  contracts: ContractOrDocument[];
  isLoading: boolean;
  userRole: "landlord" | "tenant";
  handleDownloadDocument: (filePath: string) => Promise<void>;
  handleGeneratePDF: (contract: ContractOrDocument) => void;
  deleteContractMutation: UseMutationResult<void, Error, string, unknown>;
}

export function ContractsTable({
  contracts,
  isLoading,
  userRole,
  handleDownloadDocument,
  handleGeneratePDF,
  deleteContractMutation
}: ContractsTableProps) {
  const navigate = useNavigate();

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
          {isLoading ? (
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
                          // Instead of generating PDF, directly download document if available
                          if (contract.metadata && typeof contract.metadata === 'object' && 'file_path' in contract.metadata) {
                            handleDownloadDocument(contract.metadata.file_path as string);
                          } else {
                            // Fallback to generating PDF if no file_path is available
                            handleGeneratePDF(contract);
                          }
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
}
