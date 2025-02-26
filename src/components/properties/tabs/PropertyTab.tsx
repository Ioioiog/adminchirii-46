
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PropertyStatus } from "@/utils/propertyUtils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface PropertyTabProps {
  property: any;
  isEditing: boolean;
  editedData: any;
  setEditedData: (data: any) => void;
  handleEdit: () => void;
  handleCancel: () => void;
  handleSave: () => void;
  getStatusColor: (status: PropertyStatus) => string;
}

export const PropertyTab = ({
  property,
  isEditing,
  editedData,
  setEditedData,
  handleEdit,
  handleCancel,
  handleSave,
  getStatusColor
}: PropertyTabProps) => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold mb-2">
            {isEditing ? (
              <Input
                value={editedData.name}
                onChange={(e) =>
                  setEditedData({ ...editedData, name: e.target.value })
                }
                className="text-2xl font-semibold"
              />
            ) : (
              property.name
            )}
          </h2>
          <Badge className={getStatusColor(property.status)}>
            {property.status || "Status not set"}
          </Badge>
        </div>
        <div>
          {!isEditing ? (
            <Button onClick={handleEdit}>Edit Property</Button>
          ) : (
            <div className="space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Label>Address</Label>
            {isEditing ? (
              <Input
                value={editedData.address}
                onChange={(e) =>
                  setEditedData({ ...editedData, address: e.target.value })
                }
              />
            ) : (
              <p className="text-gray-700">{property.address}</p>
            )}
          </div>

          <div>
            <Label>Type</Label>
            {isEditing ? (
              <Input
                value={editedData.type}
                onChange={(e) =>
                  setEditedData({ ...editedData, type: e.target.value })
                }
              />
            ) : (
              <p className="text-gray-700">{property.type}</p>
            )}
          </div>

          <div>
            <Label>Monthly Rent</Label>
            {isEditing ? (
              <Input
                type="number"
                value={editedData.monthly_rent}
                onChange={(e) =>
                  setEditedData({
                    ...editedData,
                    monthly_rent: parseFloat(e.target.value),
                  })
                }
              />
            ) : (
              <p className="text-gray-700">${property.monthly_rent}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Description</Label>
            {isEditing ? (
              <Textarea
                value={editedData.description}
                onChange={(e) =>
                  setEditedData({ ...editedData, description: e.target.value })
                }
              />
            ) : (
              <p className="text-gray-700">{property.description}</p>
            )}
          </div>

          <div>
            <Label>Available From</Label>
            {isEditing ? (
              <Input
                type="date"
                value={editedData.available_from}
                onChange={(e) =>
                  setEditedData({ ...editedData, available_from: e.target.value })
                }
              />
            ) : (
              <p className="text-gray-700">
                {property.available_from
                  ? format(new Date(property.available_from), "PP")
                  : "Not set"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
