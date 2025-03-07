import React from "react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import MaintenanceList from "../MaintenanceList";
import { NoDataCard } from "@/components/dashboard/charts/NoDataCard";

interface MaintenanceRequest {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at: string;
  property: { name: string };
  tenant: { first_name: string; last_name: string };
  description: string;
  assigned_to?: string | null;
  service_provider_status?: string | null;
  scheduled_date?: string | null;
  service_provider_fee?: number;
}

interface RequestsSectionProps {
  title: string;
  requests: MaintenanceRequest[];
  emptyTitle: string;
  emptyMessage: string;
  isLoading: boolean;
  onRequestClick: (requestId: string) => void;
}

export function RequestsSection({
  title,
  requests,
  emptyTitle,
  emptyMessage,
  isLoading,
  onRequestClick,
}: RequestsSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      {isLoading ? (
        <Card className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </Card>
      ) : requests.length > 0 ? (
        <div className="space-y-4">
          <MaintenanceList
            requests={requests}
            isLoading={false}
            onRequestClick={onRequestClick}
          />
        </div>
      ) : (
        <NoDataCard 
          title={emptyTitle}
          message={emptyMessage}
        />
      )}
    </div>
  );
}