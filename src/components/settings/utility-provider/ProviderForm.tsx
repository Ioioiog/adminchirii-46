
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PropertySelect } from "@/components/documents/PropertySelect";
import { useProperties } from "@/hooks/useProperties";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";

interface UtilityProvider {
  id: string;
  provider_name: string;
  username: string;
  property_id?: string;
  utility_type?: 'electricity' | 'water' | 'gas';
  start_day?: number;
  end_day?: number;
  location_name?: string;
}

interface ProviderFormProps {
  onClose: () => void;
  onSuccess: () => void;
  provider?: UtilityProvider | null;
}

export function ProviderForm({ onClose, onSuccess, provider }: ProviderFormProps) {
  const { properties } = useProperties({ userRole: "landlord" });
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    provider_name: provider?.provider_name || "Belvedere Utilities",
    username: provider?.username || "mihaigruia@me.com",
    password: provider?.password || "London123!!!",
    location_name: provider?.location_name || "Belvedere 11a 53",
    property_id: provider?.property_id || "",
    utility_type: provider?.utility_type || "electricity",
    start_day: provider?.start_day?.toString() || "1",
    end_day: provider?.end_day?.toString() || "28"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const startDayNum = parseInt(formData.start_day);
    const endDayNum = parseInt(formData.end_day);

    if (startDayNum < 1 || startDayNum > 31 || endDayNum < 1 || endDayNum > 31) {
      toast({
        title: "Error",
        description: "Days must be between 1 and 31",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No authenticated user found");
      }

      const operation = provider ? 
        supabase
          .from("utility_provider_credentials")
          .update({
            provider_name: formData.provider_name,
            username: formData.username,
            encrypted_password: formData.password || undefined,
            location_name: formData.location_name,
            property_id: formData.property_id || null,
            utility_type: formData.utility_type,
            start_day: startDayNum,
            end_day: endDayNum
          })
          .eq('id', provider.id) :
        supabase
          .from("utility_provider_credentials")
          .insert({
            provider_name: formData.provider_name,
            username: formData.username,
            encrypted_password: formData.password,
            location_name: formData.location_name,
            property_id: formData.property_id || null,
            landlord_id: user.id,
            utility_type: formData.utility_type,
            start_day: startDayNum,
            end_day: endDayNum
          });

      const { error } = await operation;

      if (error) throw error;

      toast({
        title: "Success",
        description: `Provider ${provider ? 'updated' : 'added'} successfully`,
      });

      onSuccess();
    } catch (error) {
      console.error("Error saving provider:", error);
      toast({
        title: "Error",
        description: `Failed to ${provider ? 'update' : 'add'} provider`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="provider_name">Provider Name</Label>
        <Input
          id="provider_name"
          value={formData.provider_name}
          onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
          placeholder="Enter provider name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="Enter username"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter password"
            required={!provider}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location_name">Location Name</Label>
        <Input
          id="location_name"
          value={formData.location_name}
          onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
          placeholder="Enter location name (e.g. Main Building, Apartment 3B)"
        />
      </div>
      <div className="space-y-2">
        <PropertySelect
          properties={properties}
          selectedPropertyId={formData.property_id}
          onPropertyChange={(value) => setFormData({ ...formData, property_id: value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="utility_type">Utility Type</Label>
        <Select
          value={formData.utility_type}
          onValueChange={(value: 'electricity' | 'water' | 'gas') => 
            setFormData({ ...formData, utility_type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select utility type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="electricity">Electricity</SelectItem>
            <SelectItem value="water">Water</SelectItem>
            <SelectItem value="gas">Gas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_day">Reading Period Start Day</Label>
          <Input
            id="start_day"
            type="number"
            min="1"
            max="31"
            value={formData.start_day}
            onChange={(e) => setFormData({ ...formData, start_day: e.target.value })}
            placeholder="Enter start day (1-31)"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_day">Reading Period End Day</Label>
          <Input
            id="end_day"
            type="number"
            min="1"
            max="31"
            value={formData.end_day}
            onChange={(e) => setFormData({ ...formData, end_day: e.target.value })}
            placeholder="Enter end day (1-31)"
            required
          />
        </div>
      </div>
      <div className="flex gap-4">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? "Saving..." : (provider ? "Update" : "Add Provider")}
        </Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
