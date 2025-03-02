
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useUserRole } from "@/hooks/use-user-role";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UtilitiesNavigation } from "./components/UtilitiesNavigation";
import { UtilitiesContent } from "./components/UtilitiesContent";
import { UtilityProvider } from "@/components/utilities/providers/types";
import { CsvImporterDialog } from "./components/CsvImporterDialog";

type UtilitiesSection = 'bills' | 'readings' | 'providers';

export interface UtilityWithProperty {
  id: string;
  property_id: string;
  type: string;
  amount: number;
  due_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  currency: string;
  issued_date: string | null;
  invoice_number: string | null;
  utility_provider_id: string | null;
  property?: {
    name: string;
    address: string;
  };
}

const Utilities = () => {
  const [activeSection, setActiveSection] = useState<UtilitiesSection>('bills');
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [showCsvImporter, setShowCsvImporter] = useState(false);
  const [landlordId, setLandlordId] = useState<string>('');

  const { userRole } = useUserRole();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (userRole === 'landlord') {
      const fetchLandlordId = async () => {
        const { data } = await supabase.auth.getUser();
        if (data && data.user) {
          setLandlordId(data.user.id);
        }
      };
      
      fetchLandlordId();
    }
  }, [userRole]);

  const { data: utilities = [], isLoading: utilitiesLoading } = useQuery({
    queryKey: ['utilities'],
    queryFn: async () => {
      console.log('Fetching utilities...');
      const { data, error } = await supabase
        .from('utilities')
        .select(`
          *,
          property:properties (
            name,
            address
          )
        `);
      if (error) {
        console.error('Error fetching utilities:', error);
        throw error;
      }
      console.log('Fetched utilities:', data);
      return data as UtilityWithProperty[];
    },
    enabled: !!userRole
  });

  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ["utility-providers"],
    queryFn: async () => {
      console.log("Fetching utility providers");
      try {
        const userResponse = await supabase.auth.getUser();
        if (userResponse.error) {
          console.error("Error fetching user:", userResponse.error);
          throw userResponse.error;
        }
        
        const userData = userResponse.data;
        if (!userData.user) {
          console.error("No authenticated user found");
          return [];
        }
        
        const { data, error } = await supabase.from("utility_provider_credentials").select(`
            *,
            property:properties (
              name,
              address
            )
          `).eq("landlord_id", userData.user.id);
          
        if (error) {
          console.error("Error fetching providers:", error);
          throw error;
        }
        
        console.log("Fetched providers:", data);
        return data;
      } catch (error) {
        console.error("Error in utility providers query:", error);
        return [];
      }
    }
  });

  const filteredUtilities = utilities.filter((utility) => {
    const matchesSearch = 
      searchTerm === "" || 
      utility.property?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      utility.property?.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      utility.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || utility.status === statusFilter;
    const matchesType = typeFilter === "all" || utility.type === typeFilter;
    const matchesProperty = propertyFilter === "all" || utility.property_id === propertyFilter;

    return matchesSearch && matchesStatus && matchesType && matchesProperty;
  });

  const handleDeleteProvider = async (id: string) => {
    try {
      console.log("Deleting utility provider:", id);
      const { data: scrapingData, error: scrapingJobsError } = await supabase.from("scraping_jobs").delete().eq("utility_provider_id", id).select();
      console.log("Scraping jobs deletion result:", { scrapingData, scrapingJobsError });
      if (scrapingJobsError) {
        console.error("Error deleting scraping jobs:", scrapingJobsError);
        throw scrapingJobsError;
      }
      const { data: providerData, error: providerError } = await supabase.from("utility_provider_credentials").delete().eq("id", id).select();
      console.log("Provider deletion result:", { providerData, providerError });
      if (providerError) {
        console.error("Error deleting provider:", providerError);
        throw providerError;
      }
      await queryClient.invalidateQueries({ queryKey: ["utility-providers"] });
      await queryClient.refetchQueries({ queryKey: ["utility-providers"] });
    } catch (error) {
      console.error("Error in delete operation:", error);
    }
  };

  const handleEditProvider = (provider: UtilityProvider) => {
    setEditingProvider(provider);
    setShowProviderForm(true);
  };

  if (!userRole || userRole === "service_provider") {
    return <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
        <p>This page is only available for landlords and tenants.</p>
      </div>
    </div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F1F0FB]">
      <DashboardSidebar />
      <div className="flex-1 p-8 bg-zinc-50">
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-white">
            <UtilitiesNavigation 
              activeSection={activeSection} 
              setActiveSection={setActiveSection}
              userRole={userRole}
            />
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <UtilitiesContent
              activeSection={activeSection}
              userRole={userRole}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              propertyFilter={propertyFilter}
              setPropertyFilter={setPropertyFilter}
              filteredUtilities={filteredUtilities}
              providers={providers}
              isProviderLoading={providersLoading}
              landlordId={landlordId}
              showProviderForm={showProviderForm}
              setShowProviderForm={setShowProviderForm}
              editingProvider={editingProvider}
              setEditingProvider={setEditingProvider}
              onDeleteProvider={handleDeleteProvider}
              onEditProvider={handleEditProvider}
              setShowCsvImporter={setShowCsvImporter}
            />
          </CardContent>
        </Card>
      </div>
      <CsvImporterDialog 
        showCsvImporter={showCsvImporter} 
        setShowCsvImporter={setShowCsvImporter}
      />
    </div>
  );
};

export default Utilities;
