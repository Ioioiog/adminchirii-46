
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MeterReadingForm } from "./MeterReadingForm";
import { Property } from "@/utils/propertyUtils";
import { PlusCircle } from "lucide-react";

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
  userId,
}: MeterReadingDialogProps) {
  const [open, setOpen] = useState(false);

  if (properties.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Meter Reading
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
