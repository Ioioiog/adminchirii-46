
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useProperties } from "@/hooks/useProperties";
import { useUserRole } from "@/hooks/use-user-role";
import { PropertyDetailsCard } from "@/components/properties/PropertyDetailsCard";
import { PropertyUpdateDialog } from "@/components/properties/PropertyUpdateDialog";
import { PropertyDeleteDialog } from "@/components/properties/PropertyDeleteDialog";
import { TenantList } from "@/components/tenants/TenantList";
import { MaintenanceRequestList } from "@/components/maintenance/MaintenanceRequestList";
import { PaymentList } from "@/components/payments/PaymentList";
import { DocumentList } from "@/components/documents/DocumentList";
import { UtilityAnalysisChart } from "@/components/properties/UtilityAnalysisChart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tenant } from "@/types/tenant";
import { useToast } from "@/hooks/use-toast";

const PropertyDetails = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const { userRole } = useUserRole();
  const { toast } = useToast();

  // Direct property fetch with propertyId
  const { data: propertyData, isLoading: propertyLoading, error: propertyError } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      console.log('Fetching direct property data for ID:', propertyId);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();
      
      if (error) {
        console.error('Error fetching property:', error);
        throw error;
      }
      
      console.log('Direct property data:', data);
      return data;
    },
    enabled: !!propertyId,
    retry: 2
  });
  
  // Legacy properties fetch for backward compatibility
  const { properties, isLoading: propertiesLoading } = useProperties({
    userRole: userRole === "landlord" || userRole === "tenant" ? userRole : "tenant"
  });

  const { data: tenanciesData = [], isLoading: tenanciesLoading } = useQuery({
    queryKey: ['property-tenants', propertyId],
    queryFn: async () => {
      console.log('Fetching tenancies for property:', propertyId);
      const { data, error } = await supabase
        .from('tenancies')
        .select(`
          id,
          tenant_id,
          start_date,
          end_date,
          status,
          tenant:profiles(id, first_name, last_name, email, phone)
        `)
        .eq('property_id', propertyId)
        .eq('status', 'active');
      
      if (error) {
        console.error('Error fetching tenancies:', error);
        throw error;
      }
      
      console.log('Tenancies data:', data);
      return data || [];
    },
    enabled: !!propertyId
  });

  // Convert tenancy data to proper Tenant type format
  const tenants: Tenant[] = tenanciesData.map(tenancy => ({
    id: tenancy.tenant?.id,
    first_name: tenancy.tenant?.first_name,
    last_name: tenancy.tenant?.last_name,
    email: tenancy.tenant?.email,
    phone: tenancy.tenant?.phone,
    role: 'tenant',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    property: {
      id: propertyId,
      name: property?.name || "",
      address: property?.address || ""
    },
    tenancy: {
      id: tenancy.id,
      start_date: tenancy.start_date,
      end_date: tenancy.end_date,
      status: tenancy.status
    }
  }));

  const { data: paymentsData = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['property-payments', propertyId],
    queryFn: async () => {
      console.log('Fetching payments for property:', propertyId);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          status,
          due_date,
          paid_date,
          created_at,
          updated_at,
          tenancy_id,
          tenancy:tenancies(
            id, 
            tenant:profiles(id, first_name, last_name, email),
            property:properties(id, name, address)
          )
        `)
        .eq('tenancy.property_id', propertyId)
        .order('due_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }
      
      console.log('Payments data:', data);
      return data || [];
    },
    enabled: !!propertyId
  });

  // Use the directly fetched property data first, and fall back to legacy method
  useEffect(() => {
    if (!propertyLoading && propertyData) {
      console.log('Setting property from direct fetch:', propertyData);
      setProperty(propertyData);
      setIsLoading(false);
    } else if (propertyError) {
      console.log('Direct property fetch failed, trying legacy method');
      
      if (!propertiesLoading && properties && propertyId) {
        console.log('Properties loaded from legacy method. Looking for propertyId:', propertyId);
        console.log('Available properties:', properties);
        
        const foundProperty = properties.find((p) => p.id === propertyId);
        if (foundProperty) {
          console.log('Found property in legacy properties list:', foundProperty);
          setProperty(foundProperty);
        } else {
          console.log('Property not found in properties list:', propertyId);
          toast({
            title: "Property not found",
            description: "The requested property could not be found in your properties.",
            variant: "destructive"
          });
        }
        setIsLoading(false);
      }
    }
  }, [propertyData, propertyLoading, propertyError, properties, propertyId, propertiesLoading, toast]);

  // If it's taking too long to load, show an error
  useEffect(() => {
    let timeout;
    if (isLoading) {
      timeout = setTimeout(() => {
        if (isLoading) {
          console.log("Loading timeout reached. PropertyData:", propertyData, "Properties:", properties);
          setIsLoading(false);
          toast({
            title: "Loading timeout",
            description: "There was an issue loading the property details. Please try again.",
            variant: "destructive"
          });
        }
      }, 10000); // 10 second timeout
    }
    
    return () => clearTimeout(timeout);
  }, [isLoading, propertyData, properties, toast]);

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="mb-4">
          <CardTitle className="text-2xl font-bold">
            Property Details
          </CardTitle>
        </div>
        
        {isLoading ? (
          <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : !property ? (
          <div className="flex flex-col items-center justify-center h-64">
            <h3 className="text-xl font-semibold mb-2">Property Not Found</h3>
            <p className="text-muted-foreground">The property you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <PropertyDetailsCard property={property} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PropertyUpdateDialog property={property} />
              <PropertyDeleteDialog property={property} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Tenants</CardTitle>
                </CardHeader>
                <CardContent>
                  {tenanciesLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    </div>
                  ) : (
                    <TenantList tenants={tenants} isLandlord={userRole === "landlord"} />
                  )}
                </CardContent>
              </Card>
              
              <MaintenanceRequestList propertyId={propertyId} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentsLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    </div>
                  ) : (
                    <PaymentList 
                      payments={paymentsData} 
                      isLoading={false} 
                      userRole={userRole as "landlord" | "tenant"} 
                      userId={""} 
                      propertyFilter={""} 
                      statusFilter={""} 
                      searchTerm={""}
                    />
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentList 
                    propertyId={propertyId}
                    documentType="" 
                    searchTerm="" 
                  />
                </CardContent>
              </Card>
              
              <div className="md:col-span-2">
                <UtilityAnalysisChart propertyId={propertyId} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PropertyDetails;
