
import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DashboardProperties } from "@/components/dashboard/DashboardProperties";
import { useUserRole } from "@/hooks/use-user-role";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function Properties() {
  const { t } = useTranslation('properties');
  const { userRole } = useUserRole();

  console.log("Properties page - User Role:", userRole);

  const { data: tenancies, isLoading } = useQuery({
    queryKey: ["tenant-properties"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      console.log("Fetching tenant properties for user:", user.id);
      
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
            address,
            type,
            monthly_rent,
            description
          )
        `)
        .eq('tenant_id', user.id)
        .eq('status', 'active');

      if (error) {
        console.error("Error fetching tenant properties:", error);
        throw error;
      }

      console.log("Fetched tenant properties:", data);
      return data;
    },
    enabled: userRole === "tenant"
  });

  // Early return if user is a service provider
  if (userRole === "service_provider") {
    return (
      <div className="flex h-screen bg-gradient-to-br from-dashboard-background to-gray-50">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {t("serviceProvider.notAvailable")}
              </h1>
              <p className="mt-2 text-gray-600">
                {t("serviceProvider.description")}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // For landlords, keep the existing view with management capabilities
  if (userRole === "landlord") {
    return (
      <div className="flex h-screen bg-gradient-to-br from-dashboard-background to-gray-50">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="space-y-6">
              <header className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-xl">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {t("title")}
                  </h1>
                </div>
                <p className="mt-4 text-gray-600">
                  {t("description.landlord")}
                </p>
              </header>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <DashboardProperties userRole="landlord" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Tenant view
  return (
    <div className="flex h-screen bg-gradient-to-br from-dashboard-background to-gray-50">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <header className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-xl">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {t("title")}
                </h1>
              </div>
              <p className="mt-4 text-gray-600">
                {t("description.tenant")}
              </p>
            </header>

            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !tenancies?.length ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-lg text-gray-600">
                      {t("empty.tenant")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {tenancies.map((tenancy) => (
                  <Card key={tenancy.id} className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <CardTitle>{tenancy.property.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">{t("details.address")}</p>
                          <p className="font-medium">{tenancy.property.address}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{t("details.type")}</p>
                          <p className="font-medium">{t(`types.${tenancy.property.type.toLowerCase()}`)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">{t("lease.startDate")}</p>
                            <p className="font-medium">{format(new Date(tenancy.start_date), 'PPP')}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">{t("lease.endDate")}</p>
                            <p className="font-medium">
                              {tenancy.end_date 
                                ? format(new Date(tenancy.end_date), 'PPP')
                                : t("lease.ongoing")}
                            </p>
                          </div>
                        </div>
                        {tenancy.property.description && (
                          <div>
                            <p className="text-sm text-gray-500">{t("details.description")}</p>
                            <p className="text-gray-600">{tenancy.property.description}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
