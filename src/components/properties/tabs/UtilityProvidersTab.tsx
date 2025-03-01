
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { UtilityProvider, PROVIDER_OPTIONS } from "@/components/settings/utility-provider/types";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";

interface UtilityProvidersTabProps {
  propertyId: string;
  userId: string;
}

export function UtilityProvidersTab({ propertyId, userId }: UtilityProvidersTabProps) {
  const [providers, setProviders] = useState<UtilityProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [formData, setFormData] = useState<Partial<UtilityProvider>>({
    provider_name: PROVIDER_OPTIONS[0].value,
    utility_type: PROVIDER_OPTIONS[0].default_type,
    username: "",
    property_id: propertyId,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    fetchProviders();
  }, [propertyId]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      // Use the correct table name based on your schema
      const { data, error } = await supabase
        .from("utility_providers")
        .select("*")
        .eq("property_id", propertyId);

      if (error) throw error;
      // Cast to UtilityProvider[] since we've updated the interface to match the DB structure
      setProviders(data as UtilityProvider[] || []);
      console.log("Fetched utility providers:", data);
    } catch (error) {
      console.error("Error fetching utility providers:", error);
      toast({
        title: "Error",
        description: "Failed to load utility providers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Set default utility type based on provider
    if (name === "provider_name") {
      const selectedProvider = PROVIDER_OPTIONS.find(p => p.value === value);
      if (selectedProvider) {
        setFormData(prev => ({ 
          ...prev, 
          provider_name: value,
          utility_type: selectedProvider.default_type 
        }));
      }
    }
  };

  const handleAddProvider = async () => {
    try {
      if (!formData.username) {
        toast({
          title: "Error",
          description: "Please enter a username",
          variant: "destructive",
        });
        return;
      }

      // Ensure required fields are present before insertion
      const newProvider = {
        ...formData,
        provider_name: formData.provider_name as string, // Ensure provider_name is provided
        utility_type: formData.utility_type as string, // Ensure utility_type is provided
        property_id: propertyId,
        landlord_id: userId,
        start_day: formData.start_day ? parseInt(formData.start_day.toString()) : 1,
        end_day: formData.end_day ? parseInt(formData.end_day.toString()) : 28
      };

      const { data, error } = await supabase
        .from("utility_providers")
        .insert([newProvider])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Utility provider added successfully",
      });

      // Update local state with the new provider
      setProviders([...(providers || []), data[0] as UtilityProvider]);
      setIsAddingProvider(false);
      setFormData({
        provider_name: PROVIDER_OPTIONS[0].value,
        utility_type: PROVIDER_OPTIONS[0].default_type,
        username: "",
        property_id: propertyId,
      });
      
      // Invalidate queries to refresh property data
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
    } catch (error) {
      console.error("Error adding utility provider:", error);
      toast({
        title: "Error",
        description: "Failed to add utility provider",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    try {
      const { error } = await supabase
        .from("utility_providers")
        .delete()
        .eq("id", providerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Utility provider removed successfully",
      });

      // Update local state by removing the deleted provider
      setProviders(providers.filter((provider) => provider.id !== providerId));
      
      // Invalidate queries to refresh property data
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
    } catch (error) {
      console.error("Error deleting utility provider:", error);
      toast({
        title: "Error",
        description: "Failed to remove utility provider",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Utility Providers</h2>
        <Dialog open={isAddingProvider} onOpenChange={setIsAddingProvider}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Utility Provider</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="provider_name" className="text-right">
                  Provider
                </Label>
                <div className="col-span-3">
                  <Select
                    value={formData.provider_name}
                    onValueChange={(value) => handleSelectChange("provider_name", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDER_OPTIONS.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="utility_type" className="text-right">
                  Type
                </Label>
                <div className="col-span-3">
                  <Select
                    value={formData.utility_type}
                    onValueChange={(value) => handleSelectChange("utility_type", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select utility type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electricity">Electricity</SelectItem>
                      <SelectItem value="water">Water</SelectItem>
                      <SelectItem value="gas">Gas</SelectItem>
                      <SelectItem value="internet">Internet</SelectItem>
                      <SelectItem value="building maintenance">Building Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username || ""}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="encrypted_password" className="text-right">
                  Password
                </Label>
                <Input
                  id="encrypted_password"
                  name="encrypted_password"
                  type="password"
                  value={formData.encrypted_password || ""}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location_name" className="text-right">
                  Location
                </Label>
                <Input
                  id="location_name"
                  name="location_name"
                  value={formData.location_name || ""}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Optional location name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="start_day" className="text-right col-span-2">
                    Start Day
                  </Label>
                  <Input
                    id="start_day"
                    name="start_day"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.start_day || "1"}
                    onChange={handleInputChange}
                    className="col-span-2"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-2">
                  <Label htmlFor="end_day" className="text-right col-span-2">
                    End Day
                  </Label>
                  <Input
                    id="end_day"
                    name="end_day"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.end_day || "28"}
                    onChange={handleInputChange}
                    className="col-span-2"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingProvider(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddProvider}>Add Provider</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-gray-200 h-28 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <h3 className="font-medium text-lg mb-2">No utility providers</h3>
          <p className="text-gray-500 mb-4">
            Add utility providers to manage billing and usage data.
          </p>
          <Button
            onClick={() => setIsAddingProvider(true)}
            variant="outline"
            className="flex items-center gap-2 mx-auto"
          >
            <PlusCircle className="h-4 w-4" />
            Add Provider
          </Button>
        </div>
      ) : (
        <ScrollArea className="h-[400px] w-full rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((provider) => (
              <Card key={provider.id} className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center">
                    <span>
                      {PROVIDER_OPTIONS.find(p => p.value === provider.provider_name)?.label || 
                       provider.provider_name}
                    </span>
                    <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {provider.utility_type}
                    </span>
                  </CardTitle>
                  <CardDescription>{provider.username}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  {provider.location_name && (
                    <p className="text-sm text-gray-500">Location: {provider.location_name}</p>
                  )}
                  <p className="text-sm text-gray-500">Reading Period: Day {provider.start_day || 1} - {provider.end_day || 28}</p>
                </CardContent>
                <CardFooter className="pt-2 flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteProvider(provider.id)}
                  >
                    Remove
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
