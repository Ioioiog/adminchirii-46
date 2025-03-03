import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Property } from "@/utils/propertyUtils";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Tenants = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          navigate("/auth");
          return;
        }

        const { data: propertiesData, error } = await supabase
          .from("properties")
          .select(`
            id,
            name,
            address,
            type,
            monthly_rent,
            created_at,
            updated_at,
            description,
            available_from,
            status,
            tenant_count,
            landlord_id,
            currency,
            tenancies (
              id,
              status
            )
          `)
          .eq("landlord_id", userData.user.id);

        if (error) {
          throw error;
        }

        if (propertiesData) {
          const propertiesWithStatus = propertiesData.map(property => ({
            ...property,
            status: property.tenancies?.some(t => t.status === 'active') ? 'occupied' : 'vacant',
            tenant_count: property.tenancies?.filter(t => t.status === 'active').length || 0,
            currency: property.currency || 'EUR' // Add this line to ensure currency is included
          }));
          setProperties(propertiesWithStatus as Property[]);
        }
      } catch (error: any) {
        console.error("Error fetching properties:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to fetch properties.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [navigate, toast]);

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

          <Card>
            <CardHeader>
              <CardTitle>Property List</CardTitle>
              <CardDescription>
                View and manage the properties you own and their tenant assignments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
                </div>
              ) : properties.length > 0 ? (
                <ul className="space-y-4">
                  {properties.map((property) => (
                    <li key={property.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold">{property.name}</h3>
                          <p className="text-gray-600">{property.address}</p>
                        </div>
                        <Button onClick={() => navigate(`/properties/${property.id}`)}>
                          View Details
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No properties found. Add a property to get started.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Tenants;
