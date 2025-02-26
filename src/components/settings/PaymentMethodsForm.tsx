
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PaymentMethodData {
  id: string;
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
}

export function PaymentMethodsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const { toast } = useToast();

  const handleAddPaymentMethod = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add a payment method",
          variant: "destructive",
        });
        return;
      }

      // Create a Stripe Checkout session for adding a payment method
      const { data, error } = await supabase.functions.invoke('create-payment-setup', {
        body: { userId: user.id },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast({
        title: "Error",
        description: "Could not initiate payment method setup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.functions.invoke('remove-payment-method', {
        body: { paymentMethodId },
      });

      if (error) throw error;

      setPaymentMethods(methods => methods.filter(m => m.id !== paymentMethodId));
      toast({
        title: "Success",
        description: "Payment method removed successfully",
      });
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast({
        title: "Error",
        description: "Could not remove payment method",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="space-y-1">
                <p className="font-medium">
                  {method.brand} •••• {method.last4}
                </p>
                <p className="text-sm text-muted-foreground">
                  Expires {method.exp_month}/{method.exp_year}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemovePaymentMethod(method.id)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          onClick={handleAddPaymentMethod}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Add Payment Method
        </Button>
      </CardContent>
    </Card>
  );
}
