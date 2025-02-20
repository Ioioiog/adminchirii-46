import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface Asset {
  name: string;
  value: string;
  condition: string;
}

export default function RentalContract() {
  const [assets, setAssets] = useState<Asset[]>([{
    name: '',
    value: '',
    condition: ''
  }]);

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
    <div className="max-w-4xl mx-auto p-6">
      <div className="edit-form">
        <h1 className="text-3xl font-bold text-center mb-8">CONTRACT DE ÎNCHIRIERE A LOCUINȚEI</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Contract Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contract-number">Nr. contract:</Label>
              <Input type="text" id="contract-number" defaultValue="1/26.01.2025" />
            </div>
            <div>
              <Label htmlFor="contract-date">Data:</Label>
              <Input type="date" id="contract-date" defaultValue="2025-01-26" />
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
              <Input type="text" id="owner-name" defaultValue="Various" />
            </div>
            <div>
              <Label htmlFor="owner-reg">Nr. ordine Reg. com./an:</Label>
              <Input type="text" id="owner-reg" defaultValue="J40/21592/2022" />
            </div>
            <div>
              <Label htmlFor="owner-fiscal">Cod fiscal (C.U.I.):</Label>
              <Input type="text" id="owner-fiscal" defaultValue="32586251" />
            </div>
            <div>
              <Label htmlFor="owner-address">Sediul:</Label>
              <Input type="text" id="owner-address" defaultValue="Șoseaua Fabrica de Glucoză, 6-8 Bloc 6b Ap 109 Et 10" />
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
              <Input type="text" id="tenant-name" defaultValue="NOT FOR THE FAKE S.R.L." />
            </div>
            <div>
              <Label htmlFor="tenant-reg">Nr. ordine Reg. com./an:</Label>
              <Input type="text" id="tenant-reg" defaultValue="J12/592/17.02.2020" />
            </div>
            <div>
              <Label htmlFor="tenant-fiscal">Cod fiscal (C.U.I.):</Label>
              <Input type="text" id="tenant-fiscal" defaultValue="RO43247471" />
            </div>
            <div>
              <Label htmlFor="tenant-address">Adresa:</Label>
              <Input type="text" id="tenant-address" defaultValue="Strada Dorobantilor nr 99 sc 9b bl 1 et 7 ap 38" />
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
                defaultValue="București, Fabrica de Glucoza, nr 6-8, bloc 4b, etaj 5, ap 26, sector 2" 
              />
            </div>
            <div>
              <Label htmlFor="rent-amount">Chirie lunară (EUR):</Label>
              <Input type="number" id="rent-amount" defaultValue="1100" />
            </div>
            <div>
              <Label htmlFor="vat-included">TVA inclus:</Label>
              <Select defaultValue="nu">
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

        <div className="grid grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>PROPRIETAR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="owner-signature-date">Data:</Label>
                <Input type="date" id="owner-signature-date" defaultValue="2025-01-26" />
              </div>
              <div>
                <Label htmlFor="owner-signature-name">Nume în clar:</Label>
                <Input type="text" id="owner-signature-name" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CHIRIAȘ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tenant-signature-date">Data:</Label>
                <Input type="date" id="tenant-signature-date" defaultValue="2025-01-26" />
              </div>
              <div>
                <Label htmlFor="tenant-signature-name">Nume în clar:</Label>
                <Input type="text" id="tenant-signature-name" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Button 
          onClick={handlePrint}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
        >
          Printează Contractul
        </Button>
      </div>
    </div>
  );
}
