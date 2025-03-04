
import { useState, useEffect } from "react";
import { useUserRole } from "@/hooks/use-user-role";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UtilitiesContent } from "./components/UtilitiesContent";
import { UtilityBillsSection } from "./components/sections/UtilityBillsSection";
import { UtilityProvidersSection } from "./components/sections/UtilityProvidersSection";
import { MeterReadingsSection } from "./components/sections/MeterReadingsSection";
import { CsvImporterDialog } from "./components/CsvImporterDialog";
import { CostCalculator } from "@/components/financial/CostCalculator";

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
  invoiced_percentage?: number;
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

  useEffect(() => {
    if (userId) {
      fetchUtilities();
    }
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
          invoiced_percentage,
          property:properties (
            name,
            address
          )
        `);

      // Apply userRole filter
      if (userRole === 'tenant') {
        // Get properties assigned to this tenant
        const { data: tenancies } = await supabase
          .from('tenancies')
          .select('property_id')
          .eq('tenant_id', userId)
          .eq('status', 'active');
        
        if (tenancies && tenancies.length > 0) {
          const propertyIds = tenancies.map(t => t.property_id);
          query = query.in('property_id', propertyIds);
        } else {
          // No properties assigned to this tenant
          setUtilities([]);
          setIsLoading(false);
          return;
        }
      } else if (userRole === 'landlord') {
        // Get properties owned by this landlord
        const { data: properties } = await supabase
          .from('properties')
          .select('id')
          .eq('landlord_id', userId);
        
        if (properties && properties.length > 0) {
          const propertyIds = properties.map(p => p.id);
          query = query.in('property_id', propertyIds);
        } else {
          // No properties owned by this landlord
          setUtilities([]);
          setIsLoading(false);
          return;
        }
      }

      // Apply search filter (simple implementation)
      if (searchTerm) {
        query = query.or(`type.ilike.%${searchTerm}%,invoice_number.ilike.%${searchTerm}%`);
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      // Apply type filter
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }
      
      // Apply property filter
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

  // Render the appropriate section based on activeTab
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
        return <UtilityProvidersSection userRole={userRole || "tenant"} />;
      case "meter-readings":
        return <MeterReadingsSection />;
      case "calculator":
        return <CostCalculator />;
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

  // If the user ID is not available yet, we're still loading
  if (!userId) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <UtilitiesContent
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLoading={isLoading}
      >
        {renderActiveSection()}
      </UtilitiesContent>

      {showCsvImporter && (
        <CsvImporterDialog
          open={showCsvImporter}
          onOpenChange={setShowCsvImporter}
          onImportComplete={fetchUtilities}
        />
      )}
    </>
  );
};

export default Utilities;
