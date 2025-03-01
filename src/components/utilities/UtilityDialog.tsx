
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UtilityForm } from "./components/UtilityForm";

interface UtilityDialogProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  onUtilityCreated: () => void;
  properties: any[];
}

export function UtilityDialog({
  isDialogOpen,
  setIsDialogOpen,
  onUtilityCreated,
  properties = [] // Default to empty array if properties is undefined
}: UtilityDialogProps) {
  const handleClose = () => {
    setIsDialogOpen(false);
  };

  const handleUtilityCreated = () => {
    handleClose();
    if (onUtilityCreated) {
      onUtilityCreated();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Utility Bill</DialogTitle>
        </DialogHeader>
        <UtilityForm
          onSuccess={handleUtilityCreated}
          onCancel={handleClose}
          properties={properties || []} // Ensure we always pass an array
        />
      </DialogContent>
    </Dialog>
  );
}
