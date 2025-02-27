
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Trash2,
  Eye
} from "lucide-react";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { format } from "date-fns";
import { ContractOrDocument } from "@/types/document";
import { Badge } from "@/components/ui/badge";
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
import { useNavigate } from "react-router-dom";

interface ContractsTableProps {
  contracts: ContractOrDocument[];
  userRole: "landlord" | "tenant";
  isLoading: boolean;
  handleDownloadDocument: (filePath: string) => Promise<void>;
  handleGeneratePDF: (contract: ContractOrDocument) => void;
  deleteContractMutation: UseMutationResult<void, Error, string, unknown>;
}

export function ContractsTable({ 
  contracts, 
  userRole, 
  isLoading,
  handleDownloadDocument,
  handleGeneratePDF,
  deleteContractMutation
}: ContractsTableProps) {
  const navigate = useNavigate();
  const [documentToDelete, setDocumentToDelete] = useState<ContractOrDocument | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const confirmDelete = () => {
    if (documentToDelete) {
      deleteContractMutation.mutate(documentToDelete.id);
    }
    setShowDeleteDialog(false);
    setDocumentToDelete(null);
  };

  const getDocumentStatus = (doc: ContractOrDocument): string => {
    // For lease documents and regular contracts, use the existing status
    if ('status' in doc && doc.status) {
      return doc.status;
    }
    
    // For other document types without status, return "signed" (document is uploaded/completed)
    return "signed";
  };

  const getIssueDate = (doc: ContractOrDocument): Date => {
    // For documents with valid_from, use that
    if ('valid_from' in doc && doc.valid_from) {
      return new Date(doc.valid_from);
    }
    
    // For documents with created_at, use that
    if ('created_at' in doc && doc.created_at) {
      return new Date(doc.created_at);
    }
    
    // Fallback to current date if neither exists
    return new Date();
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading contracts...</div>;
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No contracts found.</p>
        {userRole === "landlord" && (
          <Button 
            onClick={() => navigate("/generate-contract")} 
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Create Contract
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="font-medium">
                  {contract.contract_type === "lease_agreement" || contract.contract_type === "lease" 
                    ? contract.contract_type.replace('_', ' ') 
                    : 'document_name' in contract 
                      ? contract.document_name 
                      : contract.contract_type?.replace('_', ' ')}
                </TableCell>
                <TableCell>
                  {contract.properties?.name || 'Untitled Property'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {contract.contract_type?.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ContractStatusBadge status={getDocumentStatus(contract)} />
                </TableCell>
                <TableCell>
                  {format(getIssueDate(contract), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {userRole === "landlord" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setDocumentToDelete(contract);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                  {contract.status === 'draft' && userRole === "landlord" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/documents/contracts/${contract.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // For documents with file_path
                        if ('file_path' in contract && contract.file_path) {
                          handleDownloadDocument(contract.file_path);
                        } 
                        // For contracts with metadata that may contain a file_path
                        else if ('metadata' in contract && contract.metadata && 
                                typeof contract.metadata === 'object' && 
                                'file_path' in (contract.metadata as any)) {
                          handleDownloadDocument((contract.metadata as any).file_path);
                        } 
                        // For other contracts, generate PDF
                        else {
                          handleGeneratePDF(contract);
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this document
              {documentToDelete?.contract_type ? ` of type "${documentToDelete.contract_type}"` : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
