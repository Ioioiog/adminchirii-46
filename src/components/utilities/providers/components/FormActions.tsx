
import React from "react";
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  onClose: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
}

export const FormActions = ({ onClose, isSubmitting, isEditing }: FormActionsProps) => {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" type="button" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : isEditing ? "Update Provider" : "Add Provider"}
      </Button>
    </div>
  );
};
