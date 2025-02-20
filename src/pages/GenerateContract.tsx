import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

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

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};

    const isEmpty = (value: any) => {
      if (typeof value === 'number') return false;
      if (typeof value === 'string') return !value.trim();
      return !value;
    };

    if (isEmpty(contractNumber)) newErrors.contractNumber = true;
    if (isEmpty(validFrom)) newErrors.validFrom = true;

    if (isEmpty(ownerDetails.name)) newErrors.ownerName = true;
    if (isEmpty(ownerDetails.fiscal)) newErrors.ownerFiscal = true;
    if (isEmpty(ownerDetails.address)) newErrors.ownerAddress = true;

    if (isEmpty(tenantDetails.name)) newErrors.tenantName = true;
    if (isEmpty(tenantDetails.fiscal)) newErrors.tenantFiscal = true;
    if (isEmpty(tenantDetails.address)) newErrors.tenantAddress = true;

    if (isEmpty(propertyDetails.address)) newErrors.propertyAddress = true;
    if (isEmpty(propertyDetails.rentAmount)) newErrors.rentAmount = true;

    if (isEmpty(selectedTemplate)) newErrors.selectedTemplate = true;
    if (isEmpty(selectedProperty)) newErrors.selectedProperty = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateContract = async () => {
    console.log("Attempting to generate contract with values:", {
      contractNumber,
      selectedTemplate,
      selectedProperty,
      contractType,
      validFrom,
      ownerDetails,
      tenantDetails,
      propertyDetails
    });

    if (!validateForm()) {
      console.log("Validation failed. Errors:", errors);
      toast({
        title: "Error",
        description: "Te rugăm să completezi toate câmpurile obligatorii",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!selectedTemplate || !selectedProperty || !contractType || !validFrom) {
        toast({
          title: "Error",
          description: "Te rugăm să selectezi un șablon și o proprietate",
          variant: "destructive",
        });
        return;
      }

      const selectedTemplateData = templates?.find(t => t.id === selectedTemplate);
      
      if (!selectedTemplateData) {
        throw new Error("Template not found");
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not found");

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
        description: "A apărut o eroare la generarea contractului",
        variant: "destructive",
      });
    }
  };

  const createNewTemplate = async () => {
    try {
      const templateContent = {
        title: "CONTRACT DE ÎNCHIRIERE A LOCUINȚEI",
        sections: [
          {
            type: "header",
            content: "CONTRACT DE ÎNCHIRIERE A LOCUINȚEI"
          },
          {
            type: "contractNumber",
            content: "Nr. ${contractNumber}"
          },
          {
            type: "parties",
            title: "Părțile,",
            owner: "${ownerName}, Nr. ordine Reg. com./an: ${ownerReg}, Cod fiscal (C.U.I.): ${ownerFiscal}, cu sediul in ${ownerAddress}, Judetul: ${ownerCounty}, Localitatea: ${ownerCity}, cont bancar ${ownerBank}, deschis la ${ownerBankName}, reprezentat: ${ownerRepresentative}, e-mail: ${ownerEmail}, telefon: ${ownerPhone} în calitate de Proprietar",
            tenant: "${tenantName}, Nr. ordine Reg. com./an: ${tenantReg}, Cod fiscal (C.U.I.): ${tenantFiscal} cu domiciliul în ${tenantAddress}, Judetul: ${tenantCounty}, Localitatea: ${tenantCity}, cont bancar ${tenantBank}, deschis la ${tenantBankName}, reprezentat: ${tenantRepresentative}, e-mail: ${tenantEmail}, telefon: ${tenantPhone}, în calitate de Chiriaș"
          },
          {
            type: "agreement",
            content: "Au convenit încheierea prezentului contract de închiriere, în termenii și condițiile care urmează:"
          },
          {
            type: "propertyDetails",
            content: "Detalii proprietate:"
          },
          {
            type: "utilities",
            content: "Utilități:"
          },
          {
            type: "signatures",
            content: "Semnături:"
          }
        ],
        utilities: {
          waterCold: "${waterColdMeter}",
          waterHot: "${waterHotMeter}",
          electricity: "${electricityMeter}",
          gas: "${gasMeter}"
        },
        signatures: {
          owner: {
            date: "${ownerSignatureDate}",
            name: "${ownerSignatureName}"
          },
          tenant: {
            date: "${tenantSignatureDate}",
            name: "${tenantSignatureName}"
          }
        }
      };

      const { data, error } = await supabase
        .from('contract_templates')
        .insert({
          name: 'Contract de închiriere standard',
          category: 'lease',
          content: templateContent,
          is_active: true,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Template-ul a fost creat cu succes",
      });

      queryClient.invalidateQueries({ queryKey: ["contractTemplates"] });

    } catch (error) {
      console.error("Error creating template:", error);
      toast({
        title: "Error",
        description: "A apărut o eroare la crearea template-ului",
        variant: "destructive",
      });
    }
  };

  const inputClassName = (errorKey: string) =>
    `${errors[errorKey] ? "border-red-500 focus-visible:ring-red-500" : ""}`;

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
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/contracts")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contracts
          </Button>
          <Button onClick={createNewTemplate}>
            Creează Template Nou
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contract de Închiriere</CardTitle>
              <CardDescription>
                Completați detaliile contractului de închiriere
                {Object.keys(errors).length > 0 && (
                  <p className="text-red-500 mt-2">* Câmpurile marcate sunt obligatorii</p>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contract-template" className={errors.selectedTemplate ? "text-red-500" : ""}>
                    Șablon Contract *
                  </Label>
                  <Select
                    value={selectedTemplate}
                    onValueChange={(value) => setSelectedTemplate(value)}
                  >
                    <SelectTrigger className={inputClassName("selectedTemplate")}>
                      <SelectValue placeholder="Selectează șablon" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates?.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="property" className={errors.selectedProperty ? "text-red-500" : ""}>
                    Proprietate *
                  </Label>
                  <Select
                    value={selectedProperty}
                    onValueChange={(value) => setSelectedProperty(value)}
                  >
                    <SelectTrigger className={inputClassName("selectedProperty")}>
                      <SelectValue placeholder="Selectează proprietate" />
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
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Detalii Proprietar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="owner-name" className={errors.ownerName ? "text-red-500" : ""}>
                      Nume/Denumire *
                    </Label>
                    <Input
                      id="owner-name"
                      value={ownerDetails.name}
                      onChange={(e) => setOwnerDetails({...ownerDetails, name: e.target.value})}
                      className={inputClassName("ownerName")}
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
                  <div>
                    <Label htmlFor="owner-fiscal">Cod fiscal (C.U.I.)</Label>
                    <Input
                      id="owner-fiscal"
                      value={ownerDetails.fiscal}
                      onChange={(e) => setOwnerDetails({...ownerDetails, fiscal: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner-address">Sediul</Label>
                    <Input
                      id="owner-address"
                      value={ownerDetails.address}
                      onChange={(e) => setOwnerDetails({...ownerDetails, address: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner-county">Județ</Label>
                    <Input
                      id="owner-county"
                      value={ownerDetails.county}
                      onChange={(e) => setOwnerDetails({...ownerDetails, county: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner-city">Localitate</Label>
                    <Input
                      id="owner-city"
                      value={ownerDetails.city}
                      onChange={(e) => setOwnerDetails({...ownerDetails, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner-bank">Cont bancar</Label>
                    <Input
                      id="owner-bank"
                      value={ownerDetails.bank}
                      onChange={(e) => setOwnerDetails({...ownerDetails, bank: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner-bank-name">Deschis la</Label>
                    <Input
                      id="owner-bank-name"
                      value={ownerDetails.bankName}
                      onChange={(e) => setOwnerDetails({...ownerDetails, bankName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner-representative">Reprezentat prin</Label>
                    <Input
                      id="owner-representative"
                      value={ownerDetails.representative}
                      onChange={(e) => setOwnerDetails({...ownerDetails, representative: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner-email">Email</Label>
                    <Input
                      type="email"
                      id="owner-email"
                      value={ownerDetails.email}
                      onChange={(e) => setOwnerDetails({...ownerDetails, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner-phone">Telefon</Label>
                    <Input
                      type="tel"
                      id="owner-phone"
                      value={ownerDetails.phone}
                      onChange={(e) => setOwnerDetails({...ownerDetails, phone: e.target.value})}
                    />
                  </div>
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
                  <div>
                    <Label htmlFor="tenant-fiscal">Cod fiscal (C.U.I.)</Label>
                    <Input
                      id="tenant-fiscal"
                      value={tenantDetails.fiscal}
                      onChange={(e) => setTenantDetails({...tenantDetails, fiscal: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenant-address">Adresa</Label>
                    <Input
                      id="tenant-address"
                      value={tenantDetails.address}
                      onChange={(e) => setTenantDetails({...tenantDetails, address: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenant-county">Județ</Label>
                    <Input
                      id="tenant-county"
                      value={tenantDetails.county}
                      onChange={(e) => setTenantDetails({...tenantDetails, county: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenant-city">Localitate</Label>
                    <Input
                      id="tenant-city"
                      value={tenantDetails.city}
                      onChange={(e) => setTenantDetails({...tenantDetails, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenant-bank">Cont bancar</Label>
                    <Input
                      id="tenant-bank"
                      value={tenantDetails.bank}
                      onChange={(e) => setTenantDetails({...tenantDetails, bank: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenant-bank-name">Deschis la</Label>
                    <Input
                      id="tenant-bank-name"
                      value={tenantDetails.bankName}
                      onChange={(e) => setTenantDetails({...tenantDetails, bankName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenant-representative">Reprezentat prin</Label>
                    <Input
                      id="tenant-representative"
                      value={tenantDetails.representative}
                      onChange={(e) => setTenantDetails({...tenantDetails, representative: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenant-email">Email</Label>
                    <Input
                      type="email"
                      id="tenant-email"
                      value={tenantDetails.email}
                      onChange={(e) => setTenantDetails({...tenantDetails, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenant-phone">Telefon</Label>
                    <Input
                      type="tel"
                      id="tenant-phone"
                      value={tenantDetails.phone}
                      onChange={(e) => setTenantDetails({...tenantDetails, phone: e.target.value})}
                    />
                  </div>
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
                  <div>
                    <Label htmlFor="rent-amount">Cuantumul chiriei lunare (EUR)</Label>
                    <Input
                      type="number"
                      id="rent-amount"
                      value={propertyDetails.rentAmount}
                      onChange={(e) => setPropertyDetails({...propertyDetails, rentAmount: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vat-included">TVA inclus</Label>
                    <Select
                      value={propertyDetails.vatIncluded}
                      onValueChange={(value) => setPropertyDetails({...propertyDetails, vatIncluded: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selectați" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Da</SelectItem>
                        <SelectItem value="no">Nu (+ TVA)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment-day">Ziua de plată a chiriei</Label>
                    <Input
                      type="number"
                      id="payment-day"
                      min={1}
                      max={31}
                      value={propertyDetails.paymentDay}
                      onChange={(e) => setPropertyDetails({...propertyDetails, paymentDay: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="late-fee">Penalități întârziere (% pe zi)</Label>
                    <Input
                      type="number"
                      id="late-fee"
                      step="0.1"
                      value={propertyDetails.lateFee}
                      onChange={(e) => setPropertyDetails({...propertyDetails, lateFee: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contract-duration">Perioada inițială minimă (luni)</Label>
                    <Input
                      type="number"
                      id="contract-duration"
                      value={propertyDetails.contractDuration}
                      onChange={(e) => setPropertyDetails({...propertyDetails, contractDuration: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="auto-renewal">Prelungire automată</Label>
                    <Select
                      value={propertyDetails.autoRenewal}
                      onValueChange={(value) => setPropertyDetails({...propertyDetails, autoRenewal: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selectați" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Da</SelectItem>
                        <SelectItem value="no">Nu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="renewal-period">Perioada de prelungire (luni)</Label>
                    <Input
                      type="number"
                      id="renewal-period"
                      value={propertyDetails.renewalPeriod}
                      onChange={(e) => setPropertyDetails({...propertyDetails, renewalPeriod: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unilateral-notice">Termen notificare denunțare unilaterală (zile)</Label>
                    <Input
                      type="number"
                      id="unilateral-notice"
                      value={propertyDetails.unilateralNotice}
                      onChange={(e) => setPropertyDetails({...propertyDetails, unilateralNotice: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="termination-notice">Termen notificare reziliere (zile)</Label>
                    <Input
                      type="number"
                      id="termination-notice"
                      value={propertyDetails.terminationNotice}
                      onChange={(e) => setPropertyDetails({...propertyDetails, terminationNotice: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="early-termination-fee">Daune-interese pentru încetare anticipată</Label>
                    <Input
                      id="early-termination-fee"
                      value={propertyDetails.earlyTerminationFee}
                      onChange={(e) => setPropertyDetails({...propertyDetails, earlyTerminationFee: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="late-payment-termination">Încetare pentru neplată (zile)</Label>
                    <Input
                      type="number"
                      id="late-payment-termination"
                      value={propertyDetails.latePaymentTermination}
                      onChange={(e) => setPropertyDetails({...propertyDetails, latePaymentTermination: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="security-deposit">Valoarea garanției</Label>
                    <Input
                      id="security-deposit"
                      value={propertyDetails.securityDeposit}
                      onChange={(e) => setPropertyDetails({...propertyDetails, securityDeposit: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deposit-return-period">Perioada de returnare a garanției (luni)</Label>
                    <Input
                      type="number"
                      id="deposit-return-period"
                      value={propertyDetails.depositReturnPeriod}
                      onChange={(e) => setPropertyDetails({...propertyDetails, depositReturnPeriod: parseInt(e.target.value)})}
                    />
                  </div>
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
                  <div>
                    <Label htmlFor="water-hot">Apă caldă</Label>
                    <Input
                      id="water-hot"
                      value={utilities.waterHot}
                      onChange={(e) => setUtilities({...utilities, waterHot: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="electricity">Curent electric</Label>
                    <Input
                      id="electricity"
                      value={utilities.electricity}
                      onChange={(e) => setUtilities({...utilities, electricity: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gas">Gaze naturale</Label>
                    <Input
                      id="gas"
                      value={utilities.gas}
                      onChange={(e) => setUtilities({...utilities, gas: e.target.value})}
                    />
                  </div>
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

              <Button 
                className="w-full" 
                onClick={handleGenerateContract}
                disabled={Object.keys(errors).length > 0}
              >
                Generează Contract
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
