import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Edit2, Save, X, Home, DollarSign, MapPin, 
  Droplets, Zap, Flame, Plus, Car, Bed, Bath,
  Square, CalendarRange, Building, Mail, Phone,
  UserCircle
} from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FormData } from "@/types/contract";

interface PropertyTabProps {
  property: any;
  isEditing: boolean;
  editedData: any;
  setEditedData: (data: any) => void;
  handleEdit: () => void;
  handleCancel: () => void;
  handleSave: () => void;
  getStatusColor: (status: string) => string;
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
  const { userRole } = useUserRole();
  const isTenant = userRole === 'tenant';
  const status = property.tenancies?.some((t: any) => t.status === 'active') ? 'occupied' : 'vacant';

  const { data: contract } = useQuery({
    queryKey: ['property-contract', property.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('property_id', property.id)
        .eq('status', 'signed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  const landlordInfo = (contract?.metadata as FormData) || {} as FormData;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          {isEditing ? (
            <Input
              value={editedData.name}
              onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
              className="text-3xl font-semibold mb-2 border-none bg-gray-50 focus:ring-2 focus:ring-blue-500/20"
            />
          ) : (
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">{property.name}</h1>
          )}
          {isEditing ? (
            <Input
              value={editedData.address}
              onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
              className="text-gray-600 border-none bg-gray-50 focus:ring-2 focus:ring-blue-500/20"
            />
          ) : (
            <p className="text-gray-600">{property.address}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!isTenant && (
            <Badge className={`${getStatusColor(status)} text-sm px-3 py-1 rounded-full font-medium`}>
              {status}
            </Badge>
          )}
          {!isTenant && (
            isEditing ? (
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={handleCancel} className="rounded-lg">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} className="rounded-lg bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={handleEdit} className="rounded-lg">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Landlord Information</h3>
        <div className="grid gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <UserCircle className="h-4 w-4" />
            <span className="font-medium">{landlordInfo.ownerName || 'Not specified'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="h-4 w-4" />
            <span>{landlordInfo.ownerEmail || 'Email not provided'}</span>
          </div>
          {landlordInfo.ownerPhone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{landlordInfo.ownerPhone}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Address</p>
              <p className="text-base text-gray-900 mt-1">{property.address}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Home className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Property Type</p>
              {isEditing ? (
                <select
                  value={editedData.type}
                  onChange={(e) => setEditedData({ ...editedData, type: e.target.value })}
                  className="mt-1 w-full rounded-lg border-gray-200 bg-white focus:ring-2 focus:ring-blue-500/20 text-base"
                >
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Condo">Condo</option>
                  <option value="Commercial">Commercial</option>
                </select>
              ) : (
                <p className="text-base text-gray-900 mt-1">{property.type}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Monthly Rent</p>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedData.monthly_rent}
                  onChange={(e) => setEditedData({ ...editedData, monthly_rent: parseFloat(e.target.value) })}
                  className="mt-1 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500/20"
                />
              ) : (
                <p className="text-base text-gray-900 mt-1">
                  ${property.monthly_rent?.toLocaleString() || 0}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Property Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Bedrooms</label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedData.bedrooms || 0}
                  onChange={(e) => setEditedData({ ...editedData, bedrooms: parseInt(e.target.value) })}
                  className="mt-1"
                />
              ) : (
                <p className="flex items-center gap-2 mt-1">
                  <Bed className="h-4 w-4 text-gray-400" />
                  {property.bedrooms || 0}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Bathrooms</label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedData.bathrooms || 0}
                  onChange={(e) => setEditedData({ ...editedData, bathrooms: parseFloat(e.target.value) })}
                  className="mt-1"
                />
              ) : (
                <p className="flex items-center gap-2 mt-1">
                  <Bath className="h-4 w-4 text-gray-400" />
                  {property.bathrooms || 0}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Total Area (sq ft)</label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedData.total_area || 0}
                  onChange={(e) => setEditedData({ ...editedData, total_area: parseFloat(e.target.value) })}
                  className="mt-1"
                />
              ) : (
                <p className="flex items-center gap-2 mt-1">
                  <Square className="h-4 w-4 text-gray-400" />
                  {property.total_area || 0} sq ft
                </p>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Parking Spots</label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedData.parking_spots || 0}
                  onChange={(e) => setEditedData({ ...editedData, parking_spots: parseInt(e.target.value) })}
                  className="mt-1"
                />
              ) : (
                <p className="flex items-center gap-2 mt-1">
                  <Car className="h-4 w-4 text-gray-400" />
                  {property.parking_spots || 0}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Construction Year</label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedData.construction_year || ''}
                  onChange={(e) => setEditedData({ ...editedData, construction_year: parseInt(e.target.value) })}
                  className="mt-1"
                />
              ) : (
                <p className="flex items-center gap-2 mt-1">
                  <Building className="h-4 w-4 text-gray-400" />
                  {property.construction_year || 'Not specified'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Monthly Utility Costs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600">Electricity</label>
            {isEditing ? (
              <Input
                type="number"
                value={editedData.monthly_electricity_cost || 0}
                onChange={(e) => setEditedData({ ...editedData, monthly_electricity_cost: parseFloat(e.target.value) })}
                className="mt-1"
              />
            ) : (
              <p className="flex items-center gap-2 mt-1">
                <Zap className="h-4 w-4 text-yellow-400" />
                ${property.monthly_electricity_cost?.toLocaleString() || 0}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Water</label>
            {isEditing ? (
              <Input
                type="number"
                value={editedData.monthly_water_cost || 0}
                onChange={(e) => setEditedData({ ...editedData, monthly_water_cost: parseFloat(e.target.value) })}
                className="mt-1"
              />
            ) : (
              <p className="flex items-center gap-2 mt-1">
                <Droplets className="h-4 w-4 text-blue-400" />
                ${property.monthly_water_cost?.toLocaleString() || 0}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Gas</label>
            {isEditing ? (
              <Input
                type="number"
                value={editedData.monthly_gas_cost || 0}
                onChange={(e) => setEditedData({ ...editedData, monthly_gas_cost: parseFloat(e.target.value) })}
                className="mt-1"
              />
            ) : (
              <p className="flex items-center gap-2 mt-1">
                <Flame className="h-4 w-4 text-orange-400" />
                ${property.monthly_gas_cost?.toLocaleString() || 0}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Other Utilities</label>
            {isEditing ? (
              <>
                <Input
                  type="number"
                  value={editedData.monthly_other_utilities_cost || 0}
                  onChange={(e) => setEditedData({ ...editedData, monthly_other_utilities_cost: parseFloat(e.target.value) })}
                  className="mt-1"
                />
                <Input
                  type="text"
                  value={editedData.other_utilities_description || ''}
                  onChange={(e) => setEditedData({ ...editedData, other_utilities_description: e.target.value })}
                  placeholder="Description"
                  className="mt-2"
                />
              </>
            ) : (
              <div className="mt-1">
                <p className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-gray-400" />
                  ${property.monthly_other_utilities_cost?.toLocaleString() || 0}
                </p>
                {property.other_utilities_description && (
                  <p className="text-sm text-gray-500 mt-1">{property.other_utilities_description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
        {isEditing ? (
          <Textarea
            value={editedData.description || ''}
            onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
            className="min-h-[120px] bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500/20 rounded-xl"
          />
        ) : (
          <p className="text-gray-600 leading-relaxed">{property.description || 'No description available.'}</p>
        )}
      </div>
    </div>
  );
}
