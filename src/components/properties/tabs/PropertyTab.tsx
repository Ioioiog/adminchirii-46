
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Save, X, Home, DollarSign, MapPin } from "lucide-react";

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
  const status = property.tenancies?.some((t: any) => t.status === 'active') ? 'occupied' : 'vacant';

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
          <Badge className={`${getStatusColor(status)} text-sm px-3 py-1 rounded-full font-medium`}>
            {status}
          </Badge>
          {isEditing ? (
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
              {isEditing ? (
                <Input
                  value={editedData.address}
                  onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
                  className="mt-1 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500/20"
                />
              ) : (
                <p className="text-base text-gray-900 mt-1">{property.address}</p>
              )}
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
