
import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Property, PropertyStatus } from "@/utils/propertyUtils";
import { DollarSign, Home, User, Eye, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

interface PropertyCardProps {
  property: Property;
  userRole: "landlord" | "tenant";
  onEdit?: (property: Property, data: any) => void;
  onDelete?: (property: Property) => void;
  onView?: () => void; // Changed: This is now a direct function with no parameters
  viewMode: "grid" | "list";
}

export function PropertyCard({
  property,
  userRole,
  onEdit,
  onDelete,
  onView,
  viewMode
}: PropertyCardProps) {
  const { t } = useTranslation();
  
  const getStatusColor = (status: PropertyStatus) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'occupied':
        return 'bg-green-100 text-green-800';
      case 'vacant':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="group overflow-hidden rounded-xl transition-all duration-300 hover:translate-y-[-4px] border border-gray-100 shadow-soft-md hover:shadow-soft-lg bg-white">
      <CardHeader className="p-5 border-b border-gray-50 bg-gradient-to-r from-blue-50/40 to-indigo-50/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-lg text-blue-600 group-hover:scale-110 transition-all duration-300">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{property.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">{property.address}</p>
            </div>
          </div>
          <Badge className={`${getStatusColor(property.status)} transition-all duration-300 font-medium text-xs px-2.5`}>
            {property.status || 'N/A'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-4 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 group-hover:translate-y-[-2px] transition-all duration-300">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <p className="text-xs font-medium text-gray-500">{t('properties.details.monthlyRent')}</p>
            </div>
            <p className="text-sm text-gray-900 font-medium pl-6">
              €{property.monthly_rent?.toLocaleString() || 0}
            </p>
          </div>
          <div className="space-y-1.5 group-hover:translate-y-[-2px] transition-all duration-300">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <p className="text-xs font-medium text-gray-500">{t('properties.tenants')}</p>
            </div>
            <p className="text-sm text-gray-900 font-medium pl-6">
              {property.tenant_count || 0} {t('properties.active')}
            </p>
          </div>
        </div>
        
        <Separator className="my-3 bg-gray-100" />
        
        <div className="flex items-center justify-end gap-3">
          {userRole === 'landlord' && onDelete && (
            <Button variant="outline" size="sm" onClick={() => onDelete(property)} className="border-red-100 text-red-600 hover:bg-red-50 h-8 rounded-lg">
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              {t('properties.delete')}
            </Button>
          )}
          {onView && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onView} // Changed: Now directly call onView
              className="border-blue-100 text-blue-600 hover:bg-blue-50 transition-colors duration-300 h-8 rounded-lg"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              {t('properties.view')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
