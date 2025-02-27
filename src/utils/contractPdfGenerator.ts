
import { FormData } from "@/types/contract";
import { toast } from "@/hooks/use-toast";
import * as ReactDOMServer from 'react-dom/server';

interface ContractPrintProps {
  metadata: FormData;
  contractId: string;
  contractNumber?: string;
}

export const generateContractPdf = (props: ContractPrintProps): void => {
  const { metadata, contractId, contractNumber } = props;

  try {
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
      <div style={{ padding: "2rem" }}>
        <div className="max-w-4xl mx-auto">
          <div className="p-8">
            <div>
              <div className="text-black">
                <h1 className="text-3xl font-bold text-center mb-8">CONTRACT DE ÎNCHIRIERE A LOCUINȚEI</h1>
                <p className="mb-4">Nr. {metadata.contractNumber || '_____'}</p>
                <p className="mb-8">Data: {metadata.contractDate || '_____'}</p>

                <p className="mb-8">Părțile,</p>

                <div className="mb-8">
                  {metadata.ownerName}, Nr. ordine Reg. com./an: {metadata.ownerReg}, Cod fiscal (C.U.I.): {metadata.ownerFiscal},
                  cu sediul in {metadata.ownerAddress}, cont bancar {metadata.ownerBank}, deschis la {metadata.ownerBankName},
                  reprezentat: {metadata.ownerRepresentative}, e-mail: {metadata.ownerEmail}, telefon: {metadata.ownerPhone} în calitate de Proprietar,
                </div>

                <div className="mb-8">
                  {metadata.tenantName}, Nr. ordine Reg. com./an: {metadata.tenantReg}, Cod fiscal (C.U.I.): {metadata.tenantFiscal},
                  cu domiciliul în {metadata.tenantAddress}, cont bancar {metadata.tenantBank}, deschis la {metadata.tenantBankName},
                  reprezentat: {metadata.tenantRepresentative}, e-mail: {metadata.tenantEmail}, telefon: {metadata.tenantPhone} în calitate de Chiriaș,
                </div>

                <p className="mb-8">Au convenit încheierea prezentului contract de închiriere, în termenii și condițiile care urmează:</p>

                <h2 className="text-xl font-bold mb-4">1. OBIECTUL CONTRACTULUI</h2>
                <p className="mb-8">
                  1.1. Obiectul prezentului contract este închirierea apartamentului situat în {metadata.propertyAddress}, 
                  compus din {metadata.roomCount} camere, cu destinația de locuință. Chiriașul va utiliza apartamentul 
                  incepand cu data de {metadata.startDate} ca locuință pentru familia sa.
                </p>

                {/* Additional contract sections would go here */}
                
                <div className="grid grid-cols-2 gap-8 mt-16">
                  <div>
                    <p className="font-bold mb-2">PROPRIETAR,</p>
                    <p>Data: {metadata.ownerSignatureDate || '_____'}</p>
                    <p>Nume și semnătură:</p>
                    <p>{metadata.ownerSignatureName || '___________________________'}</p>
                    {metadata.ownerSignatureImage && (
                      <img 
                        src={metadata.ownerSignatureImage} 
                        alt="Owner Signature" 
                        className="mt-2 max-w-[200px]"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-bold mb-2">CHIRIAȘ,</p>
                    <p>Data: {metadata.tenantSignatureDate || '_____'}</p>
                    <p>Nume și semnătură:</p>
                    <p>{metadata.tenantSignatureName || '___________________________'}</p>
                    {metadata.tenantSignatureImage && (
                      <img 
                        src={metadata.tenantSignatureImage} 
                        alt="Tenant Signature" 
                        className="mt-2 max-w-[200px]"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contract ${contractNumber || ''}</title>
          <style>
            @media print {
              @page { 
                size: A4;
                margin: 20mm;
              }
              body { 
                font-family: Arial, sans-serif;
              }
              .mb-2 { margin-bottom: 0.5rem; }
              .mb-4 { margin-bottom: 1rem; }
              .mb-8 { margin-bottom: 2rem; }
              .mt-2 { margin-top: 0.5rem; }
              .mt-16 { margin-top: 4rem; }
              .p-8 { padding: 2rem; }
              .text-center { text-align: center; }
              .font-bold { font-weight: bold; }
              .text-3xl { font-size: 1.875rem; }
              .text-xl { font-size: 1.25rem; }
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
              .gap-8 { gap: 2rem; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid black; padding: 0.5rem; text-align: left; }
              .max-w-[200px] { max-width: 200px; }
              .list-disc { list-style-type: disc; padding-left: 2rem; }
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
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast({
      title: "Error",
      description: "Could not generate PDF for this document",
      variant: "destructive",
    });
  }
};
