import { FormData } from "@/types/contract";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { ContractSignatures } from "./ContractSignatures";

interface ContractContentProps {
  formData: FormData;
  contractId?: string;
}

export function ContractContent({ formData, contractId }: ContractContentProps) {
  console.log("Contract formData:", formData);
  console.log("Owner signature:", formData.ownerSignatureImage);
  console.log("Tenant signature:", formData.tenantSignatureImage);

  const handlePrint = () => {
    window.print();
  };

  return (
    <article className="max-w-4xl mx-auto py-8 px-4 print:p-0">      
      <div className="space-y-6 print:space-y-4 print:overflow-visible">
        <header className="text-center mb-6 print:mb-8">
          <h1 className="text-2xl font-bold mb-2 print:text-xl">CONTRACT DE ÎNCHIRIERE</h1>
          <p>Nr. {formData.contractNumber} din {formData.contractDate}</p>
        </header>

        <section className="print:break-inside-avoid-page">
          <h2 className="text-lg font-semibold mb-4">I. PĂRȚILE CONTRACTANTE</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium">1.1. {formData.ownerName}</p>
              <p>cu sediul în {formData.ownerAddress}</p>
              <p>înregistrată la Registrul Comerțului sub nr. {formData.ownerReg}</p>
              <p>cod fiscal {formData.ownerFiscal}</p>
              <p>cont {formData.ownerBank}</p>
              <p>deschis la {formData.ownerBankName}</p>
              <p>reprezentată de {formData.ownerRepresentative}</p>
              <p>în calitate de PROPRIETAR</p>
            </div>

            <div>
              <p>și</p>
            </div>

            <div>
              <p className="font-medium">1.2. {formData.tenantName}</p>
              <p>cu sediul în {formData.tenantAddress}</p>
              <p>înregistrată la Registrul Comerțului sub nr. {formData.tenantReg}</p>
              <p>cod fiscal {formData.tenantFiscal}</p>
              <p>cont {formData.tenantBank}</p>
              <p>deschis la {formData.tenantBankName}</p>
              <p>reprezentată de {formData.tenantRepresentative}</p>
              <p>în calitate de CHIRIAȘ</p>
            </div>
          </div>
        </section>

        <section className="print:break-inside-avoid-page">
          <h2 className="text-lg font-semibold mb-4">II. OBIECTUL CONTRACTULUI</h2>
          <p>
            2.1. Obiectul contractului îl constituie închirierea spațiului situat la adresa: {formData.propertyAddress}
          </p>
          <p>2.2. Spațiul închiriat are {formData.roomCount} camere.</p>
        </section>

        <section className="print:break-inside-avoid-page">
          <h2 className="text-lg font-semibold mb-4">III. DURATA CONTRACTULUI</h2>
          <p>
            3.1. Durata închirierii este de {formData.contractDuration} luni, începând cu data de {formData.startDate}.
          </p>
          <p>
            3.2. La expirarea termenului, contractul poate fi reînnoit pentru o perioadă de {formData.renewalPeriod} luni, 
            cu acordul ambelor părți.
          </p>
        </section>

        <section className="print:break-inside-avoid-page">
          <h2 className="text-lg font-semibold mb-4">IV. PREȚUL ÎNCHIRIERII</h2>
          <p>
            4.1. Chiria lunară este de {formData.rentAmount} lei{formData.vatIncluded === 'da' ? ', TVA inclus' : ''}.
          </p>
          <p>
            4.2. Plata chiriei se va face lunar, până în data de {formData.paymentDay} a fiecărei luni.
          </p>
          <p>
            4.3. Pentru întârzieri la plată se percep penalități de {formData.lateFee}% pe zi din suma datorată.
          </p>
        </section>

        <section className="print:break-inside-avoid-page">
          <h2 className="text-lg font-semibold mb-4">V. GARANȚIA</h2>
          <p>
            5.1. La semnarea contractului, chiriașul va plăti o garanție în valoare de {formData.securityDeposit} lei.
          </p>
          <p>
            5.2. Garanția va fi returnată în termen de {formData.depositReturnPeriod} zile de la încetarea contractului.
          </p>
        </section>

        <section className="print:break-inside-avoid-page">
          <h2 className="text-lg font-semibold mb-4">VI. REZILIEREA CONTRACTULUI</h2>
          <p>
            6.1. Oricare dintre părți poate denunța unilateral contractul cu un preaviz de {formData.unilateralNotice} zile.
          </p>
          <p>
            6.2. În caz de nerespectare a termenului de preaviz, se va plăti o penalizare de {formData.earlyTerminationFee} lei.
          </p>
          <p>
            6.3. Neplata chiriei timp de {formData.latePaymentTermination} zile consecutive dă dreptul proprietarului 
            de a rezilia contractul fără preaviz.
          </p>
        </section>

        <section className="print:break-inside-avoid-page">
          <h2 className="text-lg font-semibold mb-4">VII. INDEXURILE UTILITĂȚILOR LA PREDARE</h2>
          <div className="space-y-2">
            <p>Apă rece: {formData.waterColdMeter}</p>
            <p>Apă caldă: {formData.waterHotMeter}</p>
            <p>Electricitate: {formData.electricityMeter}</p>
            <p>Gaz: {formData.gasMeter}</p>
          </div>
        </section>

        {formData.assets && formData.assets.length > 0 && (
          <section className="print:break-inside-avoid-page">
            <h2 className="text-lg font-semibold mb-4">VIII. INVENTARUL BUNURILOR</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Denumire</th>
                  <th className="text-left py-2">Valoare</th>
                  <th className="text-left py-2">Stare</th>
                </tr>
              </thead>
              <tbody>
                {formData.assets.map((asset, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{asset.name}</td>
                    <td className="py-2">{asset.value}</td>
                    <td className="py-2">{asset.condition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="print:break-inside-avoid-page mt-8">
          {contractId ? (
            <ContractSignatures formData={formData} contractId={contractId} />
          ) : (
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="font-bold mb-2">PROPRIETAR,</p>
                <p className="mb-2">Data: _____</p>
                <p className="mb-2">Nume în clar și semnătură:</p>
                <p>___________________________</p>
              </div>
              <div>
                <p className="font-bold mb-2">CHIRIAȘ,</p>
                <p className="mb-2">Data: _____</p>
                <p className="mb-2">Nume în clar și semnătură:</p>
                <p>___________________________</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </article>
  );
}
