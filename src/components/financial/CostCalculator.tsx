
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Calculator } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useProperties } from "@/hooks/useProperties";
import { useUserRole } from "@/hooks/use-user-role";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InvoiceDialog } from "@/components/invoices/InvoiceDialog";
import { UtilityForInvoice } from "@/types/invoice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CostCalculator = () => {
  const { userRole } = useUserRole();
  const { properties } = useProperties({ userRole: userRole || 'tenant' });
  const { toast } = useToast();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [property, setProperty] = useState<string>("");
  const [propertyRent, setPropertyRent] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("USD");
  const [utilities, setUtilities] = useState<UtilityForInvoice[]>([]);
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  // Fetch utilities for a property
  useEffect(() => {
    if (!property) return;

    const fetchUtilities = async () => {
      try {
        const { data, error } = await supabase
          .from("utilities")
          .select("*")
          .eq("property_id", property)
          .eq("status", "pending");

        if (error) throw error;

        // Map to UtilityForInvoice type and calculate remaining amount
        const utilityItems: UtilityForInvoice[] = data.map((util) => {
          const invoicedAmount = util.invoiced_amount || 0;
          const remaining = Math.max(0, util.amount - invoicedAmount);
          const isPartiallyInvoiced = invoicedAmount > 0 && invoicedAmount < util.amount;
          
          return {
            id: util.id,
            type: util.type,
            amount: remaining, // Default to remaining amount
            original_amount: util.amount,
            selected: false,
            currency: util.currency,
            due_date: util.due_date,
            remaining_amount: remaining,
            is_partially_invoiced: isPartiallyInvoiced
          };
        });

        setUtilities(utilityItems);
      } catch (error) {
        console.error("Error fetching utilities:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch utilities",
        });
      }
    };

    // Find selected property details
    const selectedProperty = properties.find(p => p.id === property);
    if (selectedProperty) {
      setPropertyRent(selectedProperty.monthly_rent);
      setCurrency(selectedProperty.currency || "USD");
    }

    fetchUtilities();
  }, [property, properties]);

  // Calculate grand total whenever inputs change
  useEffect(() => {
    let total = 0;
    
    // Add property rent if applicable
    if (property && propertyRent) {
      total += propertyRent;
    }
    
    // Add selected utilities
    utilities.forEach(util => {
      if (util.selected) {
        total += util.amount;
      }
    });
    
    setGrandTotal(total);
  }, [property, propertyRent, utilities]);

  const handlePropertyChange = (value: string) => {
    setProperty(value);
  };

  const handleUtilityToggle = (id: string, checked: boolean) => {
    setUtilities(prev => 
      prev.map(util => 
        util.id === id ? { ...util, selected: checked } : util
      )
    );
  };

  const handleUtilityAmountChange = (id: string, value: string) => {
    const amount = parseFloat(value);
    if (isNaN(amount)) return;

    setUtilities(prev => 
      prev.map(util => {
        if (util.id === id) {
          // Make sure the amount doesn't exceed the remaining amount
          const validAmount = Math.min(amount, util.remaining_amount || util.original_amount || 0);
          return { ...util, amount: validAmount };
        }
        return util;
      })
    );
  };

  const handleCreateInvoice = () => {
    // Verify we have the required data
    if (!property || !date?.from || !date?.to) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a property and date range",
      });
      return;
    }

    // Check if at least one utility is selected or property is selected
    const hasSelectedUtilities = utilities.some(util => util.selected);
    if (!hasSelectedUtilities && !property) {
      toast({
        variant: "destructive",
        title: "No items selected",
        description: "Please select at least one utility or property",
      });
      return;
    }

    // Filter selected utilities
    const selectedUtilities = utilities.filter(util => util.selected);
    
    // Calculate rent amount
    const rentAmount = property ? propertyRent : 0;

    // Prepare calculation data
    const calculationData = {
      propertyId: property,
      rentAmount,
      dateRange: {
        from: date.from,
        to: date.to,
      },
      currency,
      grandTotal,
      utilities: selectedUtilities,
    };

    // Show invoice dialog with pre-filled data
    setShowInvoiceDialog(true);
    
    // Store calculation data for the invoice dialog
    localStorage.setItem('calculationData', JSON.stringify(calculationData));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Cost Calculator</CardTitle>
          <Calculator className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Selection */}
          <div className="space-y-2">
            <Label htmlFor="property">Select Property</Label>
            <Select value={property} onValueChange={handlePropertyChange}>
              <SelectTrigger id="property" className="w-full">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Select Period</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Property Details (Shown if property is selected) */}
          {property && (
            <div className="space-y-4 pt-2">
              <div className="grid gap-2">
                <Label htmlFor="rent">Monthly Rent ({currency})</Label>
                <Input
                  id="rent"
                  type="number"
                  value={propertyRent}
                  onChange={(e) => setPropertyRent(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          {/* Utilities (Shown if utilities are available) */}
          {utilities.length > 0 && (
            <div className="space-y-4">
              <Separator />
              <h3 className="text-md font-medium">Available Utilities</h3>
              <div className="space-y-4">
                {utilities.map((util) => (
                  <div key={util.id} className="flex items-start space-x-4 pb-2 border-b">
                    <Checkbox
                      id={`utility-${util.id}`}
                      checked={util.selected}
                      onCheckedChange={(checked) => handleUtilityToggle(util.id, !!checked)}
                    />
                    <div className="grid gap-1.5 w-full">
                      <div className="flex justify-between w-full">
                        <Label htmlFor={`utility-${util.id}`} className="capitalize">
                          {util.type}
                          {util.is_partially_invoiced && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
                              Partially Invoiced
                            </span>
                          )}
                        </Label>
                        <div className="text-sm text-muted-foreground">
                          {util.remaining_amount !== undefined && (
                            <span>Available: {util.remaining_amount.toFixed(2)} {util.currency}</span>
                          )}
                        </div>
                      </div>
                      
                      {util.selected && (
                        <div className="mt-2">
                          <Label htmlFor={`amount-${util.id}`}>Amount to invoice ({util.currency})</Label>
                          <Input
                            id={`amount-${util.id}`}
                            type="number"
                            value={util.amount}
                            onChange={(e) => handleUtilityAmountChange(util.id, e.target.value)}
                            className="mt-1"
                            min="0"
                            max={util.remaining_amount || util.original_amount}
                            step="0.01"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="space-y-2 pt-4">
            <Separator />
            <div className="flex justify-between items-center text-lg font-bold mt-4">
              <span>Grand Total:</span>
              <span>{grandTotal.toFixed(2)} {currency}</span>
            </div>
          </div>

          {/* Action Button */}
          <Button 
            onClick={handleCreateInvoice} 
            className="w-full mt-4"
            disabled={!property && !utilities.some(u => u.selected)}
          >
            Create Invoice
          </Button>
        </CardContent>
      </Card>

      {/* Invoice Dialog */}
      {showInvoiceDialog && (
        <InvoiceDialog
          open={showInvoiceDialog}
          onOpenChange={setShowInvoiceDialog}
          userId={property ? properties.find(p => p.id === property)?.landlord_id || "" : ""}
          userRole="landlord"
          calculationData={{
            propertyId: property,
            rentAmount: propertyRent,
            dateRange: {
              from: date?.from || new Date(),
              to: date?.to || new Date(),
            },
            currency,
            grandTotal,
            utilities: utilities.filter(util => util.selected),
          }}
        />
      )}
    </div>
  );
};

export default CostCalculator;
