
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronDown, Building2, MapPin, User, Calendar, DollarSign, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyDialog } from "@/components/properties/PropertyDialog";
import { PropertyFilters } from "@/components/properties/PropertyFilters";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useProperties } from "@/hooks/useProperties";
import { PropertyListHeader } from "@/components/properties/PropertyListHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { PropertyStatus } from "@/utils/propertyUtils";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

const Properties = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PropertyStatus>("all");
  const {
    properties,
    isLoading
  } = useProperties({
    userRole: "landlord"
  });

  const handleAddProperty = async (formData: any) => {
    try {
      const {
        data,
        error
      } = await supabase.from('properties').insert([{
        ...formData,
        landlord_id: (await supabase.auth.getUser()).data.user?.id
      }]).select().single();
      if (error) throw error;
      toast({
        title: "Success",
        description: "Property added successfully"
      });
      setShowAddModal(false);
      return true;
    } catch (error) {
      console.error('Error adding property:', error);
      toast({
        title: "Error",
        description: "Failed to add property",
        variant: "destructive"
      });
      return false;
    }
  };

  const filteredProperties = properties?.filter(property => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) || property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-screen">
            <div className="p-8">
              <div className="max-w-7xl mx-auto">
                Loading...
              </div>
            </div>
          </ScrollArea>
        </main>
      </div>;
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

  const handlePropertyDetails = (propertyId: string) => {
    navigate(`/properties/${propertyId}`);
  };

  return <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-screen">
          <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-soft-xl mb-8 animate-fade-in border border-white/20">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-soft-md">
                        <Home className="h-6 w-6 text-white" />
                      </div>
                      <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Properties
                      </h1>
                    </div>
                    <p className="text-gray-500 max-w-2xl">
                      Manage and track your properties effectively
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowAddModal(true)} 
                    className="w-full sm:w-auto flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-soft-md hover:shadow-soft-lg"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Property</span>
                  </Button>
                </div>
              </div>

              <PropertyFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {filteredProperties?.map(property => (
                  <Card key={property.id} className="group bg-white/80 backdrop-blur-sm border border-white/20 shadow-soft-md hover:shadow-soft-lg transition-all duration-300 overflow-hidden">
                    <CardHeader className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
                            <Home className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-lg text-gray-900">{property.name}</h3>
                            <p className="text-sm text-gray-500">{property.address}</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(property.status)} transition-all duration-300`}>
                          {property.status || 'N/A'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="flex items-center gap-3 group-hover:transform group-hover:translate-y-[-2px] transition-all duration-300">
                          <MapPin className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Address</p>
                            <p className="text-sm text-gray-500">{property.address}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 group-hover:transform group-hover:translate-y-[-2px] transition-all duration-300">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Tenants</p>
                            <p className="text-sm text-gray-500">
                              {property.tenant_count || 0} Active
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 group-hover:transform group-hover:translate-y-[-2px] transition-all duration-300">
                          <DollarSign className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Monthly Rent</p>
                            <p className="text-sm text-gray-500">
                              ${property.monthly_rent?.toLocaleString() || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          onClick={() => handlePropertyDetails(property.id)}
                          className="hover:bg-blue-50 transition-colors duration-300"
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredProperties?.length === 0 && (
                  <div className="col-span-full text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-soft-md border border-white/20">
                    <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No properties found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new property.
                    </p>
                    <div className="mt-6">
                      <Button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-soft-md hover:shadow-soft-lg"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Property
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </main>

      <PropertyDialog open={showAddModal} onOpenChange={setShowAddModal} onSubmit={handleAddProperty} mode="add" />
    </div>;
};

export default Properties;
