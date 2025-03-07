import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MeterReadingForm } from "./MeterReadingForm";
import { MeterReadingDetails } from "./MeterReadingDetails";

interface MeterReading {
  id: string;
  property_id: string;
  reading_type: string;
  reading_date: string;
  reading_value: number;
  tenant_id?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  property?: {
    name: string;
    address: string;
  } | null;
}

interface MeterReadingListProps {
  readings: MeterReading[];
  userRole: "landlord" | "tenant";
  onUpdate?: (readingId: string) => void;
}

export function MeterReadingList({ readings, userRole, onUpdate }: MeterReadingListProps) {
  const { toast } = useToast();
  const [editReading, setEditReading] = useState<MeterReading | null>(null);
  const [viewReading, setViewReading] = useState<MeterReading | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const handleDelete = async (readingId: string) => {
    try {
      console.log("Deleting meter reading with ID:", readingId);
      
      const { error } = await supabase
        .from('meter_readings')
        .delete()
        .eq("id", readingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Meter reading deleted successfully!",
      });
      
      if (onUpdate) {
        onUpdate(readingId);
      }
    } catch (error) {
      console.error("Error deleting meter reading:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete meter reading.",
      });
    }
  };

  const handleEdit = (reading: MeterReading) => {
    setEditReading(reading);
    setEditDialogOpen(true);
  };

  const handleView = (reading: MeterReading) => {
    setViewReading(reading);
    setViewDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setEditReading(null);
    if (onUpdate) {
      onUpdate("");
    }
  };

  if (!Array.isArray(readings)) {
    console.error("Readings prop is not an array:", readings);
    return (
      <div className="text-center py-8 text-gray-500">
        Error loading meter readings.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reading Date</TableHead>
              <TableHead>Reading Value</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {readings.map((reading) => (
              <TableRow key={reading.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{reading.property?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{reading.property?.address || 'N/A'}</div>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{reading.reading_type}</TableCell>
                <TableCell>{new Date(reading.reading_date).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium text-blue-600">
                  {reading.reading_value}
                </TableCell>
                <TableCell>{reading.notes || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {userRole === "tenant" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(reading)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(reading)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </>
                    )}
                    {userRole === "landlord" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(reading)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(reading.id)}
                          className="flex items-center gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {readings.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No meter readings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Meter Reading</DialogTitle>
          </DialogHeader>
          {editReading && (
            <MeterReadingForm
              properties={[{ 
                id: editReading.property_id,
                name: editReading.property?.name || '',
                address: editReading.property?.address || '',
                monthly_rent: 0,
                currency: 'USD',
                type: 'Apartment',
                description: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                status: 'occupied',
                tenant_count: 1,
                landlord_id: ''
              }]}
              onSuccess={handleEditSuccess}
              userRole={userRole}
              userId={null}
              initialData={{
                id: editReading.id,
                property_id: editReading.property_id,
                reading_type: (editReading.reading_type === 'electricity' || 
                              editReading.reading_type === 'water' || 
                              editReading.reading_type === 'gas') 
                              ? editReading.reading_type 
                              : 'water',
                reading_value: editReading.reading_value,
                reading_date: editReading.reading_date,
                notes: editReading.notes || ""
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Meter Reading Details</DialogTitle>
          </DialogHeader>
          {viewReading && <MeterReadingDetails reading={viewReading} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
