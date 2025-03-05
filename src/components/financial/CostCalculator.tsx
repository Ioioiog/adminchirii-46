
import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Calculator, Plus, Trash2, ChevronDown, FileText } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useProperties } from "@/hooks/useProperties";
import { useUserRole } from "@/hooks/use-user-role";
import { useCurrency } from "@/hooks/useCurrency";
import { InvoiceDialog } from "@/components/invoices/InvoiceDialog";
import { CalculationData } from "@/types/invoice";

interface UtilityInput {
  id: string;
  type: string;
  amount: string;
}

interface Calculations {
  propertyId?: string;
  currency?: string;
  dateRange?: DateRange;
  rentAmount?: number;
  utilities?: UtilityInput[];
  grandTotal?: number;
}

interface CostCalculatorProps {
  onCalculate?: (calculations: any) => void;
  hideCreateInvoiceButton?: boolean;
  initialCalculationData?: CalculationData;
}

const formSchema = z.object({
  propertyId: z.string().optional(),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
  rentAmount: z.number().min(0).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CostCalculator = ({ 
  onCalculate, 
  hideCreateInvoiceButton = false, 
  initialCalculationData 
}: CostCalculatorProps) => {
  const { userRole, userId } = useUserRole();
  const { properties, isLoading } = useProperties({ userRole: userRole || "tenant" });
  const { formatAmount, convertCurrency } = useCurrency();
  const [calculations, setCalculations] = useState<Calculations | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [utilities, setUtilities] = useState<UtilityInput[]>([{ id: `util-${Date.now()}`, type: "", amount: "" }]);
  const [isOpen, setIsOpen] = useState(true);
  const [propertyRent, setPropertyRent] = useState<number | null>(null);
  const [propertyCurrency, setPropertyCurrency] = useState<string>("EUR");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: "",
      dateRange: {
        from: new Date(),
        to: new Date(),
      },
      rentAmount: 0,
    }
  });

  useEffect(() => {
    if (initialCalculationData) {
      // Initialize form from calculation data
      form.setValue("propertyId", initialCalculationData.propertyId || "");
      if (initialCalculationData.dateRange) {
        form.setValue("dateRange", {
          from: initialCalculationData.dateRange.from,
          to: initialCalculationData.dateRange.to,
        });
      }
      form.setValue("rentAmount", initialCalculationData.rentAmount || 0);
      
      // Set initial property information
      const property = properties.find(p => p.id === initialCalculationData.propertyId);
      if (property) {
        setPropertyRent(property.monthly_rent);
        setPropertyCurrency(property.currency || "EUR");
      }
      
      // Set initial utilities
      if (initialCalculationData.utilities && initialCalculationData.utilities.length > 0) {
        const formattedUtilities = initialCalculationData.utilities.map(util => ({
          id: util.id,
          type: util.type,
          amount: String(util.amount)
        }));
        setUtilities(formattedUtilities);
      }
      
      // Initialize calculations
      setCalculations({
        propertyId: initialCalculationData.propertyId,
        dateRange: initialCalculationData.dateRange && {
          from: initialCalculationData.dateRange.from,
          to: initialCalculationData.dateRange.to
        },
        rentAmount: initialCalculationData.rentAmount,
        utilities: initialCalculationData.utilities?.map(util => ({
          id: util.id,
          type: util.type,
          amount: String(util.amount)
        })),
        grandTotal: initialCalculationData.grandTotal,
        currency: initialCalculationData.currency
      });
    }
  }, [initialCalculationData, form, properties]);

  const onPropertyChange = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setPropertyRent(property.monthly_rent);
      setPropertyCurrency(property.currency || "EUR");
      form.setValue("rentAmount", property.monthly_rent);
    }
  };

  const addUtility = () => {
    setUtilities([...utilities, { id: `util-${Date.now()}`, type: "", amount: "" }]);
  };

  const removeUtility = (index: number) => {
    const newUtilities = [...utilities];
    newUtilities.splice(index, 1);
    setUtilities(newUtilities);
  };

  const updateUtility = (index: number, field: keyof UtilityInput, value: string) => {
    const newUtilities = [...utilities];
    newUtilities[index] = { ...newUtilities[index], [field]: value };
    setUtilities(newUtilities);
  };

  const calculateTotal = () => {
    const values = form.getValues();
    const rentAmount = values.rentAmount || 0;
    
    let utilitiesTotal = 0;
    utilities.forEach(utility => {
      if (utility.amount && utility.type) {
        const amount = parseFloat(utility.amount);
        if (!isNaN(amount)) {
          utilitiesTotal += amount;
        }
      }
    });
    
    const grandTotal = rentAmount + utilitiesTotal;
    
    const formattedUtilities = utilities
      .filter(util => util.type && util.amount && parseFloat(util.amount) > 0)
      .map(util => ({
        id: util.id || `util-${Date.now()}`,
        type: util.type || "",
        amount: parseFloat(util.amount || "0"),
      }));
    
    // Ensure dateRange has required properties before setting calculations
    const dateRangeValue = values.dateRange || { from: new Date(), to: new Date() };
    const safeFrom = dateRangeValue.from || new Date();
    const safeTo = dateRangeValue.to || new Date();
    const safeRange: DateRange = { from: safeFrom, to: safeTo };
    
    const calculationsData: Calculations = {
      propertyId: values.propertyId,
      dateRange: safeRange,
      rentAmount,
      utilities: formattedUtilities.map(util => ({
        id: util.id,
        type: util.type,
        amount: String(util.amount)
      })),
      grandTotal,
      currency: propertyCurrency
    };
    
    setCalculations(calculationsData);
    
    if (onCalculate) {
      onCalculate(getCalculationData(calculationsData));
    }
  };

  const getCalculationData = (calculationsData: Calculations): CalculationData => {
    // Ensure dateRange has required properties
    const dateRange = calculationsData.dateRange ? {
      from: calculationsData.dateRange.from || new Date(),
      to: calculationsData.dateRange.to || new Date()
    } : undefined;
    
    return {
      propertyId: calculationsData.propertyId,
      dateRange,
      rentAmount: calculationsData.rentAmount,
      utilities: calculationsData.utilities?.map(util => ({
        id: util.id || `util-${Date.now()}`,
        type: util.type || "",
        amount: parseFloat(util.amount || "0"),
        selected: true,
        currency: propertyCurrency
      })),
      grandTotal: calculationsData.grandTotal,
      currency: calculationsData.currency
    };
  };

  const handleCreateInvoice = () => {
    setShowInvoiceDialog(true);
  };

  const handleInvoiceCreated = async () => {
    return Promise.resolve();
  };

  return (
    <div className="space-y-6">
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(calculateTotal)} className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Cost Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        onPropertyChange(value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name} ({formatAmount(property.monthly_rent, property.currency)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateRange"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date Range</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value?.from ? (
                              field.value.to ? (
                                <>
                                  {format(field.value.from, "LLL dd, y")} -{" "}
                                  {format(field.value.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(field.value.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={field.value || { from: new Date(), to: new Date() }}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rent Amount ({propertyCurrency})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Collapsible
                open={isOpen}
                onOpenChange={setIsOpen}
                className="border rounded-md p-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Additional Utilities</h4>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isOpen ? "transform rotate-180" : ""
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="space-y-3 mt-3">
                  {utilities.map((utility, index) => (
                    <div key={utility.id} className="flex items-end gap-3">
                      <div className="flex-1">
                        <FormLabel className="text-xs">Type</FormLabel>
                        <Input
                          placeholder="e.g. Electricity"
                          value={utility.type}
                          onChange={(e) => updateUtility(index, "type", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="w-1/3">
                        <FormLabel className="text-xs">Amount ({propertyCurrency})</FormLabel>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={utility.amount}
                          onChange={(e) => updateUtility(index, "amount", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeUtility(index)}
                        className="mb-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addUtility}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Utility
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="ml-auto">
                <Calculator className="mr-2 h-4 w-4" /> Calculate Total
              </Button>
            </CardFooter>
          </Card>
        </form>
      </FormProvider>

      {calculations && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Property</h3>
                <p>{properties.find(p => p.id === calculations.propertyId)?.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Period</h3>
                <p>
                  {calculations.dateRange?.from && format(calculations.dateRange.from, "MMM d, yyyy")}
                  {calculations.dateRange?.to && ` - ${format(calculations.dateRange.to, "MMM d, yyyy")}`}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Rent</h3>
                <p>{formatAmount(calculations.rentAmount || 0, propertyCurrency)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Utilities</h3>
                <p>
                  {formatAmount(
                    calculations.utilities?.reduce(
                      (sum, util) => sum + parseFloat(util.amount || "0"),
                      0
                    ) || 0,
                    propertyCurrency
                  )}
                </p>
              </div>
            </div>
            
            {calculations.utilities && calculations.utilities.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <h4 className="text-sm font-medium mb-1">Utilities Breakdown:</h4>
                <div className="space-y-1">
                  {calculations.utilities
                    .filter(util => util.type && util.amount && parseFloat(util.amount) > 0)
                    .map((util, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{util.type}</span>
                        <span>{formatAmount(parseFloat(util.amount || "0"), propertyCurrency)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            <div className="pt-3 border-t mt-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Total Amount</h3>
                <p className="text-xl font-bold text-primary">
                  {formatAmount(calculations.grandTotal || 0, propertyCurrency)}
                </p>
              </div>
            </div>
          </CardContent>
          {!hideCreateInvoiceButton && calculations.propertyId && (
            <CardFooter>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                onClick={handleCreateInvoice}
              >
                <FileText className="mr-2 h-4 w-4" /> Create Invoice
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      {showInvoiceDialog && userRole && userId && (
        <InvoiceDialog
          open={showInvoiceDialog}
          onOpenChange={setShowInvoiceDialog}
          userId={userId}
          userRole={userRole === "service_provider" ? "landlord" : userRole}
          onInvoiceCreated={handleInvoiceCreated}
          calculationData={getCalculationData(calculations as Calculations)}
        />
      )}
    </div>
  );
};

export default CostCalculator;
