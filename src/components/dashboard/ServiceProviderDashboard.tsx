
import { DashboardHeader } from "./sections/DashboardHeader";
import { DashboardMetrics } from "./DashboardMetrics";

interface ServiceProviderDashboardProps {
  userId: string;
  userName: string;
}

export function ServiceProviderDashboard({ userId, userName }: ServiceProviderDashboardProps) {
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
                <p className="text-muted-foreground">No active jobs at the moment</p>
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
                <p className="text-muted-foreground">No recent activity to display</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
