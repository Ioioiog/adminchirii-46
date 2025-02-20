import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, User, Calendar, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { EditTenantDialog } from "@/components/tenants/EditTenantDialog";

const PropertyTenants = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: propertyWithTenants, isLoading } = useQuery({
    queryKey: ["property-tenants", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          tenancies(
            id,
            start_date,
            end_date,
            status,
            tenant:profiles(
              id,
              first_name,
              last_name,
              email,
              phone
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleRemoveTenant = async (tenancyId: string) => {
    try {
      const { error } = await supabase
        .from("tenancies")
        .update({ status: "inactive" })
        .eq("id", tenancyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tenant removed successfully",
      });
    } catch (error) {
      console.error("Error removing tenant:", error);
      toast({
        title: "Error",
        description: "Failed to remove tenant",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex bg-[#F8F9FC] min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            Loading...
          </div>
        </main>
      </div>
    );
  }

  if (!propertyWithTenants) {
    return (
      <div className="flex bg-[#F8F9FC] min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-medium">Property not found</h2>
              <Button
                onClick={() => navigate("/properties")}
                variant="outline"
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Properties
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const activeTenancies = propertyWithTenants.tenancies?.filter(
    (t) => t.status === "active"
  ) || [];

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate(`/properties/${id}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Property
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">{propertyWithTenants.name}</h1>
                <p className="text-gray-500">Manage property tenants</p>
              </div>
            </div>
            <Button onClick={() => navigate(`/properties/${id}/invite-tenant`)}>
              Add New Tenant
            </Button>
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Current Tenants</h2>
              <p className="text-sm text-gray-500">
                {activeTenancies.length} active {activeTenancies.length === 1 ? "tenant" : "tenants"}
              </p>
            </CardHeader>
            <CardContent>
              {activeTenancies.length > 0 ? (
                <div className="space-y-6">
                  {activeTenancies.map((tenancy) => (
                    <div
                      key={tenancy.id}
                      className="bg-white rounded-lg border p-6 space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {tenancy.tenant.first_name} {tenancy.tenant.last_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">Active</Badge>
                              <EditTenantDialog
                                tenant={{
                                  ...tenancy.tenant,
                                  tenancy: {
                                    start_date: tenancy.start_date,
                                    end_date: tenancy.end_date,
                                    monthly_pay_day: tenancy.monthly_pay_day,
                                  },
                                  property: propertyWithTenants,
                                }}
                                onUpdate={() => {
                                  window.location.reload();
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span className="text-sm">{tenancy.tenant.email}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span className="text-sm">
                              {tenancy.tenant.phone || "No phone number"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">
                              From: {format(new Date(tenancy.start_date), "PPP")}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">
                              To: {tenancy.end_date ? format(new Date(tenancy.end_date), "PPP") : "Ongoing"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/tenants/${tenancy.tenant.id}`)}
                        >
                          View Profile
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/chat?tenantId=${tenancy.tenant.id}`)}
                        >
                          Message
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleRemoveTenant(tenancy.id)}
                        >
                          Remove Tenant
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-sm font-medium">No Active Tenants</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This property currently has no active tenants.
                  </p>
                  <Button
                    onClick={() => navigate(`/properties/${id}/invite-tenant`)}
                    variant="outline"
                    className="mt-4"
                  >
                    Add New Tenant
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

export default PropertyTenants;
