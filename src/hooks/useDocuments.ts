
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import { ContractOrDocument } from "@/types/document";

export function useDocuments(userId: string | null, userRole: "landlord" | "tenant" | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for fetching contracts
  const { 
    data: contracts = [], 
    isLoading: isLoadingContracts,
    refetch: refetchContracts
  } = useQuery({
    queryKey: ["contracts", userId, userRole],
    queryFn: async () => {
      if (!userId || !userRole) return [];
      
      try {
        // Construct query based on user role
        let query = supabase
          .from("contracts")
          .select(`
            id, 
            contract_type, 
            status, 
            valid_from, 
            valid_until, 
            tenant_id, 
            landlord_id,
            property_id,
            metadata,
            properties:property_id (
              name
            )
          `);
        
        // Filter by landlord_id or tenant_id based on user role
        if (userRole === "landlord") {
          query = query.eq("landlord_id", userId);
        } else if (userRole === "tenant") {
          query = query.eq("tenant_id", userId);
        }
        
        const { data: contractsData, error } = await query;
        if (error) throw error;

        console.log("Fetched contracts:", contractsData?.length);
        return contractsData || [];
      } catch (error) {
        console.error("Error fetching contracts:", error);
        return [];
      }
    },
    enabled: !!userId && !!userRole
  });

  // Mutation for deleting a contract
  const deleteContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      console.log("Deleting contract:", contractId);
      const { error } = await supabase
        .from("contracts")
        .delete()
        .eq("id", contractId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Contract deleted",
        description: "The contract has been deleted successfully",
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: (error) => {
      console.error("Error deleting contract:", error);
      toast({
        title: "Error",
        description: "Failed to delete the contract",
        variant: "destructive"
      });
    }
  });

  // Function to generate PDF
  const handleGeneratePDF = async (contract: ContractOrDocument) => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text(`${contract.contract_type?.toUpperCase() || 'CONTRACT'}`, 105, 20, { align: 'center' });
      
      // Add property info
      doc.setFontSize(14);
      doc.text(`Property: ${contract.properties?.name || 'No property specified'}`, 20, 40);
      
      // Add validity dates
      if ('valid_from' in contract && contract.valid_from) {
        doc.text(`Valid from: ${new Date(contract.valid_from).toLocaleDateString()}`, 20, 50);
      }
      if ('valid_until' in contract && contract.valid_until) {
        doc.text(`Valid until: ${new Date(contract.valid_until).toLocaleDateString()}`, 20, 60);
      }
      
      // Add contract content if available
      if ('content' in contract && contract.content) {
        try {
          const content = typeof contract.content === 'string' 
            ? JSON.parse(contract.content) 
            : contract.content;
            
          if (content.sections) {
            let yPos = 80;
            content.sections.forEach((section: any) => {
              doc.setFontSize(14);
              doc.text(section.title, 20, yPos);
              yPos += 10;
              
              doc.setFontSize(12);
              const textLines = doc.splitTextToSize(section.content, 170);
              doc.text(textLines, 20, yPos);
              yPos += 10 * textLines.length + 10;
            });
          }
        } catch (e) {
          console.error("Error parsing contract content:", e);
        }
      }
      
      doc.save(`contract_${contract.id}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Contract PDF has been generated successfully",
        variant: "success"
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    }
  };

  // Function to download a document
  const handleDownloadDocument = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage.from("documents").download(filePath);
      if (error) throw error;
      
      // Create URL and trigger download
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = filePath.split("/").pop() || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Your document download has started",
        variant: "success"
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  return {
    contracts,
    isLoadingContracts,
    deleteContractMutation,
    handleGeneratePDF,
    handleDownloadDocument,
    refetchContracts
  };
}
