
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PropertyDeleteDialogProps {
  property: any;
}

export function PropertyDeleteDialog({ property }: PropertyDeleteDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!property) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Delete property from Supabase
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', property.id);
      
      if (error) throw error;
      
      toast({
        title: "Property deleted",
        description: "The property has been successfully deleted",
      });
      
      setOpen(false);
      navigate('/properties');
    } catch (error) {
      console.error("Error deleting property:", error);
      toast({
        title: "Error",
        description: "Failed to delete property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delete Property</CardTitle>
        <CardDescription>
          Permanently delete this property
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          This action will permanently remove the property from your account.
          All related data including tenant records and maintenance requests will also be deleted.
        </p>
      </CardContent>
      <CardFooter>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">Delete Property</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Property</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this property? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
