
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
import { Tenant } from "@/types/tenant"; // Import Tenant type

const PropertyDetails = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const { userRole } = useUserRole();
  const { properties } = useProperties({
    userRole: userRole === "landlord" || userRole === "tenant" ? userRole : "tenant"
  });

  const { data: tenanciesData = [] } = useQuery({
    queryKey: ['property-tenants', propertyId],
    queryFn: async () => {
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
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!propertyId
  });

  // Convert tenancy data to proper Tenant type format
  const tenants: Tenant[] = tenanciesData.map(tenancy => ({
    id: tenancy.tenant.id,
    first_name: tenancy.tenant.first_name,
    last_name: tenancy.tenant.last_name,
    email: tenancy.tenant.email,
    phone: tenancy.tenant.phone,
    role: 'tenant', // Assuming tenants have role 'tenant'
    created_at: new Date().toISOString(), // Use current date as fallback
    updated_at: new Date().toISOString(), // Use current date as fallback
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

  const { data: paymentsData = [] } = useQuery({
    queryKey: ['property-payments', propertyId],
    queryFn: async () => {
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
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!propertyId
  });

  useEffect(() => {
    if (properties && propertyId) {
      const foundProperty = properties.find((p) => p.id === propertyId);
      setProperty(foundProperty);
      setIsLoading(false);
    }
  }, [properties, propertyId]);

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
                  <TenantList tenants={tenants} isLandlord={userRole === "landlord"} />
                </CardContent>
              </Card>
              
              <MaintenanceRequestList propertyId={propertyId} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentList 
                    payments={paymentsData} 
                    isLoading={false} 
                    userRole={userRole as "landlord" | "tenant"} 
                    userId={""} 
                    propertyFilter={""} 
                    statusFilter={""} 
                    searchTerm={""}
                  />
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
