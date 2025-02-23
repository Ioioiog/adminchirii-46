
import { QueryClientProvider } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import * as ReactDOMServer from 'react-dom/server';
import { useToast } from "@/hooks/use-toast";
import type { FormData } from "@/types/contract";

interface ContractPrintPreviewProps {
  queryClient: any;
  metadata: FormData;
  contractId: string;
  contractNumber?: string;
}

export function useContractPrint({ queryClient, metadata, contractId, contractNumber }: ContractPrintPreviewProps) {
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

    // Using the same layout as ContractPreviewDialog
    const contentHtml = ReactDOMServer.renderToString(
      <QueryClientProvider client={queryClient}>
        <div style={{ padding: "2rem" }}>
          <div className="max-w-4xl mx-auto">
            <Card className="p-8">
              <CardContent>
                <div className="text-black">
                  <h1 className="text-3xl font-bold text-center mb-8">CONTRACT DE ÎNCHIRIERE A LOCUINȚEI</h1>
                  {/* Contract details */}
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

                  {/* Rest of contract sections */}
                  {/* ... Same content as in ContractPreviewDialog ... */}
                  <p className="mb-8">Au convenit încheierea prezentului contract de închiriere, în termenii și condițiile care urmează:</p>

                  <h2 className="text-xl font-bold mb-4">1. OBIECTUL CONTRACTULUI</h2>
                  <p className="mb-8">
                    1.1. Obiectul prezentului contract este închirierea apartamentului situat în {metadata.propertyAddress}, 
                    compus din {metadata.roomCount} camere, cu destinația de locuință. Chiriașul va utiliza apartamentul 
                    incepand cu data de {metadata.startDate} ca locuință pentru familia sa.
                  </p>

                  <h2 className="text-xl font-bold mb-4">2. PREȚUL CONTRACTULUI</h2>
                  <div className="mb-8">
                    <p className="mb-4">
                      2.1. Părțile convin un cuantum al chiriei lunare la nivelul sumei de {metadata.rentAmount} EUR 
                      {metadata.vatIncluded === "nu" ? "+ TVA" : "(TVA inclus)"}. Plata chiriei se realizează în ziua de {metadata.paymentDay} 
                      a fiecărei luni calendaristice pentru luna calendaristică următoare, în contul bancar al Proprietarului.
                      Plata se realizează în lei, la cursul de schimb euro/leu comunicat de BNR în ziua plății.
                    </p>
                    <p className="mb-4">
                      2.2. În cazul în care data plății este o zi nebancară, plata se va realiza în prima zi bancară care urmează 
                      zilei de {metadata.paymentDay}.
                    </p>
                    <p className="mb-4">
                      2.3. Părțile convin că întârzierea la plată atrage aplicarea unor penalități în cuantum de {metadata.lateFee}% pentru fiecare 
                      zi de întârziere.
                    </p>
                    <p className="mb-4">
                      2.4. Prezentul contract se înregistrează, potrivit dispozițiilor legii în vigoare, la organele fiscale competente. Părțile cunosc că prezentul contract reprezintă titlu executoriu pentru plata chiriei la termenele stabilite prin prezentul contract, în conformitate cu prevederile art. 1798 Cod civil.
                    </p>
                    <p className="mb-4">
                      2.5. Părțile convin că, la expirarea perioadei inițiale de {metadata.contractDuration} luni, Proprietarul are dreptul de a ajusta valoarea chiriei în funcție de condițiile pieței imobiliare, rata inflației și/sau alte criterii economice relevante. Proprietarul va notifica Chiriașul în scris cu cel puțin 30 de zile înainte de expirarea perioadei inițiale, indicând noua valoare propusă a chiriei.
                    </p>
                    <p className="mb-4">
                      2.6. Chiriei i se va aplica anual indicele de inflație al EURO, comunicat de EUROSTAT (Statistical Office of the European Communities), calculat pentru anul precedent. Proprietarul se obligă să notifice Chiriașul în scris cu privire la valoarea ajustată a chiriei cu cel puțin 30 de zile înainte de data de aplicare, aceasta devenind efectivă de la 1 ianuarie al fiecărui an.
                    </p>
                    <p className="mb-4">
                      2.7. Dacă Chiriașul acceptă ajustarea, contractul se prelungește automat în noile condiții. Dacă Chiriașul nu este de acord, contractul încetează de drept la expirarea perioadei inițiale de 12 luni, fără penalități pentru niciuna dintre părți.
                    </p>
                  </div>

                  {/* ... Continue with all sections from ContractPreviewDialog ... */}
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
              </CardContent>
            </Card>
          </div>
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
  };

  return { handlePrint };
}
