
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyForm } from "@/components/properties/PropertyForm";

interface PropertyUpdateDialogProps {
  property: any;
}

export function PropertyUpdateDialog({ property }: PropertyUpdateDialogProps) {
  const [open, setOpen] = React.useState(false);

  if (!property) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Property</CardTitle>
        <CardDescription>
          Make changes to your property information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Use this dialog to update the details of your property, such as rent amount, 
          property type, or availability date.
        </p>
      </CardContent>
      <CardFooter>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Edit Property</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Edit Property</DialogTitle>
            </DialogHeader>
            <PropertyForm
              initialValues={property}
              onSuccess={() => setOpen(false)}
              isEditing
            />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
