
import { QueryClientProvider } from "@tanstack/react-query";
import { ContractContent } from "./ContractContent";
import { ContractSignatures } from "./ContractSignatures";
import * as ReactDOMServer from 'react-dom/server';
import { useToast } from "@/hooks/use-toast";
import type { FormData } from "@/types/contract";

interface ContractPrintPreviewProps {
  queryClient: any;
  metadata: FormData;
  contractId: string;
  contractNumber?: string;
}

export function ContractPrintPreview({ queryClient, metadata, contractId, contractNumber }: ContractPrintPreviewProps) {
  const { toast } = useToast();

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Could not open print window. Please check your popup blocker settings.",
        variant: "destructive"
      });
      return;
    }

    const contentHtml = ReactDOMServer.renderToString(
      <QueryClientProvider client={queryClient}>
        <div className="contract-preview">
          <ContractContent formData={metadata} />
          <ContractSignatures formData={metadata} contractId={contractId} />
        </div>
      </QueryClientProvider>
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contract ${contractNumber || ''}</title>
          <style>
            @media print {
              @page { size: A4; margin: 20mm; }
              body { font-family: Arial, sans-serif; }
            }
          </style>
        </head>
        <body>
          ${contentHtml}
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return { handlePrint };
}
