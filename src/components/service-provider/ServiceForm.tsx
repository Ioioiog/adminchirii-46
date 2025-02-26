
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";
import { useCurrency } from "@/hooks/useCurrency";
import { useNavigate } from "react-router-dom";

type ServiceCategory = Database["public"]["Enums"]["service_category"];

interface ServiceFormProps {
  onSuccess: () => void;
  service?: {
    id: string;
    name: string;
    category: ServiceCategory;
    description: string | null;
    base_price: number | null;
    price_unit: string | null;
    currency?: string;
  };
}

export function ServiceForm({ onSuccess, service }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    name: service?.name || "",
    category: service?.category || "general_maintenance" as ServiceCategory,
    description: service?.description || "",
    base_price: service?.base_price?.toString() || "",
    price_unit: service?.price_unit || "per hour",
    currency: service?.currency || "USD",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { availableCurrencies } = useCurrency();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const serviceData = {
        ...formData,
        base_price: formData.base_price ? parseFloat(formData.base_price) : null,
        provider_id: user.id,
        category: formData.category as ServiceCategory
      };

      const { error } = service
        ? await supabase
            .from("service_provider_services")
            .update(serviceData)
            .eq("id", service.id)
        : await supabase
            .from("service_provider_services")
            .insert(serviceData);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Service ${service ? "updated" : "added"} successfully`,
      });
      
      // Call onSuccess to close the dialog
      onSuccess();
      
      // Navigate to service provider profile with services tab
      navigate('/service-provider-profile', { state: { activeSection: 'services' } });
      
    } catch (error) {
      console.error("Error saving service:", error);
      toast({
        title: "Error",
        description: `Failed to ${service ? "update" : "add"} service`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Service Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.category}
          onValueChange={(value: ServiceCategory) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="plumbing">Plumbing</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="hvac">HVAC</SelectItem>
            <SelectItem value="carpentry">Carpentry</SelectItem>
            <SelectItem value="cleaning">Cleaning</SelectItem>
            <SelectItem value="painting">Painting</SelectItem>
            <SelectItem value="landscaping">Landscaping</SelectItem>
            <SelectItem value="general_maintenance">General Maintenance</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="base_price">Base Price</Label>
          <Input
            id="base_price"
            type="number"
            step="0.01"
            value={formData.base_price}
            onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {availableCurrencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.name} ({currency.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price_unit">Price Unit</Label>
          <Select
            value={formData.price_unit}
            onValueChange={(value) => setFormData({ ...formData, price_unit: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select price unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="per hour">Per Hour</SelectItem>
              <SelectItem value="per day">Per Day</SelectItem>
              <SelectItem value="per job">Per Job</SelectItem>
              <SelectItem value="per sqft">Per Sq.Ft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {service ? "Update Service" : "Add Service"}
        </Button>
      </div>
    </form>
  );
}
