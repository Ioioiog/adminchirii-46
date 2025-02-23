
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
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
        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <CardContent>
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
                    2.4. Prezentul contract se înregistrează, potrivit dispozițiilor legii în vigoare, la organele fiscale competente. 
                    Părțile cunosc că prezentul contract reprezintă titlu executoriu pentru plata chiriei la termenele stabilite prin 
                    prezentul contract, în conformitate cu prevederile art. 1798 Cod civil.
                  </p>
                  <p className="mb-4">
                    2.5. Părțile convin că, la expirarea perioadei inițiale de {metadata.contractDuration} luni, Proprietarul are dreptul 
                    de a ajusta valoarea chiriei în funcție de condițiile pieței imobiliare, rata inflației și/sau alte criterii economice relevante. 
                    Proprietarul va notifica Chiriașul în scris cu cel puțin 30 de zile înainte de expirarea perioadei inițiale, indicând noua 
                    valoare propusă a chiriei.
                  </p>
                </div>

                <h2 className="text-xl font-bold mb-4">3. DURATA CONTRACTULUI</h2>
                <div className="mb-8">
                  <p className="mb-4">
                    3.1. Părțile convin că încheie prezentul contract pentru o perioadă inițială minimă de {metadata.contractDuration} luni. 
                    Părțile convin că perioada inițială minimă este de esența contractului.
                  </p>
                  <p className="mb-4">
                    3.2. La expirarea perioadei inițiale minime, operează tacita relocațiune, cu perioade succesive de câte 12 luni.
                  </p>
                </div>

                <h2 className="text-xl font-bold mb-4">4. ÎNCETAREA CONTRACTULUI</h2>
                <div className="mb-8">
                  <p className="mb-4">
                    4.1. Părțile convin că denunțarea unilaterală a contractului se va realiza printr-o notificare scrisă comunicată 
                    celeilalte părți, prin e-mail, la adresele menționate în preambul. Locațiunea încetează în termen de 90 de zile 
                    de la data comunicării.
                  </p>
                </div>

                <h2 className="text-xl font-bold mb-4">5. OBLIGAȚIILE PROPRIETARULUI</h2>
                <div className="mb-8">
                  <p className="mb-4">5.1. Să asigure folosința nestingherită a spațiului închiriat.</p>
                  <p className="mb-4">5.2. Să execute reparațiile majore și structurale.</p>
                  <p className="mb-4">5.3. Să transmită facturile de utilități.</p>
                  <p className="mb-4">5.4. Să achite cheltuielile anterioare predării.</p>
                </div>

                <h2 className="text-xl font-bold mb-4">6. OBLIGAȚIILE CHIRIAȘULUI</h2>
                <div className="mb-8">
                  <p className="mb-4">6.1. Să folosească spațiul cu prudență și diligență.</p>
                  <p className="mb-4">6.2. Să efectueze reparațiile de întreținere curentă.</p>
                  <p className="mb-4">6.3. Să achite la timp utilitățile și cheltuielile de întreținere.</p>
                  <p className="mb-4">6.4. Să nu subînchirieze sau să cedeze folosința spațiului.</p>
                </div>

                <h2 className="text-xl font-bold mb-4">7. GARANȚIA</h2>
                <div className="mb-8">
                  <p className="mb-4">
                    7.1. Garanția este în valoare de {metadata.securityDeposit} RON și va fi returnată în termen de {metadata.depositReturnPeriod} zile 
                    de la încetarea contractului, cu condiția îndeplinirii tuturor obligațiilor contractuale de către Chiriaș.
                  </p>
                </div>

                <h2 className="text-xl font-bold mb-4">ANEXA 1 - LISTA BUNURI MOBILE/ELECTROCASNICE</h2>
                <div className="mb-8">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2 text-left">Denumire bun</th>
                        <th className="border p-2 text-left">Valoare (lei)</th>
                        <th className="border p-2 text-left">Stare</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metadata.assets?.map((asset, index) => (
                        <tr key={index}>
                          <td className="border p-2">{asset.name}</td>
                          <td className="border p-2">{asset.value}</td>
                          <td className="border p-2">{asset.condition}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h2 className="text-xl font-bold mb-4">ANEXA 2 - DETALII CONTORIZARE UTILITĂȚI</h2>
                <div className="mb-8">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2 text-left">Tip serviciu/utilitate</th>
                        <th className="border p-2 text-left">Nivel contor la data încheierii contractului</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2">Apă rece</td>
                        <td className="border p-2">{metadata.waterColdMeter}</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Apă caldă</td>
                        <td className="border p-2">{metadata.waterHotMeter}</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Curent electric</td>
                        <td className="border p-2">{metadata.electricityMeter}</td>
                      </tr>
                      <tr>
                        <td className="border p-2">Gaze naturale</td>
                        <td className="border p-2">{metadata.gasMeter}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

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
      </DialogContent>
    </Dialog>
  );
}
