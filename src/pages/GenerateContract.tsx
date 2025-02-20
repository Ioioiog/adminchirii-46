
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

export default function GenerateContract() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [contractType, setContractType] = useState<string>("lease");
  const [validFrom, setValidFrom] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [validUntil, setValidUntil] = useState<string>("");

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
          content: selectedTemplateData.content as Json,
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

        <Card>
          <CardHeader>
            <CardTitle>Generate New Contract</CardTitle>
            <CardDescription>
              Create a new contract by selecting a template and property
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="template">Contract Template</Label>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
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

            <div className="space-y-2">
              <Label htmlFor="property">Property</Label>
              <Select
                value={selectedProperty}
                onValueChange={setSelectedProperty}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties?.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name} - {property.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Contract Type</Label>
              <Select value={contractType} onValueChange={setContractType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lease">Lease Agreement</SelectItem>
                  <SelectItem value="rental">Rental Agreement</SelectItem>
                  <SelectItem value="commercial">Commercial Lease</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validFrom">Valid From</Label>
              <Input
                type="date"
                id="validFrom"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until (Optional)</Label>
              <Input
                type="date"
                id="validUntil"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={handleGenerateContract}>
              Generate Contract
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
