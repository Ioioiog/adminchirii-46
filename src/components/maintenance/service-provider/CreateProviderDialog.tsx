
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ServiceProvider {
  id: string;
  business_name?: string | null;
  description?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  website?: string | null;
  service_area?: string[];
  rating?: number;
  review_count?: number;
  profiles: Array<{
    first_name: string | null;
    last_name: string | null;
  }>;
}

interface NewProvider {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  category: string;
}

interface CreateProviderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isCreating: boolean;
  onCreateProvider: (provider: NewProvider) => Promise<void>;
  provider?: ServiceProvider | null;
}

export function CreateProviderDialog({ 
  isOpen, 
  onClose, 
  onSuccess, 
  isCreating,
  onCreateProvider,
  provider 
}: CreateProviderDialogProps) {
  const [newProvider, setNewProvider] = useState<NewProvider>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    category: "general_maintenance"
  });
  const { toast } = useToast();

  useEffect(() => {
    if (provider && isOpen) {
      setNewProvider({
        first_name: provider.profiles[0]?.first_name || "",
        last_name: provider.profiles[0]?.last_name || "",
        email: provider.contact_email || "",
        phone: provider.contact_phone || "",
        category: "general_maintenance" // Default value for existing providers
      });
    } else if (!isOpen) {
      setNewProvider({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        category: "general_maintenance"
      });
    }
  }, [provider, isOpen]);

  const handleSubmit = async () => {
    try {
      // Validate all required fields
      if (!newProvider.first_name.trim() || 
          !newProvider.last_name.trim() || 
          !newProvider.email.trim() || 
          !newProvider.phone.trim() ||
          !newProvider.category) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (First Name, Last Name, Email, Phone, and Category).",
          variant: "destructive",
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newProvider.email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }

      // Validate phone format (basic validation)
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (!phoneRegex.test(newProvider.phone)) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid phone number (minimum 10 digits).",
          variant: "destructive",
        });
        return;
      }

      await onCreateProvider(newProvider);
      onSuccess();
      setNewProvider({ first_name: "", last_name: "", email: "", phone: "", category: "general_maintenance" });
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{provider ? 'Edit Service Provider' : 'Create Service Provider'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={newProvider.first_name}
                onChange={(e) => setNewProvider(prev => ({ ...prev, first_name: e.target.value }))}
                className="w-full"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={newProvider.last_name}
                onChange={(e) => setNewProvider(prev => ({ ...prev, last_name: e.target.value }))}
                className="w-full"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={newProvider.email}
              onChange={(e) => setNewProvider(prev => ({ ...prev, email: e.target.value }))}
              className="w-full"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              value={newProvider.phone}
              onChange={(e) => setNewProvider(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={newProvider.category}
              onValueChange={(value) => setNewProvider(prev => ({ ...prev, category: value }))}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="general_maintenance">General Maintenance</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="painting">Painting</SelectItem>
                <SelectItem value="carpentry">Carpentry</SelectItem>
                <SelectItem value="landscaping">Landscaping</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
            onClick={handleSubmit}
            disabled={isCreating}
          >
            {isCreating ? "Saving..." : (provider ? "Save Changes" : "Create Service Provider")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
