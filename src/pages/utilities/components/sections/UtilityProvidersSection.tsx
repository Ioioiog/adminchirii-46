
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { ProviderForm } from "@/components/utilities/providers/ProviderForm";
import { ProviderList } from "@/components/utilities/providers/ProviderList";
import { useQueryClient } from "@tanstack/react-query";
import { UtilityProvider } from "@/components/utilities/providers/types";

interface UtilityProvidersSectionProps {
  providers: any[];
  isLoading: boolean;
  landlordId: string;
  showProviderForm: boolean;
  setShowProviderForm: (value: boolean) => void;
  editingProvider: any;
  setEditingProvider: (provider: any) => void;
  onDeleteProvider: (id: string) => Promise<void>;
  onEditProvider: (provider: UtilityProvider) => void;
}

export function UtilityProvidersSection({
  providers,
  isLoading,
  landlordId,
  showProviderForm,
  setShowProviderForm,
  editingProvider,
  setEditingProvider,
  onDeleteProvider,
  onEditProvider
}: UtilityProvidersSectionProps) {
  const queryClient = useQueryClient();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/10 rounded-xl">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">Utility Providers</CardTitle>
              <p className="text-gray-500 mt-1">
                Manage your utility provider connections and automated bill fetching.
              </p>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => setShowProviderForm(true)} 
          disabled={showProviderForm} 
          className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          Add Provider
        </Button>
      </div>
      {showProviderForm ? (
        <ProviderForm 
          landlordId={landlordId} 
          onSubmit={() => {
            queryClient.invalidateQueries({ queryKey: ["utility-providers"] });
          }}
          onClose={() => {
            setShowProviderForm(false);
            setEditingProvider(null);
          }} 
          onSuccess={() => {
            setShowProviderForm(false);
            setEditingProvider(null);
            queryClient.invalidateQueries({ queryKey: ["utility-providers"] });
          }} 
          provider={editingProvider} 
        />
      ) : (
        <ProviderList 
          providers={providers} 
          onDelete={onDeleteProvider} 
          onEdit={onEditProvider} 
          isLoading={isLoading} 
        />
      )}
    </div>
  );
}
