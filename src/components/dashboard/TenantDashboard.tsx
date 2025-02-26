
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Calendar, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TenantDashboardProps {
  userId: string;
  userName: string;
  tenantInfo?: {
    tenancy_id: string;
    status: string;
    start_date: string;
    end_date?: string;
    property_id: string;
    property_name: string;
    property_address: string;
  };
}

export const TenantDashboard = ({ userId, userName }: TenantDashboardProps) => {
  const { t } = useTranslation();

  // Fetch tenant information using React Query
  const { data: tenantInfo, isLoading } = useQuery({
    queryKey: ['tenant-info', userId],
    queryFn: async () => {
      console.log("Fetching tenant info for:", userId);
      const { data, error } = await supabase.rpc(
        'get_latest_tenancy',
        { p_tenant_id: userId }
      );

      if (error) {
        console.error("Error fetching tenant info:", error);
        throw error;
      }

      console.log("Tenant info fetched:", data);
      return data?.[0] || null;
    },
    retry: 2,
    enabled: !!userId
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white shadow-md animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-4 bg-gray-200 rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-4 bg-gray-200 rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-4 bg-gray-200 rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tenantInfo) {
    return (
      <div className="grid gap-6 md:grid-cols-1">
        <Card className="bg-white shadow-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {t('tenants.dashboard.noTenancy')}
            </p>
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
          <div className="text-2xl font-bold">{tenantInfo.property_name}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {tenantInfo.property_address}
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
            {t('tenants.dashboard.status')}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">
            {tenantInfo.status}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ID: {tenantInfo.tenancy_id}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
