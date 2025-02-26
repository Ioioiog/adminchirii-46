
import { useTranslation } from "react-i18next";
import { Property } from "@/utils/propertyUtils";
import { TenantInviteDialog } from "./TenantInviteDialog";
import { TenantAssignDialog } from "./TenantAssignDialog";
import { Button } from "@/components/ui/button";
import { UserPlus, Mail } from "lucide-react";
import { useState } from "react";

interface TenantsHeaderProps {
  properties: Property[];
  userRole: "landlord" | "tenant";
}

export function TenantsHeader({ properties, userRole }: TenantsHeaderProps) {
  const { t } = useTranslation();

  const title = userRole === "landlord" 
    ? t('tenants.title.landlord') 
    : t('tenants.title.tenant');

  const description = userRole === "landlord"
    ? t('tenants.description.landlord')
    : t('tenants.description.tenant');

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm mb-6 animate-fade-in">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">
            {title}
          </h1>
          <p className="text-gray-500 max-w-2xl">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
