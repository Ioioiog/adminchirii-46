
import React from "react";
import { Calendar, Wallet, Home } from "lucide-react";
import { Property } from "@/utils/propertyUtils";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface PropertyCardHeaderProps {
  property: Property;
}

export function PropertyCardHeader({ property }: PropertyCardHeaderProps) {
  const { t } = useTranslation(['properties', 'common']);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="mb-2">
          {t(`properties:types.${property.type.toLowerCase()}`)}
        </Badge>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900">
        {property.name}
      </h3>
      
      <div className="space-y-3">
        <p className="text-gray-600 flex items-center gap-2 text-sm">
          <Home className="h-4 w-4 text-blue-500" />
          {property.address}
        </p>
        
        <div className="flex items-center justify-between">
          <p className="text-lg font-medium flex items-center gap-2 text-blue-600">
            <Wallet className="h-5 w-5" />
            {t('common:currency.usd')}{property.monthly_rent}
            <span className="text-sm text-gray-500">/ {t('properties:rent.period')}</span>
          </p>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            {property.tenancy ? (
              format(new Date(property.tenancy.start_date), 'PPP')
            ) : property.available_from ? (
              format(new Date(property.available_from), 'PPP')
            ) : !property.tenancy && (
              t('properties:available.now')
            )}
          </div>
        </div>
      </div>

      {property.description && (
        <p className="text-sm text-gray-600 leading-relaxed mt-4 bg-gray-50 p-3 rounded-md">
          {property.description}
        </p>
      )}
    </div>
  );
}
