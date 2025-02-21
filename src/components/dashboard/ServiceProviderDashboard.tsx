import { DashboardHeader } from "./sections/DashboardHeader";
import { DashboardMetrics } from "./DashboardMetrics";

interface ServiceProviderDashboardProps {
  userId: string;
  userName: string;
}

export function ServiceProviderDashboard({ userId, userName }: ServiceProviderDashboardProps) {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <section className="bg-white rounded-xl shadow-sm p-6 transition-all duration-200 hover:shadow-md">
        <DashboardHeader userName={userName} />
      </section>

      {/* Metrics Section */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <DashboardMetrics userId={userId} userRole="service_provider" />
      </section>

      {/* Active Jobs Section */}
      <section className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 transition-all duration-200 hover:shadow-xl">
        <div className="space-y-6">
          <div className="border-b border-gray-100 pb-5">
            <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              Active Jobs
            </h2>
            <p className="text-muted-foreground mt-2">
              Track your current maintenance requests and jobs
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}