
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUserRole } from "@/hooks/use-user-role";
import { useCurrency } from "@/hooks/useCurrency";
import { InvoiceDialog } from "@/components/invoices/InvoiceDialog";
import { FileText } from "lucide-react";
import { CalculationData } from "@/types/invoice";

const formSchema = z.object({
  rentAmount: z.string().refine(value => !isNaN(parseFloat(value)), {
    message: "Rent amount must be a number.",
  }).refine(value => parseFloat(value) > 0, {
    message: "Rent amount must be greater than zero.",
  }),
  startDate: z.date({
    required_error: "A start date is required.",
  }),
  endDate: z.date({
    required_error: "An end date is required.",
  }),
  utilities: z.array(
    z.object({
      type: z.string().min(1, "Type is required"),
      amount: z.string().refine(value => !isNaN(parseFloat(value)), {
        message: "Utility amount must be a number.",
      }).refine(value => parseFloat(value) >= 0, {
        message: "Utility amount cannot be negative.",
      }),
      id: z.string(),
    })
  ).optional(),
});

interface CostCalculatorProps {
  onInvoiceCreated?: () => void;
}

interface Calculations {
  rentAmount: number;
  dateRange: DateRange;
  utilities: Array<{ type: string; amount: number; id: string }>;
  utilitiesTotal: number;
  grandTotal: number;
}

