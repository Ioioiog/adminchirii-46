
import React, { useState } from "react";
import { Building2, Users, AlertTriangle, Clock, DollarSign, Wrench, CheckCircle, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useMetrics } from "@/hooks/useMetrics";
import { MetricCard } from "./MetricCard";
import { RevenueDetailsModal } from "../dashboard/RevenueDetailsModal";
import { useCurrency } from "@/hooks/useCurrency";
import FinancialSummaryCard from "../financial/FinancialSummaryCard";

interface DashboardMetricsProps {
  userId: string;
  userRole: "landlord" | "tenant" | "service_provider";
}

export function DashboardMetrics({ userId, userRole }: DashboardMetricsProps) {
  const { t } = useTranslation("dashboard");
  const { data: metrics, isLoading } = useMetrics(userId, userRole);
  const [showRevenueDetails, setShowRevenueDetails] = useState(false);
  const { formatAmount } = useCurrency();

  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">
          {t("metrics.loading")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 animate-pulse h-24 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const renderLandlordMetrics = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <FinancialSummaryCard
        title={t("metrics.totalProperties")}
        amount={metrics?.totalProperties?.toString() || "0"}
        description={t("metrics.totalPropertiesDesc")}
        icon={Building2}
      />
      <FinancialSummaryCard
        title={t("metrics.monthlyRevenue")}
        amount={formatAmount(metrics?.monthlyRevenue || 0)}
        description={t("metrics.monthlyRevenueDesc")}
        icon={DollarSign}
        color="green"
      />
      <Button
        className="p-0 h-auto bg-transparent hover:bg-transparent"
        onClick={() => setShowRevenueDetails(true)}
      >
        <FinancialSummaryCard
          title={t("metrics.activeTenants")}
          amount={metrics?.activeTenants?.toString() || "0"}
          description={t("metrics.activeTenantsDesc")}
          icon={Users}
        />
      </Button>
      <FinancialSummaryCard
        title={t("metrics.pendingMaintenance")}
        amount={metrics?.pendingMaintenance?.toString() || "0"}
        description={t("metrics.pendingMaintenanceDesc")}
        icon={AlertTriangle}
        color={metrics?.pendingMaintenance ? "yellow" : "default"}
      />
    </div>
  );

  const renderTenantMetrics = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <FinancialSummaryCard
        title={t("metrics.rentedPropertiesDesc")}
        amount={metrics?.totalProperties?.toString() || "0"}
        description={t("metrics.rentedPropertiesDesc")}
        icon={Building2}
      />
      <Button
        className="p-0 h-auto bg-transparent hover:bg-transparent"
        onClick={() => setShowRevenueDetails(true)}
      >
        <FinancialSummaryCard
          title={t("metrics.paymentStatus")}
          amount={metrics?.paymentStatus || t("metrics.noPayments")}
          description={t("metrics.paymentStatusDesc")}
          icon={Wallet}
          color={metrics?.paymentStatus === "paid" ? "green" : "yellow"}
        />
      </Button>
      <FinancialSummaryCard
        title={t("metrics.openMaintenanceDesc")}
        amount={metrics?.pendingMaintenance?.toString() || "0"}
        description={t("metrics.openMaintenanceDesc")}
        icon={Wrench}
        color={metrics?.pendingMaintenance ? "yellow" : "default"}
      />
    </div>
  );

  const renderServiceProviderMetrics = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <FinancialSummaryCard
        title={t("metrics.activeJobs")}
        amount={metrics?.activeJobs?.toString() || "0"}
        description={t("metrics.activeJobsDesc")}
        icon={Clock}
      />
      <FinancialSummaryCard
        title={t("metrics.completedJobs")}
        amount={metrics?.completedJobs?.toString() || "0"}
        description={t("metrics.completedJobsDesc")}
        icon={CheckCircle}
        color="green"
      />
      <FinancialSummaryCard
        title={t("metrics.monthlyEarnings")}
        amount={formatAmount(metrics?.monthlyEarnings || 0)}
        description={t("metrics.monthlyEarningsDesc")}
        icon={DollarSign}
        color="green"
      />
    </div>
  );

  return (
    <div className="mb-6 space-y-2">
      {userRole === "landlord" && renderLandlordMetrics()}
      {userRole === "tenant" && renderTenantMetrics()}
      {userRole === "service_provider" && renderServiceProviderMetrics()}
      <RevenueDetailsModal
        open={showRevenueDetails}
        onOpenChange={setShowRevenueDetails}
        revenueDetails={metrics?.revenueDetails}
      />
    </div>
  );
}
