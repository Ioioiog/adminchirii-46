
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageLayout } from "@/components/layout/PageLayout";
import { format } from "date-fns";
import { Json } from "@/integrations/supabase/types/json";

interface Property {
  id: string;
  name: string;
  address: string;
}

export default function GenerateContract() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contractNumber, setContractNumber] = useState<string>(`1/${format(new Date(), "dd.MM.yyyy")}`);
  const [validFrom, setValidFrom] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [validUntil, setValidUntil] = useState<string>("");
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
    paymentDay: 1,
    lateFee: 0.1,
    contractDuration: 12,
    securityDeposit: "contravaloarea unei chirii lunare",
    depositReturnPeriod: 3
  });

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateContract = async () => {
    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Te rugăm să completezi toate câmpurile obligatorii",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not found");

      const contractContent = {
        contractNumber,
        ownerDetails,
        tenantDetails,
        propertyDetails,
        validFrom,
        validUntil
      };

      const { data, error } = await supabase
        .from("contracts")
        .insert({
          contract_type: "lease",
          valid_from: validFrom,
          valid_until: validUntil || null,
          status: "draft",
          content: contractContent as Json,
          landlord_id: user.id,
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

  const inputClassName = (errorKey: string) =>
    `${errors[errorKey] ? "border-red-500 focus-visible:ring-red-500" : ""}`;

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
                {Object.keys(errors).length > 0 && (
                  <p className="text-red-500 mt-2">* Câmpurile marcate sunt obligatorii</p>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contract-number" className={errors.contractNumber ? "text-red-500" : ""}>
                    Nr. contract *
                  </Label>
                  <Input
                    id="contract-number"
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    className={inputClassName("contractNumber")}
                  />
                </div>
                <div>
                  <Label htmlFor="valid-from">Data început</Label>
                  <Input
                    type="date"
                    id="valid-from"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="valid-until">Data sfârșit</Label>
                  <Input
                    type="date"
                    id="valid-until"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
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
                    <Label htmlFor="owner-fiscal" className={errors.ownerFiscal ? "text-red-500" : ""}>
                      Cod fiscal (C.U.I.) *
                    </Label>
                    <Input
                      id="owner-fiscal"
                      value={ownerDetails.fiscal}
                      onChange={(e) => setOwnerDetails({...ownerDetails, fiscal: e.target.value})}
                      className={inputClassName("ownerFiscal")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner-address" className={errors.ownerAddress ? "text-red-500" : ""}>
                      Adresă *
                    </Label>
                    <Input
                      id="owner-address"
                      value={ownerDetails.address}
                      onChange={(e) => setOwnerDetails({...ownerDetails, address: e.target.value})}
                      className={inputClassName("ownerAddress")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner-phone">Telefon</Label>
                    <Input
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
                    <Label htmlFor="tenant-name" className={errors.tenantName ? "text-red-500" : ""}>
                      Nume/Denumire *
                    </Label>
                    <Input
                      id="tenant-name"
                      value={tenantDetails.name}
                      onChange={(e) => setTenantDetails({...tenantDetails, name: e.target.value})}
                      className={inputClassName("tenantName")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenant-fiscal" className={errors.tenantFiscal ? "text-red-500" : ""}>
                      Cod fiscal (C.U.I.) *
                    </Label>
                    <Input
                      id="tenant-fiscal"
                      value={tenantDetails.fiscal}
                      onChange={(e) => setTenantDetails({...tenantDetails, fiscal: e.target.value})}
                      className={inputClassName("tenantFiscal")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenant-address" className={errors.tenantAddress ? "text-red-500" : ""}>
                      Adresă *
                    </Label>
                    <Input
                      id="tenant-address"
                      value={tenantDetails.address}
                      onChange={(e) => setTenantDetails({...tenantDetails, address: e.target.value})}
                      className={inputClassName("tenantAddress")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tenant-phone">Telefon</Label>
                    <Input
                      id="tenant-phone"
                      value={tenantDetails.phone}
                      onChange={(e) => setTenantDetails({...tenantDetails, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Detalii Proprietate și Contract</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="property-address" className={errors.propertyAddress ? "text-red-500" : ""}>
                      Adresa proprietății *
                    </Label>
                    <Input
                      id="property-address"
                      value={propertyDetails.address}
                      onChange={(e) => setPropertyDetails({...propertyDetails, address: e.target.value})}
                      className={inputClassName("propertyAddress")}
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
                    <Label htmlFor="rent-amount" className={errors.rentAmount ? "text-red-500" : ""}>
                      Chirie lunară (RON) *
                    </Label>
                    <Input
                      type="number"
                      id="rent-amount"
                      value={propertyDetails.rentAmount}
                      onChange={(e) => setPropertyDetails({...propertyDetails, rentAmount: parseFloat(e.target.value)})}
                      className={inputClassName("rentAmount")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment-day">Ziua de plată</Label>
                    <Input
                      type="number"
                      id="payment-day"
                      min={1}
                      max={31}
                      value={propertyDetails.paymentDay}
                      onChange={(e) => setPropertyDetails({...propertyDetails, paymentDay: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
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
