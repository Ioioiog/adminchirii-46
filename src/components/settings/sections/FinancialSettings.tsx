
import { InvoiceInfoForm } from "../InvoiceInfoForm";
import { StripeAccountForm } from "../StripeAccountForm";
import { useUserRole } from "@/hooks/use-user-role";
import { InvoiceGenerationInfo } from "./InvoiceGenerationInfo";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { CreditCard, Receipt } from "lucide-react";

export function FinancialSettings() {
  const { userRole } = useUserRole();

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
            <h3 className="text-lg font-medium">Invoice Information</h3>
          </CardHeader>
          <CardContent>
            <InvoiceInfoForm />
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
