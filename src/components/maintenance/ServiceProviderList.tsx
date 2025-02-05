import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "@/hooks/useAuthState";
import { useUserRole } from "@/hooks/use-user-role";
import { ServiceProviderFilters } from "./service-provider/ServiceProviderFilters";
import { CreateProviderDialog } from "./service-provider/CreateProviderDialog";
import { ServiceProviderListContent } from "./service-provider/ServiceProviderListContent";

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
  services?: ServiceProviderService[];
  isPreferred?: boolean;
}

interface ServiceProviderService {
  name: string;
  base_price?: number;
  price_unit?: string;
  category: string;
}

interface Filters {
  search: string;
  category: string;
  rating: string;
}

export function ServiceProviderList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUserId } = useAuthState();
  const { userRole } = useUserRole();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: "all",
    rating: "all"
  });

  if (userRole === "service_provider") {
    return null;
  }

  const { data: serviceProviders, isLoading } = useQuery({
    queryKey: ["service-providers-details", filters],
    queryFn: async () => {
      console.log("Fetching service providers with details and filters:", filters);
      
      if (!currentUserId) {
        console.log("No user ID available");
        return [];
      }

      const { data: preferredProviders, error: preferredError } = await supabase
        .from("landlord_service_providers")
        .select("service_provider_id")
        .eq('landlord_id', currentUserId);

      if (preferredError) {
        console.error("Error fetching preferred providers:", preferredError);
        throw preferredError;
      }

      let query = supabase
        .from("service_provider_profiles")
        .select(`
          id,
          business_name,
          description,
          contact_phone,
          contact_email,
          website,
          service_area,
          rating,
          review_count,
          profiles!fk_profiles (
            first_name,
            last_name
          ),
          services:service_provider_services (
            name,
            category,
            base_price,
            price_unit
          )
        `);

      // Apply filters
      if (filters.search) {
        query = query.or(`business_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.rating !== "all") {
        query = query.gte("rating", parseInt(filters.rating));
      }

      const { data: providers, error: providersError } = await query;

      if (providersError) {
        console.error("Error fetching providers:", providersError);
        throw providersError;
      }

      const preferredIds = new Set(preferredProviders?.map(p => p.service_provider_id) || []);

      let filteredProviders = (providers || [])
        .map(provider => ({
          ...provider,
          profiles: Array.isArray(provider.profiles) ? provider.profiles : [provider.profiles],
          isPreferred: preferredIds.has(provider.id)
        }));

      // Filter by service category if selected
      if (filters.category !== "all") {
        filteredProviders = filteredProviders.filter(provider => 
          provider.services?.some(service => service.category === filters.category)
        );
      }

      return filteredProviders.sort((a, b) => {
        if (a.isPreferred === b.isPreferred) {
          const aName = a.business_name || `${a.profiles[0]?.first_name} ${a.profiles[0]?.last_name}`;
          const bName = b.business_name || `${b.profiles[0]?.first_name} ${b.profiles[0]?.last_name}`;
          return aName.localeCompare(bName);
        }
        return a.isPreferred ? -1 : 1;
      });
    },
    enabled: !!currentUserId
  });

  const handleCreateServiceProvider = async (newProvider: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  }) => {
    try {
      setIsCreating(true);
      
      console.log("Creating new service provider:", newProvider);
      const tempPassword = Math.random().toString(36).slice(-8) + "!1A";

      // First check if the user already exists
      const { data: existingUser, error: userCheckError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('email', newProvider.email)
        .maybeSingle();

      if (userCheckError) {
        console.error("Error checking existing user:", userCheckError);
        throw userCheckError;
      }

      let userId;

      if (existingUser) {
        console.log("Existing user found:", existingUser);
        userId = existingUser.id;
        
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            first_name: newProvider.first_name,
            last_name: newProvider.last_name,
            phone: newProvider.phone,
            role: 'service_provider'
          })
          .eq('id', userId);

        if (updateError) throw updateError;
      } else {
        console.log("Creating new user with temporary password");
        // Create new user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: newProvider.email,
          password: tempPassword,
          options: {
            data: {
              role: "service_provider",
              first_name: newProvider.first_name,
              last_name: newProvider.last_name
            }
          }
        });

        if (authError) {
          console.error("Error creating user:", authError);
          throw authError;
        }

        userId = authData.user!.id;
      }

      console.log("Creating/updating service provider profile for user:", userId);

      // Create or update service provider profile
      const { error: spError } = await supabase
        .from('service_provider_profiles')
        .upsert({
          id: userId,
          business_name: `${newProvider.first_name} ${newProvider.last_name}`, // Using full name as initial business name
          contact_email: newProvider.email,
          contact_phone: newProvider.phone,
          is_first_login: true
        });

      if (spError) {
        console.error("Error creating service provider profile:", spError);
        throw spError;
      }

      // Send welcome email with temporary password
      console.log("Sending welcome email to new service provider");
      const { error: emailError } = await supabase.functions.invoke('send-service-provider-welcome', {
        body: {
          email: newProvider.email,
          firstName: newProvider.first_name,
          lastName: newProvider.last_name,
          tempPassword: tempPassword
        }
      });

      if (emailError) {
        console.error("Error sending welcome email:", emailError);
        // Continue despite email error, but notify user
        toast({
          title: "Warning",
          description: "Provider created but welcome email could not be sent. Please contact them directly.",
          variant: "destructive",
        });
      }

      toast({
        title: "Success",
        description: "Service provider created successfully.",
      });

      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['service-providers-details'] });
    } catch (error: any) {
      console.error("Error in handleCreateServiceProvider:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create service provider. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handlePreferredToggle = async (provider: ServiceProvider) => {
    if (!currentUserId) {
      console.error("No user ID available");
      return;
    }

    try {
      if (provider.isPreferred) {
        await supabase
          .from('landlord_service_providers')
          .delete()
          .eq('landlord_id', currentUserId)
          .eq('service_provider_id', provider.id);
      } else {
        await supabase
          .from('landlord_service_providers')
          .insert({
            landlord_id: currentUserId,
            service_provider_id: provider.id
          });
      }
      
      queryClient.invalidateQueries({ queryKey: ['service-providers-details'] });
      
      toast({
        title: provider.isPreferred ? "Removed from preferred providers" : "Added to preferred providers",
        description: `${provider.business_name || `${provider.profiles[0]?.first_name} ${provider.profiles[0]?.last_name}`} has been ${provider.isPreferred ? 'removed from' : 'added to'} your preferred providers list.`,
      });
    } catch (error) {
      console.error('Error updating preferred status:', error);
      toast({
        title: "Error",
        description: "Failed to update preferred status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {userRole === "landlord" && (
        <div className="flex justify-end items-center mb-6">
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white" 
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Create New Provider
          </Button>
        </div>
      )}

      <ServiceProviderFilters 
        filters={filters}
        onFiltersChange={setFilters}
      />

      <ServiceProviderListContent
        providers={serviceProviders}
        isLoading={isLoading}
        onPreferredToggle={handlePreferredToggle}
        onEdit={handleEdit}
        userRole={userRole}
      />

      <CreateProviderDialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setSelectedProvider(null);
        }}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          setSelectedProvider(null);
        }}
        isCreating={isCreating}
        onCreateProvider={handleCreateServiceProvider}
        provider={selectedProvider}
      />
    </div>
  );
}
