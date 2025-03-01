import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useProperties } from "@/hooks/useProperties";
import { useUserRole } from "@/hooks/use-user-role";
import { PropertyDetailsCard } from "@/components/properties/PropertyDetailsCard";
import { PropertyUpdateDialog } from "@/components/properties/PropertyUpdateDialog";
import { PropertyDeleteDialog } from "@/components/properties/PropertyDeleteDialog";
import { TenantList } from "@/components/tenants/TenantList";
import { MaintenanceRequestList } from "@/components/maintenance/MaintenanceRequestList";
import { PaymentList } from "@/components/payments/PaymentList";
import { DocumentList } from "@/components/documents/DocumentList";
import { UtilityAnalysisChart } from "@/components/properties/UtilityAnalysisChart";

const PropertyDetails = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const { userRole } = useUserRole();
  const { properties } = useProperties({
    userRole: userRole === "landlord" || userRole === "tenant" ? userRole : "tenant"
  });

  useEffect(() => {
    if (properties && propertyId) {
      const foundProperty = properties.find((p) => p.id === propertyId);
      setProperty(foundProperty);
      setIsLoading(false);
    }
  }, [properties, propertyId]);

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="mb-4">
          <CardTitle className="text-2xl font-bold">
            Property Details
          </CardTitle>
        </div>
        
        {isLoading ? (
          <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <div className="space-y-6">
            <PropertyDetailsCard property={property} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PropertyUpdateDialog property={property} />
              <PropertyDeleteDialog property={property} />
              <TenantList propertyId={propertyId} />
              <MaintenanceRequestList propertyId={propertyId} />
              <PaymentList propertyId={propertyId} />
              <DocumentList propertyId={propertyId} />
              <div className="md:col-span-2">
                <UtilityAnalysisChart propertyId={propertyId} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PropertyDetails;
