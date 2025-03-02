
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { ProviderForm } from "@/components/utilities/providers/ProviderForm";
import { ProviderList } from "@/components/utilities/providers/ProviderList";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UtilityProvider } from "@/components/utilities/providers/types";

interface PropertyProvidersSettingsProps {
  propertyId: string;
}

export function PropertyProvidersSettings({ propertyId }: PropertyProvidersSettingsProps) {
  const [providers, setProviders] = useState<UtilityProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<UtilityProvider | null>(null);
  const { toast } = useToast();

  const fetchProviders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('utility_provider_credentials')
        .select('*')
        .eq('property_id', propertyId);

      if (error) {
        console.error('Error fetching providers:', error);
        toast({
          title: "Error",
          description: "Failed to fetch providers.",
          variant: "destructive",
        });
        return;
      }

      // Type assertion to help TypeScript identify that this array matches UtilityProvider
      // since the query returns the correct fields
      setProviders(data as unknown as UtilityProvider[]);
    } catch (error) {
      console.error('Error in fetchProviders:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchProviders();
    }
  }, [propertyId]);

  const handleDeleteProvider = async (id: string) => {
    try {
      const { error } = await supabase
        .from('utility_provider_credentials')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Provider deleted successfully.",
      });

      setProviders((prev) => prev.filter(provider => provider.id !== id));
    } catch (error) {
      console.error("Error deleting provider:", error);
      toast({
        title: "Error",
        description: "Failed to delete provider.",
        variant: "destructive",
      });
    }
  };

  const handleEditProvider = (provider: UtilityProvider) => {
    setEditingProvider(provider);
    setShowProviderForm(true);
  };

  // Get current user ID safely
  const getCurrentUserId = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user?.id || '';
    } catch (error) {
      console.error("Error getting current user:", error);
      return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          <h2 className="text-2xl">Utility Providers</h2>
          <p className="text-gray-500">Manage your utility providers for this property.</p>
        </div>
        <Button onClick={() => setShowProviderForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white transition-colors">
          Add Provider
        </Button>
      </div>

      {showProviderForm ? (
        <ProviderForm 
          landlordId={localStorage.getItem('userId') || ''} // Fallback to local storage if available
          onSubmit={() => {
            setShowProviderForm(false);
            setEditingProvider(null);
          }}
          onClose={() => {
            setShowProviderForm(false);
            setEditingProvider(null);
          }} 
          onSuccess={() => {
            setShowProviderForm(false);
            setEditingProvider(null);
            // Refresh providers list
            fetchProviders();
          }} 
          provider={editingProvider} 
        />
      ) : (
        <ProviderList 
          providers={providers} 
          onDelete={handleDeleteProvider} 
          onEdit={handleEditProvider}
          isLoading={isLoading} 
        />
      )}
    </div>
  );
}
