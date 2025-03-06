
import React from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UtilityType } from "@/integrations/supabase/types/utility";

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
    if (onUpdate) {
      onUpdate(reading.id);
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
  );
}
