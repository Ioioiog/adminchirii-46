import { DashboardHeader } from "./sections/DashboardHeader";
import { DashboardMetrics } from "./DashboardMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Calendar, DollarSign, FileText, Building2, Info } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TenantDashboardProps {
  userId: string;
  userName: string;
}

export function TenantDashboard({ userId, userName }: TenantDashboardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

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
      title: t('quickActions.maintenance'),
      description: t('quickActions.maintenanceDesc'),
      icon: Home,
      action: () => navigate('/maintenance'),
      features: [
        "Submit new maintenance requests",
        "Track repair progress in real-time",
        "Schedule maintenance visits"
      ]
    },
    {
      title: t('quickActions.documents'),
      description: t('quickActions.documentsDesc'),
      icon: FileText,
      action: () => navigate('/documents'),
      features: [
        "View rental agreements",
        "Download payment receipts",
        "Store important documents"
      ]
    },
  ];

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <section className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6">
          <DashboardHeader userName={userName} />
        </section>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!tenancies?.length) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <section className="mb-8 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm p-6 border border-gray-100">
          <DashboardHeader userName={userName} />
        </section>

        <section className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-full lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 border-none shadow-md">
            <CardContent className="p-8">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-4">
                  <div className="bg-white/80 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center shadow-sm">
                    <Building2 className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
                    Welcome to Your Tenant Dashboard
                  </h2>
                  <p className="text-lg text-gray-600">
                    You currently don't have any active properties. Here's how you can get started:
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-gray-900">Ways to get a property:</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-4">
                        {[
                          "Accept a rental contract invitation from a landlord",
                          "Sign a rental agreement through the platform",
                          "Have your existing rental contract registered by your landlord"
                        ].map((item, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                            </div>
                            <span className="text-gray-600">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-gray-900">What happens next:</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-4">
                        {[
                          "Wait for your landlord to send you a contract invitation",
                          "Once received, review and sign the contract",
                          "After signing, you'll see your property details here",
                          "You'll be able to manage your rental, submit maintenance requests, and track payments"
                        ].map((item, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                            <span className="text-gray-600">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center pt-6">
                  <Button 
                    onClick={() => navigate('/documents/contracts')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 h-auto text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    View Contracts
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-full lg:col-span-1 bg-gradient-to-br from-indigo-50 to-blue-50 border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">{t('quickActions.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quickActions.map((action, index) => (
                <Card key={index} className="bg-white/80 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <action.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-1">{action.title}</h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                        <Button 
                          onClick={action.action}
                          variant="ghost" 
                          className="mt-2 w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          {t('quickActions.viewMore')} →
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Info className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Quick Tips</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                          Click on any action to access its features
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                          Use maintenance requests for property issues
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                          Track requests in real-time
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <section className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6">
        <DashboardHeader userName={userName} />
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6">
        <DashboardMetrics userId={userId} userRole="tenant" />
      </section>

      <section className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-8">
        <h2 className="text-2xl font-semibold mb-6">{t('propertyInfo')}</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {tenancies?.map((tenancy) => (
            <Card key={tenancy.id} className="group hover:shadow-xl transition-all duration-300 border-2 border-gray-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
                <CardTitle className="text-xl font-semibold">
                  {tenancy.property.name}
                </CardTitle>
                <div className="p-2 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <Home className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-4">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-900 font-medium">{tenancy.property.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="text-gray-900 font-medium">
                        {format(new Date(tenancy.start_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">End Date</p>
                      <p className="text-gray-900 font-medium">
                        {tenancy.end_date 
                          ? format(new Date(tenancy.end_date), 'MMM d, yyyy')
                          : t('ongoingLease')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      onClick={() => navigate('/maintenance')}
                    >
                      {t('quickActions.maintenance')}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      onClick={() => navigate('/documents')}
                    >
                      {t('quickActions.documents')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{t('quickActions.title')}</h2>
          <p className="text-gray-600">Access frequently used features and manage your rental efficiently with these quick actions.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow border-2 border-gray-100">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <action.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-2 pl-4">
                    {action.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    onClick={action.action} 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    {t('quickActions.viewMore')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How to use Quick Actions</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Click on any action card to access its detailed features</li>
                <li>• Use maintenance requests for any property-related issues</li>
                <li>• Access documents section for all your paperwork needs</li>
                <li>• Track the status of your requests in real-time</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
