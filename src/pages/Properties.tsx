import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronDown, Building2, MapPin, User, Calendar, DollarSign, Home, LayoutGrid, Table as TableIcon, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyDialog } from "@/components/properties/PropertyDialog";
import { PropertyFilters } from "@/components/properties/PropertyFilters";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useProperties } from "@/hooks/useProperties";
import { PropertyListHeader } from "@/components/properties/PropertyListHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { PropertyStatus } from "@/utils/propertyUtils";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/use-user-role";
import { useTranslation } from "react-i18next";

const Properties = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PropertyStatus>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const { userRole } = useUserRole();
  const { t } = useTranslation('properties');
  
  console.log("Current user role:", userRole);
  const { properties, isLoading } = useProperties({ userRole: userRole || "tenant" });
  console.log("Properties from useProperties:", properties);

  const { data: propertyContracts = [] } = useQuery({
    queryKey: ["property-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase.from('contracts').select('property_id, status').eq('status', 'signed');
      if (error) {
        console.error("Error fetching contracts:", error);
        throw error;
      }
      return data;
    }
  });

  const handleAddProperty = async (formData: any) => {
    if (userRole !== 'landlord') {
      toast({
        title: "Error",
        description: "Only landlords can add properties",
        variant: "destructive"
      });
      return false;
    }
    try {
      const { data, error } = await supabase.from('properties').insert([{
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

  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      if (userRole !== 'landlord') {
        throw new Error("Only landlords can delete properties");
      }
      const { error } = await supabase.from('properties').delete().eq('id', propertyId);
      if (error) {
        console.error("Error deleting property:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Property deleted successfully"
      });
      window.location.reload();
    },
    onError: error => {
      toast({
        title: "Error",
        description: "Failed to delete property. It may have active tenants or related records.",
        variant: "destructive"
      });
      console.error("Delete error:", error);
    }
  });

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

  const filteredProperties = properties?.filter(property => {
    if (!property) return false;
    const searchString = searchTerm.toLowerCase();
    const matchesSearch = property.name.toLowerCase().includes(searchString) || 
                         property.address.toLowerCase().includes(searchString);
    const matchesStatus = statusFilter === "all" || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  console.log("Filtered properties:", filteredProperties);

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <div className="col-span-full text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Loading properties...</h3>
        </div>
      );
    }

    return (
      <div className="col-span-full text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No properties found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {userRole === 'tenant' ? (
            <div className="space-y-4 max-w-xl mx-auto">
              <p className="text-gray-600">
                Your properties will appear here once you have an active rental agreement. Here's how you can get a property:
              </p>
              <div className="text-left space-y-3">
                <h4 className="font-medium text-gray-900">Ways to get a property:</h4>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Accept a rental contract invitation from a landlord</li>
                  <li>Sign a rental agreement through the platform</li>
                  <li>Have your existing rental contract registered by your landlord</li>
                </ul>
                <h4 className="font-medium text-gray-900 pt-2">Next steps:</h4>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Wait for your landlord to send you a contract invitation</li>
                  <li>Once received, review and sign the contract</li>
                  <li>After signing, the property will automatically appear here</li>
                  <li>You can then manage your rental, submit maintenance requests, and track payments</li>
                </ul>
              </div>
            </div>
          ) : "Click the button below to add your first property."}
        </p>
        <div className="mt-6">
          {userRole === 'tenant' ? (
            <Button 
              onClick={() => navigate('/documents')}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Available Properties
            </Button>
          ) : (
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-screen">
          <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 bg-transparent">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-sm mb-8 border border-white/20">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-sm">
                        <Home className="h-6 w-6 text-white" />
                      </div>
                      <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        {t('title')}
                      </h1>
                    </div>
                    <p className="text-gray-500 max-w-2xl">
                      {userRole === 'landlord' ? t('description.landlord') : t('description.tenant')}
                    </p>
                  </div>
                  {userRole === 'landlord' && (
                    <Button 
                      onClick={() => setShowAddModal(true)} 
                      className="w-full sm:w-auto flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{t('add')}</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PropertyFilters 
                  searchTerm={searchTerm} 
                  setSearchTerm={setSearchTerm} 
                  statusFilter={statusFilter} 
                  setStatusFilter={setStatusFilter}
                />
                <ToggleGroup 
                  type="single" 
                  value={viewMode} 
                  onValueChange={value => value && setViewMode(value as "grid" | "table")} 
                  className="bg-white rounded-lg p-1 border border-gray-200"
                >
                  <ToggleGroupItem 
                    value="grid" 
                    aria-label="Grid view"
                    className="data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem 
                    value="table" 
                    aria-label="Table view"
                    className="data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600"
                  >
                    <TableIcon className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {(!properties || properties.length === 0) ? renderEmptyState() : (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {filteredProperties?.map(property => {
                      const hasContract = propertyContracts?.some(contract => contract.property_id === property.id);
                      const displayStatus = hasContract ? 'occupied' as PropertyStatus : property.status;
                      return (
                        <Card key={property.id} className="group bg-white/80 backdrop-blur-sm border border-white/20 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                          <CardHeader className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
                                  <Home className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <h3 className="font-medium text-lg text-gray-900">{property.name}</h3>
                                </div>
                              </div>
                              <Badge className={`${getStatusColor(displayStatus)} transition-all duration-300`}>
                                {displayStatus || 'N/A'}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6 pt-0">
                            <div className="grid gap-4 mb-6">
                              <div className="flex items-center gap-3 group-hover:transform group-hover:translate-y-[-2px] transition-all duration-300">
                                <MapPin className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Address</p>
                                  <p className="text-sm text-gray-500">{property.address}</p>
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
                              {userRole === 'landlord' && <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                                      <Trash2 className="h-4 w-4" />
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
                                      <Button variant="destructive" onClick={() => deletePropertyMutation.mutate(property.id)}>
                                        Delete
                                      </Button>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>}
                              <Button 
                                variant="outline" 
                                onClick={() => handlePropertyDetails(property.id)} 
                                className="hover:bg-blue-50 transition-all duration-300"
                              >
                                View Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {filteredProperties?.length === 0 && renderEmptyState()}
                  </div>
                ) : (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 overflow-hidden animate-fade-in">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Property Name</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Monthly Rent</TableHead>
                          <TableHead>Tenants</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProperties?.map(property => {
                          const hasContract = propertyContracts?.some(contract => contract.property_id === property.id);
                          const displayStatus = hasContract ? 'occupied' as PropertyStatus : property.status;
                          return (
                            <TableRow key={property.id} className="group hover:bg-blue-50/50">
                              <TableCell className="font-medium">{property.name}</TableCell>
                              <TableCell>{property.address}</TableCell>
                              <TableCell>${property.monthly_rent?.toLocaleString() || 0}</TableCell>
                              <TableCell>{property.tenant_count || 0} Active</TableCell>
                              <TableCell>
                                <Badge className={`${getStatusColor(displayStatus)}`}>
                                  {displayStatus || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="outline" 
                                  onClick={() => handlePropertyDetails(property.id)} 
                                  className="hover:bg-blue-50 transition-all duration-300"
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {filteredProperties?.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <div className="flex flex-col items-center justify-center">
                                <Building2 className="h-12 w-12 text-gray-400 mb-2" />
                                <h3 className="text-sm font-medium text-gray-900">No properties found</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  {userRole === 'landlord' ? "Get started by creating a new property." : <div className="space-y-4 max-w-xl mx-auto">
        <p className="text-gray-600">
          Your properties will appear here once you have an active rental agreement. Here's how you can get a property:
        </p>
        <div className="text-left space-y-3">
          <h4 className="font-medium text-gray-900">Ways to get a property:</h4>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>Accept a rental contract invitation from a landlord</li>
            <li>Sign a rental agreement through the platform</li>
            <li>Have your existing rental contract registered by your landlord</li>
          </ul>
          <h4 className="font-medium text-gray-900 pt-2">Next steps:</h4>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>Wait for your landlord to send you a contract invitation</li>
            <li>Once received, review and sign the contract</li>
            <li>After signing, the property will automatically appear here</li>
            <li>You can then manage your rental, submit maintenance requests, and track payments</li>
          </ul>
        </div>
      </div>}
                                </p>
                                {userRole === 'landlord' && <Button onClick={() => setShowAddModal(true)} className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Property
                                  </Button>}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )
              )}
            </div>
          </div>
        </ScrollArea>
      </main>

      {userRole === 'landlord' && (
        <PropertyDialog 
          open={showAddModal} 
          onOpenChange={setShowAddModal} 
          onSubmit={handleAddProperty} 
          mode="add" 
        />
      )}
    </div>
  );
};

export default Properties;
