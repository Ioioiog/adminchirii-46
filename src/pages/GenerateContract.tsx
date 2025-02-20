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
  // New fields
  ownerCounty: string;
  ownerCity: string;
  ownerRepresentative: string;
  tenantCounty: string;
  tenantCity: string;
  tenantRepresentative: string;
  propertyRooms: string;
  startDate: string;
  lateFee: string;
  renewalPeriod: string;
  unilateralNotice: string;
  terminationNotice: string;
  earlyTerminationFee: string;
  latePaymentTermination: string;
  securityDeposit: string;
  depositReturnPeriod: string;
  waterColdMeter: string;
  waterHotMeter: string;
  electricityMeter: string;
  gasMeter: string;
  ownerSignatureDate: string;
  ownerSignatureName: string;
  tenantSignatureDate: string;
  tenantSignatureName: string;
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
    paymentDay: '2',
    // New fields with initial values
    ownerCounty: 'București',
    ownerCity: 'București',
    ownerRepresentative: 'Administrator',
    tenantCounty: 'București',
    tenantCity: 'București',
    tenantRepresentative: 'Administrator',
    propertyRooms: '2',
    startDate: '2025-01-26',
    lateFee: '0.1',
    renewalPeriod: '12',
    unilateralNotice: '30',
    terminationNotice: '15',
    earlyTerminationFee: '2 chirii lunare',
    latePaymentTermination: '5',
    securityDeposit: '2 chirii lunare',
    depositReturnPeriod: '2',
    waterColdMeter: '0',
    waterHotMeter: '0',
    electricityMeter: '0',
    gasMeter: '0',
    ownerSignatureDate: '2025-01-26',
    ownerSignatureName: '',
    tenantSignatureDate: '2025-01-26',
    tenantSignatureName: ''
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
          {/* Edit Form - Only visible when not printing */}
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

            {/* New form fields for additional details */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="propertyRooms">Număr camere:</Label>
                  <Input 
                    type="number" 
                    id="propertyRooms" 
                    value={formData.propertyRooms}
                    onChange={(e) => handleInputChange('propertyRooms', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">Data începerii:</Label>
                  <Input 
                    type="date" 
                    id="startDate" 
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lateFee">Penalități întârziere (%):</Label>
                  <Input 
                    type="number" 
                    id="lateFee" 
                    value={formData.lateFee}
                    onChange={(e) => handleInputChange('lateFee', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="securityDeposit">Garanție:</Label>
                  <Input 
                    type="text" 
                    id="securityDeposit" 
                    value={formData.securityDeposit}
                    onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Utility Meters Card */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Contoare Utilități</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="waterColdMeter">Apă rece:</Label>
                  <Input 
                    type="text" 
                    id="waterColdMeter" 
                    value={formData.waterColdMeter}
                    onChange={(e) => handleInputChange('waterColdMeter', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="waterHotMeter">Apă caldă:</Label>
                  <Input 
                    type="text" 
                    id="waterHotMeter" 
                    value={formData.waterHotMeter}
                    onChange={(e) => handleInputChange('waterHotMeter', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="electricityMeter">Curent electric:</Label>
                  <Input 
                    type="text" 
                    id="electricityMeter" 
                    value={formData.electricityMeter}
                    onChange={(e) => handleInputChange('electricityMeter', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="gasMeter">Gaze naturale:</Label>
                  <Input 
                    type="text" 
                    id="gasMeter" 
                    value={formData.gasMeter}
                    onChange={(e) => handleInputChange('gasMeter', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={() => window.print()}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
            >
              Printează Contractul
            </Button>
          </div>

          {/* Printable Contract - Only visible when printing */}
          <div className="hidden print:block print:p-8">
            <div className="text-black">
              <h1 className="text-3xl font-bold text-center mb-8">CONTRACT DE ÎNCHIRIERE A LOCUINȚEI</h1>
              <p>Nr. {formData.contractNumber}</p>
              
              <h2 className="text-xl font-bold mt-8 mb-4">Părțile,</h2>
              
              <p className="mb-4">
                {formData.ownerName}, Nr. ordine Reg. com./an: {formData.ownerReg}, Cod fiscal (C.U.I.): {formData.ownerFiscal}, 
                cu sediul in {formData.ownerAddress}, Judetul: {formData.ownerCounty}, Localitatea: {formData.ownerCity}, 
                cont bancar {formData.ownerBank}, deschis la {formData.ownerBankName}, reprezentat: {formData.ownerRepresentative}, 
                e-mail: {formData.ownerEmail}, telefon: {formData.ownerPhone} în calitate de Proprietar,
              </p>
              
              <p className="mb-4">
                {formData.tenantName}, Nr. ordine Reg. com./an: {formData.tenantReg}, Cod fiscal (C.U.I.): {formData.tenantFiscal} 
                cu domiciliul în {formData.tenantAddress}, Judetul: {formData.tenantCounty}, Localitatea: {formData.tenantCity}, 
                cont bancar {formData.tenantBank}, deschis la {formData.tenantBankName}, reprezentat: {formData.tenantRepresentative}, 
                e-mail: {formData.tenantEmail}, telefon: {formData.tenantPhone}, în calitate de Chiriaș,
              </p>
              
              <p className="mb-8">Au convenit încheierea prezentului contract de închiriere, în termenii și condițiile care urmează:</p>

              {/* Contract sections with full text */}
              <h2 className="text-xl font-bold mt-8 mb-4">1. OBIECTUL CONTRACTULUI</h2>
              <p className="mb-4">
                1.1. Obiectul prezentului contract este închirierea apartamentului situat în {formData.propertyAddress}, compus din {formData.propertyRooms} camere, cu destinația de locuință. Chiriașul va utiliza apartamentul incepand cu data de {formData.startDate} ca locuință pentru familia sa.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4">2. PREȚUL CONTRACTULUI</h2>
              <p className="mb-4">
                2.1. Părțile convin un cuantum al chiriei lunare la nivelul sumei de {formData.rentAmount} euro {formData.vatIncluded === 'nu' ? '+ TVA' : 'TVA inclus'}. Plata chiriei se realizează în ziua de {formData.paymentDay} a fiecărei luni calendaristice pentru luna calendaristică următoare, în contul bancar al Proprietarului, indicat în preambulul prezentului contract. Plata se realizează în lei, la cursul de schimb euro/leu comunicat de BNR în ziua plății.
              </p>
              <p className="mb-4">
                2.2. În cazul în care data plății este o zi nebancară, plata se va realiza în prima zi bancară care urmează zilei de {formData.paymentDay}.
              </p>
              <p className="mb-4">
                2.3. Părțile convin că întârzierea la plată atrage aplicarea unor penalități în cuantum de {formData.lateFee}% pentru fiecare zi de întârziere.
              </p>
              <p className="mb-4">
                2.4. Prezentul contract se înregistrează, potrivit dispozițiilor legii în vigoare, la organele fiscale competente. Părțile cunosc că prezentul contract reprezintă titlu executoriu pentru plata chiriei la termenele stabilite prin prezentul contract, în conformitate cu prevederile art. 1798 Cod civil.
              </p>
              <p className="mb-4">
                2.5. Părțile convin că, la expirarea perioadei inițiale de {formData.contractDuration} luni, Proprietarul are dreptul de a ajusta valoarea chiriei în funcție de condițiile pieței imobiliare, rata inflației și/sau alte criterii economice relevante. Proprietarul va notifica Chiriașul în scris cu cel puțin 30 de zile înainte de expirarea perioadei inițiale, indicând noua valoare propusă a chiriei.
              </p>
              <p className="mb-4">
                2.6. Chiriei i se va aplica anual indicele de inflație al EURO, comunicat de EUROSTAT (Statistical Office of the European Communities), calculat pentru anul precedent. Proprietarul se obligă să notifice Chiriașul în scris cu privire la valoarea ajustată a chiriei cu cel puțin 30 de zile înainte de data de aplicare, aceasta devenind efectivă de la 1 ianuarie al fiecărui an.
              </p>
              <p className="mb-4">
                2.7. Dacă Chiriașul acceptă ajustarea, contractul se prelungește automat în noile condiții. Dacă Chiriașul nu este de acord, contractul încetează de drept la expirarea perioadei inițiale de {formData.contractDuration} luni, fără penalități pentru niciuna dintre părți.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4">3. DURATA CONTRACTULUI</h2>
              <p className="mb-4">
                3.1. Părțile convin că încheie prezentul contract pentru o perioadă inițială minimă de {formData.contractDuration} luni. Părțile convin că perioada inițială minimă este de esența contractului.
              </p>
              <p className="mb-4">
                3.2. Părțile convin că la expirarea perioadei inițiale minime, operează tacita relocațiune, adică prelungirea automată a perioadei contractuale, cu perioade succesive de câte {formData.renewalPeriod} luni.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4">4. ÎNCETAREA CONTRACTULUI</h2>
              <p className="mb-4">
                4.1. Părțile convin că denunțarea unilaterală a contractului se va realiza printr-o notificare scrisă comunicată celeilalte părți, prin e-mail, la adresele menționate în preambul. Locațiunea încetează în termen de {formData.unilateralNotice} de zile de la data comunicării.
              </p>
              <p className="mb-4">
                4.2. Părțile convin că rezilierea contractului se va realiza printr-o notificare scrisă comunicată celeilalte părți, prin e-mail, la adresele menționate în preambul. Locațiunea încetează în termen de {formData.terminationNotice} de zile de la data comunicării, dacă în acest interval partea aflată în culpă contractuală nu remediază problema ce determină rezilierea contractului.
              </p>
              <p className="mb-4">
                4.3. Părțile sunt de acord că dacă încetarea contractului intervine în perioada inițială de {formData.contractDuration} luni, din orice motiv, partea care denunță unilateral contractul sau cea din culpa căreia se solicită rezilierea contractului datorează celeilalte părți, cu titlu de daune-interese, o sumă egală cu {formData.earlyTerminationFee}.
              </p>
              <p className="mb-4">
                4.4. Prin excepție, în situația întârzierii la plata chiriei cu mai mult de 30 de zile, locațiunea încetează în termen de {formData.latePaymentTermination} de zile de la scadența neonorată.
              </p>
              <p className="mb-4">
                4.5. În ceea ce privește obligațiile de plată stabilite prin prezentul contract, părțile convin că se află de drept în întârziere.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4">5. OBLIGAȚIILE PROPRIETARULUI</h2>
              <p className="mb-4">
                5.1. Proprietarul se obligă să pună la dispoziția Chiriașului apartamentul în scopul utilizării acestuia ca locuință.
              </p>
              <p className="mb-4">
                5.2. Proprietarul este răspunzător și își asumă efectuarea oricăror reparații majore, care țin de structura de rezistență a apartamentului sau cele care devin necesare în vederea utilizării apartamentului în conformitate cu destinația sa.
              </p>
              <p className="mb-4">
                5.3. Proprietarul va informa Chiriașul și va transmite acestuia orice facturi emise de furnizorii de utilități, cu excepția celor care sunt comunicate la adresa poștală a apartamentului.
              </p>
              <p className="mb-4">
                5.4. Proprietarul va achita toate cheltuielile aferente întreținerii și utilităților pentru perioada anterioară predării apartamentului.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4">6. OBLIGAȚIILE CHIRIAȘULUI</h2>
              <p className="mb-4">
                6.1. Chiriașul este obligat să folosească apartamentul cu prudență și diligență, să se îngrijească de acesta și să se asigure că utilizează echipamentele și electrocasnicele care se regăsesc în apartament în conformitate cu manualul și instrucțiunile de utilizare puse la dispoziție de Proprietar.
              </p>
              <p className="mb-4">
                6.2. Chiriașul este răspunzător și își asumă pe deplin efectuarea oricăror reparații care țin de întreținerea curentă a apartamentului și a bunurilor din acesta. Pentru claritate, reparații ce țin de întreținerea curentă sunt, cu titlu exemplificativ: reparații necesare ca urmare a uzurii normale a lucrurilor (reparații minore de tâmplărie, reparația sau înlocuirea unor elemente precum prize, întrerupătoare, robineți, etc.).
              </p>
              <p className="mb-4">
                6.3. Orice reparații ce cad în sarcina Chiriașului se vor realiza doar cu instalatori/electricieni autorizați potrivit legii sau în cadrul unui service autorizat, după caz, pe bază de contract de prestări servicii și garanție pentru lucrările astfel efectuate.
              </p>
              <p className="mb-4">
                6.4. Chiriașul va notifica cu privire la orice defecțiuni sau reparații care sunt necesare și care cad în sarcina Proprietarului în cel mai scurt timp posibil, prin e-mail, astfel încât acestea să poată fi realizate în timp util. În ipoteza neîndeplinirii obligației de informare, reparațiile vor cădea în sarcina Chiriașului.
              </p>
              <p className="mb-4">
                6.5. Chiriașul nu va face modificări apartamentului închiriat fără acordul scris și prealabil al Proprietarului.
              </p>
              <p className="mb-4">
                6.6. Chiriașul își asumă plata tuturor facturilor de utilități, precum și efectuarea tuturor cheltuielilor ce țin de utilizarea apartamentului. În ipoteza neîndeplinirii la timp a obligațiilor de plată, Chiriașul este răspunzător și își asumă integral plata penalităților de întârziere și a eventualelor cheltuieli de recuperare a debitelor restante efectuate de furnizori, inclusiv cheltuieli de judecată, după caz.
              </p>
              <p className="mb-4">
                6.7. Chiriașul va permite Proprietarului să inspecteze apartamentul închiriat, la solicitarea acestuia din urmă, la o dată și oră stabilite de comun acord, în avans. Părțile convin că lipsa repetată a disponibilității Chiriașului pentru îndeplinirea acestei obligații poate constitui motiv pentru rezilierea contractului.
              </p>
              <p className="mb-4">
                6.8. Chiriașul nu are dreptul de schimba destinația apartamentului sau de a ceda folosința apartamentului, total sau parțial, cu titlu oneros sau gratuit, fără acordul prealabil scris al proprietarului.
              </p>
              <p className="mb-4">
                6.9. Chiriașul are obligația ca odată cu încetarea contratului, să înceteze orice contracte de prestări servicii încheiate în numele său care presupun prestarea serviciilor la adresa apartamentului închiriat.
              </p>
              <p className="mb-4">
                6.10. Chiriasul nu are voie sa introduca in locatie animale, animale de companie sau orice fel de vietuitoare fara acordul prealabil in scris al proprietarului.
              </p>
              <p className="mb-4">
                6.11. Chiriasul trebuie sa mentioneze la momentul semnarii contractului numarul exact de persoane care vor locui in imobil pe perioada inchirierii, acest lucru fiind necesar proprietarului pentru a-l declara la administratie.
              </p>
              <p className="mb-4">
                6.12. Chiriasul este de acord sa semneze AXENA 1 care cuprinde un inventar al lucrurilor/electrocasnicelor/bunurilor ce sunt
