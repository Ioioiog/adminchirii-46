import { useEffect, useState } from "react";
import { StripeAccountForm } from "../StripeAccountForm";
import { useUserRole } from "@/hooks/use-user-role";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Building, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ServiceProviderInvoiceInfo } from "@/integrations/supabase/types/service-provider";
import { Json } from "@/integrations/supabase/types/json";

export function FinancialSettings() {
  const { userRole } = useUserRole();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ServiceProviderInvoiceInfo>({
    defaultValues: {
      companyName: "",
      companyAddress: "",
      bankName: "",
      bankAccountNumber: "",
      bankSwiftCode: "",
      vatNumber: "",
      registrationNumber: "",
      paymentTerms: "",
      invoiceNotes: "",
      applyVat: false,
    },
  });

  useEffect(() => {
    const fetchInvoiceInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('service_provider_profiles')
          .select('invoice_info')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data?.invoice_info) {
          const invoiceInfo = data.invoice_info as Record<string, unknown>;
          
          const transformedData: ServiceProviderInvoiceInfo = {
            companyName: String(invoiceInfo.companyName || ""),
            companyAddress: String(invoiceInfo.companyAddress || ""),
            bankName: String(invoiceInfo.bankName || ""),
            bankAccountNumber: String(invoiceInfo.bankAccountNumber || ""),
            bankSwiftCode: String(invoiceInfo.bankSwiftCode || ""),
            vatNumber: String(invoiceInfo.vatNumber || ""),
            registrationNumber: String(invoiceInfo.registrationNumber || ""),
            paymentTerms: String(invoiceInfo.paymentTerms || ""),
            invoiceNotes: String(invoiceInfo.invoiceNotes || ""),
            applyVat: Boolean(invoiceInfo.applyVat),
          };

          form.reset(transformedData);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching invoice info:', error);
        setIsLoading(false);
      }
    };

    if (userRole === 'service_provider') {
      fetchInvoiceInfo();
    }
  }, [form, userRole]);

  const onSubmit = async (data: ServiceProviderInvoiceInfo) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const jsonData: Record<string, Json> = {
        companyName: data.companyName,
        companyAddress: data.companyAddress,
        bankName: data.bankName,
        bankAccountNumber: data.bankAccountNumber,
        bankSwiftCode: data.bankSwiftCode,
        vatNumber: data.vatNumber,
        registrationNumber: data.registrationNumber,
        paymentTerms: data.paymentTerms,
        invoiceNotes: data.invoiceNotes,
        applyVat: data.applyVat,
      };

      const { error } = await supabase
        .from('service_provider_profiles')
        .update({
          invoice_info: jsonData
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice information updated successfully",
      });
    } catch (error) {
      console.error('Error updating invoice info:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (userRole !== 'service_provider') {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-1">Financial & Payments Settings</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Manage your payment information and invoice details
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Receipt className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Invoice Information</h3>
                <p className="text-sm text-muted-foreground">
                  This information will appear on your invoices
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your company name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter company registration number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="companyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter your company address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
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
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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
                    name="vatNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VAT Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter VAT number (if applicable)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter your payment terms (e.g., Payment due within 30 days)" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="invoiceNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Invoice Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter any additional notes to appear on invoices" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label htmlFor="apply-vat">Apply VAT to Invoices</Label>
                    <span className="text-sm text-muted-foreground">
                      Automatically add VAT to your invoice amounts
                    </span>
                  </div>
                  <FormField
                    control={form.control}
                    name="applyVat"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="apply-vat"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Invoice Information"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Building className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Stripe Account</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your Stripe account to receive online payments
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <StripeAccountForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
