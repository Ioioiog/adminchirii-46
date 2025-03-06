
import { useState } from "react";
import { Home, Wrench, Users, Wallet } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { useMetrics } from "@/hooks/useMetrics";
import { useTranslation } from "react-i18next";
import { RevenueDetailsModal } from "./RevenueDetailsModal";
import { useCurrency } from "@/hooks/useCurrency";

export function DashboardMetrics({ userId, userRole }: { userId: string; userRole: "landlord" | "tenant" | "service_provider" }) {
  const { t } = useTranslation('dashboard');
  const [showRevenueDetails, setShowRevenueDetails] = useState(false);
  const { formatAmount } = useCurrency();
  
  const { data: metrics, isLoading } = useMetrics(userId, userRole);

  console.log("DashboardMetrics - userRole:", userRole);
  console.log("DashboardMetrics - metrics:", metrics);

  if (isLoading || !metrics) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-fade-in">
        {[...Array(userRole === 'service_provider' ? 3 : 4)].map((_, i) => (
          <MetricCard
            key={i}
            title="metrics.loading"
            value="..."
            icon={Home}
            className="bg-white shadow-md hover:shadow-lg transition-all duration-300"
          />
        ))}
      </div>
    );
  }

  const handleRevenueClick = () => {
    setShowRevenueDetails(true);
  };

  if (userRole === "service_provider") {
    return (
      <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
        <MetricCard
          title="metrics.activeJobs"
          value={metrics.activeJobs || 0}
          icon={Wrench}
          route="/maintenance"
          className="bg-white shadow-md hover:shadow-lg transition-all duration-300"
          description="metrics.activeJobsDesc"
        />
        <MetricCard
          title="metrics.completedJobs"
          value={metrics.completedJobs || 0}
          icon={Home}
          route="/maintenance"
          className="bg-white shadow-md hover:shadow-lg transition-all duration-300"
          description="metrics.completedJobsDesc"
        />
        <MetricCard
          title="metrics.monthlyEarnings"
          value={formatAmount(metrics.monthlyEarnings || 0, 'EUR')}
          icon={Wallet}
          onClick={handleRevenueClick}
          className="bg-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
          description="metrics.monthlyEarningsDesc"
        />
      </div>
    );
  }

  if (userRole === "landlord") {
    return (
      <>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-fade-in">
          <MetricCard
            title="metrics.totalProperties"
            value={metrics.totalProperties || 0}
            icon={Home}
            route="/properties"
            className="bg-white shadow-md hover:shadow-lg transition-all duration-300"
            description="metrics.totalPropertiesDesc"
          />
          <MetricCard
            title="metrics.monthlyRevenue"
            value={formatAmount(metrics.monthlyRevenue || 0, 'EUR')}
            icon={Wallet}
            onClick={handleRevenueClick}
            description="metrics.monthlyRevenueDesc"
            className="bg-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
          />
          <MetricCard
            title="metrics.activeTenants"
            value={metrics.activeTenants || 0}
            icon={Users}
            route="/tenants"
            className="bg-white shadow-md hover:shadow-lg transition-all duration-300"
            description="metrics.activeTenantsDesc"
          />
          <MetricCard
            title="metrics.pendingMaintenance"
            value={metrics.pendingMaintenance || 0}
            icon={Wrench}
            route="/maintenance"
            className="bg-white shadow-md hover:shadow-lg transition-all duration-300"
            description="metrics.pendingMaintenanceDesc"
          />
        </div>

        <RevenueDetailsModal
          open={showRevenueDetails}
          onOpenChange={setShowRevenueDetails}
          revenueDetails={metrics.revenueDetails}
        />
      </>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
        <MetricCard
          title="metrics.totalProperties"
          value={metrics.totalProperties || 0}
          icon={Home}
          route="/properties"
          className="bg-white shadow-md hover:shadow-lg transition-all duration-300"
          description="metrics.rentedPropertiesDesc"
        />
        <MetricCard
          title="metrics.pendingMaintenance"
          value={metrics.pendingMaintenance || 0}
          icon={Wrench}
          route="/maintenance"
          className="bg-white shadow-md hover:shadow-lg transition-all duration-300"
          description="metrics.openMaintenanceDesc"
        />
        <MetricCard
          title="metrics.paymentStatus"
          value={metrics.paymentStatus || t('metrics.noPayments')}
          icon={Wallet}
          onClick={handleRevenueClick}
          className="bg-white shadow-md hover:shadow-lg transition-all duration-300"
          description="metrics.paymentStatusDesc"
        />
      </div>

      <RevenueDetailsModal
        open={showRevenueDetails}
        onOpenChange={setShowRevenueDetails}
        revenueDetails={metrics.revenueDetails}
      />
    </>
  );
}
