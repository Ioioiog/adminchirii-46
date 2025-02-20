
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronDown, Building2, MapPin, User, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyDialog } from "@/components/properties/PropertyDialog";
import { PropertyFilters } from "@/components/properties/PropertyFilters";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useProperties } from "@/hooks/useProperties";
import { PropertyListHeader } from "@/components/properties/PropertyListHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { PropertyStatus } from "@/utils/propertyUtils";

const Properties = () => {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PropertyStatus>("all");
  const { properties, isLoading } = useProperties({ userRole: "landlord" });

  const filteredProperties = properties?.filter((property) => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex bg-[#F8F9FC] min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            Loading...
          </div>
        </main>
      </div>
    );
  }

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

  const handleAddProperty = async (data: any) => {
    // Implement property addition logic
    return true;
  };

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">Properties</h1>
              <p className="text-gray-500">Manage and track your properties</p>
            </div>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>

          <PropertyFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          <div className="bg-white rounded-lg shadow-sm">
            <Accordion type="single" collapsible className="w-full">
              {filteredProperties?.map((property) => (
                <AccordionItem key={property.id} value={property.id}>
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-medium">{property.name}</h3>
                          <p className="text-sm text-gray-500">{property.address}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(property.status)}>
                        {property.status || 'N/A'}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 py-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">Address</p>
                            <p className="text-sm text-gray-500">{property.address}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">Tenants</p>
                            <p className="text-sm text-gray-500">
                              {property.tenant_count || 0} Active
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">Monthly Rent</p>
                            <p className="text-sm text-gray-500">
                              ${property.monthly_rent || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/properties/${property.id}`)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => navigate(`/properties/${property.id}/tenants`)}
                        >
                          Manage Tenants
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {filteredProperties?.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No properties found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new property.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <PropertyDialog
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSubmit={handleAddProperty}
        mode="add"
      />
    </div>
  );
};

export default Properties;
