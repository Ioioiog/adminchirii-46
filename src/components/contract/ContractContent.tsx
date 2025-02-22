
import { FormData } from "@/types/contract";

interface ContractContentProps {
  formData: FormData;
}

export function ContractContent({ formData }: ContractContentProps) {
  return (
    <div className="text-black">
      <h1 className="text-2xl text-center font-bold mb-8">Contract de Închiriere</h1>
      
      <div className="mb-8">
        <p className="mb-2">Contract nr. {formData.contractNumber}</p>
        <p>Data: {formData.contractDate}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">I. Părțile contractante</h2>
        
        <div className="mb-4">
          <p className="mb-2">1.1. {formData.ownerName}, cu sediul social în {formData.ownerAddress}, înregistrată la Registrul Comerțului sub nr. {formData.ownerReg}, având cod fiscal {formData.ownerFiscal}, cont bancar {formData.ownerBank} deschis la {formData.ownerBankName}, email {formData.ownerEmail}, telefon {formData.ownerPhone}, cu sediul în județul {formData.ownerCounty}, localitatea {formData.ownerCity}, reprezentată prin {formData.ownerRepresentative}, în calitate de PROPRIETAR</p>
        </div>

        <div>
          <p>și</p>
        </div>

        <div className="mb-4">
          <p className="mb-2">1.2. {formData.tenantName}, cu sediul social în {formData.tenantAddress}, înregistrată la Registrul Comerțului sub nr. {formData.tenantReg}, având cod fiscal {formData.tenantFiscal}, cont bancar {formData.tenantBank} deschis la {formData.tenantBankName}, email {formData.tenantEmail}, telefon {formData.tenantPhone}, cu sediul în județul {formData.tenantCounty}, localitatea {formData.tenantCity}, reprezentată prin {formData.tenantRepresentative}, în calitate de CHIRIAȘ</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">II. Obiectul contractului</h2>
        <p className="mb-4">2.1. Obiectul prezentului contract îl constituie închirierea imobilului situat în {formData.propertyAddress}, compus din {formData.roomCount} camere.</p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">III. Durata contractului</h2>
        <p className="mb-4">3.1. Prezentul contract se încheie pe o durată de {formData.contractDuration} luni, începând cu data de {formData.startDate}.</p>
        <p className="mb-4">3.2. La expirarea termenului, contractul poate fi reînnoit pentru o perioadă de {formData.renewalPeriod} luni prin act adițional semnat de ambele părți.</p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">IV. Chiria și modalitatea de plată</h2>
        <p className="mb-4">4.1. Chiria lunară este de {formData.rentAmount} RON {formData.vatIncluded === 'da' ? '(inclusiv TVA)' : '(fără TVA)'}.</p>
        <p className="mb-4">4.2. Plata chiriei se va efectua lunar, până în data de {formData.paymentDay} a fiecărei luni, pentru luna în curs.</p>
        <p className="mb-4">4.3. Pentru întârzierea la plată se vor percepe penalități de {formData.lateFee}% pe zi din suma datorată.</p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">V. Garanția</h2>
        <p className="mb-4">5.1. La semnarea contractului, chiriașul va constitui o garanție în valoare de {formData.securityDeposit}.</p>
        <p className="mb-4">5.2. Garanția va fi returnată în termen de {formData.depositReturnPeriod} zile de la încetarea contractului.</p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">VI. Rezilierea contractului</h2>
        <p className="mb-4">6.1. Contractul poate fi reziliat unilateral cu un preaviz de {formData.unilateralNotice} zile.</p>
        <p className="mb-4">6.2. În cazul întârzierii la plată cu mai mult de {formData.latePaymentTermination} zile, proprietarul poate rezilia contractul.</p>
        <p className="mb-4">6.3. În cazul rezilierii anticipate, se va aplica o penalizare de {formData.earlyTerminationFee}.</p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">VII. Indexuri utilități</h2>
        <div className="grid grid-cols-2 gap-4">
          <p>Apă rece: {formData.waterColdMeter}</p>
          <p>Apă caldă: {formData.waterHotMeter}</p>
          <p>Electricitate: {formData.electricityMeter}</p>
          <p>Gaz: {formData.gasMeter}</p>
        </div>
      </div>

      {formData.assets && formData.assets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">VIII. Inventarul bunurilor</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-400 px-4 py-2">Denumire</th>
                <th className="border border-gray-400 px-4 py-2">Valoare</th>
                <th className="border border-gray-400 px-4 py-2">Stare</th>
              </tr>
            </thead>
            <tbody>
              {formData.assets.map((asset, index) => (
                <tr key={index}>
                  <td className="border border-gray-400 px-4 py-2">{asset.name}</td>
                  <td className="border border-gray-400 px-4 py-2">{asset.value}</td>
                  <td className="border border-gray-400 px-4 py-2">{asset.condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
