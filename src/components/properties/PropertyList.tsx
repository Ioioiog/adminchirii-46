
import React from "react";
import { PropertyCard } from "./PropertyCard";
import { Card } from "@/components/ui/card";
import { Property } from "@/utils/propertyUtils";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

interface PropertyListProps {
  properties: Property[] | undefined;
  isLoading: boolean;
  userRole: "landlord" | "tenant";
  onEdit?: (property: Property, data: any) => void;
  onDelete?: (property: Property) => void;
  onView?: (propertyId: string) => void; // This expects a function that takes a string (propertyId)
  viewMode: "grid" | "list";
}

export function PropertyList({ 
  properties, 
  isLoading, 
  userRole, 
  onEdit, 
  onDelete,
  onView,
  viewMode 
}: PropertyListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-6 max-w-7xl mx-auto animate-fade-in`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse bg-gradient-to-br from-gray-50 to-white">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded-full w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded-full w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded-full w-2/3"></div>
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (properties === undefined) {
    return (
      <div className="max-w-7xl mx-auto animate-fade-in">
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">{t('common.error')}</AlertTitle>
          <AlertDescription className="text-red-800">
            {t('properties.error.fetch')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!properties.length) {
    return (
      <div className="max-w-7xl mx-auto animate-fade-in">
        <Card className="p-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="text-center space-y-3">
            <p className="text-gray-600 text-lg">
              {userRole === "landlord" 
                ? t('properties.empty.landlord')
                : t('properties.empty.tenant')}
            </p>
            {userRole === "tenant" && (
              <p className="text-sm text-gray-500">
                {t('properties.empty.tenant.contact')}
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-6 max-w-7xl mx-auto animate-fade-in`}>
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          userRole={userRole}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView ? () => onView(property.id) : undefined} // Fixed: Pass only the property.id to onView
          viewMode={viewMode}
        />
      ))}
    </div>
  );
}