const CostCalculator: React.FC<CostCalculatorProps> = ({ onInvoiceCreated }) => {
  const [calculations, setCalculations] = useState<Calculations | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const { toast } = useToast();
  const { userRole, userId } = useUserRole();
  const { formatAmount } = useCurrency();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rentAmount: '',
      startDate: undefined,
      endDate: undefined,
      utilities: [{ type: '', amount: '', id: `utility-${Date.now()}-${Math.random()}` }],
    },
  });

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = form;

  const rentAmount = watch("rentAmount");
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const utilities = watch("utilities");

  useEffect(() => {
    // Generate unique IDs for utilities when they are added
    const updatedUtilities = utilities?.map(utility => ({
      ...utility,
      id: utility.id || `utility-${Date.now()}-${Math.random()}`,
    }));

    setValue("utilities", updatedUtilities, { shouldDirty: true });
  }, [utilities, setValue]);

  const calculateCosts = () => {
    if (!rentAmount || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      toast({
        title: "Invalid Date Range",
        description: "Start date cannot be after end date.",
        variant: "destructive",
      });
      return;
    }

    const timeDiff = end.getTime() - start.getTime();
    const dayDiff = timeDiff / (1000 * 3600 * 24) + 1;
    const proratedRent = (parseFloat(rentAmount) / 30) * dayDiff;

    let utilitiesTotal = 0;
    let formattedUtilities: Array<{ type: string; amount: number; id: string }> = [];
    
    if (utilities && utilities.length > 0) {
      utilitiesTotal = utilities.reduce((acc, utility) => {
        const amount = parseFloat(utility.amount || '0');
        return acc + amount;
      }, 0);
      
      formattedUtilities = utilities.map(utility => ({
        type: utility.type || '',
        amount: parseFloat(utility.amount || '0'),
        id: utility.id || `utility-${Date.now()}-${Math.random()}`
      }));
    }

    const grandTotal = proratedRent + utilitiesTotal;

    setCalculations({
      rentAmount: proratedRent,
      dateRange: { from: start, to: end },
      utilities: formattedUtilities,
      utilitiesTotal: utilitiesTotal,
      grandTotal: grandTotal,
    });

    toast({
      title: "Costs Calculated",
      description: `Total cost: ${formatAmount(grandTotal)}`,
    });
  };

  const addUtility = () => {
    setValue("utilities", [
      ...(utilities || []), 
      { type: '', amount: '', id: `utility-${Date.now()}-${Math.random()}` }
    ], { shouldDirty: true });
  };

  const removeUtility = (index: number) => {
    const updatedUtilities = [...(utilities || [])];
    updatedUtilities.splice(index, 1);
    setValue("utilities", updatedUtilities, { shouldDirty: true });
  };

  const handleCreateInvoice = () => {
    if (calculations?.grandTotal && calculations?.grandTotal > 0) {
      setShowInvoiceDialog(true);
    } else {
      toast({
        title: "No Costs Calculated",
        description: "Please calculate costs before creating an invoice.",
        variant: "destructive",
      });
    }
  };

  // Convert Calculations to CalculationData for InvoiceDialog
  const getCalculationData = (): CalculationData => {
    if (!calculations) return {};
    
    return {
      rentAmount: calculations.rentAmount,
      dateRange: {
        from: calculations.dateRange.from,
        to: calculations.dateRange.to as Date, // Force type as Date since it's required
      },
      grandTotal: calculations.grandTotal,
      utilities: calculations.utilities.map(util => ({
        id: util.id,
        type: util.type,
        amount: util.amount,
        selected: true
      }))
    };
  };

  // Create a Promise-returning function for onInvoiceCreated
  const handleInvoiceCreated = async (): Promise<void> => {
    if (onInvoiceCreated) {
      onInvoiceCreated();
    }
    return Promise.resolve();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 flex items-center justify-center">
      <div className="container max-w-3xl mx-auto shadow-md rounded-lg overflow-hidden">
        <Card className="w-full">
          <CardHeader className="bg-white p-5 border-b">
            <CardTitle className="text-lg font-semibold text-gray-800">Cost Calculator</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <FormProvider {...form}>
              <form onSubmit={handleSubmit(calculateCosts)} className="space-y-4">
                {/* Rent Amount Input */}
                <div>
                  <Label htmlFor="rentAmount" className="block text-sm font-medium text-gray-700">
                    Rent Amount
                  </Label>
                  <Input
                    type="text"
                    id="rentAmount"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    {...register("rentAmount")}
                  />
                  {errors.rentAmount && (
                    <p className="text-red-500 text-sm mt-1">{errors.rentAmount.message?.toString()}</p>
                  )}
                </div>

                {/* Date Range Picker */}
                <div>
                  <Label className="block text-sm font-medium text-gray-700">
                    Date Range
                  </Label>
                  <div className="rounded-md border bg-white p-2 shadow-sm">
                    <Calendar
                      mode="range"
                      defaultMonth={startDate}
                      selected={
                        startDate && endDate ? { from: startDate, to: endDate } : undefined
                      }
                      onSelect={(range: DateRange | undefined) => {
                        setValue("startDate", range?.from, { shouldValidate: true });
                        setValue("endDate", range?.to, { shouldValidate: true });
                      }}
                      className="rounded-md border-none shadow-none overflow-hidden"
                    />
                  </div>
                  {errors.startDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.startDate.message?.toString()}</p>
                  )}
                  {errors.endDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.endDate.message?.toString()}</p>
                  )}
                  {startDate && endDate && (
                    <p className="text-sm text-gray-500 mt-1">
                      Selected Range: {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
                    </p>
                  )}
                </div>

                {/* Utilities */}
                <div>
                  <Label className="block text-sm font-medium text-gray-700">
                    Utilities
                  </Label>
                  {utilities?.map((utility, index) => (
                    <div key={utility.id || index} className="flex space-x-2 mb-2">
                      <Input
                        type="text"
                        placeholder="Type"
                        className="mt-1 block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        {...register(`utilities.${index}.type`)}
                      />
                      <Input
                        type="text"
                        placeholder="Amount"
                        className="mt-1 block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        {...register(`utilities.${index}.amount`)}
                      />
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeUtility(index)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="secondary" size="sm" onClick={addUtility}>
                    Add Utility
                  </Button>
                  {errors.utilities && (
                    <p className="text-red-500 text-sm mt-1">{errors.utilities[0]?.message?.toString()}</p>
                  )}
                </div>

                {/* Calculate Button */}
                <Button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                  Calculate
                </Button>

                {/* Cost Calculator Results Summary */}
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Calculation Results</h3>
                    <Button 
                      onClick={handleCreateInvoice} 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                      disabled={!calculations?.grandTotal || calculations?.grandTotal <= 0}
                    >
                      <FileText className="h-4 w-4" />
                      Create Invoice
                    </Button>
                  </div>
                  
                  {calculations && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100 shadow-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-blue-100">
                          <span className="text-sm font-medium text-slate-600">Period:</span>
                          <span className="text-sm">
                            {format(calculations.dateRange.from, 'MMM d, yyyy')} to {format(calculations.dateRange.to, 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-blue-100">
                          <span className="text-sm font-medium text-slate-600">Prorated Rent:</span>
                          <span className="text-sm">{formatAmount(calculations.rentAmount)}</span>
                        </div>
                        
                        {calculations.utilities && calculations.utilities.length > 0 && (
                          <div className="py-2 border-b border-blue-100">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-slate-600">Included Utilities:</span>
                              <span className="text-sm">{formatAmount(calculations.utilitiesTotal)}</span>
                            </div>
                            <div className="pl-4 space-y-1 mt-1">
                              {calculations.utilities.map((utility) => (
                                <div key={utility.id} className="flex justify-between text-xs text-slate-500">
                                  <span>{utility.type}</span>
                                  <span>{formatAmount(utility.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center py-3 font-medium">
                          <span className="text-base text-slate-800">Total Amount:</span>
                          <span className="text-lg text-blue-700">{formatAmount(calculations.grandTotal)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Create Invoice Form Dialog */}
                {showInvoiceDialog && userId && (
                  <InvoiceDialog
                    open={showInvoiceDialog}
                    onOpenChange={setShowInvoiceDialog}
                    userId={userId}
                    userRole={userRole === "service_provider" ? "landlord" : userRole}
                    calculationData={getCalculationData()}
                    onInvoiceCreated={handleInvoiceCreated}
                  />
                )}
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CostCalculator;
