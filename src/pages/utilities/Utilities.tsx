import { useState, useEffect } from "react";
import { useUserRole } from "@/hooks/use-user-role";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UtilitiesContent } from "./components/UtilitiesContent";
import { UtilityBillsSection } from "./components/sections/UtilityBillsSection";
import { UtilityProvidersSection } from "./components/sections/UtilityProvidersSection";
import { MeterReadingsSection } from "./components/sections/MeterReadingsSection";
import { CsvImporterDialog } from "./components/CsvImporterDialog";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export interface UtilityWithProperty {
  id: string;
  property_id: string;
  type: string;
  amount: number;
  currency: string;
  due_date: string;
  issued_date?: string;
  invoice_number?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  invoiced?: boolean;
  invoiced_amount?: number;
  metadata_amount?: number;
  document_path?: string | null;
  property?: {
    name: string;
    address: string;
  } | null;
}

const Utilities = () => {
  const { userRole, userId } = useUserRole();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("utilities");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [utilities, setUtilities] = useState<UtilityWithProperty[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCsvImporter, setShowCsvImporter] = useState<boolean>(false);
  
  const [providers, setProviders] = useState<any[]>([]);
  const [isProviderLoading, setIsProviderLoading] = useState<boolean>(true);
  const [showProviderForm, setShowProviderForm] = useState<boolean>(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    
    if (userId) {
      const fetchData = async () => {
        try {
          await fetchUtilities();
        } catch (error) {
          console.error("Error in fetchData:", error);
        }
      };
      
      fetchData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [userId, userRole, searchTerm, statusFilter, typeFilter, propertyFilter]);

  const fetchUtilities = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching utilities with filters:', {
        userRole,
        searchTerm,
        statusFilter,
        typeFilter,
        propertyFilter
      });

      let query = supabase
        .from("utilities")
        .select(`
          id,
          property_id,
          type,
          amount,
          currency,
          due_date,
          issued_date,
          invoice_number,
          status,
          created_at,
          updated_at,
          invoiced,
          invoiced_amount,
          metadata_amount,
          document_path,
          property:properties (
            name,
            address
          )
        `);

      if (userRole === 'tenant') {
        const { data: tenancies } = await supabase
          .from('tenancies')
          .select('property_id')
          .eq('tenant_id', userId)
          .eq('status', 'active');
        
        if (tenancies && tenancies.length > 0) {
          const propertyIds = tenancies.map(t => t.property_id);
          query = query.in('property_id', propertyIds);
        } else {
          setUtilities([]);
          setIsLoading(false);
          return;
        }
      } else if (userRole === 'landlord') {
        const { data: properties } = await supabase
          .from('properties')
          .select('id')
          .eq('landlord_id', userId);
        
        if (properties && properties.length > 0) {
          const propertyIds = properties.map(p => p.id);
          query = query.in('property_id', propertyIds);
        } else {
          setUtilities([]);
          setIsLoading(false);
          return;
        }
      }

      if (searchTerm) {
        query = query.or(`type.ilike.%${searchTerm}%,invoice_number.ilike.%${searchTerm}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (typeFilter !== 'all') {
        const safeTypeFilter = typeFilter as "electricity" | "water" | "gas" | "internet" | "building maintenance" | "other";
        query = query.eq('type', safeTypeFilter);
      }
      
      if (propertyFilter !== 'all') {
        query = query.eq('property_id', propertyFilter);
      }

      const { data, error } = await query
        .order('due_date', { ascending: false });

      if (error) throw error;

      console.log('Fetched utilities:', data);
      setUtilities(data || []);
    } catch (error) {
      console.error('Error fetching utilities:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch utilities",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    try {
      const { error } = await supabase
        .from('utility_provider_credentials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      fetchProviders();
      
      toast({
        title: "Success",
        description: "Provider deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting provider:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete provider",
      });
    }
  };

  const handleEditProvider = (provider: any) => {
    setEditingProvider(provider);
    setShowProviderForm(true);
  };

  const fetchProviders = async () => {
    if (userRole !== 'landlord' || !userId) return;
    
    try {
      setIsProviderLoading(true);
      const { data, error } = await supabase
        .from('utility_provider_credentials')
        .select('*, property:properties(name, address)')
        .eq('landlord_id', userId);
      
      if (error) throw error;
      
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch utility providers",
      });
    } finally {
      setIsProviderLoading(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    console.log("Tab changed to:", tabId);
    setActiveTab(tabId);
  };

  const renderActiveSection = () => {
    switch (activeTab) {
      case "utilities":
        return (
          <UtilityBillsSection
            userRole={userRole || "tenant"}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            propertyFilter={propertyFilter}
            setPropertyFilter={setPropertyFilter}
            utilities={utilities}
            setShowCsvImporter={setShowCsvImporter}
          />
        );
      case "providers":
        return <UtilityProvidersSection
          providers={providers}
          isLoading={isProviderLoading}
          landlordId={userId || ""}
          showProviderForm={showProviderForm}
          setShowProviderForm={setShowProviderForm}
          editingProvider={editingProvider}
          setEditingProvider={setEditingProvider}
          onDeleteProvider={handleDeleteProvider}
          onEditProvider={handleEditProvider}
          userRole={userRole || "tenant"}
        />;
      case "meter-readings":
        return <MeterReadingsSection userRole={userRole || "tenant"} />;
      default:
        return (
          <UtilityBillsSection
            userRole={userRole || "tenant"}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            propertyFilter={propertyFilter}
            setPropertyFilter={setPropertyFilter}
            utilities={utilities}
            setShowCsvImporter={setShowCsvImporter}
          />
        );
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    if (userRole === 'landlord' && userId) {
      fetchProviders();
    }
    
    return () => {
      isMounted = false;
    };
  }, [userRole, userId]);

  if (!userId) {
    return <div>Loading...</div>;
  }

  const filteredUtilities = utilities;

  return (
    <DashboardLayout>
      <div className="p-4">
        <UtilitiesContent
          activeSection={activeTab as any}
          userRole={userRole || "tenant"}
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
          isProviderLoading={isProviderLoading}
          landlordId={userId || ""}
          showProviderForm={showProviderForm}
          setShowProviderForm={setShowProviderForm}
          editingProvider={editingProvider}
          setEditingProvider={setEditingProvider}
          onDeleteProvider={handleDeleteProvider}
          onEditProvider={handleEditProvider}
          setShowCsvImporter={setShowCsvImporter}
          onTabChange={handleTabChange}
        >
          {renderActiveSection()}
        </UtilitiesContent>
      </div>

      {showCsvImporter && (
        <CsvImporterDialog
          showCsvImporter={showCsvImporter}
          setShowCsvImporter={setShowCsvImporter}
        />
      )}
    </DashboardLayout>
  );
};

export default Utilities;
