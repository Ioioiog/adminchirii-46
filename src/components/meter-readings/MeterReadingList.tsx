import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MeterReadingForm } from "./MeterReadingForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "@/hooks/useAuthState";

interface MeterReading {
  id: string;
  property_id: string;
  reading_type: 'electricity' | 'water' | 'gas';
  reading_value: number;
  reading_date: string;
  notes: string | null;
  property: {
    name: string;
    address: string;
    type: 'Apartment' | 'House' | 'Condo' | 'Commercial';
    monthly_rent: number;
    created_at: string;
    updated_at: string;
  };
}

interface MeterReadingListProps {
  readings: MeterReading[];
  userRole: "landlord" | "tenant";
  onUpdate: () => void;
}

export function MeterReadingList({
  readings,
  userRole,
  onUpdate,
}: MeterReadingListProps) {
  const { toast } = useToast();
  const { currentUserId } = useAuthState();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedReading, setSelectedReading] = useState<MeterReading | null>(null);

  console.log("MeterReadingList - Current readings:", readings);
  console.log("MeterReadingList - User role:", userRole);

  const handleDelete = async () => {
    if (!selectedReading) return;

    try {
      console.log("Attempting to delete meter reading:", selectedReading.id);
      const { error } = await supabase
        .from('meter_readings')
        .delete()
        .eq('id', selectedReading.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Meter reading has been deleted",
      });

      onUpdate();
    } catch (error: any) {
      console.error("Error deleting meter reading:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete meter reading",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedReading(null);
    }
  };

  if (!readings || readings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No meter readings found.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Reading</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Notes</TableHead>
            {userRole === "landlord" && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {readings.map((reading) => (
            <TableRow key={reading.id}>
              <TableCell>{reading.property.name}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {reading.reading_type.charAt(0).toUpperCase() + reading.reading_type.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>{reading.reading_value}</TableCell>
              <TableCell>{format(new Date(reading.reading_date), 'PPP')}</TableCell>
              <TableCell>{reading.notes || '-'}</TableCell>
              {userRole === "landlord" && (
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedReading(reading);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedReading(reading);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the meter reading.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Meter Reading</DialogTitle>
          </DialogHeader>
          {selectedReading && (
            <MeterReadingForm
              properties={[{
                id: selectedReading.property_id,
                name: selectedReading.property.name,
                address: selectedReading.property.address,
                type: selectedReading.property.type,
                monthly_rent: selectedReading.property.monthly_rent,
                created_at: selectedReading.property.created_at,
                updated_at: selectedReading.property.updated_at
              }]}
              onSuccess={() => {
                setEditDialogOpen(false);
                onUpdate();
              }}
              userRole={userRole}
              userId={currentUserId}
              initialData={{
                id: selectedReading.id,
                property_id: selectedReading.property_id,
                reading_type: selectedReading.reading_type,
                reading_value: selectedReading.reading_value,
                reading_date: selectedReading.reading_date,
                notes: selectedReading.notes || undefined
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}