import { FormData, Asset } from "@/types/contract";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Json } from "@/integrations/supabase/types/json";
import { useProperties } from "@/hooks/useProperties";
import { useUserRole } from "@/hooks/use-user-role";

interface ContractFormProps {
  formData: FormData;
  assets: Asset[];
  onInputChange: (field: keyof FormData, value: string) => void;
  onAssetChange: (index: number, field: keyof Asset, value: string) => void;
  onAddAsset: () => void;
  onDeleteAsset: (index: number) => void;
}

export function ContractForm({
  formData,
  assets,
  onInputChange,
  onAssetChange,
  onAddAsset,
  onDeleteAsset
}: ContractFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const { properties, isLoading: isLoadingProperties } = useProperties({ userRole: "landlord" });

  const handlePropertySelect = (propertyId: string) => {
    const selectedProperty = properties.find(p => p.id === propertyId);
    if (selectedProperty) {
      onInputChange('propertyAddress', selectedProperty.address);
    }
  };

  const handleSaveContract = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save a contract",
        variant: "destructive"
      });
      return;
    }

    try {
      const metadataJson: Json = {
        ...formData,
        assets: assets.map(asset => ({
          name: asset.name,
          value: asset.value,
          condition: asset.condition
        }))
      };

      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .insert({
          name: formData.propertyAddress,
          address: formData.propertyAddress,
          landlord_id: user.id,
          monthly_rent: parseFloat(formData.rentAmount) || 0
        })
        .select()
        .single();

      if (propertyError) throw propertyError;

      const { data, error } = await supabase
        .from('contracts')
        .insert({
          contract_type: 'lease',
          status: 'draft',
          landlord_id: user.id,
          property_id: propertyData.id,
          content: {} as Json,
          metadata: metadataJson,
          valid_from: formData.startDate || null,
          valid_until: formData.startDate ? 
            new Date(new Date(formData.startDate).setMonth(
              new Date(formData.startDate).getMonth() + 
              parseInt(formData.contractDuration || '0')
            )).toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contract has been saved successfully",
      });

      navigate(`/documents/contracts/${data.id}`);
    } catch (error) {
      console.error('Error saving contract:', error);
      toast({
        title: "Error",
        description: "Failed to save the contract. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
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
              onChange={(e) => onInputChange('contractNumber', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="contract-date">Data:</Label>
            <Input 
              type="date" 
              id="contract-date" 
              value={formData.contractDate}
              onChange={(e) => onInputChange('contractDate', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="contract-duration">Durata (luni):</Label>
            <Input 
              type="number" 
              id="contract-duration" 
              value={formData.contractDuration}
              onChange={(e) => onInputChange('contractDuration', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="payment-day">Ziua de plată:</Label>
            <Input 
              type="number" 
              id="payment-day" 
              value={formData.paymentDay}
              onChange={(e) => onInputChange('paymentDay', e.target.value)}
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
              onChange={(e) => onInputChange('ownerName', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="owner-reg">Nr. ordine Reg. com./an:</Label>
            <Input 
              type="text" 
              id="owner-reg" 
              value={formData.ownerReg}
              onChange={(e) => onInputChange('ownerReg', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="owner-fiscal">Cod fiscal (C.U.I.):</Label>
            <Input 
              type="text" 
              id="owner-fiscal" 
              value={formData.ownerFiscal}
              onChange={(e) => onInputChange('ownerFiscal', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="owner-address">Sediul:</Label>
            <Input 
              type="text" 
              id="owner-address" 
              value={formData.ownerAddress}
              onChange={(e) => onInputChange('ownerAddress', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="owner-bank">Cont bancar:</Label>
            <Input 
              type="text" 
              id="owner-bank" 
              value={formData.ownerBank}
              onChange={(e) => onInputChange('ownerBank', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="owner-bank-name">Banca:</Label>
            <Input 
              type="text" 
              id="owner-bank-name" 
              value={formData.ownerBankName}
              onChange={(e) => onInputChange('ownerBankName', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="owner-email">Email:</Label>
            <Input 
              type="email" 
              id="owner-email" 
              value={formData.ownerEmail}
              onChange={(e) => onInputChange('ownerEmail', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="owner-phone">Telefon:</Label>
            <Input 
              type="tel" 
              id="owner-phone" 
              value={formData.ownerPhone}
              onChange={(e) => onInputChange('ownerPhone', e.target.value)}
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
              onChange={(e) => onInputChange('tenantName', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="tenant-reg">Nr. ordine Reg. com./an:</Label>
            <Input 
              type="text" 
              id="tenant-reg" 
              value={formData.tenantReg}
              onChange={(e) => onInputChange('tenantReg', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="tenant-fiscal">Cod fiscal (C.U.I.):</Label>
            <Input 
              type="text" 
              id="tenant-fiscal" 
              value={formData.tenantFiscal}
              onChange={(e) => onInputChange('tenantFiscal', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="tenant-address">Adresa:</Label>
            <Input 
              type="text" 
              id="tenant-address" 
              value={formData.tenantAddress}
              onChange={(e) => onInputChange('tenantAddress', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="tenant-bank">Cont bancar:</Label>
            <Input 
              type="text" 
              id="tenant-bank" 
              value={formData.tenantBank}
              onChange={(e) => onInputChange('tenantBank', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="tenant-bank-name">Banca:</Label>
            <Input 
              type="text" 
              id="tenant-bank-name" 
              value={formData.tenantBankName}
              onChange={(e) => onInputChange('tenantBankName', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="tenant-email">Email:</Label>
            <Input 
              type="email" 
              id="tenant-email" 
              value={formData.tenantEmail}
              onChange={(e) => onInputChange('tenantEmail', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="tenant-phone">Telefon:</Label>
            <Input 
              type="tel" 
              id="tenant-phone" 
              value={formData.tenantPhone}
              onChange={(e) => onInputChange('tenantPhone', e.target.value)}
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
            <Label htmlFor="property-select">Select Property</Label>
            <Select onValueChange={handlePropertySelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties?.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="property-address">Adresa apartamentului:</Label>
            <Input 
              type="text" 
              id="property-address" 
              value={formData.propertyAddress}
              onChange={(e) => onInputChange('propertyAddress', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="rent-amount">Chirie lunară (EUR):</Label>
            <Input 
              type="number" 
              id="rent-amount" 
              value={formData.rentAmount}
              onChange={(e) => onInputChange('rentAmount', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="vat-included">TVA inclus:</Label>
            <Select 
              value={formData.vatIncluded}
              onValueChange={(value) => onInputChange('vatIncluded', value)}
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
                        onChange={(e) => onAssetChange(index, 'name', e.target.value)}
                      />
                    </td>
                    <td className="border p-2">
                      <Input
                        type="text"
                        value={asset.value}
                        onChange={(e) => onAssetChange(index, 'value', e.target.value)}
                      />
                    </td>
                    <td className="border p-2">
                      <Input
                        type="text"
                        value={asset.condition}
                        onChange={(e) => onAssetChange(index, 'condition', e.target.value)}
                      />
                    </td>
                    <td className="border p-2">
                      <Button 
                        variant="destructive" 
                        onClick={() => onDeleteAsset(index)}
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
          <Button onClick={onAddAsset} className="mt-4">
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
              value={formData.roomCount}
              onChange={(e) => onInputChange('roomCount', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="startDate">Data începerii:</Label>
            <Input 
              type="date" 
              id="startDate" 
              value={formData.startDate}
              onChange={(e) => onInputChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="lateFee">Penalități întârziere (%):</Label>
            <Input 
              type="number" 
              id="lateFee" 
              value={formData.lateFee}
              onChange={(e) => onInputChange('lateFee', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="securityDeposit">Garanție:</Label>
            <Input 
              type="text" 
              id="securityDeposit" 
              value={formData.securityDeposit}
              onChange={(e) => onInputChange('securityDeposit', e.target.value)}
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
              onChange={(e) => onInputChange('waterColdMeter', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="waterHotMeter">Apă caldă:</Label>
            <Input 
              type="text" 
              id="waterHotMeter" 
              value={formData.waterHotMeter}
              onChange={(e) => onInputChange('waterHotMeter', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="electricityMeter">Curent electric:</Label>
            <Input 
              type="text" 
              id="electricityMeter" 
              value={formData.electricityMeter}
              onChange={(e) => onInputChange('electricityMeter', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="gasMeter">Gaze naturale:</Label>
            <Input 
              type="text" 
              id="gasMeter" 
              value={formData.gasMeter}
              onChange={(e) => onInputChange('gasMeter', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 mt-6">
        <Button 
          onClick={() => window.print()}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
        >
          Printează Contractul
        </Button>
        <Button 
          onClick={handleSaveContract}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
        >
          Salvează Contractul
        </Button>
      </div>
    </div>
  );
}
