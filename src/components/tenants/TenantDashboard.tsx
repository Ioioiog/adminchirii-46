
import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Calendar, DollarSign } from "lucide-react";

interface TenantDashboardProps {
  tenantInfo?: {
    property?: {
      name: string;
      address: string;
      monthly_rent: number;
      type: string;
    };
    start_date?: string;
    end_date?: string;
  };
}

export const TenantDashboard = ({ tenantInfo }: TenantDashboardProps) => {
  const { t } = useTranslation();

  // Add safety check for undefined tenantInfo
  if (!tenantInfo?.property) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white shadow-md">
          <CardContent>
            <p className="text-muted-foreground mt-4">Loading tenant information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('tenants.dashboard.property')}
          </CardTitle>
          <Home className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{tenantInfo.property.name}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {tenantInfo.property.address}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('tenants.dashboard.leasePeriod')}
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {tenantInfo.start_date ? new Date(tenantInfo.start_date).toLocaleDateString() : '-'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {tenantInfo.end_date
              ? t('tenants.dashboard.endDate', { date: new Date(tenantInfo.end_date).toLocaleDateString() })
              : t('tenants.dashboard.noEndDate')}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('tenants.dashboard.monthlyRent')}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${tenantInfo.property.monthly_rent.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {tenantInfo.property.type}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
