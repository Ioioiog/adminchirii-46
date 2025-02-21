
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/utils/propertyUtils";

interface PaymentDialogProps {
  open?: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userRole: "landlord" | "tenant";
  properties: Property[];
}

export function PaymentDialog({
  open,
  onOpenChange,
  userId,
  userRole,
  properties
}: PaymentDialogProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First get the active tenancy for this property
      const { data: tenancyData, error: tenancyError } = await supabase
        .from('tenancies')
        .select('id')
        .eq('property_id', selectedProperty)
        .eq('status', 'active')
        .single();

      if (tenancyError) throw tenancyError;

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          amount: parseFloat(amount),
          tenancy_id: tenancyData.id,
          status: 'pending',
          due_date: new Date().toISOString().split('T')[0], // Today's date
          currency: 'USD'
        });

      if (paymentError) throw paymentError;

      toast({
        title: "Success",
        description: "Payment created successfully",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create payment",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Payment</DialogTitle>
          <DialogDescription>
            Enter the payment details below
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="property">Property</Label>
            <Select
              value={selectedProperty}
              onValueChange={setSelectedProperty}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !amount || !selectedProperty}
            >
              {isSubmitting ? "Creating..." : "Create Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
