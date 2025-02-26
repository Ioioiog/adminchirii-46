
import { DashboardHeader } from "./sections/DashboardHeader";
import { DashboardMetrics } from "./DashboardMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Calendar, DollarSign, FileText, Building2 } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TenantDashboardProps {
  userId: string;
  userName: string;
  tenantInfo: {
    tenancy_id: string;
    status: string;
    start_date: string;
    end_date?: string;
    property_id: string;
    property_name: string;
    property_address: string;
  };
}

export function TenantDashboard({ userId, userName }: TenantDashboardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fetch all active tenancies for the tenant
  const { data: tenancies, isLoading } = useQuery({
    queryKey: ["tenant-properties", userId],
    queryFn: async () => {
      console.log("Fetching tenant properties for user:", userId);
      const { data, error } = await supabase
        .from('tenancies')
        .select(`
          id,
          status,
          start_date,
          end_date,
          property:properties (
            id,
            name,
            address
          )
        `)
        .eq('tenant_id', userId)
        .eq('status', 'active');

      if (error) {
        console.error("Error fetching tenant properties:", error);
        throw error;
      }

      console.log("Fetched tenant properties:", data);
      return data;
    },
  });

  const quickActions = [
    {
      title: t('dashboard.quickActions.maintenance'),
      description: t('dashboard.quickActions.maintenanceDesc'),
      icon: Home,
      action: () => navigate('/maintenance'),
    },
    {
      title: t('dashboard.quickActions.documents'),
      description: t('dashboard.quickActions.documentsDesc'),
      icon: FileText,
      action: () => navigate('/documents'),
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <p className="text-muted-foreground">{t('dashboard.metrics.loading')}</p>
      </div>
    );
  }

  // Show welcome message and guide when no properties are found
  if (!tenancies?.length) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <section className="bg-white rounded-xl shadow-sm p-6">
          <DashboardHeader userName={userName} />
        </section>

        <section className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto" />
            <h2 className="text-2xl font-semibold text-gray-900">Welcome to Your Tenant Dashboard</h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                You currently don't have any active properties. Here's how you can get started:
              </p>
              <div className="text-left space-y-4 bg-blue-50 p-6 rounded-lg">
                <h3 className="font-medium text-gray-900">Ways to get a property:</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Accept a rental contract invitation from a landlord</li>
                  <li>Sign a rental agreement through the platform</li>
                  <li>Have your existing rental contract registered by your landlord</li>
                </ul>
                <h3 className="font-medium text-gray-900 pt-2">What happens next:</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Wait for your landlord to send you a contract invitation</li>
                  <li>Once received, review and sign the contract</li>
                  <li>After signing, you'll see your property details here</li>
                  <li>You'll be able to manage your rental, submit maintenance requests, and track payments</li>
                </ul>
              </div>
            </div>
            <div className="pt-4">
              <Button 
                onClick={() => navigate('/properties')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                View Properties
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Actions Section */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">{t('dashboard.quickActions.title')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {quickActions.map((action, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <action.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                      <Button onClick={action.action} variant="outline" className="w-full">
                        {t('dashboard.quickActions.viewMore')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <DashboardHeader userName={userName} />
      </section>

      {/* Properties Section */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">{t('dashboard.propertyInfo')}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {tenancies?.map((tenancy) => (
            <Card key={tenancy.id} className="border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">
                  {tenancy.property.name}
                </CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="text-base font-medium">{tenancy.property.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="text-base font-medium">
                        {format(new Date(tenancy.start_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">End Date</p>
                      <p className="text-base font-medium">
                        {tenancy.end_date 
                          ? format(new Date(tenancy.end_date), 'MMM d, yyyy')
                          : t('dashboard.ongoingLease')}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/maintenance')}
                    >
                      {t('dashboard.quickActions.maintenance')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/documents')}
                    >
                      {t('dashboard.quickActions.documents')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Metrics Section */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">{t('dashboard.metrics.title')}</h2>
        <DashboardMetrics userId={userId} userRole="tenant" />
      </section>

      {/* Quick Actions */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">{t('dashboard.quickActions.title')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <action.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                    <Button onClick={action.action} variant="outline" className="w-full">
                      {t('dashboard.quickActions.viewMore')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
