import { FormData } from "@/types/contract";
import { ContractHeader } from "./ContractHeader";
import { ContractParties } from "./ContractParties";
import { ContractSignatures } from "./ContractSignatures";
import { ContractAssets } from "./ContractAssets";

interface ContractContentProps {
  formData: FormData;
}

export function ContractContent({ formData }: ContractContentProps) {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="text-black">
        <ContractHeader formData={formData} />
        <ContractParties formData={formData} />
        
        <p className="mb-8">Au convenit încheierea prezentului contract de închiriere, în termenii și condițiile care urmează:</p>

        {/* Contract Sections */}
        <div className="contract-sections">
          {/* Section 1 */}
          <h2 className="text-xl font-bold mb-4">1. OBIECTUL CONTRACTULUI</h2>
          <div className="mb-8">
            <p>1.1. Obiectul prezentului contract este închirierea apartamentului situat în {formData.propertyAddress || '_____'}, 
            compus din {formData.roomCount || '_____'} camere, cu destinația de locuință. Chiriașul va utiliza apartamentul 
            începând cu data de {formData.startDate || '_____'} ca locuință pentru familia sa.</p>
          </div>

          {/* Section 2 */}
          <h2 className="text-xl font-bold mb-4">2. PREȚUL CONTRACTULUI</h2>
          <div className="mb-8">
            <p className="mb-4">2.1. Părțile convin un cuantum al chiriei lunare la nivelul sumei de {formData.rentAmount || '_____'} EUR 
            {formData.vatIncluded === "nu" ? " + TVA" : " (TVA inclus)"}. Plata chiriei se realizează în ziua de {formData.paymentDay || '_____'} 
            a fiecărei luni calendaristice pentru luna calendaristică următoare, în contul bancar al Proprietarului. 
            Plata se realizează în lei, la cursul de schimb euro/leu comunicat de BNR în ziua plății.</p>

            <p className="mb-4">2.2. În cazul în care data plății este o zi nebancară, plata se va realiza în prima zi bancară care urmează 
            zilei de {formData.paymentDay || '_____'}.</p>

            <p className="mb-4">2.3. Părțile convin că întârzierea la plată atrage aplicarea unor penalități în cuantum de 1% pentru fiecare 
            zi de întârziere.</p>

            <p className="mb-4">2.4. Prezentul contract se înregistrează, potrivit dispozițiilor legii în vigoare, la organele fiscale competente. 
            Părțile cunosc că prezentul contract reprezintă titlu executoriu pentru plata chiriei la termenele stabilite prin prezentul contract, 
            în conformitate cu prevederile art. 1798 Cod civil.</p>

            <p className="mb-4">2.5. La expirarea perioadei inițiale de {formData.contractDuration || '_____'} luni, Proprietarul are dreptul 
            de a ajusta valoarea chiriei în funcție de condițiile pieței imobiliare, rata inflației și/sau alte criterii economice relevante. 
            Proprietarul va notifica Chiriașul în scris cu cel puțin 30 de zile înainte de expirarea perioadei inițiale.</p>

            <p className="mb-4">2.6. Chiriei i se va aplica anual indicele de inflație al EURO, comunicat de EUROSTAT, calculat pentru anul precedent. 
            Proprietarul se obligă să notifice Chiriașul în scris cu privire la valoarea ajustată a chiriei cu cel puțin 30 de zile înainte de data 
            de aplicare.</p>
          </div>

          {/* Section 3 */}
          <h2 className="text-xl font-bold mb-4">3. DURATA CONTRACTULUI</h2>
          <div className="mb-8">
            <p className="mb-4">3.1. Părțile convin că încheie prezentul contract pentru o perioadă inițială minimă de {formData.contractDuration || '_____'} 
            luni. Părțile convin că perioada inițială minimă este de esența contractului.</p>

            <p className="mb-4">3.2. La expirarea perioadei inițiale minime, operează tacita relocațiune, adică prelungirea automată a perioadei 
            contractuale, cu perioade succesive de câte 12 luni.</p>
          </div>

          {/* Section 4 */}
          <h2 className="text-xl font-bold mb-4">4. ÎNCETAREA CONTRACTULUI</h2>
          <div className="mb-8">
            <p className="mb-4">4.1. Denunțarea unilaterală a contractului se va realiza printr-o notificare scrisă comunicată celeilalte părți, 
            prin e-mail, la adresele menționate în preambul. Locațiunea încetează în termen de 90 de zile de la data comunicării.</p>

            <p className="mb-4">4.2. Rezilierea contractului se va realiza printr-o notificare scrisă comunicată celeilalte părți, prin e-mail. 
            Locațiunea încetează în termen de 30 de zile de la data comunicării, dacă în acest interval partea aflată în culpă contractuală nu 
            remediază problema.</p>

            <p className="mb-4">4.3. În situația încetării contractului în perioada inițială de {formData.contractDuration || '_____'} luni, 
            partea care denunță unilateral contractul sau cea din culpa căreia se solicită rezilierea contractului datorează celeilalte părți, 
            cu titlu de daune-interese, o sumă egală cu contravaloarea unei chirii lunare.</p>

            <p className="mb-4">4.4. În situația întârzierii la plata chiriei cu mai mult de 30 de zile, locațiunea încetează în termen de 40 
            de zile de la scadența neonorată.</p>
          </div>

          {/* Section 5 */}
          <h2 className="text-xl font-bold mb-4">5. OBLIGAȚIILE PROPRIETARULUI</h2>
          <div className="mb-8">
            <p className="mb-4">5.1. Proprietarul se obligă să pună la dispoziția Chiriașului apartamentul în scopul utilizării acestuia ca locuință.</p>

            <p className="mb-4">5.2. Proprietarul este răspunzător și își asumă efectuarea oricăror reparații majore, care țin de structura de 
            rezistență a apartamentului sau cele care devin necesare în vederea utilizării apartamentului în conformitate cu destinația sa.</p>

            <p className="mb-4">5.3. Proprietarul va informa Chiriașul și va transmite acestuia orice facturi emise de furnizorii de utilități, 
            cu excepția celor care sunt comunicate la adresa poștală a apartamentului.</p>

            <p className="mb-4">5.4. Proprietarul va achita toate cheltuielile aferente întreținerii și utilităților pentru perioada anterioară 
            predării apartamentului.</p>
          </div>

          {/* Section 6 */}
          <h2 className="text-xl font-bold mb-4">6. OBLIGAȚIILE CHIRIAȘULUI</h2>
          <div className="mb-8">
            <p className="mb-4">6.1. Chiriașul este obligat să folosească apartamentul cu prudență și diligență, să se îngrijească de acesta și 
            să se asigure că utilizează echipamentele și electrocasnicele conform instrucțiunilor de utilizare.</p>

            <p className="mb-4">6.2. Chiriașul este răspunzător și își asumă pe deplin efectuarea oricăror reparații care țin de întreținerea 
            curentă a apartamentului și a bunurilor din acesta.</p>

            <p className="mb-4">6.3. Orice reparații ce cad în sarcina Chiriașului se vor realiza doar cu instalatori/electricieni autorizați 
            potrivit legii.</p>

            <p className="mb-4">6.4. Chiriașul va notifica orice defecțiuni sau reparații necesare care cad în sarcina Proprietarului în cel 
            mai scurt timp posibil.</p>

            <p className="mb-4">6.5. Chiriașul nu va face modificări apartamentului închiriat fără acordul scris și prealabil al Proprietarului.</p>

            <p className="mb-4">6.6. Chiriașul își asumă plata tuturor facturilor de utilități și efectuarea tuturor cheltuielilor ce țin de 
            utilizarea apartamentului.</p>

            <p className="mb-4">6.7. Chiriașul va permite Proprietarului să inspecteze apartamentul închiriat, la o dată și oră stabilite de 
            comun acord.</p>

            <p className="mb-4">6.8. Chiriașul nu are dreptul să schimbe destinația apartamentului sau să cedeze folosința acestuia fără acordul 
            prealabil scris al proprietarului.</p>

            <p className="mb-4">6.9. Chiriașul nu are voie să introducă în locație animale fără acordul prealabil în scris al proprietarului.</p>

            <p className="mb-4">6.10. Chiriașul trebuie să menționeze la momentul semnării contractului numărul exact de persoane care vor locui 
            în imobil.</p>
          </div>

          {/* Section 7 */}
          <h2 className="text-xl font-bold mb-4">7. GARANȚIA</h2>
          <div className="mb-8">
            <p className="mb-4">7.1. Chiriașul este de acord să ofere, cu titlu de garanție, suma de {formData.securityDeposit || '_____'}.</p>

            <p className="mb-4">7.2. Părțile convin că suma constituită cu titlu de garanție se returnează Chiriașului după încetarea contractului, 
            după expirarea unui termen de {formData.depositReturnPeriod || '_____'} luni.</p>

            <p className="mb-4">7.3. Proprietarul are dreptul să rețină din garanție sumele necesare pentru acoperirea daunelor sau utilităților 
            neplătite.</p>

            <p className="mb-4">7.4. Evaluarea prejudiciilor va fi realizată pe baza unui proces-verbal semnat de ambele părți.</p>
          </div>

          {/* Section 8 */}
          <h2 className="text-xl font-bold mb-4">8. UTILITĂȚI</h2>
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
                  <td className="border p-2">{formData.waterColdMeter || '_____'}</td>
                </tr>
                <tr>
                  <td className="border p-2">Apă caldă</td>
                  <td className="border p-2">{formData.waterHotMeter || '_____'}</td>
                </tr>
                <tr>
                  <td className="border p-2">Curent electric</td>
                  <td className="border p-2">{formData.electricityMeter || '_____'}</td>
                </tr>
                <tr>
                  <td className="border p-2">Gaze naturale</td>
                  <td className="border p-2">{formData.gasMeter || '_____'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 9 */}
          <h2 className="text-xl font-bold mb-4">9. CLAUZE FINALE</h2>
          <div className="mb-8">
            <p className="mb-4">9.1. Orice comunicare se va realiza în scris, prin e-mail, la adresele menționate în preambul.</p>

            <p className="mb-4">9.2. Orice diferende între Părți care nu pot fi rezolvate pe cale amiabilă vor fi deferite instanțelor 
            judecătorești competente de pe raza Municipiului București.</p>
          </div>
        </div>

        <ContractSignatures formData={formData} />
        <ContractAssets formData={formData} />
      </div>
    </div>
  );
}
