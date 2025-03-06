import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronDown, Building2, MapPin, User, Calendar, DollarSign, Home, LayoutGrid, Table as TableIcon, Trash2, FileText } from "lucide-react";
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

const Properties = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PropertyStatus>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const {
    userRole
  } = useUserRole();
  const {
    properties,
    isLoading
  } = useProperties({
    userRole: userRole || "tenant"
  });
  const {
    data: propertyContracts = []
  } = useQuery({
    queryKey: ["property-contracts"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('contracts').select('property_id, status').eq('status', 'signed');
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
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      if (userRole !== 'landlord') {
        throw new Error("Only landlords can delete properties");
      }
      const {
        error
      } = await supabase.from('properties').delete().eq('id', propertyId);
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
  const filteredProperties = properties?.filter(property => {
    if (!property) return false;
    const searchString = searchTerm.toLowerCase();
    const hasContract = propertyContracts.some(contract => contract.property_id === property.id);
    const propertyStatus = hasContract ? 'occupied' as PropertyStatus : property.status;
    const matchesSearch = property.name.toLowerCase().includes(searchString) || property.address.toLowerCase().includes(searchString);
    const matchesStatus = statusFilter === "all" || propertyStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const getEmptyStateMessage = () => {
    if (userRole === 'landlord') {
      return "Get started by creating a new property.";
    }
    return <div className="space-y-4 max-w-xl mx-auto">
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
      </div>;
  };
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
          <div className="p-8 bg-white">
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
                      {userRole === 'landlord' ? "Manage and track your properties effectively" : "View your rented properties"}
                    </p>
                  </div>
                  {userRole === 'landlord' && <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-soft-md hover:shadow-soft-lg">
                      <Plus className="h-4 w-4" />
                      <span>Add Property</span>
                    </Button>}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PropertyFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
                <ToggleGroup type="single" value={viewMode} onValueChange={value => value && setViewMode(value as "grid" | "table")} className="bg-white rounded-lg p-1 border border-gray-200">
                  <ToggleGroupItem value="grid" aria-label="Grid view" className="data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600">
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="table" aria-label="Table view" className="data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600">
                    <TableIcon className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {viewMode === "grid" ? 
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                  {filteredProperties?.map(property => {
                const hasContract = propertyContracts.some(contract => contract.property_id === property.id);
                const displayStatus = hasContract ? 'occupied' as PropertyStatus : property.status;
                const currencySymbol = property.currency === 'EUR' ? '€' : 
                                      property.currency === 'USD' ? '$' : 
                                      property.currency === 'GBP' ? '£' : 
                                      property.currency;
                
                return <Card key={property.id} className="group overflow-hidden rounded-xl transition-all duration-300 hover:translate-y-[-4px] border border-gray-100 shadow-soft-md hover:shadow-soft-lg bg-white">
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
                            <Badge className={`${getStatusColor(displayStatus)} transition-all duration-300 font-medium text-xs px-2.5`}>
                              {displayStatus || 'N/A'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-5 pt-4 space-y-5">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 group-hover:translate-y-[-2px] transition-all duration-300">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gray-400" />
                                <p className="text-xs font-medium text-gray-500">Monthly Rent</p>
                              </div>
                              <p className="text-sm text-gray-900 font-medium pl-6">
                                {currencySymbol}{property.monthly_rent?.toLocaleString() || 0}
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
                            {userRole === 'landlord' && <AlertDialog>
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
                                    <Button variant="destructive" onClick={() => deletePropertyMutation.mutate(property.id)}>
                                      Delete
                                    </Button>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handlePropertyDetails(property.id)} 
                              className="border-blue-100 text-blue-600 hover:bg-blue-50 transition-colors duration-300 h-8 rounded-lg"
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>;
              })}
                  {filteredProperties?.length === 0 && 
                    <div className="col-span-full text-center py-12 bg-white/95 backdrop-blur-sm rounded-xl shadow-soft-md border border-gray-100">
                      <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No properties found</h3>
                      <div className="mt-1 text-sm">
                        {getEmptyStateMessage()}
                      </div>
                      <div className="mt-6 flex items-center justify-center gap-4">
                        {userRole === 'landlord' ? <Button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-soft-md hover:shadow-soft-lg">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Property
                          </Button> : <Button onClick={() => navigate('/documents')} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white transition-all duration-300 shadow-soft-md hover:shadow-soft-lg">
                            <FileText className="h-4 w-4 mr-2" />
                            Accept Rental Contract
                          </Button>}
                      </div>
                    </div>}
                </div> : 
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-soft-md border border-gray-100 overflow-hidden animate-fade-in">
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
                    const hasContract = propertyContracts.some(contract => contract.property_id === property.id);
                    const displayStatus = hasContract ? 'occupied' as PropertyStatus : property.status;
                    const currencySymbol = property.currency === 'EUR' ? '€' : 
                                          property.currency === 'USD' ? '$' : 
                                          property.currency === 'GBP' ? '£' : 
                                          property.currency;
                    
                    return <TableRow key={property.id} className="group hover:bg-blue-50/50">
                            <TableCell className="font-medium">{property.name}</TableCell>
                            <TableCell>{property.address}</TableCell>
                            <TableCell>{currencySymbol}{property.monthly_rent?.toLocaleString() || 0}</TableCell>
                            <TableCell>{property.tenant_count || 0} Active</TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(displayStatus)}`}>
                                {displayStatus || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" onClick={() => handlePropertyDetails(property.id)} className="hover:bg-blue-50 transition-colors duration-300">
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>;
                  })}
                      {filteredProperties?.length === 0 && <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex flex-col items-center justify-center">
                              <Building2 className="h-12 w-12 text-gray-400 mb-2" />
                              <h3 className="text-sm font-medium text-gray-900">No properties found</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {getEmptyStateMessage()}
                              </p>
                              {userRole === 'landlord' && <Button onClick={() => setShowAddModal(true)} className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Property
                                </Button>}
                            </div>
                          </TableCell>
                        </TableRow>}
                    </TableBody>
                  </Table>
                </div>}
            </div>
          </div>
        </ScrollArea>
      </main>

      {userRole === 'landlord' && <PropertyDialog open={showAddModal} onOpenChange={setShowAddModal} onSubmit={handleAddProperty} mode="add" />}
    </div>;
};

export default Properties;
