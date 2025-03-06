import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { StripeAccountForm } from "../StripeAccountForm";
import { useUserRole } from "@/hooks/use-user-role";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Building, Receipt, CreditCard, DollarSign, FileText } from "lucide-react";
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

interface LandlordFinancialInfo {
  businessName: string;
  taxIdentificationNumber: string;
  bankName: string;
  bankAccountNumber: string;
  invoicePrefix: string;
  automaticInvoicing: boolean;
}

export function FinancialSettings() {
  const { userRole } = useUserRole();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isStripeLoading, setIsStripeLoading] = useState(false);

  const tenantForm = useForm<TenantFinancialInfo>({
    defaultValues: {
      bankName: "",
      bankAccountNumber: "",
      bankSwiftCode: "",
      preferredPaymentMethod: "",
      automaticPayments: false,
      paymentReminders: true,
    },
  });

  const landlordForm = useForm<LandlordFinancialInfo>({
    defaultValues: {
      businessName: "",
      taxIdentificationNumber: "",
      bankName: "",
      bankAccountNumber: "",
      invoicePrefix: "",
      automaticInvoicing: true,
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
          
          if (userRole === 'tenant') {
            tenantForm.reset({
              bankName: String(financialInfo.bankName || ""),
              bankAccountNumber: String(financialInfo.bankAccountNumber || ""),
              bankSwiftCode: String(financialInfo.bankSwiftCode || ""),
              preferredPaymentMethod: String(financialInfo.preferredPaymentMethod || ""),
              automaticPayments: Boolean(financialInfo.automaticPayments),
              paymentReminders: Boolean(financialInfo.paymentReminders ?? true),
            });
          } else if (userRole === 'landlord') {
            landlordForm.reset({
              businessName: String(financialInfo.businessName || ""),
              taxIdentificationNumber: String(financialInfo.taxIdentificationNumber || ""),
              bankName: String(financialInfo.bankName || ""),
              bankAccountNumber: String(financialInfo.bankAccountNumber || ""),
              invoicePrefix: String(financialInfo.invoicePrefix || ""),
              automaticInvoicing: Boolean(financialInfo.automaticInvoicing ?? true),
            });
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching financial info:', error);
        setIsLoading(false);
      }
    };

    fetchFinancialInfo();
  }, [userRole, tenantForm, landlordForm]);

  const onTenantSubmit = async (formData: TenantFinancialInfo) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

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

  const onLandlordSubmit = async (formData: LandlordFinancialInfo) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const invoiceInfo: Record<string, Json> = {
        businessName: formData.businessName,
        taxIdentificationNumber: formData.taxIdentificationNumber,
        bankName: formData.bankName,
        bankAccountNumber: formData.bankAccountNumber,
        invoicePrefix: formData.invoicePrefix,
        automaticInvoicing: formData.automaticInvoicing,
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
        description: "Business financial information updated successfully",
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

  const setupStripePayment = async () => {
    try {
      setIsStripeLoading(true);
      const { data, error } = await supabase.functions.invoke('create-payment-setup', {
        method: 'POST',
      });

      if (error) throw error;

      if (data?.clientSecret) {
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
        if (!stripe) throw new Error('Stripe failed to load');

        const { error: stripeError } = await stripe.confirmSetup({
          clientSecret: data.clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/settings?section=financial`,
          },
        });

        if (stripeError) {
          throw stripeError;
        }
      }
    } catch (error) {
      console.error('Error setting up Stripe payment:', error);
      toast({
        title: "Error",
        description: "Failed to setup payment method",
        variant: "destructive",
      });
    } finally {
      setIsStripeLoading(false);
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
            Manage your payment preferences and payment methods
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Card Payment Setup</h3>
                <p className="text-sm text-muted-foreground">
                  Add a credit or debit card for automatic payments
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={setupStripePayment} 
              disabled={isStripeLoading}
              className="w-full"
            >
              {isStripeLoading ? "Setting up..." : "Setup Card Payment"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Building className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Bank Information</h3>
                <p className="text-sm text-muted-foreground">
                  Update your bank account details and payment preferences
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...tenantForm}>
              <form onSubmit={tenantForm.handleSubmit(onTenantSubmit)} className="space-y-6">
                <div className="grid gap-4">
                  <FormField
                    control={tenantForm.control}
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
                    control={tenantForm.control}
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
                    control={tenantForm.control}
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
                    control={tenantForm.control}
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
                      control={tenantForm.control}
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
                      control={tenantForm.control}
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

  if (userRole === 'landlord') {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-1">Business Payment Settings</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Manage your business payment and invoicing preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Stripe Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your Stripe account to process payments from tenants
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <StripeAccountForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Building className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Business Information</h3>
                <p className="text-sm text-muted-foreground">
                  Update your business details and banking information
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...landlordForm}>
              <form onSubmit={landlordForm.handleSubmit(onLandlordSubmit)} className="space-y-6">
                <div className="grid gap-4">
                  <FormField
                    control={landlordForm.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your business name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={landlordForm.control}
                    name="taxIdentificationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Identification Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your tax ID" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={landlordForm.control}
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
                    control={landlordForm.control}
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
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-4">Invoicing Settings</h4>
                  <div className="grid gap-4">
                    <FormField
                      control={landlordForm.control}
                      name="invoicePrefix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Invoice Prefix</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., INV-" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex flex-col space-y-1">
                      <Label htmlFor="automatic-invoicing">Automatic Invoicing</Label>
                      <span className="text-sm text-muted-foreground">
                        Generate invoices automatically on the scheduled date
                      </span>
                    </div>
                    <FormField
                      control={landlordForm.control}
                      name="automaticInvoicing"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="automatic-invoicing"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Business Settings"}
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
