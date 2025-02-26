
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface RoleSpecificFormProps {
  role: string;
  email: string;
  onComplete: () => void;
}

export function RoleSpecificForm({ role, email, onComplete }: RoleSpecificFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    // Service Provider specific fields
    businessName: "",
    serviceArea: "",
    businessDescription: "",
    website: "",
    // Landlord specific fields
    companyName: "",
    vatNumber: "",
    registrationNumber: "",
    // Tenant specific fields
    occupation: "",
    employmentStatus: "",
    currentAddress: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("Starting role-specific form submission for role:", role);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("No authenticated user found");
        throw new Error("No authenticated user found");
      }

      console.log("Updating user metadata and profile for user:", user.id);
      
      // First update the user's metadata with role
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          role: role,
          first_name: formData.firstName,
          last_name: formData.lastName
        }
      });

      if (updateError) {
        console.error("Error updating user metadata:", updateError);
        throw updateError;
      }

      // Then update the profile with common fields
      const baseProfileData = {
        id: user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        role: role,
        email: email,
        address: formData.address
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(baseProfileData, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error("Error updating profile:", profileError);
        throw profileError;
      }

      // If user is a service provider, create/update service provider profile
      if (role === 'service_provider') {
        const { error: spError } = await supabase
          .from('service_provider_profiles')
          .upsert({
            id: user.id,
            business_name: formData.businessName,
            service_area: [formData.serviceArea],
            contact_email: email,
            contact_phone: formData.phone,
            description: formData.businessDescription,
            website: formData.website
          }, {
            onConflict: 'id'
          });

        if (spError) {
          console.error("Error updating service provider profile:", spError);
          throw spError;
        }
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });

      onComplete();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Common fields for all roles */}
      <div className="space-y-2">
        <Label htmlFor="firstName">First Name *</Label>
        <Input
          id="firstName"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name *</Label>
        <Input
          id="lastName"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
        />
      </div>

      {/* Service Provider specific fields */}
      {role === 'service_provider' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceArea">Service Area *</Label>
            <Input
              id="serviceArea"
              name="serviceArea"
              value={formData.serviceArea}
              onChange={handleChange}
              placeholder="e.g. New York City"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessDescription">Business Description</Label>
            <Textarea
              id="businessDescription"
              name="businessDescription"
              value={formData.businessDescription}
              onChange={handleChange}
              placeholder="Describe your services and expertise..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>
        </>
      )}

      {/* Landlord specific fields */}
      {role === 'landlord' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name (if applicable)</Label>
            <Input
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatNumber">VAT Number (if applicable)</Label>
            <Input
              id="vatNumber"
              name="vatNumber"
              value={formData.vatNumber}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationNumber">Business Registration Number (if applicable)</Label>
            <Input
              id="registrationNumber"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
            />
          </div>
        </>
      )}

      {/* Tenant specific fields */}
      {role === 'tenant' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation *</Label>
            <Input
              id="occupation"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="employmentStatus">Employment Status *</Label>
            <Select
              value={formData.employmentStatus}
              onValueChange={(value) => handleSelectChange(value, 'employmentStatus')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employed">Employed</SelectItem>
                <SelectItem value="self-employed">Self-employed</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="unemployed">Unemployed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentAddress">Current Address *</Label>
            <Input
              id="currentAddress"
              name="currentAddress"
              value={formData.currentAddress}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
            <Input
              id="emergencyContactName"
              name="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
            <Input
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              type="tel"
              value={formData.emergencyContactPhone}
              onChange={handleChange}
              required
            />
          </div>
        </>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving..." : "Complete Profile"}
      </Button>
    </form>
  );
}
