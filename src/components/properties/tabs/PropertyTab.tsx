import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Save, X } from "lucide-react";
import { Property, PropertyStatus } from "@/utils/propertyUtils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { subMonths, format } from "date-fns";

interface PropertyTabProps {
  property: Property;
  isEditing: boolean;
  editedData: any;
  setEditedData: (data: any) => void;
  handleEdit: () => void;
  handleCancel: () => void;
  handleSave: () => void;
  getStatusColor: (status: PropertyStatus) => string;
}

export function PropertyTab({
  property,
  isEditing,
  editedData,
  setEditedData,
  handleEdit,
  handleCancel,
  handleSave,
  getStatusColor,
}: PropertyTabProps) {
  const { formatAmount } = useCurrency();
  const [averageMonthlyUtilities, setAverageMonthlyUtilities] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchAverageUtilities = async () => {
      if (!property.id) return;
      
      setIsLoading(true);
      try {
        const now = new Date();
        const twelveMonthsAgo = subMonths(now, 12);
        const formattedDate = twelveMonthsAgo.toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('utilities')
          .select('amount')
          .eq('property_id', property.id)
          .gte('due_date', formattedDate);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0);
          const average = totalAmount / data.length;
          setAverageMonthlyUtilities(average);
        } else {
          setAverageMonthlyUtilities(0);
        }
      } catch (error) {
        console.error('Error fetching utility data:', error);
        setAverageMonthlyUtilities(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAverageUtilities();
  }, [property.id]);
  
  const formatDate = (date: string | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const estimatedUtilities = 
    (property.monthly_electricity_cost || 0) + 
    (property.monthly_water_cost || 0) + 
    (property.monthly_gas_cost || 0) + 
    (property.monthly_other_utilities_cost || 0);

  const formatCurrency = (value: number | null) => {
    if (value === null) return "Calculating...";
    return `€${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {isEditing ? (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Edit Property</h3>
          <PropertyForm
            onSubmit={handleSave}
            initialData={editedData}
            isSubmitting={false}
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={handleCancel} variant="outline" className="mr-2">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-medium">Property Information</h3>
            <Button onClick={handleEdit} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Details
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Name</h4>
                  <p className="text-base text-gray-900 mt-1">{property.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Address</h4>
                  <p className="text-base text-gray-900 mt-1">
                    {property.address}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Type</h4>
                  <p className="text-base text-gray-900 mt-1">{property.type}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <Badge className={getStatusColor(property.status)}>
                    {property.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Monthly Rent
                  </h4>
                  <p className="text-base text-gray-900 mt-1">
                    {property.currency === 'EUR' ? '€' : 
                     property.currency === 'USD' ? '$' : 
                     property.currency === 'GBP' ? '£' : 
                     property.currency}{property.monthly_rent?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Average Monthly Utilities (12 months)
                  </h4>
                  <p className="text-base text-gray-900 mt-1 bg-gray-100 px-3 py-2 rounded">
                    {isLoading ? "Loading..." : formatCurrency(averageMonthlyUtilities)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Availability
                  </h4>
                  <p className="text-base text-gray-900 mt-1">
                    {property.available_from
                      ? formatDate(property.available_from)
                      : "Available Now"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Bedrooms
                  </h4>
                  <p className="text-base text-gray-900 mt-1">
                    {property.bedrooms || 0}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Bathrooms
                  </h4>
                  <p className="text-base text-gray-900 mt-1">
                    {property.bathrooms || 0}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Total Area
                  </h4>
                  <p className="text-base text-gray-900 mt-1">
                    {property.total_area || 0} m²
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Construction Year
                  </h4>
                  <p className="text-base text-gray-900 mt-1">
                    {property.construction_year || "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Description
                  </h4>
                  <p className="text-base text-gray-900 mt-1">
                    {property.description || "No description available"}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {estimatedUtilities > 0 && (
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>Utility Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Electricity
                      </h4>
                      <p className="text-base text-gray-900 mt-1">
                        €{property.monthly_electricity_cost?.toLocaleString() || 0}/month
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Water
                      </h4>
                      <p className="text-base text-gray-900 mt-1">
                        €{property.monthly_water_cost?.toLocaleString() || 0}/month
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Gas
                      </h4>
                      <p className="text-base text-gray-900 mt-1">
                        €{property.monthly_gas_cost?.toLocaleString() || 0}/month
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Other Utilities
                      </h4>
                      <p className="text-base text-gray-900 mt-1">
                        €{property.monthly_other_utilities_cost?.toLocaleString() || 0}/month
                      </p>
                    </div>
                  </div>
                  {property.other_utilities_description && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500">
                        Other Utilities Description
                      </h4>
                      <p className="text-base text-gray-900 mt-1">
                        {property.other_utilities_description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
