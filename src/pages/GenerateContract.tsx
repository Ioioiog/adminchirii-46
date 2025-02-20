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

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      {/* Sidebar - Only visible when not printing */}
      <div className="print:hidden">
        <DashboardSidebar />
      </div>

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
              <p className="mb-4">Nr. {formData.contractNumber}</p>
              <p className="mb-4">Data: {formData.contractDate}</p>
              
              <h2 className="text-xl font-bold mb-4">I. PĂRȚILE CONTRACTANTE</h2>
              
              <p className="mb-4">
                {formData.ownerName}, cu sediul in {formData.ownerAddress}, înregistrată la Registrul Comerțului sub nr. {formData.ownerReg}, 
                având codul fiscal {formData.ownerFiscal}, cont bancar {formData.ownerBank} deschis la {formData.ownerBankName}, 
                reprezentată prin {formData.ownerEmail}, telefon {formData.ownerPhone}, în calitate de PROPRIETAR
              </p>
              
              <p className="mb-4">și</p>
              
              <p className="mb-8">
                {formData.tenantName}, cu sediul în {formData.tenantAddress}, înregistrată la Registrul Comerțului sub nr. {formData.tenantReg}, 
                având codul fiscal {formData.tenantFiscal}, cont bancar {formData.tenantBank} deschis la {formData.tenantBankName}, 
                reprezentată prin {formData.tenantEmail}, telefon {formData.tenantPhone}, în calitate de CHIRIAȘ
              </p>

              <h2 className="text-xl font-bold mb-4">II. OBIECTUL CONTRACTULUI</h2>
              <p className="mb-8">
                Proprietarul închiriază, iar chiriașul ia în chirie imobilul situat în {formData.propertyAddress}, în schimbul unei chirii lunare de {formData.rentAmount} EUR ({formData.vatIncluded === "nu" ? "+ TVA" : "TVA inclus"}).
              </p>

              <h2 className="text-xl font-bold mb-4">III. DURATA CONTRACTULUI</h2>
              <p className="mb-8">
                Durata contractului este de {formData.contractDuration} luni, începând cu data de {formData.startDate}.
              </p>

              <h2 className="text-xl font-bold mb-4">IV. PLATA CHIRIEI</h2>
              <p className="mb-8">
                Chiria se va plăti lunar, până în ziua {formData.paymentDay} a fiecărei luni, pentru luna în curs.
              </p>

              <h2 className="text-xl font-bold mb-4">V. INVENTARUL BUNURILOR</h2>
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
                    {assets.map((asset, index) => (
                      <tr key={index}>
                        <td className="border p-2">{asset.name}</td>
                        <td className="border p-2">{asset.value}</td>
                        <td className="border p-2">{asset.condition}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 className="text-xl font-bold mb-4">6. OBLIGAȚIILE CHIRIAȘULUI</h2>
              <p className="mb-4">6.1. Chiriașul este obligat să folosească apartamentul cu prudență și diligență, să se îngrijească de acesta și să se asigure că utilizează echipamentele și electrocasnicele care se regăsesc în apartament în conformitate cu manualul și instrucțiunile de utilizare puse la dispoziție de Proprietar.</p>
              <p className="mb-4">6.2. Chiriașul este răspunzător și își asumă pe deplin efectuarea oricăror reparații care țin de întreținerea curentă a apartamentului și a bunurilor din acesta.</p>
              <p className="mb-4">6.3. Orice reparații ce cad în sarcina Chiriașului se vor realiza doar cu instalatori/electricieni autorizați potrivit legii.</p>
              
              <h2 className="text-xl font-bold mb-4">7. GARANȚIA</h2>
              <p className="mb-4">7.1. Chiriașul este de acord să ofere, cu titlu de garanție, {formData.securityDeposit}.</p>
              <p className="mb-4">7.2. Părțile convin că suma constituită cu titlu de garanție se returnează Chiriașului după încetarea contractului, după expirarea unui termen de {formData.depositReturnPeriod} luni.</p>

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
                      <td className="border p-2">{formData.waterColdMeter}</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Apă caldă</td>
                      <td className="border p-2">{formData.waterHotMeter}</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Curent electric</td>
                      <td className="border p-2">{formData.electricityMeter}</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Gaze naturale</td>
                      <td className="border p-2">{formData.gasMeter}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-8 mt-16 print:break-before-page">
                <div>
                  <p className="font-bold mb-2">PROPRIETAR,</p>
                  <p className="mb-2">Data: {formData.ownerSignatureDate}</p>
                  <p className="mb-2">Nume în clar și semnătura:</p>
                  <p>{formData.ownerSignatureName || "___________________________"}</p>
                </div>
                <div>
                  <p className="font-bold mb-2">CHIRIAȘ,</p>
                  <p className="mb-2">Data: {formData.tenantSignatureDate}</p>
                  <p className="mb-2">Nume în clar și semnătura:</p>
                  <p>{formData.tenantSignatureName || "___________________________"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
