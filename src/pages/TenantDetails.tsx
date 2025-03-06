
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { ArrowLeft, User, Home, Calendar, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tenant } from "@/types/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

const TenantDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTenantDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch tenant details from the tenant_details view
        const { data, error } = await supabase
          .from('tenant_details')
          .select('*')
          .eq('tenant_id', id)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          // Transform the data to match the Tenant type
          const formattedTenant: Tenant = {
            id: data.tenant_id,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            role: data.role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            property: {
              id: data.property_id,
              name: data.property_name,
              address: data.property_address,
            },
            tenancy: {
              id: data.tenancy_id,
              start_date: data.start_date,
              end_date: data.end_date,
              status: data.tenancy_status,
            },
          };
          
          setTenant(formattedTenant);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch tenant details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantDetails();
  }, [id, toast]);

  return (
    <div className="flex bg-dashboard-background min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/tenants")}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tenants
            </Button>
          </div>

          <PageHeader
            icon={User}
            title={tenant ? `${tenant.first_name} ${tenant.last_name}` : "Tenant Details"}
            description="View and manage tenant information"
          />

          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
            </div>
          ) : tenant ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium">{tenant.first_name} {tenant.last_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge variant={tenant.tenancy.status === 'active' ? 'default' : 'secondary'} 
                        className={tenant.tenancy.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}
                      >
                        {tenant.tenancy.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Email
                      </p>
                      <p className="font-medium">{tenant.email || "Not provided"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Phone
                      </p>
                      <p className="font-medium">{tenant.phone || "Not provided"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Property Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Home className="h-4 w-4" /> Property
                      </p>
                      <p className="font-medium">{tenant.property.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{tenant.property.address}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Tenancy Start Date
                      </p>
                      <p className="font-medium">
                        {tenant.tenancy.start_date ? 
                          format(new Date(tenant.tenancy.start_date), 'MMM d, yyyy') : 
                          "Not set"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Tenancy End Date
                      </p>
                      <p className="font-medium">
                        {tenant.tenancy.end_date ? 
                          format(new Date(tenant.tenancy.end_date), 'MMM d, yyyy') : 
                          "Not set"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4 mt-6">
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/chat?tenantId=${tenant.id}`)}
                >
                  Message Tenant
                </Button>
                <Button 
                  variant="default"
                  onClick={() => navigate(`/generate-contract?tenantId=${tenant.id}`)}
                >
                  Generate Contract
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Tenant Not Found</h3>
                <p className="text-gray-500 mb-6">The tenant you're looking for doesn't exist or you don't have permission to view it.</p>
                <Button onClick={() => navigate("/tenants")}>
                  Return to Tenant List
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default TenantDetails;
