
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLayout } from "@/components/layout/PageLayout";
import { format } from "date-fns";
import { Json } from "@/integrations/supabase/types/json";

interface ContractTemplate {
  id: string;
  name: string;
  category: string;
  content: Json;
}

interface Property {
  id: string;
  name: string;
  address: string;
}

interface Asset {
  name: string;
  value: number;
  condition: string;
}

export default function GenerateContract() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [contractType, setContractType] = useState<string>("lease");
  const [validFrom, setValidFrom] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [validUntil, setValidUntil] = useState<string>("");
  const [contractNumber, setContractNumber] = useState<string>(`1/${format(new Date(), "dd.MM.yyyy")}`);
  const [ownerDetails, setOwnerDetails] = useState({
    name: "",
    reg: "",
    fiscal: "",
    address: "",
    county: "",
    city: "",
    bank: "",
    bankName: "",
    representative: "",
    email: "",
    phone: ""
  });
  const [tenantDetails, setTenantDetails] = useState({
    name: "",
    reg: "",
    fiscal: "",
    address: "",
    county: "",
    city: "",
    bank: "",
    bankName: "",
    representative: "",
    email: "",
    phone: ""
  });
  const [propertyDetails, setPropertyDetails] = useState({
    address: "",
    rooms: 2,
    rentAmount: 0,
    vatIncluded: "no",
    paymentDay: 1,
    lateFee: 0.1,
    contractDuration: 12,
    autoRenewal: "yes",
    renewalPeriod: 12,
    unilateralNotice: 90,
    terminationNotice: 30,
    earlyTerminationFee: "contravaloarea unei chirii lunare",
    latePaymentTermination: 40,
    securityDeposit: "contravaloarea unei chirii lunare",
    depositReturnPeriod: 3
  });
  const [utilities, setUtilities] = useState({
    waterCold: "",
    waterHot: "",
    electricity: "",
    gas: ""
  });
  const [assets, setAssets] = useState<Asset[]>([
    { name: "", value: 0, condition: "" }
  ]);

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["contractTemplates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      return data as ContractTemplate[];
    },
  });

  const { data: properties, isLoading: isLoadingProperties } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name, address");

      if (error) throw error;
      return data as Property[];
    },
  });

  const addAssetRow = () => {
    setAssets([...assets, { name: "", value: 0, condition: "" }]);
  };

  const removeAssetRow = (index: number) => {
    const newAssets = assets.filter((_, i) => i !== index);
    setAssets(newAssets);
  };

  const updateAsset = (index: number, field: keyof Asset, value: string | number) => {
    const newAssets = [...assets];
    newAssets[index] = {
      ...newAssets[index],
      [field]: value
    };
    setAssets(newAssets);
  };

  const handleGenerateContract = async () => {
    try {
      if (!selectedTemplate || !selectedProperty || !contractType || !validFrom) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const selectedTemplateData = templates?.find(t => t.id === selectedTemplate);
      
      if (!selectedTemplateData) {
        throw new Error("Template not found");
      }

      // Get current user's ID for landlord_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not found");

      // Create contract content
      const contractContent = {
        contractNumber,
        ownerDetails,
        tenantDetails,
        propertyDetails,
        utilities,
        assets,
        validFrom,
        validUntil,
        baseTemplate: selectedTemplateData.content
      };

      // Create contract with the correct types
      const { data, error } = await supabase
        .from("contracts")
        .insert({
          property_id: selectedProperty,
          landlord_id: user.id,
          contract_type: contractType,
          valid_from: validFrom,
          valid_until: validUntil || null,
          status: "draft",
          content: contractContent as Json,
          template_id: selectedTemplate,
          metadata: {} as Json
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contract generated successfully",
      });

      navigate(`/contracts/${data.id}`);
    } catch (error) {
      console.error("Error generating contract:", error);
      toast({
        title: "Error",
        description: "Failed to generate contract",
        variant: "destructive",
      });
    }
  };

  if (isLoadingTemplates || isLoadingProperties) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-lg">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto py-8 space-y-6">
        <Button variant="ghost" onClick={() => navigate("/contracts")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Contracts
        </Button>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contract de Închiriere</CardTitle>
              <CardDescription>
                Completați detaliile contractului de închiriere
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contract-number">Nr. contract</Label>
                  <Input
                    id="contract-number"
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="contract-date">Data contract</Label>
                  <Input
                    type="date"
                    id="contract-date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Detalii Proprietar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="owner-name">Nume/Denumire</Label>
                    <Input
                      id="owner-name"
                      value={ownerDetails.name}
                      onChange={(e) => setOwnerDetails({...ownerDetails, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner-reg">Nr. Reg. Com.</Label>
                    <Input
                      id="owner-reg"
                      value={ownerDetails.reg}
                      onChange={(e) => setOwnerDetails({...ownerDetails, reg: e.target.value})}
                    />
                  </div>
                  {/* ... Add more owner fields similarly */}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Detalii Chiriaș</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tenant-name">Nume/Denumire</Label>
                    <Input
                      id="tenant-name"
                      value={tenantDetails.name}
                      onChange={(e) => setTenantDetails({...tenantDetails, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenant-reg">Nr. Reg. Com.</Label>
                    <Input
                      id="tenant-reg"
                      value={tenantDetails.reg}
                      onChange={(e) => setTenantDetails({...tenantDetails, reg: e.target.value})}
                    />
                  </div>
                  {/* ... Add more tenant fields similarly */}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Detalii Proprietate și Condiții Contract</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="property-address">Adresa</Label>
                    <Input
                      id="property-address"
                      value={propertyDetails.address}
                      onChange={(e) => setPropertyDetails({...propertyDetails, address: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rooms">Număr camere</Label>
                    <Input
                      type="number"
                      id="rooms"
                      value={propertyDetails.rooms}
                      onChange={(e) => setPropertyDetails({...propertyDetails, rooms: parseInt(e.target.value)})}
                    />
                  </div>
                  {/* ... Add more property fields similarly */}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Utilități</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="water-cold">Apă rece</Label>
                    <Input
                      id="water-cold"
                      value={utilities.waterCold}
                      onChange={(e) => setUtilities({...utilities, waterCold: e.target.value})}
                    />
                  </div>
                  {/* ... Add more utility fields similarly */}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Bunuri mobile/electrocasnice</h3>
                {assets.map((asset, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <Label>Denumire bun</Label>
                      <Input
                        value={asset.name}
                        onChange={(e) => updateAsset(index, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Valoare (lei)</Label>
                      <Input
                        type="number"
                        value={asset.value}
                        onChange={(e) => updateAsset(index, "value", parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Stare</Label>
                      <Input
                        value={asset.condition}
                        onChange={(e) => updateAsset(index, "condition", e.target.value)}
                      />
                    </div>
                    <Button 
                      variant="destructive"
                      onClick={() => removeAssetRow(index)}
                      className="mt-2"
                    >
                      Șterge
                    </Button>
                  </div>
                ))}
                <Button onClick={addAssetRow} variant="outline">
                  Adaugă bun
                </Button>
              </div>

              <Button className="w-full" onClick={handleGenerateContract}>
                Generează Contract
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
