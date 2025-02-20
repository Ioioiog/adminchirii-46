
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, User, DollarSign, MapPin, Calendar, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { PropertyStatus } from "@/utils/propertyUtils";
import { useToast } from "@/hooks/use-toast";

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          tenancies(
            id,
            status,
            tenant:profiles(
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleEdit = () => {
    setEditedData({
      name: property.name,
      address: property.address,
      type: property.type,
      monthly_rent: property.monthly_rent,
      description: property.description,
      available_from: property.available_from,
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(null);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('properties')
        .update(editedData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Property updated successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["property", id] });
      setIsEditing(false);
      setEditedData(null);
    } catch (error) {
      console.error('Error updating property:', error);
      toast({
        title: "Error",
        description: "Failed to update property",
        variant: "destructive",
      });
    }
  };

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

  if (!property) {
    return (
      <div className="flex bg-[#F8F9FC] min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h2 className="text-lg font-medium">Property not found</h2>
              <p className="mt-1 text-gray-500">The property you're looking for doesn't exist.</p>
              <Button
                onClick={() => navigate("/properties")}
                className="mt-4"
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Properties
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const status = property.tenancies?.some(t => t.status === 'active') ? 'occupied' : 'vacant';
  const activeTenants = property.tenancies?.filter(t => t.status === 'active') || [];

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/properties")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div>
                  {isEditing ? (
                    <Input
                      value={editedData.name}
                      onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                      className="text-2xl font-semibold mb-1"
                    />
                  ) : (
                    <h1 className="text-2xl font-semibold">{property.name}</h1>
                  )}
                  {isEditing ? (
                    <Input
                      value={editedData.address}
                      onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
                      className="text-gray-500"
                    />
                  ) : (
                    <p className="text-gray-500">{property.address}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(status)}>
                  {status}
                </Badge>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Address</p>
                    {isEditing ? (
                      <Input
                        value={editedData.address}
                        onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">{property.address}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Home className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Property Type</p>
                    {isEditing ? (
                      <select
                        value={editedData.type}
                        onChange={(e) => setEditedData({ ...editedData, type: e.target.value })}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="Apartment">Apartment</option>
                        <option value="House">House</option>
                        <option value="Condo">Condo</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    ) : (
                      <p className="text-sm text-gray-500">{property.type}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Monthly Rent</p>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedData.monthly_rent}
                        onChange={(e) => setEditedData({ ...editedData, monthly_rent: parseFloat(e.target.value) })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">
                        ${property.monthly_rent?.toLocaleString() || 0}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Available From</p>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editedData.available_from}
                        onChange={(e) => setEditedData({ ...editedData, available_from: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">
                        {property.available_from ? format(new Date(property.available_from), 'PPP') : 'Not specified'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Active Tenants</p>
                    <p className="text-sm text-gray-500">{activeTenants.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-medium mb-2">Description</h3>
              {isEditing ? (
                <Textarea
                  value={editedData.description || ''}
                  onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                  className="min-h-[100px]"
                />
              ) : (
                <p className="text-sm text-gray-500">{property.description || 'No description available.'}</p>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Active Tenants</h2>
            </CardHeader>
            <CardContent>
              {activeTenants.length > 0 ? (
                <div className="divide-y">
                  {activeTenants.map((tenancy) => (
                    <div key={tenancy.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {tenancy.tenant.first_name} {tenancy.tenant.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{tenancy.tenant.email}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/tenants/${tenancy.tenant.id}`)}
                        >
                          View Tenant
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No active tenants</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PropertyDetails;
