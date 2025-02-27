
import { FormData } from "@/types/contract";
import { toast } from "@/hooks/use-toast";
import * as ReactDOMServer from 'react-dom/server';
import React from 'react';

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

    // Create contract content as a string of HTML
    const contractContent = `
      <div style="padding: 2rem;">
        <div style="max-width: 800px; margin: 0 auto;">
          <div style="padding: 2rem;">
            <div>
              <div style="color: black;">
                <h1 style="font-size: 1.875rem; font-weight: bold; text-align: center; margin-bottom: 2rem;">CONTRACT DE ÎNCHIRIERE A LOCUINȚEI</h1>
                <p style="margin-bottom: 1rem;">Nr. ${metadata.contractNumber || '_____'}</p>
                <p style="margin-bottom: 2rem;">Data: ${metadata.contractDate || '_____'}</p>

                <p style="margin-bottom: 2rem;">Părțile,</p>

                <div style="margin-bottom: 2rem;">
                  ${metadata.ownerName}, Nr. ordine Reg. com./an: ${metadata.ownerReg}, Cod fiscal (C.U.I.): ${metadata.ownerFiscal},
                  cu sediul in ${metadata.ownerAddress}, cont bancar ${metadata.ownerBank}, deschis la ${metadata.ownerBankName},
                  reprezentat: ${metadata.ownerRepresentative}, e-mail: ${metadata.ownerEmail}, telefon: ${metadata.ownerPhone} în calitate de Proprietar,
                </div>

                <div style="margin-bottom: 2rem;">
                  ${metadata.tenantName}, Nr. ordine Reg. com./an: ${metadata.tenantReg}, Cod fiscal (C.U.I.): ${metadata.tenantFiscal},
                  cu domiciliul în ${metadata.tenantAddress}, cont bancar ${metadata.tenantBank}, deschis la ${metadata.tenantBankName},
                  reprezentat: ${metadata.tenantRepresentative}, e-mail: ${metadata.tenantEmail}, telefon: ${metadata.tenantPhone} în calitate de Chiriaș,
                </div>

                <p style="margin-bottom: 2rem;">Au convenit încheierea prezentului contract de închiriere, în termenii și condițiile care urmează:</p>

                <h2 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 1rem;">1. OBIECTUL CONTRACTULUI</h2>
                <p style="margin-bottom: 2rem;">
                  1.1. Obiectul prezentului contract este închirierea apartamentului situat în ${metadata.propertyAddress}, 
                  compus din ${metadata.roomCount} camere, cu destinația de locuință. Chiriașul va utiliza apartamentul 
                  incepand cu data de ${metadata.startDate} ca locuință pentru familia sa.
                </p>

                <!-- Additional contract sections would go here -->
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; margin-top: 4rem;">
                  <div>
                    <p style="font-weight: bold; margin-bottom: 0.5rem;">PROPRIETAR,</p>
                    <p>Data: ${metadata.ownerSignatureDate || '_____'}</p>
                    <p>Nume și semnătură:</p>
                    <p>${metadata.ownerSignatureName || '___________________________'}</p>
                    ${metadata.ownerSignatureImage ? 
                      `<img src="${metadata.ownerSignatureImage}" alt="Owner Signature" style="margin-top: 0.5rem; max-width: 200px;">` : ''}
                  </div>
                  <div>
                    <p style="font-weight: bold; margin-bottom: 0.5rem;">CHIRIAȘ,</p>
                    <p>Data: ${metadata.tenantSignatureDate || '_____'}</p>
                    <p>Nume și semnătură:</p>
                    <p>${metadata.tenantSignatureName || '___________________________'}</p>
                    ${metadata.tenantSignatureImage ? 
                      `<img src="${metadata.tenantSignatureImage}" alt="Tenant Signature" style="margin-top: 0.5rem; max-width: 200px;">` : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

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
            }
          </style>
        </head>
        <body>
          ${contractContent}
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
