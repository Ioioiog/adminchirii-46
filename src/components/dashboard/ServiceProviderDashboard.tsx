
import { DashboardHeader } from "./sections/DashboardHeader";
import { DashboardMetrics } from "./DashboardMetrics";
import { Info, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ServiceProviderDashboardProps {
  userId: string;
  userName: string;
}

export function ServiceProviderDashboard({ userId, userName }: ServiceProviderDashboardProps) {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <section className="bg-white rounded-2xl shadow-sm p-8 transition-all duration-200 hover:shadow-md animate-fade-in">
        <DashboardHeader userName={userName} />
      </section>

      {/* Metrics Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="col-span-full">
          <div className="bg-white rounded-2xl shadow-sm p-8 transition-all duration-200 hover:shadow-md">
            <DashboardMetrics userId={userId} userRole="service_provider" />
          </div>
        </div>
      </section>

      {/* Active Jobs Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-8 transition-all duration-200 hover:shadow-xl">
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-5">
              <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                Active Jobs
              </h2>
              <p className="text-muted-foreground mt-2">
                Track your current maintenance requests and jobs
              </p>
            </div>
            <div className="grid gap-4">
              {/* Active Jobs Content */}
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-gray-100">
                <div className="text-center space-y-4">
                  <Activity className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">No active jobs yet</h3>
                    <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                      Update your service areas and skills to start receiving job requests from property owners.
                    </p>
                    <Button 
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate("/service-areas")}
                    >
                      Set Up Service Areas
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-8 transition-all duration-200 hover:shadow-xl">
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-5">
              <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                Recent Activity
              </h2>
              <p className="text-muted-foreground mt-2">
                Your latest updates and notifications
              </p>
            </div>
            <div className="grid gap-4">
              {/* Recent Activity Content */}
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-gray-100">
                <div className="text-center space-y-4">
                  <Info className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Getting Started Guide</h3>
                    <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                      Complete these steps to start receiving maintenance requests:
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-left max-w-sm mx-auto">
                      <li className="flex items-start gap-2">
                        <span className="font-medium">1.</span>
                        <span>Update your service provider profile with your expertise and experience</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium">2.</span>
                        <span>Define your service areas to match with nearby properties</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium">3.</span>
                        <span>Set up your payment information to receive payments for completed jobs</span>
                      </li>
                    </ul>
                    <Button 
                      variant="outline"
                      className="mt-6"
                      onClick={() => navigate("/service-provider-profile")}
                    >
                      Complete Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
