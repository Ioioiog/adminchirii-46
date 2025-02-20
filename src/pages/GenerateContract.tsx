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
  assets: Asset[];
}

export default function GenerateContract() {
  const [assets, setAssets] = useState<Asset[]>([{
    name: '',
    value: '',
    condition: ''
  }]);

  const [formData, setFormData] = useState<FormData>({
    contractNumber: '1/01.01.2025',
    contractDate: '2025-01-01',
    ownerName: 'xxxx srl',
    ownerReg: 'Jxx/0000/0000',
    ownerFiscal: '000000',
    ownerAddress: 'Șoseaua ....., nr...., Bloc ..., Ap .... Et ....',
    ownerBank: 'RO00BREL0000000000000100',
    ownerBankName: 'BANK S.A.',
    ownerEmail: 'xxxxx@xxxx.com',
    ownerPhone: '0700000000',
    tenantName: 'xxxx srl',
    tenantReg: 'J00/0000/0000',
    tenantFiscal: 'RO00000',
    tenantAddress: 'Șoseaua ....., nr...., Bloc ..., Ap .... Et ....',
    tenantBank: 'RO78BTRL00000000000',
    tenantBankName: 'Banca Transilvania',
    tenantEmail: 'xxxxxx@gmail.com',
    tenantPhone: '07000000',
    propertyAddress: 'București, Fabrica de Glucoza, nr 6-8, bloc 4b, etaj 5, ap 26, sector 2',
    rentAmount: '1100',
    vatIncluded: 'nu',
    contractDuration: '12',
    paymentDay: '2',
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
    tenantSignatureName: '',
    assets: []
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addAssetRow = () => {
    const newAsset = { name: '', value: '', condition: '' };
    setAssets(prev => [...prev, newAsset]);
    setFormData(prev => ({
      ...prev,
      assets: [...prev.assets, newAsset]
    }));
  };

  const deleteAssetRow = (index: number) => {
    setAssets(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      assets: prev.assets.filter((_, i) => i !== index)
    }));
  };

  const handleAssetChange = (index: number, field: keyof Asset, value: string) => {
    const newAssets = [...assets];
    newAssets[index][field] = value;
    setAssets(newAssets);
    setFormData(prev => ({
      ...prev,
      assets: newAssets
    }));
  };

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <div className="print:hidden">
        <DashboardSidebar />
      </div>

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

          <div className="hidden print:block print:p-8">
            <div className="text-black">
              <h1 className="text-3xl font-bold text-center mb-8">CONTRACT DE ÎNCHIRIERE A LOCUINȚEI</h1>
              <p className="mb-4">Nr. {formData.contractNumber || '_____'}/{formData.contractDate || '_____'}</p>

              <p className="mb-8 font-bold">Părțile,</p>

              <div className="mb-8">
                <p className="mb-4">{formData.ownerName || '_____'}, Nr. ordine Reg. com./an: {formData.ownerReg || '_____'}, 
                Cod fiscal (C.U.I.): {formData.ownerFiscal || '_____'}, cu sediul in {formData.ownerAddress || '_____'}, 
                cont bancar {formData.ownerBank || '_____'}, deschis la {formData.ownerBankName || '_____'}, 
                reprezentat: {formData.ownerRepresentative || '_____'}, e-mail: {formData.ownerEmail || '_____'}, 
                telefon: {formData.ownerPhone || '_____'} în calitate de PROPRIETAR,</p>
                
                <p className="mb-4">și</p>

                <p className="mb-4">{formData.tenantName || '_____'}, Nr. ordine Reg. com./an: {formData.tenantReg || '_____'}, 
                Cod fiscal (C.U.I.): {formData.tenantFiscal || '_____'}, cu domiciliul în {formData.tenantAddress || '_____'}, 
                cont bancar {formData.tenantBank || '_____'}, deschis la {formData.tenantBankName || '_____'}, 
                reprezentat: {formData.tenantRepresentative || '_____'}, e-mail: {formData.tenantEmail || '_____'}, 
                telefon: {formData.tenantPhone || '_____'} în calitate de CHIRIAȘ,</p>
              </div>

              <p className="mb-8">Au convenit încheierea prezentului contract de închiriere, în termenii și condițiile care urmează:</p>

              <h2 className="text-xl font-bold mb-4">1. OBIECTUL CONTRACTULUI</h2>
              <div className="mb-8">
                <p>1.1. Obiectul prezentului contract este închirierea apartamentului situat în {formData.propertyAddress || '_____'}, 
                compus din {formData.propertyRooms || '_____'} camere, cu destinația de locuință. Chiriașul va utiliza apartamentul 
                începând cu data de {formData.startDate || '_____'} ca locuință pentru familia sa.</p>
              </div>

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

              <h2 className="text-xl font-bold mb-4">3. DURATA CONTRACTULUI</h2>
              <div className="mb-8">
                <p className="mb-4">3.1. Părțile convin că încheie prezentul contract pentru o perioadă inițială minimă de {formData.contractDuration || '_____'} 
                luni. Părțile convin că perioada inițială minimă este de esența contractului.</p>

                <p className="mb-4">3.2. La expirarea perioadei inițiale minime, operează tacita relocațiune, adică prelungirea automată a perioadei 
                contractuale, cu perioade succesive de câte 12 luni.</p>
              </div>

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

              <h2 className="text-xl font-bold mb-4">7. GARANȚIA</h2>
              <div className="mb-8">
                <p className="mb-4">7.1. Chiriașul este de acord să ofere, cu titlu de garanție, suma de {formData.securityDeposit || '_____'}.</p>

                <p className="mb-4">7.2. Părțile convin că suma constituită cu titlu de garanție se returnează Chiriașului după încetarea contractului, 
                după expirarea unui termen de {formData.depositReturnPeriod || '_____'} luni.</p>

                <p className="mb-4">7.3. Proprietarul are dreptul să rețină din garanție sumele necesare pentru acoperirea daunelor sau utilităților 
                neplătite.</p>

                <p className="mb-4">7.4. Evaluarea prejudiciilor va fi realizată pe baza unui proces-verbal semnat de ambele părți.</p>
              </div>

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

              <h2 className="text-xl font-bold mb-4">9. CLAUZE FINALE</h2>
              <div className="mb-8">
                <p className="mb-4">9.1. Orice comunicare se va realiza în scris, prin e-mail, la adresele menționate în preambul.</p>

                <p className="mb-4">9.2. Orice diferende între Părți care nu pot fi rezolvate pe cale amiabilă vor fi deferite instanțelor 
                judecătorești competente de pe raza Municipiului București.</p>
              </div>

              <p className="mb-8">Prezentul contract a fost încheiat astăzi, {formData.contractDate || '_____'}, în trei exemplare originale, 
              câte unul pentru fiecare parte și unul pentru autoritatea fiscală.</p>

              <div className="grid grid-cols-2 gap-8 mt-16">
                <div>
                  <p className="font-bold mb-2">PROPRIETAR,</p>
                  <p className="mb-2">Data: {formData.ownerSignatureDate || '_____'}</p>
                  <p className="mb-2">Nume în clar și semnătură:</p>
                  <p>{formData.ownerSignatureName || '___________________________'}</p>
                </div>
                <div>
                  <p className="font-bold mb-2">CHIRIAȘ,</p>
                  <p className="mb-2">Data: {formData.tenantSignatureDate || '_____'}</p>
                  <p className="mb-2">Nume în clar și semnătură:</p>
                  <p>{formData.tenantSignatureName || '___________________________'}</p>
                </div>
              </div>

              <h2 className="text-xl font-bold mt-8 mb-4">ANEXA 1 - INVENTARUL BUNURILOR</h2>
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
                    {formData.assets.map((asset, index) => (
                      <tr key={index}>
                        <td className="border p-2">{asset.name}</td>
                        <td className="border p-2">{asset.value}</td>
                        <td className="border p-2">{asset.condition}</td>
                      </tr>
                    ))}
                    {!(formData.assets || []).length && (
                      <tr>
                        <td className="border p-2">_____</td>
                        <td className="border p-2">_____</td>
                        <td className="border p-2">_____</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
