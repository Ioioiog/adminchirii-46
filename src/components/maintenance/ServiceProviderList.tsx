
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
import { Plus } from "lucide-react";

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
    role?: string | null;
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
  createdByMe: boolean;
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
    rating: "all",
    createdByMe: false
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

      // First, let's log the current user ID for debugging
      console.log("Current user ID:", currentUserId);

      // Get service provider profiles
      const { data: providers, error: providersError } = await supabase
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
          services:service_provider_services (
            name,
            category,
            base_price,
            price_unit
          )
        `);

      if (providersError) {
        console.error("Error fetching providers:", providersError);
        throw providersError;
      }

      console.log("Raw providers data:", providers);

      // Get profiles data
      const providerIds = providers?.map(p => p.id) || [];
      console.log("Provider IDs to fetch profiles for:", providerIds);

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .in('id', providerIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      console.log("Raw profiles data:", profilesData);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

      const preferredIds = new Set(preferredProviders?.map(p => p.service_provider_id) || []);

      let filteredProviders = (providers || [])
        .map(provider => {
          const profile = profilesMap.get(provider.id);
          
          const fullName = profile 
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
            : '';
            
          console.log("Processing provider:", {
            id: provider.id,
            rawBusinessName: provider.business_name,
            profile: profile,
            fullName: fullName,
            role: profile?.role
          });

          const isRegisteredProvider = profile?.role === 'service_provider';
          const displayName = provider.business_name || fullName || 'Unknown Provider';

          console.log("Final display name:", displayName);

          return {
            ...provider,
            business_name: displayName,
            profiles: [profile || { first_name: null, last_name: null, role: null }],
            isPreferred: preferredIds.has(provider.id),
            isCustomProvider: !isRegisteredProvider
          };
        });

      if (filters.category !== "all") {
        filteredProviders = filteredProviders.filter(provider => 
          provider.services?.some(service => service.category === filters.category)
        );
      }

      if (filters.search) {
        filteredProviders = filteredProviders.filter(provider => 
          provider.business_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          provider.description?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      console.log("Final filtered providers:", filteredProviders.map(p => ({
        id: p.id,
        displayName: p.business_name,
        profileData: p.profiles[0],
        isCustom: !Boolean(p.profiles[0]?.role === 'service_provider')
      })));

      return filteredProviders.sort((a, b) => {
        if (a.isPreferred === b.isPreferred) {
          return (a.business_name || '').localeCompare(b.business_name || '');
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

      if (!currentUserId) {
        console.error("No user ID available");
        return;
      }

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

        if (!authData.user) {
          throw new Error("No user data returned from auth signup");
        }

        userId = authData.user.id;

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log("Creating/updating service provider profile for user:", userId);

      const { error: spError } = await supabase
        .from('service_provider_profiles')
        .upsert({
          id: userId,
          business_name: `${newProvider.first_name} ${newProvider.last_name}`,
          contact_email: newProvider.email,
          contact_phone: newProvider.phone,
          is_first_login: true
        });

      if (spError) {
        console.error("Error creating service provider profile:", spError);
        throw spError;
      }

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Service Providers</h2>
        {userRole === "landlord" && (
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2" 
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create New Provider
          </Button>
        )}
      </div>

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
