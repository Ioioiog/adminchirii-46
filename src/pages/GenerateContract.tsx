import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

interface Asset {
  name: string;
  value: string;
  condition: string;
}

interface FormData {
  contractNumber: string;
  contractDate: string;
  ownerName: string;
  ownerReg: string;
  ownerFiscal: string;
  ownerAddress: string;
  ownerBank: string;
  ownerBankName: string;
  ownerEmail: string;
  ownerPhone: string;
  tenantName: string;
  tenantReg: string;
  tenantFiscal: string;
  tenantAddress: string;
  tenantBank: string;
  tenantBankName: string;
  tenantEmail: string;
  tenantPhone: string;
  propertyAddress: string;
  rentAmount: string;
  vatIncluded: string;
  contractDuration: string;
  paymentDay: string;
}

export default function GenerateContract() {
  const [assets, setAssets] = useState<Asset[]>([{
    name: '',
    value: '',
    condition: ''
  }]);

  const [formData, setFormData] = useState<FormData>({
    contractNumber: '1/26.01.2025',
    contractDate: '2025-01-26',
    ownerName: 'Various',
    ownerReg: 'J40/21592/2022',
    ownerFiscal: '32586251',
    ownerAddress: 'Șoseaua Fabrica de Glucoză, 6-8 Bloc 6b Ap 109 Et 10',
    ownerBank: 'RO03BREL0002002669730100',
    ownerBankName: 'LIBRA BANK S.A.',
    ownerEmail: 'mihaigruia@me.com',
    ownerPhone: '0744778792',
    tenantName: 'NOT FOR THE FAKE S.R.L.',
    tenantReg: 'J12/592/17.02.2020',
    tenantFiscal: 'RO43247471',
    tenantAddress: 'Strada Dorobantilor nr 99 sc 9b bl 1 et 7 ap 38',
    tenantBank: 'RO78BTRLRONCRT0541567101',
    tenantBankName: 'Banca Transilvania',
    tenantEmail: 'culda.catalinam@gmail.com',
    tenantPhone: '0748910682',
    propertyAddress: 'București, Fabrica de Glucoza, nr 6-8, bloc 4b, etaj 5, ap 26, sector 2',
    rentAmount: '1100',
    vatIncluded: 'nu',
    contractDuration: '12',
    paymentDay: '2'
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addAssetRow = () => {
    setAssets([...assets, { name: '', value: '', condition: '' }]);
  };

  const deleteAssetRow = (index: number) => {
    const newAssets = assets.filter((_, i) => i !== index);
    setAssets(newAssets);
  };

  const handleAssetChange = (index: number, field: keyof Asset, value: string) => {
    const newAssets = [...assets];
    newAssets[index][field] = value;
    setAssets(newAssets);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="edit-form bg-white rounded-lg shadow-sm p-6 print:hidden">
            <h1 className="text-3xl font-bold text-center mb-8">CONTRACT DE ÎNCHIRIERE A LOCUINȚEI</h1>
            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Contract Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contract-number">Nr. contract:</Label>
                  <Input 
                    type="text" 
                    id="contract-number" 
                    value={formData.contractNumber}
                    onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="contract-date">Data:</Label>
                  <Input 
                    type="date" 
                    id="contract-date" 
                    value={formData.contractDate}
                    onChange={(e) => handleInputChange('contractDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="contract-duration">Durata (luni):</Label>
                  <Input 
                    type="number" 
                    id="contract-duration" 
                    value={formData.contractDuration}
                    onChange={(e) => handleInputChange('contractDuration', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="payment-day">Ziua de plată:</Label>
                  <Input 
                    type="number" 
                    id="payment-day" 
                    value={formData.paymentDay}
                    onChange={(e) => handleInputChange('paymentDay', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Proprietar (Owner)</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="owner-name">Nume/Denumire:</Label>
                  <Input 
                    type="text" 
                    id="owner-name" 
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange('ownerName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="owner-reg">Nr. ordine Reg. com./an:</Label>
                  <Input 
                    type="text" 
                    id="owner-reg" 
                    value={formData.ownerReg}
                    onChange={(e) => handleInputChange('ownerReg', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="owner-fiscal">Cod fiscal (C.U.I.):</Label>
                  <Input 
                    type="text" 
                    id="owner-fiscal" 
                    value={formData.ownerFiscal}
                    onChange={(e) => handleInputChange('ownerFiscal', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="owner-address">Sediul:</Label>
                  <Input 
                    type="text" 
                    id="owner-address" 
                    value={formData.ownerAddress}
                    onChange={(e) => handleInputChange('ownerAddress', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="owner-bank">Cont bancar:</Label>
                  <Input 
                    type="text" 
                    id="owner-bank" 
                    value={formData.ownerBank}
                    onChange={(e) => handleInputChange('ownerBank', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="owner-bank-name">Banca:</Label>
                  <Input 
                    type="text" 
                    id="owner-bank-name" 
                    value={formData.ownerBankName}
                    onChange={(e) => handleInputChange('ownerBankName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="owner-email">Email:</Label>
                  <Input 
                    type="email" 
                    id="owner-email" 
                    value={formData.ownerEmail}
                    onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="owner-phone">Telefon:</Label>
                  <Input 
                    type="tel" 
                    id="owner-phone" 
                    value={formData.ownerPhone}
                    onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Chiriaș (Tenant)</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tenant-name">Nume/Denumire:</Label>
                  <Input 
                    type="text" 
                    id="tenant-name" 
                    value={formData.tenantName}
                    onChange={(e) => handleInputChange('tenantName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tenant-reg">Nr. ordine Reg. com./an:</Label>
                  <Input 
                    type="text" 
                    id="tenant-reg" 
                    value={formData.tenantReg}
                    onChange={(e) => handleInputChange('tenantReg', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tenant-fiscal">Cod fiscal (C.U.I.):</Label>
                  <Input 
                    type="text" 
                    id="tenant-fiscal" 
                    value={formData.tenantFiscal}
                    onChange={(e) => handleInputChange('tenantFiscal', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tenant-address">Adresa:</Label>
                  <Input 
                    type="text" 
                    id="tenant-address" 
                    value={formData.tenantAddress}
                    onChange={(e) => handleInputChange('tenantAddress', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tenant-bank">Cont bancar:</Label>
                  <Input 
                    type="text" 
                    id="tenant-bank" 
                    value={formData.tenantBank}
                    onChange={(e) => handleInputChange('tenantBank', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tenant-bank-name">Banca:</Label>
                  <Input 
                    type="text" 
                    id="tenant-bank-name" 
                    value={formData.tenantBankName}
                    onChange={(e) => handleInputChange('tenantBankName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tenant-email">Email:</Label>
                  <Input 
                    type="email" 
                    id="tenant-email" 
                    value={formData.tenantEmail}
                    onChange={(e) => handleInputChange('tenantEmail', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tenant-phone">Telefon:</Label>
                  <Input 
                    type="tel" 
                    id="tenant-phone" 
                    value={formData.tenantPhone}
                    onChange={(e) => handleInputChange('tenantPhone', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="property-address">Adresa apartamentului:</Label>
                  <Input 
                    type="text" 
                    id="property-address" 
                    value={formData.propertyAddress}
                    onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="rent-amount">Chirie lunară (EUR):</Label>
                  <Input 
                    type="number" 
                    id="rent-amount" 
                    value={formData.rentAmount}
                    onChange={(e) => handleInputChange('rentAmount', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="vat-included">TVA inclus:</Label>
                  <Select 
                    value={formData.vatIncluded}
                    onValueChange={(value) => handleInputChange('vatIncluded', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select VAT option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="da">Da</SelectItem>
                      <SelectItem value="nu">Nu (+ TVA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2 text-left">Denumire bun</th>
                        <th className="border p-2 text-left">Valoare (lei)</th>
                        <th className="border p-2 text-left">Stare</th>
                        <th className="border p-2 text-left">Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map((asset, index) => (
                        <tr key={index}>
                          <td className="border p-2">
                            <Input
                              type="text"
                              value={asset.name}
                              onChange={(e) => handleAssetChange(index, 'name', e.target.value)}
                            />
                          </td>
                          <td className="border p-2">
                            <Input
                              type="text"
                              value={asset.value}
                              onChange={(e) => handleAssetChange(index, 'value', e.target.value)}
                            />
                          </td>
                          <td className="border p-2">
                            <Input
                              type="text"
                              value={asset.condition}
                              onChange={(e) => handleAssetChange(index, 'condition', e.target.value)}
                            />
                          </td>
                          <td className="border p-2">
                            <Button 
                              variant="destructive" 
                              onClick={() => deleteAssetRow(index)}
                              className="w-full"
                            >
                              Șterge
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button onClick={addAssetRow} className="mt-4">
                  Adaugă bun
                </Button>
              </CardContent>
            </Card>

            <Button 
              onClick={handlePrint}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
            >
              Printează Contractul
            </Button>
          </div>

          <div className="hidden print:block print:p-8">
            <div className="text-black">
             <h1>CONTRACT DE ÎNCHIRIERE A LOCUINȚEI</h1>
                <p>Nr. ${contractNumber}</p>
                
                <h2>Părțile,</h2>
                
                <p>${ownerName}, Nr. ordine Reg. com./an: ${ownerReg}, Cod fiscal (C.U.I.): ${ownerFiscal}, cu sediul in ${ownerAddress}, Judetul: ${ownerCounty}, Localitatea: ${ownerCity}, cont bancar ${ownerBank}, deschis la ${ownerBankName}, reprezentat: ${ownerRepresentative}, e-mail: ${ownerEmail}, telefon: ${ownerPhone} în calitate de Proprietar,</p>
                
                <p>${tenantName}, Nr. ordine Reg. com./an: ${tenantReg}, Cod fiscal (C.U.I.): ${tenantFiscal} cu domiciliul în ${tenantAddress}, Judetul: ${tenantCounty}, Localitatea: ${tenantCity}, cont bancar ${tenantBank}, deschis la ${tenantBankName}, reprezentat: ${tenantRepresentative}, e-mail: ${tenantEmail}, telefon: ${tenantPhone}, în calitate de Chiriaș,</p>
                
                <p>Au convenit încheierea prezentului contract de închiriere, în termenii și condițiile care urmează:</p>
                
                <h2>1. OBIECTUL CONTRACTULUI</h2>
                <p>1.1. Obiectul prezentului contract este închirierea apartamentului situat în ${propertyAddress}, compus din ${propertyRooms} camere, cu destinația de locuință. Chiriașul va utiliza apartamentul incepand cu data de ${startDate} ca locuință pentru familia sa.</p>
                
                <h2>2. PREȚUL CONTRACTULUI</h2>
                <p>2.1. Părțile convin un cuantum al chiriei lunare la nivelul sumei de ${rentAmount} euro ${vatIncluded === 'nu' ? '+ TVA' : 'TVA inclus'}. Plata chiriei se realizează în ziua de ${paymentDay} a fiecărei luni calendaristice pentru luna calendaristică următoare, în contul bancar al Proprietarului, indicat în preambulul prezentului contract. Plata se realizează în lei, la cursul de schimb euro/leu comunicat de BNR în ziua plății.</p>
                <p>2.2. În cazul în care data plății este o zi nebancară, plata se va realiza în prima zi bancară care urmează zilei de ${paymentDay}.</p>
                <p>2.3. Părțile convin că întârzierea la plată atrage aplicarea unor penalități în cuantum de ${lateFee}% pentru fiecare zi de întârziere.</p>
                <p>2.4. Prezentul contract se înregistrează, potrivit dispozițiilor legii în vigoare, la organele fiscale competente. Părțile cunosc că prezentul contract reprezintă titlu executoriu pentru plata chiriei la termenele stabilite prin prezentul contract, în conformitate cu prevederile art. 1798 Cod civil.</p>
                <p>2.5. Părțile convin că, la expirarea perioadei inițiale de ${contractDuration} luni, Proprietarul are dreptul de a ajusta valoarea chiriei în funcție de condițiile pieței imobiliare, rata inflației și/sau alte criterii economice relevante. Proprietarul va notifica Chiriașul în scris cu cel puțin 30 de zile înainte de expirarea perioadei inițiale, indicând noua valoare propusă a chiriei.</p>
                <p>2.6. Chiriei i se va aplica anual indicele de inflație al EURO, comunicat de EUROSTAT (Statistical Office of the European Communities), calculat pentru anul precedent. Proprietarul se obligă să notifice Chiriașul în scris cu privire la valoarea ajustată a chiriei cu cel puțin 30 de zile înainte de data de aplicare, aceasta devenind efectivă de la 1 ianuarie al fiecărui an.</p>
                <p>2.7. Dacă Chiriașul acceptă ajustarea, contractul se prelungește automat în noile condiții. Dacă Chiriașul nu este de acord, contractul încetează de drept la expirarea perioadei inițiale de ${contractDuration} luni, fără penalități pentru niciuna dintre părți.</p>
                
                <h2>3. DURATA CONTRACTULUI</h2>
                <p>3.1. Părțile convin că încheie prezentul contract pentru o perioadă inițială minimă de ${contractDuration} luni. Părțile convin că perioada inițială minimă este de esența contractului.</p>
                <p>3.2. Părțile convin că la expirarea perioadei inițiale minime, operează tacita relocațiune, adică prelungirea automată a perioadei contractuale, cu perioade succesive de câte ${renewalPeriod} luni.</p>
                
                <h2>4. ÎNCETAREA CONTRACTULUI</h2>
                <p>4.1. Părțile convin că denunțarea unilaterală a contractului se va realiza printr-o notificare scrisă comunicată celeilalte părți, prin e-mail, la adresele menționate în preambul. Locațiunea încetează în termen de ${unilateralNotice} de zile de la data comunicării.</p>
                <p>4.2. Părțile convin că rezilierea contractului se va realiza printr-o notificare scrisă comunicată celeilalte părți, prin e-mail, la adresele menționate în preambul. Locațiunea încetează în termen de ${terminationNotice} de zile de la data comunicării, dacă în acest interval partea aflată în culpă contractuală nu remediază problema ce determină rezilierea contractului.</p>
                <p>4.3. Părțile sunt de acord că dacă încetarea contractului intervine în perioada inițială de ${contractDuration} luni, din orice motiv, partea care denunță unilateral contractul sau cea din culpa căreia se solicită rezilierea contractului datorează celeilalte părți, cu titlu de daune-interese, o sumă egală cu ${earlyTerminationFee}.</p>
                <p>4.4. Prin excepție, în situația întârzierii la plata chiriei cu mai mult de 30 de zile, locațiunea încetează în termen de ${latePaymentTermination} de zile de la scadența neonorată.</p>
                <p>4.5. În ceea ce privește obligațiile de plată stabilite prin prezentul contract, părțile convin că se află de drept în întârziere.</p>
                
                <h2>5. OBLIGAȚIILE PROPRIETARULUI</h2>
                <p>5.1. Proprietarul se obligă să pună la dispoziția Chiriașului apartamentul în scopul utilizării acestuia ca locuință.</p>
                <p>5.2. Proprietarul este răspunzător și își asumă efectuarea oricăror reparații majore, care țin de structura de rezistență a apartamentului sau cele care devin necesare în vederea utilizării apartamentului în conformitate cu destinația sa.</p>
                <p>5.3. Proprietarul va informa Chiriașul și va transmite acestuia orice facturi emise de furnizorii de utilități, cu excepția celor care sunt comunicate la adresa poștală a apartamentului.</p>
                <p>5.4. Proprietarul va achita toate cheltuielile aferente întreținerii și utilităților pentru perioada anterioară predării apartamentului.</p>
                
                <h2>6. OBLIGAȚIILE CHIRIAȘULUI</h2>
                <p>6.1. Chiriașul este obligat să folosească apartamentul cu prudență și diligență, să se îngrijească de acesta și să se asigure că utilizează echipamentele și electrocasnicele care se regăsesc în apartament în conformitate cu manualul și instrucțiunile de utilizare puse la dispoziție de Proprietar.</p>
                <p>6.2. Chiriașul este răspunzător și își asumă pe deplin efectuarea oricăror reparații care țin de întreținerea curentă a apartamentului și a bunurilor din acesta. Pentru claritate, reparații ce țin de întreținerea curentă sunt, cu titlu exemplificativ: reparații necesare ca urmare a uzurii normale a lucrurilor (reparații minore de tâmplărie, reparația sau înlocuirea unor elemente precum prize, întrerupătoare, robineți, etc.).</p>
                <p>6.3. Orice reparații ce cad în sarcina Chiriașului se vor realiza doar cu instalatori/electricieni autorizați potrivit legii sau în cadrul unui service autorizat, după caz, pe bază de contract de prestări servicii și garanție pentru lucrările astfel efectuate.</p>
                <p>6.4. Chiriașul va notifica cu privire la orice defecțiuni sau reparații care sunt necesare și care cad în sarcina Proprietarului în cel mai scurt timp posibil, prin e-mail, astfel încât acestea să poată fi realizate în timp util. În ipoteza neîndeplinirii obligației de informare, reparațiile vor cădea în sarcina Chiriașului.</p>
                <p>6.5. Chiriașul nu va face modificări apartamentului închiriat fără acordul scris și prealabil al Proprietarului.</p>
                <p>6.6. Chiriașul își asumă plata tuturor facturilor de utilități, precum și efectuarea tuturor cheltuielilor ce țin de utilizarea apartamentului. În ipoteza neîndeplinirii la timp a obligațiilor de plată, Chiriașul este răspunzător și își asumă integral plata penalităților de întârziere și a eventualelor cheltuieli de recuperare a debitelor restante efectuate de furnizori, inclusiv cheltuieli de judecată, după caz.</p>
                <p>6.7. Chiriașul va permite Proprietarului să inspecteze apartamentul închiriat, la solicitarea acestuia din urmă, la o dată și oră stabilite de comun acord, în avans. Părțile convin că lipsa repetată a disponibilității Chiriașului pentru îndeplinirea acestei obligații poate constitui motiv pentru rezilierea contractului.</p>
                <p>6.8. Chiriașul nu are dreptul de schimba destinația apartamentului sau de a ceda folosința apartamentului, total sau parțial, cu titlu oneros sau gratuit, fără acordul prealabil scris al proprietarului.</p>
                <p>6.9. Chiriașul are obligația ca odată cu încetarea contratului, să înceteze orice contracte de prestări servicii încheiate în numele său care presupun prestarea serviciilor la adresa apartamentului închiriat.</p>
                <p>6.10. Chiriasul nu are voie sa introduca in locatie animale, animale de companie sau orice fel de vietuitoare fara acordul prealabil in scris al proprietarului.</p>
                <p>6.11. Chiriasul trebuie sa mentioneze la momentul semnarii contractului numarul exact de persoane care vor locui in imobil pe perioada inchirierii, acest lucru fiind necesar proprietarului pentru a-l declara la administratie.</p>
                <p>6.12. Chiriasul este de acord sa semneze AXENA 1 care cuprinde un inventar al lucrurilor/electrocasnicelor/bunurilor ce sunt in imobil. De acemenea la intrarea in imobil se vor face poze la aceste bunuri si la starea imobilului, poze ce vor fi comunicate prin email dupa semnare. Acest email va reprezenta o dovada a starii imobilului si bunurilor aflate in custodia chiriasului de la data semnarii prezentului contract. Orice paguba adusa acestor bunuri sau imobilului in sine din culpa chiriasului, atrage raspunderea chiriasului. Pentru claritate, chiriasul va plati orice defectiune sau avarie din culpa lui, adusa bunurilor sau/si imobilului.</p>
                <p>6.14. Chiriasul este obligat la finalul contractului sa predea cheile, telecomanda parcare (daca este cazul) si orice bun pe care proprietarul l-a lasat in custodia chiriasului pe perioada derularii contractului.</p>
                
                <h2>7. GARANȚIA</h2>
                <p>7.1. Chiriașul este de acord să ofere, cu titlu de garanție, ${securityDeposit}. Această sumă de bani va fi utilizată de Proprietar doar în situația în care Chiriașul nu își îndeplinește în mod corespunzător obligațiile asumate contractual. Garanția nu poate fi utilizată în contul ultimei chirii lunare, anterior încetării contractului din orice motiv. Garantia nu reprezinta o suma de bani perceputa de proprietar ca plata anticipata pentru eventuale daune ci reprezinta o plata anticipata cu acordul chiriasului pentru plati legate de intretinere, curent, apa, curatenie si igienizare, schimbarea yalei de la intrare, plati pe care proprietarul le primeste ulterior plecarii efective a chiriasului din imobil.</p>
                <p>7.2. Părțile convin că suma constituită cu titlu de garanție se returnează Chiriașului după încetarea contractului, după expirarea unui termen suficient care să permită Proprietarului să verifice acuratețea consumurilor declarate de energie electrică, gaze naturale, apă rece/caldă, etc. fără ca această perioadă să depășească ${depositReturnPeriod} luni de la data încetării contractului.</p>
                <p>7.3. Proprietarul are dreptul să rețină din suma constituită cu titlu de garanție orice sume reprezentând prejudicii cauzate de Chiriaș, contravaloare a reparațiilor necesare ca urmare a neefectuării lor de către Chiriaș precum si sume ce tin de curatenie si igienizare efectuate dupa eliberarea imobilului de catre chirias.</p>
                <p>7.4. Proprietarul nu are dreptul să pretindă Chiriașului despăgubiri pentru uzura normală a lucrurilor. Se consideră „uzură normală" modificările minore apărute în urma utilizării imobilului în conformitate cu destinația sa, cum ar fi:</p>
                <ul>
                    <li>Degradarea pereților cauzată de trecerea timpului (decolorare, crăpături fine);</li>
                    <li>Uzura mobilierului și echipamentelor electronice datorată utilizării corespunzătoare;</li>
                    <li>Degradări mici la tâmplărie, prize, întrerupătoare, care nu sunt cauzate de neglijență sau folosire abuzivă.</li>
                </ul>
                <p>7.5. Garanția va fi utilizată exclusiv pentru acoperirea prejudiciilor cauzate de Chiriaș sau pentru cheltuieli restante asociate contractului. Proprietarul este obligat să comunice Chiriașului, în scris, cu detalii și justificări, orice utilizare a sumei constituite drept garanție.</p>
                <p>7.6. Evaluarea prejudiciilor va fi realizată pe baza unui proces-verbal semnat de ambele părți, care să includă starea bunurilor, a apartamentului și a utilităților la începutul și la finalul contractului.</p>
                <p>7.7. Orice litigiu legat de starea bunurilor și evaluarea prejudiciilor va fi soluționat printr-un expert autorizat desemnat de comun acord de către părți.</p>
                
                <h2>8. CLAUZE FINALE</h2>
                <p>8.1. Orice comunicare se va realiza în scris, prin e-mail, servicii de mesagerie instant/SMS, la adresele și numerele de telefon menționate în preambul prezentului contract. Modificările aduse prezentului contract vor fi realizate printr-un act adițional.</p>
                <p>8.2. Orice diferende între Părți care nu pot fi rezolvate pe cale amiabilă vor fi deferite instanțelor judecătorești competente de pe raza Municipiului București.</p>
                
                <p>Prezentul contract a fost încheiat astăzi, ${contractDate}, în trei exemplare originale, câte unul pentru fiecare parte și unul pentru autoritatea fiscală.</p>
                
                <h3>Detalii contorizare utilități:</h3>
                <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <th>Tip serviciu/utilitate</th>
                        <th>Nivel contor la data încheierii contractului</th>
                    </tr>
                    <tr>
                        <td>Apă rece</td>
                        <td>${waterColdMeter}</td>
                    </tr>
                    <tr>
                        <td>Apă caldă</td>
                        <td>${waterHotMeter}</td>
                    </tr>
                    <tr>
                        <td>Curent electric</td>
                        <td>${electricityMeter}</td>
                    </tr>
                    <tr>
                        <td>Gaze naturale</td>
                        <td>${gasMeter}</td>
                    </tr>
                </table>
                
                <h3>Listă bunuri mobile/electrocasnice:</h3>
                <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <th>Denumire bun</th>
                        <th>Valoare (lei)</th>
                        <th>Stare</th>
                    </tr>
                    ${assetsList}
                </table>
                
                <div style="display: flex; justify-content: space-between; margin-top: 50px;">
                    <div style="width: 45%;">
                        <p><strong>PROPRIETAR,</strong></p>
                        <p>Data: ${ownerSignatureDate}</p>
                        <p>Nume în clar și semnătura:</p>
                        <p>${ownerSignatureName || '___________________________'}</p>
                    </div>
                    
                    <div style="width: 45%;">
                        <p><strong>CHIRIAȘ,</strong></p>
                        <p>Data: ${tenantSignatureDate}</p>
                        <p>Nume în clar și semnătura:</p>
                        <p>${tenantSignatureName || '___________________________'}</p>
                    </div>
                </div>
  );
}
