
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calculator, FileText, Receipt } from "lucide-react";
import { InvoiceForm } from "./InvoiceForm";
import { InvoiceDialogProps } from "@/types/invoice";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CostCalculator } from "@/components/financial/CostCalculator";

export function InvoiceDialog({ 
  open, 
  onOpenChange, 
  userId, 
  userRole, 
  onInvoiceCreated,
  calculationData
}: InvoiceDialogProps) {
  const [activeTab, setActiveTab] = useState<"form" | "calculator">(
    calculationData ? "form" : "calculator"
  );
  const [localCalculationData, setLocalCalculationData] = useState(calculationData);

  const handleInvoiceCreated = async () => {
    if (onInvoiceCreated) {
      await onInvoiceCreated();
    }
    onOpenChange(false);
  };

  const handleCalculatorResult = (data: any) => {
    setLocalCalculationData(data);
    setActiveTab("form");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-lg shadow-lg border-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <Receipt size={20} />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-800">Create Invoice</DialogTitle>
            </div>
            <DialogDescription className="mt-2 text-gray-600">
              Note: Invoices are automatically generated on the monthly renewal date of each active tenancy.
              Manual invoice creation should only be used for special cases or partial payments.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "form" | "calculator")} className="flex-1 flex flex-col">
            <div className="px-6 pt-4 border-b">
              <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
                <TabsTrigger value="calculator" className="flex items-center gap-2 py-2">
                  <Calculator size={16} />
                  <span>Cost Calculator</span>
                </TabsTrigger>
                <TabsTrigger value="form" className="flex items-center gap-2 py-2">
                  <FileText size={16} />
                  <span>Invoice Details</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh] flex-1">
              <TabsContent value="calculator" className="mt-0 h-full">
                {userRole && userId && (
                  <CostCalculator
                    onCalculate={handleCalculatorResult}
                    hideCreateInvoiceButton
                    initialCalculationData={localCalculationData}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="form" className="mt-0 h-full">
                <InvoiceForm 
                  onSuccess={handleInvoiceCreated} 
                  userId={userId} 
                  userRole={userRole} 
                  calculationData={localCalculationData || calculationData}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
