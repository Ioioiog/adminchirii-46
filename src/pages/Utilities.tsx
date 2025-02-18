
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Gauge, Plug } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { UtilityDialog } from "@/components/utilities/UtilityDialog";
import { UtilityList } from "@/components/utilities/UtilityList";
import { MeterReadingDialog } from "@/components/meter-readings/MeterReadingDialog";
import { MeterReadingList } from "@/components/meter-readings/MeterReadingList";
import { useProperties } from "@/hooks/useProperties";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type UtilitiesSection = 'bills' | 'readings';

const Utilities = () => {
  const [activeSection, setActiveSection] = useState<UtilitiesSection>('bills');
  const { userRole } = useUserRole();
  const { properties, isLoading: propertiesLoading } = useProperties({ 
    userRole: userRole === "landlord" || userRole === "tenant" ? userRole : "tenant"
  });

  // Fetch utilities data
  const { data: utilities = [], isLoading: utilitiesLoading } = useQuery({
    queryKey: ['utilities'],
    queryFn: async () => {
      console.log('Fetching utilities...');
      const { data, error } = await supabase
        .from('utilities')
        .select(`
          id,
          property_id,
          type,
          amount,
          currency,
          due_date,
          status,
          issued_date,
          invoice_number,
          created_at,
          updated_at,
          property:properties (
            name,
            address
          )
        `);

      if (error) {
        console.error('Error fetching utilities:', error);
        throw error;
      }

      console.log('Fetched utilities:', data);
      return data || [];
    },
    enabled: !!userRole
  });

  // Only allow landlord or tenant roles to access this page
  if (!userRole || userRole === "service_provider") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
          <p>This page is only available for landlords and tenants.</p>
        </div>
      </div>
    );
  }

  const navigationItems = [
    {
      id: 'bills' as UtilitiesSection,
      label: 'Utility Bills',
      icon: Plug,
    },
    {
      id: 'readings' as UtilitiesSection,
      label: 'Meter Readings',
      icon: Gauge,
    },
  ];

  const renderSection = () => {
    // Ensure we only render for landlord or tenant roles
    if (userRole !== "landlord" && userRole !== "tenant") return null;

    switch (activeSection) {
      case 'bills':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-xl">
                    <Plug className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Utilities</CardTitle>
                </div>
                <p className="text-gray-500 max-w-2xl">
                  Manage and track utility services for your properties.
                </p>
              </div>
              {userRole === "landlord" && properties && (
                <UtilityDialog
                  properties={properties}
                  onUtilityCreated={() => {}} // Add your refresh logic here
                />
              )}
            </div>
            {utilitiesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : (
              <UtilityList
                utilities={utilities}
                userRole={userRole}
                onStatusUpdate={() => {}} // Add your refresh logic here
              />
            )}
          </div>
        );
      case 'readings':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-xl">
                    <Gauge className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Meter Readings</CardTitle>
                </div>
                <p className="text-gray-500 max-w-2xl">
                  Track and manage utility meter readings for your properties.
                </p>
              </div>
              <MeterReadingDialog
                properties={properties}
                onReadingCreated={() => {}} // Add your refresh logic here
                userRole={userRole}
                userId={null} // Add your user ID here
              />
            </div>
            <MeterReadingList
              readings={[]} // Add your readings data here
              userRole={userRole}
              onUpdate={() => {}} // Add your refresh logic here
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (propertiesLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar />
      <div className="flex-1 p-8">
        <Card>
          <CardHeader>
            <div className="w-full flex gap-4 bg-card overflow-x-auto">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? 'default' : 'ghost'}
                  className={cn(
                    "flex-shrink-0 gap-2",
                    activeSection === item.id && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setActiveSection(item.id)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {renderSection()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Utilities;
