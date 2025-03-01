
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useUserRole } from "@/hooks/use-user-role";
import { PropertyDetailsCard } from "@/components/properties/PropertyDetailsCard";
import { PropertyUpdateDialog } from "@/components/properties/PropertyUpdateDialog";
import { PropertyDeleteDialog } from "@/components/properties/PropertyDeleteDialog";
import { TenantList } from "@/components/tenants/TenantList";
import { MaintenanceRequestList } from "@/components/maintenance/MaintenanceRequestList";
import { PaymentList } from "@/components/payments/PaymentList";
import { DocumentList } from "@/components/documents/DocumentList";
import { UtilityAnalysisChart } from "@/components/properties/UtilityAnalysisChart";
import { Tenant } from "@/types/tenant";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PropertyDetails = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const { userRole, userId } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Fetch property data directly using propertyId
  const { 
    data: property, 
    isLoading: propertyLoading,
    error: propertyError
  } = useQuery({
    queryKey: ['property-details', propertyId],
    queryFn: async () => {
      console.log('Fetching property data for ID:', propertyId);
      
      let query = supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId);
        
      // Apply different condition based on user role
      if (userRole === 'tenant' && userId) {
        // For tenants, only allow access to properties they're renting
        query = supabase
          .from('properties')
          .select(`
            *,
            tenancies!inner (
              id, 
              status,
              tenant_id
            )
          `)
          .eq('id', propertyId)
          .eq('tenancies.tenant_id', userId)
          .eq('tenancies.status', 'active');
      }
      
      const { data, error } = await query.single();
      
      if (error) {
        console.error('Error fetching property:', error);
        throw error;
      }
      
      console.log('Property data fetched:', data);
      return data;
    },
    enabled: !!propertyId && !!userRole,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch tenants information
  const { 
    data: tenanciesData = [], 
    isLoading: tenantsLoading 
  } = useQuery({
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
    enabled: !!propertyId && !propertyLoading && !!property,
  });

  // Fetch payments information
  const { 
    data: paymentsData = [], 
    isLoading: paymentsLoading 
  } = useQuery({
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
    enabled: !!propertyId && !propertyLoading && !!property,
  });

  // Format tenancy data to Tenant type
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

  // Handle error state
  useEffect(() => {
    if (propertyError) {
      console.error('Error loading property:', propertyError);
      toast({
        title: "Property not found",
        description: "The requested property could not be found or you don't have access to it.",
        variant: "destructive"
      });
      
      // Navigate back to properties page after error
      setTimeout(() => {
        navigate('/properties');
      }, 3000);
    }
  }, [propertyError, toast, navigate]);

  // Render property details page
  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="mb-4">
          <CardTitle className="text-2xl font-bold">
            Property Details
          </CardTitle>
        </div>
        
        {propertyLoading ? (
          <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : !property ? (
          <div className="flex flex-col items-center justify-center h-64">
            <h3 className="text-xl font-semibold mb-2">Property Not Found</h3>
            <p className="text-muted-foreground">The property you're looking for doesn't exist or you don't have access to it.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate('/properties')}
            >
              Back to Properties
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <PropertyDetailsCard property={property} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userRole === "landlord" && (
                <>
                  <PropertyUpdateDialog property={property} />
                  <PropertyDeleteDialog property={property} />
                </>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle>Tenants</CardTitle>
                </CardHeader>
                <CardContent>
                  {tenantsLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    </div>
                  ) : tenants.length > 0 ? (
                    <TenantList tenants={tenants} isLandlord={userRole === "landlord"} />
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No tenants assigned to this property.</p>
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
                      userId={userId || ""} 
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
