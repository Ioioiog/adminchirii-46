
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PropertyDetailsCardProps {
  property: any;
}

export function PropertyDetailsCard({ property }: PropertyDetailsCardProps) {
  if (!property) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{property.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Address</h3>
            <p className="text-base">{property.address}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Type</h3>
            <Badge variant="outline" className="mt-1">
              {property.type}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Monthly Rent</h3>
              <p className="text-lg font-medium">${property.monthly_rent}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Available From</h3>
              <p className="text-base">
                {property.available_from ? new Date(property.available_from).toLocaleDateString() : 'Immediately'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Bedrooms</h3>
              <p className="text-base">{property.bedrooms}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Bathrooms</h3>
              <p className="text-base">{property.bathrooms}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Area</h3>
              <p className="text-base">{property.total_area} m²</p>
            </div>
          </div>
          
          {property.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="text-base">{property.description}</p>
            </div>
          )}
          
          {property.amenities && property.amenities.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Amenities</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {property.amenities.map((amenity: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
