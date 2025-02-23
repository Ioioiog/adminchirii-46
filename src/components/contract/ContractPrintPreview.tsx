
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

    const contentHtml = ReactDOMServer.renderToString(
      <QueryClientProvider client={queryClient}>
        <div style={{ padding: "2rem" }}>
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

                  <h2 className="text-xl font-bold mb-4">3. DURATA CONTRACTULUI</h2>
                  <div className="mb-8">
                    <p className="mb-4">
                      3.1. Părțile convin că încheie prezentul contract pentru o perioadă inițială minimă de {metadata.contractDuration} luni. Părțile convin că perioada inițială minimă este de esența contractului.
                    </p>
                    <p className="mb-4">
                      3.2. La expirarea perioadei inițiale minime, operează tacita relocațiune, cu perioade succesive de câte 12 luni.
                    </p>
                  </div>

                  <h2 className="text-xl font-bold mb-4">4. ÎNCETAREA CONTRACTULUI</h2>
                  <div className="mb-8">
                    <p className="mb-4">
                      4.1. Părțile convin că denunțarea unilaterală a contractului se va realiza printr-o notificare scrisă comunicată celeilalte părți, prin e-mail, la adresele menționate în preambul. Locațiunea încetează în termen de 90 de zile de la data comunicării.
                    </p>
                    <p className="mb-4">
                      4.2. Părțile convin că rezilierea contractului se va realiza printr-o notificare scrisă comunicată celeilalte părți, prin e-mail, la adresele menționate în preambul. Locațiunea încetează în termen de 30 de zile de la data comunicării, dacă în acest interval partea aflată în culpă contractuală nu remediază problema ce determină rezilierea contractului.
                    </p>
                    <p className="mb-4">
                      4.3. Părțile sunt de acord că dacă încetarea contractului intervine în perioada inițială de 12 luni, din orice motiv, partea care denunță unilateral contractul sau cea din culpa căreia se solicită rezilierea contractului datorează celeilalte părți, cu titlu de daune-interese, o sumă egală cu contravaloarea unei chirii lunare.
                    </p>
                    <p className="mb-4">
                      4.4. Prin excepție, în situația întârzierii la plata chiriei cu mai mult de 30 de zile, locațiunea încetează în termen de 40 de zile de la scadența neonorată.
                    </p>
                    <p className="mb-4">
                      4.5. În ceea ce privește obligațiile de plată stabilite prin prezentul contract, părțile convin că se află de drept în întârziere.
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
                    <p className="mb-4">6.2. Chiriașul este răspunzător și își asumă pe deplin efectuarea oricăror reparații care țin de întreținerea curentă a apartamentului și a bunurilor din acesta. Pentru claritate, reparații ce țin de întreținerea curentă sunt, cu titlu exemplificativ: reparații necesare ca urmare a uzurii normale a lucrurilor (reparații minore de tâmplărie, reparația sau înlocuirea unor elemente precum prize, întrerupătoare, robineți, etc.).</p>
                    <p className="mb-4">6.3. Orice reparații ce cad în sarcina Chiriașului se vor realiza doar cu instalatori/electricieni autorizați potrivit legii sau în cadrul unui service autorizat, după caz, pe bază de contract de prestări servicii și garanție pentru lucrările astfel efectuate.</p>
                    <p className="mb-4">6.4. Chiriașul va notifica cu privire la orice defecțiuni sau reparații care sunt necesare și care cad în sarcina Proprietarului în cel mai scurt timp posibil, prin e-mail, astfel încât acestea să poată fi realizate în timp util. În ipoteza neîndeplinirii obligației de informare, reparațiile vor cădea în sarcina Chiriașului.</p>
                    <p className="mb-4">6.5. Chiriașul nu va face modificări apartamentului închiriat fără acordul scris și prealabil al Proprietarului.</p>
                    <p className="mb-4">6.6. Chiriașul își asumă plata tuturor facturilor de utilități, precum și efectuarea tuturor cheltuielilor ce țin de utilizarea apartamentului. În ipoteza neîndeplinirii la timp a obligațiilor de plată, Chiriașul este răspunzător și își asumă integral plata penalităților de întârziere și a eventualelor cheltuieli de recuperare a debitelor restante efectuate de furnizori, inclusiv cheltuieli de judecată, după caz.</p>
                    <p className="mb-4">6.7. Chiriașul va permite Proprietarului să inspecteze apartamentul închiriat, la solicitarea acestuia din urmă, la o dată și oră stabilite de comun acord, în avans.</p>
                    <p className="mb-4">6.8. Chiriașul nu are dreptul de schimba destinația apartamentului sau de a ceda folosința apartamentului, total sau parțial, cu titlu oneros sau gratuit, fără acordul prealabil scris al proprietarului.</p>
                    <p className="mb-4">6.9. Chiriașul are obligația ca odată cu încetarea contratului, să înceteze orice contracte de prestări servicii încheiate în numele său care presupun prestarea serviciilor la adresa apartamentului închiriat.</p>
                    <p className="mb-4">6.10. Chiriasul nu are voie sa introduca in locatie animale, animale de companie sau orice fel de vietuitoare fara acordul prealabil in scris al proprietarului.</p>
                    <p className="mb-4">6.11. Chiriasul trebuie sa mentioneze la momentul semnarii contractului numarul exact de persoane care vor locui in imobil pe perioada inchirierii, acest lucru fiind necesar proprietarului pentru a-l declara la administratie.</p>
                    <p className="mb-4">6.12. Chiriasul este de acord sa semneze ANEXA 1 care cuprinde un inventar al lucrurilor/electrocasnicelor/bunurilor ce sunt in imobil. De asemenea la intrarea in imobil se vor face poze la aceste bunuri si la starea imobilului, poze ce vor fi comunicate prin email dupa semnare.</p>
                    <p className="mb-4">6.13. Chiriasul este obligat la finalul contractului sa predea cheile, telecomanda parcare (daca este cazul) si orice bun pe care proprietarul l-a lasat in custodia chiriasului pe perioada derularii contractului.</p>
                  </div>

                  <h2 className="text-xl font-bold mb-4">7. GARANȚIA</h2>
                  <div className="mb-8">
                    <p className="mb-4">7.1. Chiriașul este de acord să ofere, cu titlu de garanție, contravaloarea unei chirii lunare. Această sumă de bani va fi utilizată de Proprietar doar în situația în care Chiriașul nu își îndeplinește în mod corespunzător obligațiile asumate contractual. Garanția nu poate fi utilizată în contul ultimei chirii lunare, anterior încetării contractului din orice motiv. Garantia nu reprezinta o suma de bani perceputa de proprietar ca plata anticipata pentru eventuale daune ci reprezinta o plata anticipata cu acordul chiriasului pentru plati legate de intretinere, curent, apa, curatenie si igienizare, schimbarea yalei de la intrare, plati pe care proprietarul le primeste ulterior plecarii efective a chiriasului din imobil.</p>
                    <p className="mb-4">7.2. Părțile convin că suma constituită cu titlu de garanție se returnează Chiriașului după încetarea contractului, după expirarea unui termen suficient care să permită Proprietarului să verifice acuratețea consumurilor declarate de energie electrică, gaze naturale, apă rece/caldă, etc. fără ca această perioadă să depășească trei luni de la data încetării contractului.</p>
                    <p className="mb-4">7.3. Proprietarul are dreptul să rețină din suma constituită cu titlu de garanție orice sume reprezentând prejudicii cauzate de Chiriaș, contravaloare a reparațiilor necesare ca urmare a neefectuării lor de către Chiriaș precum si sume ce tin de curatenie si igienizare efectuate dupa eliberarea imobilului de catre chirias.</p>
                    <p className="mb-4">7.4. Proprietarul nu are dreptul să pretindă Chiriașului despăgubiri pentru uzura normală a lucrurilor. Se consideră „uzură normală" modificările minore apărute în urma utilizării imobilului în conformitate cu destinația sa, cum ar fi:</p>
                    <ul className="list-disc pl-8 mb-4">
                      <li>Degradarea pereților cauzată de trecerea timpului (decolorare, crăpături fine);</li>
                      <li>Uzura mobilierului și echipamentelor electronice datorată utilizării corespunzătoare;</li>
                      <li>Degradări mici la tâmplărie, prize, întrerupătoare, care nu sunt cauzate de neglijență sau folosire abuzivă.</li>
                    </ul>
                    <p className="mb-4">7.5. Garanția va fi utilizată exclusiv pentru acoperirea prejudiciilor cauzate de Chiriaș sau pentru cheltuieli restante asociate contractului. Proprietarul este obligat să comunice Chiriașului, în scris, cu detalii și justificări, orice utilizare a sumei constituite drept garanție.</p>
                    <p className="mb-4">7.6. Evaluarea prejudiciilor va fi realizată pe baza unui proces-verbal semnat de ambele părți, care să includă starea bunurilor, a apartamentului și a utilităților la începutul și la finalul contractului.</p>
                    <p className="mb-4">7.7. Orice litigiu legat de starea bunurilor și evaluarea prejudiciilor va fi soluționat printr-un expert autorizat desemnat de comun acord de către părți.</p>
                  </div>

                  <h2 className="text-xl font-bold mb-4">8. CLAUZE FINALE</h2>
                  <div className="mb-8">
                    <p className="mb-4">
                      8.1. Orice comunicare se va realiza în scris, prin e-mail, servicii de mesagerie instant/SMS, la adresele și numerele de telefon menționate în preambul prezentului contract. Modificările aduse prezentului contract vor fi realizate printr-un act adițional.
                    </p>
                    <p className="mb-4">
                      8.2. Orice diferende între Părți care nu pot fi rezolvate pe cale amiabilă vor fi deferite instanțelor judecătorești competente de pe raza Municipiului București.
                    </p>
                    <p className="mb-4">
                      Prezentul contract a fost încheiat astăzi, {metadata.contractDate}, în trei exemplare originale, câte unul pentru fiecare parte și unul pentru autoritatea fiscală.
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
