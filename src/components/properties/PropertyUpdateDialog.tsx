
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PropertyUpdateDialogProps {
  property: any;
}

export function PropertyUpdateDialog({ property }: PropertyUpdateDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  if (!property) return null;

  const handleSubmit = async (data: any) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          name: data.name,
          address: data.address,
          monthly_rent: data.monthly_rent,
          type: data.type,
          description: data.description,
          available_from: data.available_from
        })
        .eq('id', property.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Property updated successfully",
      });

      return true;
    } catch (error) {
      console.error("Error updating property:", error);
      toast({
        title: "Error",
        description: "Failed to update property",
        variant: "destructive",
      });
      return false;
    }
  };

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
              onSubmit={handleSubmit}
              isEditing
            />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
