import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProviderList } from "@/components/utilities/providers/ProviderList";
import { ProviderForm } from "@/components/utilities/providers/ProviderForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface UtilityProvider {
  id: string;
  provider_name: string;
  username: string;
  property_id?: string;
  property?: {
    name: string;
    address: string;
  };
  utility_type?: 'electricity' | 'water' | 'gas';
  start_day?: number;
  end_day?: number;
}

export function PropertyProvidersSettings() {
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<UtilityProvider | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["utility-providers"],
    queryFn: async () => {
      console.log("Fetching utility providers");
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error fetching user:", userError);
        throw userError;
      }

      if (!user) {
        console.error("No authenticated user found");
        return [];
      }

      const { data, error } = await supabase
        .from("utility_provider_credentials")
        .select(`
          *,
          property:properties (
            name,
            address
          )
        `)
        .eq("landlord_id", user.id);

      if (error) {
        console.error("Error fetching providers:", error);
        throw error;
      }

      console.log("Fetched providers:", data);
      return data as UtilityProvider[];
    }
  });

  const handleDelete = async (id: string) => {
    try {
      console.log("Deleting utility provider:", id);
      const { error } = await supabase
        .from("utility_provider_credentials")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Utility provider deleted successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["utility-providers"] });
    } catch (error) {
      console.error("Error deleting provider:", error);
      toast({
        title: "Error",
        description: "Failed to delete utility provider",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (provider: UtilityProvider) => {
    setEditingProvider(provider);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Utility Providers</h3>
        <Button 
          onClick={() => setShowForm(true)} 
          disabled={showForm}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Provider
        </Button>
      </div>

      {showForm ? (
        <ProviderForm
          onClose={() => {
            setShowForm(false);
            setEditingProvider(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingProvider(null);
            queryClient.invalidateQueries({ queryKey: ["utility-providers"] });
          }}
          provider={editingProvider}
        />
      ) : (
        <ProviderList
          providers={providers}
          onDelete={handleDelete}
          onEdit={handleEdit}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
