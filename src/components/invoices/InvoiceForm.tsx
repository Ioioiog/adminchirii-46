import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCurrency } from "@/hooks/useCurrency";
import { Switch } from "@/components/ui/switch";
import { differenceInDays, isLastDayOfMonth, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { CalendarIcon, Percent } from "lucide-react";
import { UtilityItem } from "@/types/invoice";

interface InvoiceFormValues {
  property_id: string;
  details?: string;
  document?: File;
  tenant_email?: string;
  amount: number;
  currency: string;
  is_partial: boolean;
  partial_percentage?: number;
  calculation_method: 'percentage' | 'days';
  days_calculated?: number;
}

interface InvoiceFormProps {
  onSuccess?: () => void;
}

interface Utility {
  id: string;
  type: string;
  amount: number;
  due_date: string;
  issued_date?: string;
  invoice_number?: string;
  currency: string;
  percentage?: number;
  original_amount?: number;
  is_partial?: boolean;
}

export function InvoiceForm({ onSuccess }: InvoiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Array<{ id: string; name: string; monthly_rent: number }>>([]);
  const { toast } = useToast();
  const form = useForm<InvoiceFormValues>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [tenantEmail, setTenantEmail] = useState<string | null>(null);
  const { availableCurrencies, formatAmount } = useCurrency();
  const [isPartialInvoice, setIsPartialInvoice] = useState(false);
  const [propertyFullAmount, setPropertyFullAmount] = useState<number | null>(null);
  const [partialPercentage, setPartialPercentage] = useState<number>(50);
  const [calculationMethod, setCalculationMethod] = useState<'percentage' | 'days'>('days');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [daysCalculated, setDaysCalculated] = useState<number>(0);
  const [utilityData, setUtilityData] = useState<Utility[]>([]);
  const [selectedUtilities, setSelectedUtilities] = useState<Utility[]>([]);
  const [utilityTotal, setUtilityTotal] = useState<number>(0);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("EUR");

  useEffect(() => {
    const fetchProperties = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error getting user:", userError);
        return;
      }
      if (!user) return;

      console.log("Fetching properties for user:", user.id);
      const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select("id, name, monthly_rent")
        .eq("landlord_id", user.id);

      if (propertiesError) {
        console.error("Error fetching properties:", propertiesError);
        return;
      }

      console.log("Fetched properties:", properties);
      setProperties(properties || []);
    };

    fetchProperties();
  }, []);

  useEffect(() => {
    const fetchTenantEmail = async () => {
      if (!selectedPropertyId) return;

      const { data: tenancy, error: tenancyError } = await supabase
        .from("tenancies")
        .select(`
          tenant:profiles (
            email
          )
        `)
        .eq("property_id", selectedPropertyId)
        .eq("status", "active")
        .maybeSingle();

      if (tenancyError) {
        console.error("Error fetching tenant:", tenancyError);
        return;
      }

      if (tenancy?.tenant?.email) {
        setTenantEmail(tenancy.tenant.email);
        form.setValue("tenant_email", tenancy.tenant.email);
      }

      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("monthly_rent")
        .eq("id", selectedPropertyId)
        .maybeSingle();

      if (propertyError) {
        console.error("Error fetching property monthly rent:", propertyError);
        return;
      }

      if (property?.monthly_rent) {
        setPropertyFullAmount(property.monthly_rent);
        if (!isPartialInvoice) {
          form.setValue("amount", property.monthly_rent);
        } else {
          updatePartialAmount(property.monthly_rent);
        }
      }

      fetchUtilities(selectedPropertyId);
    };

    fetchTenantEmail();
  }, [selectedPropertyId, form]);

  const fetchUtilities = async (propertyId: string) => {
    if (!dateRange?.from || !dateRange?.to) return;

    const startDate = format(dateRange.from, 'yyyy-MM-dd');
    const endDate = format(dateRange.to, 'yyyy-MM-dd');

    try {
      const { data: utilities, error } = await supabase
        .from('utilities')
        .select('id, type, amount, due_date, issued_date, invoice_number, currency')
        .eq('property_id', propertyId)
        .gte('issued_date', startDate)
        .lte('issued_date', endDate)
        .eq('status', 'pending');

      if (error) {
        console.error("Error fetching utilities:", error);
        return;
      }

      const utilitiesWithPartial = (utilities || []).map(util => ({
        ...util,
        percentage: 100,
        original_amount: util.amount,
        is_partial: false
      }));
      
      setUtilityData(utilitiesWithPartial);
      
      setSelectedUtilities(utilitiesWithPartial);
      
      const total = utilitiesWithPartial.reduce((sum, util) => sum + util.amount, 0);
      setUtilityTotal(total);
      
      if (propertyFullAmount) {
        updateTotalAmount(propertyFullAmount, total);
      }
    } catch (error) {
      console.error("Error in fetchUtilities:", error);
    }
  };

  useEffect(() => {
    if (dateRange?.from && dateRange?.to && selectedPropertyId) {
      fetchUtilities(selectedPropertyId);
      
      const days = differenceInDays(dateRange.to, dateRange.from) + 1;
      setDaysCalculated(days);
      form.setValue("days_calculated", days);
      
      if (propertyFullAmount && isPartialInvoice) {
        updatePartialAmount(propertyFullAmount);
      }
    }
  }, [dateRange, selectedPropertyId]);

  useEffect(() => {
    const total = selectedUtilities.reduce((sum, util) => sum + util.amount, 0);
    setUtilityTotal(total);
    
    if (propertyFullAmount) {
      updateTotalAmount(propertyFullAmount, total);
    }
  }, [selectedUtilities, propertyFullAmount, selectedCurrency]);

  const updateTotalAmount = async (rentAmount: number, utilitiesAmount: number) => {
    const { data: exchangeRatesData } = await supabase.functions.invoke('get-exchange-rates');
    const rates = exchangeRatesData?.rates || { USD: 4.56, EUR: 4.97, RON: 1 };
    
    let rentPortion = rentAmount;
    
    if (isPartialInvoice) {
      if (calculationMethod === 'percentage') {
        rentPortion = (rentAmount * partialPercentage) / 100;
      } else if (calculationMethod === 'days') {
        const dailyRate = rentAmount / 30;
        rentPortion = dailyRate * daysCalculated;
      }
    }
    
    const convertAmount = (amount: number, fromCurrency: string, toCurrency: string) => {
      if (fromCurrency === toCurrency) return amount;
      
      let amountInRON = amount;
      if (fromCurrency !== 'RON') {
        amountInRON = amount * rates[fromCurrency];
      }
      
      if (toCurrency === 'RON') {
        return amountInRON;
      }
      
      return amountInRON / rates[toCurrency];
    };
    
    const propertyCurrency = "EUR";
    
    const convertedRentPortion = convertAmount(rentPortion, propertyCurrency, selectedCurrency);
    
    const convertedUtilitiesAmount = selectedUtilities.reduce((sum, util) => {
      const convertedAmount = convertAmount(util.amount, util.currency || "EUR", selectedCurrency);
      return sum + convertedAmount;
    }, 0);
    
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('invoice_info')
          .eq('id', user.id)
          .single();
      
        let vatAmount = 0;
        if (profile?.invoice_info && typeof profile.invoice_info === 'object') {
          const invoiceInfo = profile.invoice_info as { [key: string]: any };
          if (invoiceInfo.apply_vat) {
            vatAmount = convertedRentPortion * 0.19;
          }
        }
        
        form.setValue("amount", convertedRentPortion + vatAmount + convertedUtilitiesAmount);
        form.setValue("currency", selectedCurrency);
      }
    });
  };

  const updatePartialAmount = (fullAmount: number) => {
    if (calculationMethod === 'percentage') {
      const calculatedAmount = (fullAmount * partialPercentage) / 100;
      updateTotalAmount(calculatedAmount, utilityTotal);
    } else if (calculationMethod === 'days') {
      const days = daysCalculated;
      const dailyRate = fullAmount / 30;
      const calculatedAmount = dailyRate * days;
      updateTotalAmount(calculatedAmount, utilityTotal);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handlePartialToggle = (isPartial: boolean) => {
    setIsPartialInvoice(isPartial);
    form.setValue("is_partial", isPartial);
    
    if (propertyFullAmount) {
      if (isPartial) {
        updatePartialAmount(propertyFullAmount);
        if (calculationMethod === 'percentage') {
          form.setValue("partial_percentage", partialPercentage);
        } else {
          form.setValue("days_calculated", daysCalculated);
        }
      } else {
        updateTotalAmount(propertyFullAmount, utilityTotal);
        form.setValue("partial_percentage", undefined);
        form.setValue("days_calculated", undefined);
      }
    }
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseInt(e.target.value, 10);
    setPartialPercentage(percentage);
    form.setValue("partial_percentage", percentage);
    
    if (propertyFullAmount && isPartialInvoice && calculationMethod === 'percentage') {
      updatePartialAmount(propertyFullAmount);
    }
  };

  const handleCalculationMethodChange = (method: 'percentage' | 'days') => {
    setCalculationMethod(method);
    form.setValue("calculation_method", method);
    
    if (propertyFullAmount && isPartialInvoice) {
      updatePartialAmount(propertyFullAmount);
    }
  };

  const toggleUtilitySelection = (utility: Utility) => {
    if (selectedUtilities.some(u => u.id === utility.id)) {
      setSelectedUtilities(selectedUtilities.filter(u => u.id !== utility.id));
    } else {
      setSelectedUtilities([...selectedUtilities, utility]);
    }
  };

  const toggleUtilityPartial = (utility: Utility) => {
    const updatedUtilities = selectedUtilities.map(util => {
      if (util.id === utility.id) {
        return {
          ...util,
          is_partial: !util.is_partial,
          percentage: !util.is_partial ? 100 : util.percentage,
          amount: !util.is_partial ? util.original_amount || util.amount : util.amount
        };
      }
      return util;
    });
    
    setSelectedUtilities(updatedUtilities);
    
    const newTotal = updatedUtilities.reduce((sum, util) => sum + util.amount, 0);
    setUtilityTotal(newTotal);
    
    if (propertyFullAmount) {
      updateTotalAmount(propertyFullAmount, newTotal);
    }
  };

  const updateUtilityPercentage = (utilityId: string, percentage: number) => {
    const updatedUtilities = selectedUtilities.map(util => {
      if (util.id === utilityId) {
        const newAmount = util.original_amount ? (util.original_amount * percentage) / 100 : util.amount;
        return {
          ...util,
          percentage,
          amount: newAmount,
          is_partial: percentage < 100
        };
      }
      return util;
    });
    
    setSelectedUtilities(updatedUtilities);
    
    const newTotal = updatedUtilities.reduce((sum, util) => sum + util.amount, 0);
    setUtilityTotal(newTotal);
    
    if (propertyFullAmount) {
      updateTotalAmount(propertyFullAmount, newTotal);
    }
  };

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    form.setValue("currency", currency);
    
    if (propertyFullAmount) {
      updateTotalAmount(propertyFullAmount, utilityTotal);
    }
  };

  const onSubmit = async (values: InvoiceFormValues) => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please upload an invoice document",
        variant: "destructive",
      });
      return;
    }

    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Error",
        description: "Please select a date range",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log("Submitting invoice with values:", values);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("No user found");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile || profile.role !== "landlord") throw new Error("Only landlords can create invoices");

      const { data: tenancy, error: tenancyError } = await supabase
        .from("tenancies")
        .select("tenant_id")
        .eq("property_id", values.property_id)
        .eq("status", "active")
        .maybeSingle();

      if (tenancyError) throw tenancyError;
      if (!tenancy) throw new Error("No active tenant found for this property");

      if (values.tenant_email) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ email: values.tenant_email })
          .eq("id", tenancy.tenant_id);

        if (updateError) throw updateError;
      }

      const { data: landlordProfile } = await supabase
        .from("profiles")
        .select("invoice_info")
        .eq("id", user.id)
        .single();
      
      let applyVat = false;
      if (landlordProfile?.invoice_info && typeof landlordProfile.invoice_info === 'object') {
        const invoiceInfo = landlordProfile.invoice_info as { [key: string]: any };
        applyVat = !!invoiceInfo.apply_vat;
      }
      
      const vatRate = applyVat ? 19 : 0;

      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      let metadata: any = {};
      if (isPartialInvoice) {
        metadata = {
          is_partial: true,
          full_amount: propertyFullAmount,
          calculation_method: calculationMethod,
          date_range: {
            from: dateRange.from.toISOString(),
            to: dateRange.to.toISOString()
          },
          utilities_included: selectedUtilities.map(u => ({
            id: u.id,
            type: u.type,
            amount: u.amount,
            due_date: u.due_date,
            percentage: u.percentage,
            original_amount: u.original_amount,
            is_partial: u.is_partial
          }))
        };
        
        if (calculationMethod === 'percentage') {
          metadata = {
            ...metadata,
            partial_percentage: values.partial_percentage
          };
        } else if (calculationMethod === 'days') {
          metadata = {
            ...metadata,
            days_calculated: daysCalculated,
            daily_rate: propertyFullAmount ? propertyFullAmount / 30 : 0
          };
        }
      } else {
        metadata = {
          date_range: {
            from: dateRange.from.toISOString(),
            to: dateRange.to.toISOString()
          },
          utilities_included: selectedUtilities.map(u => ({
            id: u.id,
            type: u.type,
            amount: u.amount,
            due_date: u.due_date,
            percentage: u.percentage,
            original_amount: u.original_amount,
            is_partial: u.is_partial
          }))
        };
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          amount: values.amount,
          currency: values.currency,
          due_date: dueDate,
          landlord_id: user.id,
          property_id: values.property_id,
          tenant_id: tenancy.tenant_id,
          status: "pending",
          vat_rate: vatRate,
          metadata: metadata
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      let rentPortion = propertyFullAmount || 0;
      if (isPartialInvoice) {
        if (calculationMethod === 'percentage') {
          rentPortion = ((propertyFullAmount || 0) * partialPercentage) / 100;
        } else {
          const dailyRate = (propertyFullAmount || 0) / 30;
          rentPortion = dailyRate * daysCalculated;
        }
      }

      const invoiceItemType = isPartialInvoice ? "partial_rent" : "rent";
      let rentDescription = isPartialInvoice 
        ? calculationMethod === 'percentage'
          ? `Partial rent (${values.partial_percentage}%)`
          : `Partial rent for ${daysCalculated} days (${format(dateRange.from, 'PP')} to ${format(dateRange.to, 'PP')})`
        : `Monthly rent (${format(dateRange.from, 'PP')} to ${format(dateRange.to, 'PP')})`;

      const { error: rentItemError } = await supabase
        .from("invoice_items")
        .insert({
          invoice_id: invoice.id,
          description: rentDescription,
          amount: rentPortion,
          type: invoiceItemType
        });

      if (rentItemError) throw rentItemError;

      if (applyVat && rentPortion > 0) {
        const vatAmount = rentPortion * (vatRate / 100);
        const { error: vatItemError } = await supabase
          .from("invoice_items")
          .insert({
            invoice_id: invoice.id,
            description: `VAT (${vatRate}%) on Rent`,
            amount: vatAmount,
            type: "tax"
          });
        
        if (vatItemError) throw vatItemError;
      }

      for (const utility of selectedUtilities) {
        let utilityDescription = `${utility.type} utility`;
        
        if (utility.invoice_number) {
          utilityDescription += ` (${utility.invoice_number})`;
        }
        
        if (utility.is_partial && utility.percentage !== 100) {
          utilityDescription += ` (${utility.percentage}% of ${utility.original_amount})`;
        }
        
        const { error: utilityItemError } = await supabase
          .from("invoice_items")
          .insert({
            invoice_id: invoice.id,
            description: utilityDescription,
            amount: utility.amount,
            type: "utility"
          });
        
        if (utilityItemError) throw utilityItemError;
        
        const { error: utilityUpdateError } = await supabase
          .from("utilities")
          .update({ status: "invoiced" })
          .eq("id", utility.id);
          
        if (utilityUpdateError) throw utilityUpdateError;
      }

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `${invoice.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('invoice-documents')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;
      }

      toast({
        title: "Success",
        description: "Invoice created successfully",
      });

      if (onSuccess) {
        onSuccess();
      }

      form.reset();
      setSelectedFile(null);
      setTenantEmail(null);
      setSelectedPropertyId(null);
      setIsPartialInvoice(false);
      setPartialPercentage(50);
      setCalculationMethod('days');
      setDaysCalculated(0);
      setDateRange({
        from: new Date(),
        to: new Date(),
      });
      setUtilityData([]);
      setSelectedUtilities([]);
      setUtilityTotal(0);
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="property">Property</Label>
        <Select 
          onValueChange={(value) => {
            console.log("Property selected:", value);
            form.setValue("property_id", value);
            setSelectedPropertyId(value);
          }}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a property" />
          </SelectTrigger>
          <SelectContent>
            {properties.length > 0 ? (
              properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-properties" disabled>
                No properties available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedPropertyId && (
        <div className="space-y-2">
          <Label htmlFor="tenant_email">Tenant Email</Label>
          <Input
            id="tenant_email"
            type="email"
            {...form.register("tenant_email")}
            defaultValue={tenantEmail || ""}
            placeholder="tenant@example.com"
          />
        </div>
      )}

      {selectedPropertyId && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date_range">Billing Period</Label>
            <DatePickerWithRange 
              date={dateRange} 
              setDate={setDateRange} 
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Select the period for this invoice
            </p>
          </div>
          
          <div className="flex items-center space-x-2 my-4">
            <Switch 
              id="is_partial"
              checked={isPartialInvoice}
              onCheckedChange={handlePartialToggle}
            />
            <Label htmlFor="is_partial" className="cursor-pointer">Create Partial Rent Invoice</Label>
          </div>
        </div>
      )}

      {isPartialInvoice && selectedPropertyId && (
        <div className="space-y-4 p-4 border rounded-md">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Input 
                type="radio" 
                id="percentage-method" 
                name="calculation-method" 
                checked={calculationMethod === 'percentage'} 
                onChange={() => handleCalculationMethodChange('percentage')}
                className="w-4 h-4"
              />
              <Label htmlFor="percentage-method">Percentage based</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Input 
                type="radio" 
                id="days-method" 
                name="calculation-method" 
                checked={calculationMethod === 'days'} 
                onChange={() => handleCalculationMethodChange('days')}
                className="w-4 h-4"
              />
              <Label htmlFor="days-method">Days based</Label>
            </div>
          </div>

          {calculationMethod === 'percentage' && (
            <div className="space-y-2">
              <Label htmlFor="partial_percentage">Percentage of full amount (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="partial_percentage"
                  type="number"
                  min="1"
                  max="99"
                  value={partialPercentage}
                  onChange={handlePercentageChange}
                  className="w-24"
                />
                <span>%</span>
              </div>
              {propertyFullAmount && (
                <p className="text-sm text-muted-foreground">
                  Full amount: {propertyFullAmount} | Partial amount: {(propertyFullAmount * partialPercentage) / 100}
                </p>
              )}
            </div>
          )}

          {calculationMethod === 'days' && (
            <div className="space-y-2">
              <Label htmlFor="days_calculated">Period details</Label>
              <div className="text-sm text-muted-foreground">
                <p>Selected period: {dateRange?.from && dateRange?.to ? 
                  `${format(dateRange.from, 'PP')} to ${format(dateRange.to, 'PP')} (${daysCalculated} days)` : 
                  'No period selected'}</p>
                {propertyFullAmount && (
                  <>
                    <p>Full monthly amount: {propertyFullAmount}</p>
                    <p>Daily rate: {(propertyFullAmount / 30).toFixed(2)}</p>
                    <p>Partial rent amount for {daysCalculated} days: {((propertyFullAmount / 30) * daysCalculated).toFixed(2)}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedPropertyId && dateRange?.from && dateRange?.to && (
        <div className="space-y-4 border p-4 rounded-md">
          <div className="flex justify-between items-center">
            <Label>Utilities for this period</Label>
            <div className="text-sm">
              Total: {utilityTotal.toFixed(2)}
            </div>
          </div>
          
          {utilityData.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {utilityData.map(utility => (
                <div 
                  key={utility.id} 
                  className={`p-3 border rounded-md ${
                    selectedUtilities.some(u => u.id === utility.id) ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={selectedUtilities.some(u => u.id === utility.id)}
                        onChange={() => toggleUtilitySelection(utility)}
                        className="h-4 w-4"
                      />
                      <div>
                        <div className="font-medium capitalize">{utility.type}</div>
                        <div className="text-sm text-gray-500">
                          {utility.invoice_number ? `Invoice #${utility.invoice_number}` : 'No invoice number'} | 
                          Due: {new Date(utility.due_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="font-medium">{utility.amount.toFixed(2)} {utility.currency}</div>
                  </div>
                  
                  {selectedUtilities.some(u => u.id === utility.id) && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={selectedUtilities.find(u => u.id === utility.id)?.is_partial || false}
                          onCheckedChange={() => toggleUtilityPartial(utility)}
                          id={`partial-${utility.id}`}
                        />
                        <Label htmlFor={`partial-${utility.id}`}>Partial payment</Label>
                      </div>
                      
                      {selectedUtilities.find(u => u.id === utility.id)?.is_partial && (
                        <div className="mt-2 flex items-center space-x-2">
                          <div className="w-full max-w-xs">
                            <div className="flex items-center">
                              <Input
                                type="number"
                                min="1"
                                max="99"
                                value={selectedUtilities.find(u => u.id === utility.id)?.percentage || 100}
                                onChange={(e) => updateUtilityPercentage(utility.id, parseInt(e.target.value, 10))}
                                className="w-20"
                              />
                              <span className="ml-2">%</span>
                            </div>
                            {utility.original_amount && (
                              <div className="text-xs text-gray-500 mt-1">
                                {selectedUtilities.find(u => u.id === utility.id)?.percentage || 100}% of {utility.original_amount.toFixed(2)} = 
                                {((utility.original_amount * (selectedUtilities.find(u => u.id === utility.id)?.percentage || 100)) / 100).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No utilities found for this period
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Total Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            required
            {...form.register("amount", { valueAsNumber: true })}
            placeholder="Enter invoice amount"
            readOnly
            className="bg-gray-50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select 
            onValueChange={(value) => handleCurrencyChange(value)}
            value={selectedCurrency}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {availableCurrencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="details">Details</Label>
        <Textarea
          id="details"
          {...form.register("details")}
          placeholder="Enter invoice details..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="document">Upload Invoice Document (Required)</Label>
        <Input
          id="document"
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          required
          className="cursor-pointer"
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Invoice"}
      </Button>
    </form>
  );
}
