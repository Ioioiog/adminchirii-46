
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { MeterReadingForm } from "./MeterReadingForm";
import { Property } from "@/utils/propertyUtils";

interface MeterReadingDialogProps {
  properties: Property[];
  onReadingCreated: () => void;
  userRole: "landlord" | "tenant";
  userId: string | null;
}

export function MeterReadingDialog({
  properties,
  onReadingCreated,
  userRole,
  userId
}: MeterReadingDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Reading
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Meter Reading</DialogTitle>
        </DialogHeader>
        <MeterReadingForm
          properties={properties}
          onSuccess={() => {
            setOpen(false);
            onReadingCreated();
          }}
          userRole={userRole}
          userId={userId}
        />
      </DialogContent>
    </Dialog>
  );
}
