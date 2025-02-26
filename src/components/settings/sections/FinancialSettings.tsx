
import { useEffect, useState } from "react";
import { StripeAccountForm } from "../StripeAccountForm";
import { useUserRole } from "@/hooks/use-user-role";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Building, Receipt, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Json } from "@/integrations/supabase/types/json";

interface TenantFinancialInfo {
  bankName: string;
  bankAccountNumber: string;
  bankSwiftCode: string;
  preferredPaymentMethod: string;
  automaticPayments: boolean;
  paymentReminders: boolean;
}

export function FinancialSettings() {
  const { userRole } = useUserRole();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<TenantFinancialInfo>({
    defaultValues: {
      bankName: "",
      bankAccountNumber: "",
      bankSwiftCode: "",
      preferredPaymentMethod: "",
      automaticPayments: false,
      paymentReminders: true,
    },
  });

  useEffect(() => {
    const fetchFinancialInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('invoice_info')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data?.invoice_info) {
          const financialInfo = data.invoice_info as Record<string, unknown>;
          form.reset({
            bankName: String(financialInfo.bankName || ""),
            bankAccountNumber: String(financialInfo.bankAccountNumber || ""),
            bankSwiftCode: String(financialInfo.bankSwiftCode || ""),
            preferredPaymentMethod: String(financialInfo.preferredPaymentMethod || ""),
            automaticPayments: Boolean(financialInfo.automaticPayments),
            paymentReminders: Boolean(financialInfo.paymentReminders ?? true),
          });
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching financial info:', error);
        setIsLoading(false);
      }
    };

    if (userRole === 'tenant') {
      fetchFinancialInfo();
    }
  }, [form, userRole]);

  const onSubmit = async (formData: TenantFinancialInfo) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Convert the form data to a Record type that matches Json type
      const invoiceInfo: Record<string, Json> = {
        bankName: formData.bankName,
        bankAccountNumber: formData.bankAccountNumber,
        bankSwiftCode: formData.bankSwiftCode,
        preferredPaymentMethod: formData.preferredPaymentMethod,
        automaticPayments: formData.automaticPayments,
        paymentReminders: formData.paymentReminders,
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          invoice_info: invoiceInfo
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Financial information updated successfully",
      });
    } catch (error) {
      console.error('Error updating financial info:', error);
      toast({
        title: "Error",
        description: "Failed to update financial information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (userRole === 'service_provider') {
    return <StripeAccountForm />;
  }

  if (userRole === 'tenant') {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-1">Payment Settings</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Manage your payment preferences and bank account details
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Payment Information</h3>
                <p className="text-sm text-muted-foreground">
                  Update your payment details and preferences
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your bank name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bankAccountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Account Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your account number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bankSwiftCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank SWIFT/BIC Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter bank SWIFT/BIC code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredPaymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Payment Method</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Bank Transfer, Credit Card" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="automatic-payments">Automatic Payments</Label>
                      <span className="text-sm text-muted-foreground">
                        Allow automatic payment processing when rent is due
                      </span>
                    </div>
                    <FormField
                      control={form.control}
                      name="automaticPayments"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="automatic-payments"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="payment-reminders">Payment Reminders</Label>
                      <span className="text-sm text-muted-foreground">
                        Receive notifications before payment due dates
                      </span>
                    </div>
                    <FormField
                      control={form.control}
                      name="paymentReminders"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="payment-reminders"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Payment Settings"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
