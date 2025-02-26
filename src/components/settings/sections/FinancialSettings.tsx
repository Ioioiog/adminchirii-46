
import { useEffect, useState } from "react";
import { StripeAccountForm } from "../StripeAccountForm";
import { useUserRole } from "@/hooks/use-user-role";
import { InvoiceGenerationInfo } from "./InvoiceGenerationInfo";
import { InvoiceInfoForm } from "../InvoiceInfoForm";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { CreditCard, Receipt, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types/json";

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
  const [contractData, setContractData] = useState<ContractData | null>(null);

  useEffect(() => {
    const fetchContractData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: contract, error } = await supabase
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
          .limit(1)
          .single();

        if (error) throw error;

        // Type assertion to ensure contract data matches our interface
        const typedContract: ContractData = {
          property: contract.property,
          metadata: contract.metadata as ContractData['metadata']
        };

        setContractData(typedContract);
      } catch (error) {
        console.error('Error fetching contract:', error);
        toast({
          title: "Error",
          description: "Could not fetch invoice information",
          variant: "destructive",
        });
      }
    };

    if (userRole === 'tenant') {
      fetchContractData();
    }
  }, [userRole, toast]);

  // For tenants, show payment-related settings
  if (userRole === 'tenant') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Financial & Payments Settings</h2>
        
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Payment Information</h3>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6">
              <div className="flex items-center space-x-4">
                <CreditCard className="h-6 w-6 text-blue-500" />
                <div>
                  <h4 className="font-medium">Payment Methods</h4>
                  <p className="text-sm text-muted-foreground">
                    You can pay your rent and utilities using credit card, debit card, or bank transfer
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Receipt className="h-6 w-6 text-green-500" />
                <div>
                  <h4 className="font-medium">Invoices & Receipts</h4>
                  <p className="text-sm text-muted-foreground">
                    Access your payment history and download invoices from the Financial section
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Building className="h-6 w-6 text-purple-500" />
              <div>
                <h3 className="text-lg font-medium">Invoice Information</h3>
                <p className="text-sm text-muted-foreground">
                  This information is automatically filled from your rental contract
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Property</h4>
                <p className="text-sm text-muted-foreground">
                  {contractData?.property?.name || 'Not available'}
                </p>
              </div>
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
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For landlords, show the original content
  if (userRole === 'landlord') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Financial & Payments Settings</h2>
        
        <InvoiceGenerationInfo />
        
        <Separator className="my-6" />
        
        <InvoiceInfoForm />
        
        <Separator className="my-6" />
        
        <StripeAccountForm />
      </div>
    );
  }

  return null;
}
