
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Users, UserPlus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTenants } from "@/hooks/useTenants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

const Tenants = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: tenants, isLoading, error } = useTenants();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Fetch properties to enable selecting one for tenant invitation
  const { data: properties } = useQuery({
    queryKey: ["properties-for-tenant-invite"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("landlord_id", userData.user.id);

      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate("/auth");
      }
    };

    checkAuth();
  }, [navigate]);

  if (error) {
    toast({
      title: "Error",
      description: error.message || "Failed to fetch tenants.",
      variant: "destructive",
    });
  }

  // Function to handle inviting a tenant
  const handleInviteTenant = () => {
    // Navigate to the contract generation page instead
    navigate("/generate-contract");
  };

  // Function to handle inviting a co-tenant
  const handleInviteCoTenant = (tenantId: string, propertyId: string) => {
    navigate(`/properties/${propertyId}/invite-tenant?coTenantFor=${tenantId}`);
  };

  // Function to handle View Details button click
  const handleViewTenantDetails = (tenantId: string) => {
    navigate(`/tenants/${tenantId}`);
  };

  return (
    <div className="flex bg-dashboard-background min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <PageHeader
            icon={Users}
            title="Tenants"
            description="Manage your tenants and their property assignments"
          />

          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Tenant List</h2>
              <p className="text-gray-500 text-sm">View and manage all your tenants</p>
            </div>
            <Button 
              onClick={handleInviteTenant} 
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Invite New Tenant
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Tenants</CardTitle>
              <CardDescription>
                View details of all tenants across your properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
                </div>
              ) : tenants && tenants.length > 0 ? (
                <div className="space-y-4">
                  {tenants.map((tenant) => (
                    <div 
                      key={`${tenant.id}-${tenant.tenancy.id}`} 
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {tenant.first_name} {tenant.last_name}
                            </h3>
                            <Badge variant={tenant.tenancy.status === 'active' ? 'default' : 'secondary'} 
                              className={tenant.tenancy.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}
                            >
                              {tenant.tenancy.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{tenant.email}</p>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Property:</span> {tenant.property.name}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>
                              <span className="font-medium">From:</span> {tenant.tenancy.start_date ? format(new Date(tenant.tenancy.start_date), 'MMM d, yyyy') : 'N/A'}
                            </span>
                            {tenant.tenancy.end_date && (
                              <span>
                                <span className="font-medium">To:</span> {format(new Date(tenant.tenancy.end_date), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3 md:mt-0">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleInviteCoTenant(tenant.id, tenant.property.id)}
                          >
                            <UsersRound className="h-4 w-4 mr-1" />
                            Invite Co-Tenant
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => navigate(`/chat?tenantId=${tenant.id}`)}
                          >
                            Message
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewTenantDetails(tenant.id)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No tenants found</h3>
                  <p className="text-gray-500 mt-2">
                    You don't have any tenants yet. Start by inviting a tenant to one of your properties.
                  </p>
                  <Button 
                    onClick={() => navigate("/properties")} 
                    className="mt-4"
                  >
                    Go to Properties
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Tenants;
