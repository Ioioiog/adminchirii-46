
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getContract } from "@/api/contracts";
import { ContractContent } from "@/components/contract/ContractContent";
import { ContractSignatures } from "@/components/contract/ContractSignatures";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Send, UserPlus, PrinterIcon } from "lucide-react";
import { InviteSignersModal } from "@/components/contract/InviteSignersModal";
import { SendContractModal } from "@/components/contract/SendContractModal";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function ContractDetails() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract", id],
    queryFn: () => getContract(id as string),
    enabled: !!id,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!contract) {
    return <div>Contract not found</div>;
  }

  const metadata = contract.metadata || {};

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Contract Print</title>
            <link rel="stylesheet" href="/src/index.css">
            <style>
              @media print {
                @page { margin: 2cm; }
              }
              body { font-family: system-ui, -apple-system, sans-serif; }
            </style>
          </head>
          <body>
            <div id="print-content">
              ${document.querySelector('.contract-content')?.innerHTML || ''}
            </div>
            <script>
              window.onload = () => {
                window.print();
                window.onafterprint = () => window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <InviteSignersModal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        contractId={id || ''}
      />

      <SendContractModal
        open={isPreviewModalOpen}
        onOpenChange={setIsPreviewModalOpen}
        contractId={id || ''}
      />

      <div className="flex-1 p-4">
        <div className="flex items-center justify-between py-4 px-6">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={() => setIsInviteModalOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite to Sign
            </Button>
            <Button onClick={() => setIsPreviewModalOpen(true)}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
          <div>
            {contract.status === "signed" ? (
              <Badge className="bg-green-100 text-green-800">Signed</Badge>
            ) : contract.status === "draft" ? (
              <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
            )}
          </div>
        </div>

        <div className="contract-content">
          <ContractContent formData={metadata as any} />
          <ContractSignatures formData={metadata as any} contractId={id || ''} />
        </div>
      </div>
    </div>
  );
}
