
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { FormData } from "@/types/contract";

interface ContractPreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  metadata: FormData;
  contractId: string;
}

export function ContractPreviewDialog({
  isOpen,
  onOpenChange,
  metadata,
  contractId
}: ContractPreviewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="contract-preview p-8 text-black">
          <h1 className="text-2xl text-center font-bold mb-8">Contract de Închiriere</h1>
          
          <div className="mb-8">
            <p className="mb-2">Contract nr. {metadata.contractNumber}</p>
            <p>Data: {metadata.contractDate}</p>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">I. Părțile contractante</h2>
            
            <div className="mb-4">
              <p className="font-medium">1.1. Proprietar:</p>
              <p>{metadata.ownerName}</p>
              <p>Nr. Registru Comerțului: {metadata.ownerReg}</p>
              <p>CUI: {metadata.ownerFiscal}</p>
              <p>Adresa: {metadata.ownerAddress}</p>
              <p>Cont bancar: {metadata.ownerBank}</p>
              <p>Banca: {metadata.ownerBankName}</p>
              <p>Email: {metadata.ownerEmail}</p>
              <p>Telefon: {metadata.ownerPhone}</p>
              <p>Județ: {metadata.ownerCounty}</p>
              <p>Oraș: {metadata.ownerCity}</p>
              <p>Reprezentant legal: {metadata.ownerRepresentative}</p>
            </div>

            <div className="mb-4">
              <p>și</p>
            </div>

            <div className="mb-4">
              <p className="font-medium">1.2. Chiriaș:</p>
              <p>{metadata.tenantName}</p>
              <p>Nr. Registru Comerțului: {metadata.tenantReg}</p>
              <p>CUI: {metadata.tenantFiscal}</p>
              <p>Adresa: {metadata.tenantAddress}</p>
              <p>Cont bancar: {metadata.tenantBank}</p>
              <p>Banca: {metadata.tenantBankName}</p>
              <p>Email: {metadata.tenantEmail}</p>
              <p>Telefon: {metadata.tenantPhone}</p>
              <p>Județ: {metadata.tenantCounty}</p>
              <p>Oraș: {metadata.tenantCity}</p>
              <p>Reprezentant legal: {metadata.tenantRepresentative}</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">II. Obiectul contractului</h2>
            <p>2.1. Obiectul prezentului contract îl constituie închirierea imobilului situat la adresa: {metadata.propertyAddress}</p>
            <p>2.2. Imobilul are {metadata.roomCount} camere.</p>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">III. Durata contractului</h2>
            <p>3.1. Durata contractului este de {metadata.contractDuration} luni.</p>
            <p>3.2. Contractul intră în vigoare la data de {metadata.startDate}.</p>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">IV. Chiria și modalitatea de plată</h2>
            <p>4.1. Chiria lunară este de {metadata.rentAmount} RON {metadata.vatIncluded === 'true' ? '(TVA inclus)' : '(fără TVA)'}.</p>
            <p>4.2. Plata chiriei se va efectua lunar, până în data de {metadata.paymentDay} a fiecărei luni.</p>
            <p>4.3. În caz de întârziere la plată se vor percepe penalități de {metadata.lateFee}% pe zi din suma datorată.</p>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">V. Garanția</h2>
            <p>5.1. Garanția este în valoare de {metadata.securityDeposit} RON.</p>
            <p>5.2. Garanția va fi returnată în termen de {metadata.depositReturnPeriod} zile de la încetarea contractului.</p>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">VI. Utilitățile</h2>
            <p>Index apă rece: {metadata.waterColdMeter}</p>
            <p>Index apă caldă: {metadata.waterHotMeter}</p>
            <p>Index electricitate: {metadata.electricityMeter}</p>
            <p>Index gaz: {metadata.gasMeter}</p>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">VII. Semnături</h2>
            
            <div className="grid grid-cols-2 gap-8">
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
      </DialogContent>
    </Dialog>
  );
}
