import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { ContractOrDocument } from "@/types/document";
import { generateContractPdf } from "@/utils/contractPdfGenerator";
import { FormData } from "@/types/contract";

export function useDocuments(userId: string | null, userRole: "landlord" | "tenant" | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchContracts = async (): Promise<ContractOrDocument[]> => {
    if (!userId) {
      throw new Error("No user ID available");
    }

    let regularContracts: any[] = [];
    
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
        regularContracts = contracts || [];
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
        regularContracts = contracts || [];
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
    const documentContracts = documents?.map(doc => ({
      id: doc.id,
      name: doc.name,
      file_path: doc.file_path,
      document_type: doc.document_type,
      property: doc.property,
      created_at: doc.created_at,
      contract_type: `${doc.document_type}_document`,
      status: "signed" as const,
      valid_from: null,
      valid_until: null,
      properties: doc.property ? { name: doc.property.name } : null,
      document_name: doc.name,
      metadata: {}
    })) || [];

    return [...regularContracts, ...documentContracts];
  };

  const { data: contracts = [], isLoading: isLoadingContracts } = useQuery({
    queryKey: ["contracts", userId, userRole] as const,
    queryFn: fetchContracts,
    enabled: !!userId && !!userRole
  });

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

      // Extract contract number if it exists in the metadata
      let contractNumber: string | undefined;

      if (typeof contract.metadata === 'object') {
        const metadataObj = contract.metadata as Record<string, any>;
        if (metadataObj && 'contractNumber' in metadataObj) {
          contractNumber = metadataObj.contractNumber as string;
        }
      }

      generateContractPdf({
        metadata: contract.metadata as any as FormData,
        contractId: contract.id,
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

  return {
    contracts,
    isLoadingContracts,
    deleteContractMutation,
    handleGeneratePDF,
    handleDownloadDocument
  };
}
