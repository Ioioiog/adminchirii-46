
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PropertyForm } from "./PropertyForm";
import { Property } from "@/utils/propertyUtils";

interface PropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: ((data: any) => void) | ((property: Property, data: any) => Promise<boolean>);
  property?: Property;
  isSubmitting?: boolean;
  mode: "add" | "edit";
}

export function PropertyDialog({
  open,
  onOpenChange,
  onSubmit,
  property,
  isSubmitting,
  mode,
}: PropertyDialogProps) {
  const handleSubmit = async (data: any) => {
    if (mode === "edit" && property) {
      // Ensure property ID is included in the data
      const updatedData = {
        ...data,
        id: property.id // Include the property ID
      };
      await (onSubmit as (property: Property, data: any) => Promise<boolean>)(property, updatedData);
    } else {
      (onSubmit as (data: any) => void)(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Property" : "Edit Property"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add" 
              ? "Add a new property to your portfolio." 
              : "Update your property details."}
          </DialogDescription>
        </DialogHeader>
        <PropertyForm
          onSubmit={handleSubmit}
          initialData={property}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
