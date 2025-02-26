
import { useEffect, useState } from "react";
import { StripeAccountForm } from "../StripeAccountForm";
import { useUserRole } from "@/hooks/use-user-role";
import { InvoiceGenerationInfo } from "./InvoiceGenerationInfo";
import { InvoiceInfoForm } from "../InvoiceInfoForm";
import { PaymentMethodsForm } from "../PaymentMethodsForm";
import { Separator } from "@/components/ui/separator";
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

interface ServiceProviderInvoiceInfo {
  companyName: string;
  companyAddress: string;
  bankName: string;
  bankAccountNumber: string;
  bankSwiftCode: string;
  vatNumber: string;
  registrationNumber: string;
  paymentTerms: string;
  invoiceNotes: string;
  applyVat: boolean;
}

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
          form.reset(data.invoice_info as ServiceProviderInvoiceInfo);
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

      const { error } = await supabase
        .from('service_provider_profiles')
        .update({
          invoice_info: data
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

  if (userRole === 'service_provider') {
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

  if (userRole === 'tenant') {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-1">Financial & Payments Settings</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Manage your payment methods and billing information
          </p>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <PaymentMethodsForm />
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Payment Overview</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Current balance and payment information</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Balance</p>
                      <p className="text-2xl font-semibold">
                        {formatAmount(balance)}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Statement
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Download Financial Statement</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will generate a detailed statement of your financial history. Continue?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <Button onClick={handleDownloadStatement}>
                            Download
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <CreditCard className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Payment Methods</h4>
                      <p className="text-sm text-muted-foreground">
                        Add and manage your payment methods
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Receipt className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Invoices & Receipts</h4>
                      <p className="text-sm text-muted-foreground">
                        Access your payment history
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Building className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Invoice Information</h3>
                    <p className="text-sm text-muted-foreground">
                      This information is automatically filled from your rental contract
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsViewingDetails(!isViewingDetails)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {isViewingDetails ? 'Hide' : 'View'} Details
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">Loading information...</p>
                </div>
              ) : !contractData ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No signed contract information available. Please contact your landlord if you believe this is an error.
                </p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Property</h4>
                    <p className="text-sm text-muted-foreground">
                      {contractData.property?.name || 'Not available'}
                    </p>
                  </div>
                  {isViewingDetails && (
                    <>
                      <div>
                        <h4 className="font-medium mb-2">Tenant Name</h4>
                        <p className="text-sm text-muted-foreground">
                          {contractData.metadata?.tenantName || 'Not available'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Registration Number</h4>
                        <p className="text-sm text-muted-foreground">
                          {contractData.metadata?.tenantReg || 'Not available'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Fiscal Code</h4>
                        <p className="text-sm text-muted-foreground">
                          {contractData.metadata?.tenantFiscal || 'Not available'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Address</h4>
                        <p className="text-sm text-muted-foreground">
                          {contractData.metadata?.tenantAddress || 'Not available'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Bank Account</h4>
                        <p className="text-sm text-muted-foreground">
                          {contractData.metadata?.tenantBank || 'Not available'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Bank Name</h4>
                        <p className="text-sm text-muted-foreground">
                          {contractData.metadata?.tenantBankName || 'Not available'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Contact Email</h4>
                        <p className="text-sm text-muted-foreground">
                          {contractData.metadata?.tenantEmail || 'Not available'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Phone Number</h4>
                        <p className="text-sm text-muted-foreground">
                          {contractData.metadata?.tenantPhone || 'Not available'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (userRole === 'landlord') {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight mb-1">Financial & Payments Settings</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Manage your financial settings and payment preferences
          </p>
        </div>
        
        <div className="grid gap-8">
          <InvoiceGenerationInfo />
          <Separator className="my-2" />
          <InvoiceInfoForm />
          <Separator className="my-2" />
          <StripeAccountForm />
        </div>
      </div>
    );
  }

  return null;
}
