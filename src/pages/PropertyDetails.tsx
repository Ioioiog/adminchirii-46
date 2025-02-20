
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, User, DollarSign, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { PropertyStatus } from "@/utils/propertyUtils";

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          tenancies(
            id,
            status,
            tenant:profiles(
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: PropertyStatus) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'occupied':
        return 'bg-green-100 text-green-800';
      case 'vacant':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (!property) {
    return (
      <div className="flex bg-[#F8F9FC] min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h2 className="text-lg font-medium">Property not found</h2>
              <p className="mt-1 text-gray-500">The property you're looking for doesn't exist.</p>
              <Button
                onClick={() => navigate("/properties")}
                className="mt-4"
                variant="outline"
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

  const status = property.tenancies?.some(t => t.status === 'active') ? 'occupied' : 'vacant';
  const activeTenants = property.tenancies?.filter(t => t.status === 'active') || [];

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/properties")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">{property.name}</h1>
                <p className="text-gray-500">{property.address}</p>
              </div>
            </div>
            <Badge className={getStatusColor(status)}>
              {status}
            </Badge>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Property Details</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-gray-500">{property.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Home className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Property Type</p>
                      <p className="text-sm text-gray-500">{property.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Monthly Rent</p>
                      <p className="text-sm text-gray-500">
                        ${property.monthly_rent?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Available From</p>
                      <p className="text-sm text-gray-500">
                        {property.available_from ? format(new Date(property.available_from), 'PPP') : 'Not specified'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Active Tenants</p>
                      <p className="text-sm text-gray-500">{activeTenants.length}</p>
                    </div>
                  </div>
                </div>

                {property.description && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h3 className="text-sm font-medium mb-2">Description</h3>
                      <p className="text-sm text-gray-500">{property.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Active Tenants</h2>
              </CardHeader>
              <CardContent>
                {activeTenants.length > 0 ? (
                  <div className="divide-y">
                    {activeTenants.map((tenancy) => (
                      <div key={tenancy.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {tenancy.tenant.first_name} {tenancy.tenant.last_name}
                            </p>
                            <p className="text-sm text-gray-500">{tenancy.tenant.email}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/tenants/${tenancy.tenant.id}`)}
                          >
                            View Tenant
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No active tenants</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PropertyDetails;
