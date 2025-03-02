
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Property, PropertyStatus } from "@/utils/propertyUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Home, MapPin, User, Eye, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogHeader } from "@/components/ui/alert-dialog";

interface PropertyCardProps {
  property: Property;
  userRole: "landlord" | "tenant";
  onView: (propertyId: string) => void;
  onDelete?: (propertyId: string) => void;
  displayStatus?: PropertyStatus;
}

export function PropertyCard({ 
  property, 
  userRole, 
  onView,
  onDelete,
  displayStatus = property.status,
}: PropertyCardProps) {
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
      <div className="p-5 border-b border-gray-50 bg-gradient-to-r from-blue-50/40 to-indigo-50/40">
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
          <Badge className={`${getStatusColor(displayStatus)} transition-all duration-300 font-medium text-xs px-2.5`}>
            {displayStatus || 'N/A'}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-5 pt-4 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 group-hover:translate-y-[-2px] transition-all duration-300">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <p className="text-xs font-medium text-gray-500">Monthly Rent</p>
            </div>
            <p className="text-sm text-gray-900 font-medium pl-6">
              €{property.monthly_rent?.toLocaleString() || 0}
            </p>
          </div>
          <div className="space-y-1.5 group-hover:translate-y-[-2px] transition-all duration-300">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <p className="text-xs font-medium text-gray-500">Tenants</p>
            </div>
            <p className="text-sm text-gray-900 font-medium pl-6">
              {property.tenant_count || 0} Active
            </p>
          </div>
        </div>
        
        <Separator className="my-3 bg-gray-100" />
        
        <div className="flex items-center justify-end gap-3">
          {userRole === 'landlord' && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-red-100 text-red-600 hover:bg-red-50 h-8 rounded-lg">
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the property
                    and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button variant="destructive" onClick={() => onDelete(property.id)}>
                    Delete
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onView(property.id)} 
            className="border-blue-100 text-blue-600 hover:bg-blue-50 transition-colors duration-300 h-8 rounded-lg"
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
