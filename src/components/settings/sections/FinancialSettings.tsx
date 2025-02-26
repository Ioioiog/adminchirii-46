
import { useEffect, useState } from "react";
import { StripeAccountForm } from "../StripeAccountForm";
import { useUserRole } from "@/hooks/use-user-role";
import { InvoiceGenerationInfo } from "./InvoiceGenerationInfo";
import { InvoiceInfoForm } from "../InvoiceInfoForm";
import { PaymentMethodsForm } from "../PaymentMethodsForm";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { CreditCard, Receipt, Building, Download, Eye, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Json } from "@/integrations/supabase/types/json";
import { useCurrency } from "@/hooks/useCurrency";

interface ContractData {
  property?: {
    name: string;
  };
  metadata?: {
    tenantName?: string;
    tenantReg?: string;
    tenantFiscal?: string;
    tenantAddress?: string;
    tenantBank?: string;
    tenantBankName?: string;
    tenantEmail?: string;
    tenantPhone?: string;
  } | Json;
}

export function FinancialSettings() {
  const { userRole } = useUserRole();
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch contract data and balance
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch contract
        const { data: contract, error: contractError } = await supabase
          .from('contracts')
          .select(`
            metadata,
            property:properties (
              name
            )
          `)
          .eq('tenant_id', user.id)
          .eq('status', 'signed')
          .order('created_at', { ascending: false })
          .maybeSingle();

        if (contractError) throw contractError;

        if (contract) {
          setContractData({
            property: contract.property,
            metadata: contract.metadata as ContractData['metadata']
          });
        }

        // Fetch balance from payments
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('amount, status')
          .eq('tenant_id', user.id);

        if (paymentsError) throw paymentsError;

        const totalBalance = payments?.reduce((acc, payment) => {
          return payment.status === 'pending' ? acc + payment.amount : acc;
        }, 0) || 0;

        setBalance(totalBalance);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Could not fetch financial information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userRole === 'tenant') {
      fetchData();
    }
  }, [userRole, toast]);

  const handleDownloadStatement = async () => {
    try {
      toast({
        title: "Processing",
        description: "Generating your financial statement...",
      });
      // Implement statement download logic here
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not generate financial statement",
        variant: "destructive",
      });
    }
  };

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
                      {contractData?.property?.name || 'Not available'}
                    </p>
                  </div>
                  {isViewingDetails && (
                    <>
                      <div>
                        <h4 className="font-medium mb-2">Tenant Name</h4>
                        <p className="text-sm text-muted-foreground">
                          {(contractData?.metadata as any)?.tenantName || 'Not available'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Registration Number</h4>
                        <p className="text-sm text-muted-foreground">
                          {(contractData?.metadata as any)?.tenantReg || 'Not available'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Fiscal Code</h4>
                        <p className="text-sm text-muted-foreground">
                          {(contractData?.metadata as any)?.tenantFiscal || 'Not available'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Address</h4>
                        <p className="text-sm text-muted-foreground">
                          {(contractData?.metadata as any)?.tenantAddress || 'Not available'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Bank Account</h4>
                        <p className="text-sm text-muted-foreground">
                          {(contractData?.metadata as any)?.tenantBank || 'Not available'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Bank Name</h4>
                        <p className="text-sm text-muted-foreground">
                          {(contractData?.metadata as any)?.tenantBankName || 'Not available'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Contact Email</h4>
                        <p className="text-sm text-muted-foreground">
                          {(contractData?.metadata as any)?.tenantEmail || 'Not available'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Phone Number</h4>
                        <p className="text-sm text-muted-foreground">
                          {(contractData?.metadata as any)?.tenantPhone || 'Not available'}
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
