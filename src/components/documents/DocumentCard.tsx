
import { Card, CardContent } from "@/components/ui/card";
import { FileText, UserCircle, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DocumentActions } from "./DocumentActions";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ContractStatus } from "@/types/contract";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useContractPrint } from "@/components/contract/ContractPrintPreview";

interface DocumentCardProps {
  document: {
    id: string;
    name: string;
    file_path?: string;
    created_at: string;
    document_type: "lease_agreement" | "invoice" | "receipt" | "other";
    property?: {
      id: string;
      name: string;
      address: string;
    } | null;
    tenant_id?: string | null;
    tenant?: {
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    } | null;
    isContract: boolean;
    contract_type?: string;
    status?: ContractStatus;
  };
  userRole: "landlord" | "tenant";
  viewMode: "grid" | "list";
}

const documentTypeLabels = {
  lease_agreement: "Lease Agreement",
  invoice: "Invoice",
  receipt: "Receipt",
  other: "Other",
};

export function DocumentCard({ document: doc, userRole, viewMode }: DocumentCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [contractData, setContractData] = useState<any>(null);
  const [isLandlordUpdated, setIsLandlordUpdated] = useState(false);

  useEffect(() => {
    if (doc.isContract) {
      const fetchContractData = async () => {
        try {
          const { data, error } = await supabase
            .from('contracts')
            .select('*, metadata')
            .eq('id', doc.id)
            .single();
            
          if (error) throw error;
          
          if (data) {
            setContractData(data);
            // Check if the contract was updated by the landlord (is in signed status or the user is a landlord)
            setIsLandlordUpdated(data.status === 'signed' || userRole === 'landlord');
          }
        } catch (error) {
          console.error("Error fetching contract data:", error);
        }
      };
      
      fetchContractData();
    }
  }, [doc.id, doc.isContract, userRole]);

  const { handlePrint } = useContractPrint({
    queryClient,
    metadata: contractData?.metadata || {},
    contractId: doc.id,
    contractNumber: contractData?.metadata?.contractNumber
  });

  const handleViewContract = () => {
    if (doc.isContract) {
      navigate(`/documents/contracts/${doc.id}`);
    }
  };

  const handleDownloadDocument = async () => {
    if (!doc.file_path) return;
    
    try {
      const cleanFilePath = doc.file_path.replace(/^\/+/, '');
      
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
        const a = window.document.createElement("a");
        a.href = url;
        a.download = fileName || 'document';
        window.document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(a);
        
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
    <div className={`p-4 ${viewMode === 'grid' ? 'h-full' : ''}`}>
      <div className={`flex ${viewMode === 'grid' ? 'flex-col space-y-4' : 'items-center justify-between'} gap-4`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {doc.isContract ? (
            <CreditCard className="h-5 w-5 text-blue-500 flex-shrink-0" />
          ) : (
            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          )}
          
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium truncate">{doc.name}</h3>
            {doc.property && (
              <p className="text-sm text-muted-foreground truncate">
                {doc.property.name}
              </p>
            )}
          </div>
        </div>
        
        <div className={`flex ${viewMode === 'grid' ? 'flex-col' : 'items-center'} gap-3`}>
          {doc.tenant && (
            <div className="hidden sm:flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {doc.tenant.first_name} {doc.tenant.last_name}
              </span>
            </div>
          )}
          
          <Badge variant="secondary" className="flex-shrink-0">
            {doc.isContract 
              ? `Contract - ${doc.status}` 
              : documentTypeLabels[doc.document_type]}
          </Badge>
          
          <div className="hidden sm:block text-sm text-muted-foreground">
            {format(new Date(doc.created_at), "MMM d, yyyy")}
          </div>
          
          {doc.isContract ? (
            isLandlordUpdated ? (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => contractData && handlePrint()}
              >
                Download PDF
              </Button>
            ) : (
              <Button 
                variant="outline"
                size="sm"
                onClick={handleViewContract}
              >
                View Contract
              </Button>
            )
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadDocument}
              >
                Download
              </Button>
              
              <DocumentActions 
                document={doc}
                userRole={userRole}
                onDocumentUpdated={() => {
                  window.location.reload();
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
