import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileText, Building, CreditCard, Calculator, AlertCircle } from "lucide-react";
import { InvoiceFormProps, InvoiceMetadata, UtilityForInvoice } from "@/types/invoice";
import { Card, CardContent } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { formatAmount } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";

interface InvoiceFormValues {
  property_id: string;
  tenant_id: string;
  amount: number;
  due_date: string;
}

interface PropertyOption {
  id: string;
  name: string;
  monthly_rent: number;
  currency: string;
}

interface InvoiceSettings {
  apply_vat?: boolean;
  vat_rate?: number;
  [key: string]: any;
}

export function InvoiceForm({ onSuccess, userId, userRole, calculationData }: InvoiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Array<PropertyOption>>([]);
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyOption | null>(null);
  const [utilities, setUtilities] = useState<UtilityForInvoice[]>([]);
  const [defaultTenantId, setDefaultTenantId] = useState<string | null>(null);
  const [applyVat, setApplyVat] = useState<boolean>(false);
  const [vatRate, setVatRate] = useState<number>(19);
  const [invoiceCurrency, setInvoiceCurrency] = useState<string>(calculationData?.currency || 'EUR');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [rentAlreadyInvoiced, setRentAlreadyInvoiced] = useState<boolean>(false);
  const [invoicedPeriod, setInvoicedPeriod] = useState<{from: Date, to: Date} | null>(null);
  const [grandTotal, setGrandTotal] = useState<number>(calculationData?.grandTotal || 0);

  const formSchema = z.object({
    property_id: z.string({ required_error: "Please select a property" }),
    tenant_id: z.string({ required_error: "Please select a tenant" }),
    amount: z.number().min(0, "Amount must be a positive number"),
    due_date: z.string({ required_error: "Please select a due date" }),
  });

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: calculationData?.rentAmount || 0,
      property_id: calculationData?.propertyId || '',
    },
  });

  const propertyId = form.watch("property_id");

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-exchange-rates');
        
        if (error) {
          console.error('Error fetching exchange rates:', error);
          return;
        }
        
        if (data && data.rates) {
          setExchangeRates(data.rates);
        }
      } catch (error) {
        console.error('Error in exchange rates fetch:', error);
      }
    };
    
    fetchExchangeRates();
  }, []);

  useEffect(() => {
    if (calculationData?.propertyId) {
      form.setValue("property_id", calculationData.propertyId);
    }
    
    if (calculationData?.rentAmount) {
      form.setValue("amount", calculationData.rentAmount);
    }
    
    if (calculationData?.currency) {
      setInvoiceCurrency(calculationData.currency);
    }
    
    if (calculationData?.grandTotal) {
      setGrandTotal(calculationData.grandTotal);
    }
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    form.setValue("due_date", dueDate.toISOString().split('T')[0]);

    if (calculationData?.utilities && Array.isArray(calculationData.utilities)) {
      setUtilities(calculationData.utilities.map(util => ({
        ...util,
        selected: true
      })));
    }
  }, [calculationData, form]);

  useEffect(() => {
    const checkExistingInvoices = async () => {
      if (!propertyId) return;
      
      try {
        const currentDate = new Date();
        const firstDayOfMonth = startOfMonth(currentDate);
        const lastDayOfMonth = endOfMonth(currentDate);
        
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('id, created_at, metadata, amount')
          .eq('property_id', propertyId)
          .gte('created_at', firstDayOfMonth.toISOString())
          .lte('created_at', lastDayOfMonth.toISOString());
        
        if (error) {
          console.error('Error checking existing invoices:', error);
          return;
        }
        
        const rentInvoices = invoices?.filter(invoice => {
          const metadata = invoice.metadata as InvoiceMetadata;
          return !metadata?.utilities_included || 
                 metadata.utilities_included.length === 0 || 
                 metadata.subtotal > 0;
        });
        
        if (rentInvoices && rentInvoices.length > 0) {
          setRentAlreadyInvoiced(true);
          
          const latestInvoice = rentInvoices[rentInvoices.length - 1];
          const metadata = latestInvoice.metadata as InvoiceMetadata;
          
          if (metadata && metadata.date_range) {
            setInvoicedPeriod({
              from: new Date(metadata.date_range.from),
              to: new Date(metadata.date_range.to)
            });
          } else {
            setInvoicedPeriod({
              from: firstDayOfMonth,
              to: lastDayOfMonth
            });
          }
          
          if (calculationData?.dateRange) {
            const calcFrom = calculationData.dateRange.from;
            const calcTo = calculationData.dateRange.to;
            
            const overlaps = rentInvoices.some(invoice => {
              const metadata = invoice.metadata as InvoiceMetadata;
              if (metadata && metadata.date_range) {
                const invoiceFrom = new Date(metadata.date_range.from);
                const invoiceTo = new Date(metadata.date_range.to);
                
                return (
                  isWithinInterval(calcFrom, { start: invoiceFrom, end: invoiceTo }) ||
                  isWithinInterval(calcTo, { start: invoiceFrom, end: invoiceTo }) ||
                  isWithinInterval(invoiceFrom, { start: calcFrom, end: calcTo }) ||
                  isWithinInterval(invoiceTo, { start: calcFrom, end: calcTo })
                );
              }
              
              return true;
            });
            
            if (overlaps && !calculationData.rentAmount) {
              form.setValue("amount", 0);
            }
          }
        } else {
          setRentAlreadyInvoiced(false);
          setInvoicedPeriod(null);
        }
      } catch (error) {
        console.error('Error in checkExistingInvoices:', error);
      }
    };
    
    checkExistingInvoices();
  }, [propertyId, calculationData, form]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        let query;
        
        if (userRole === "landlord") {
          query = supabase
            .from("properties")
            .select(`
              id,
              name,
              monthly_rent,
              currency,
              tenancies (
                id,
                tenant_id,
                status
              )
            `)
            .eq("landlord_id", userId);
        } else if (userRole === "tenant") {
          query = supabase
            .from("tenancies")
            .select(`
              property:properties (
                id,
                name,
                monthly_rent,
                currency
              )
            `)
            .eq("tenant_id", userId)
            .eq("status", "active");
        }

        const { data, error } = await query!;

        if (error) throw error;

        let propertiesData: PropertyOption[] = [];
        
        if (userRole === "landlord") {
          propertiesData = data.map((property) => ({
            id: property.id,
            name: property.name,
            monthly_rent: property.monthly_rent,
            currency: property.currency || 'EUR'
          }));
        } else if (userRole === "tenant") {
          propertiesData = data.map((tenancy) => ({
            id: tenancy.property.id,
            name: tenancy.property.name,
            monthly_rent: tenancy.property.monthly_rent,
            currency: tenancy.property.currency || 'EUR'
          }));
        }

        setProperties(propertiesData);
        
        if (propertiesData.length === 1 && !calculationData?.propertyId && !form.getValues("property_id")) {
          form.setValue("property_id", propertiesData[0].id);
          setSelectedProperty(propertiesData[0]);
          setInvoiceCurrency(propertiesData[0].currency || 'EUR');
        } else if (calculationData?.propertyId) {
          const matchingProperty = propertiesData.find(p => p.id === calculationData.propertyId);
          if (matchingProperty) {
            setSelectedProperty(matchingProperty);
            if (!calculationData.currency) {
              setInvoiceCurrency(matchingProperty.currency || 'EUR');
            }
          }
        }
      } catch (error: any) {
        console.error("Error fetching properties:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Could not fetch properties",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [userId, userRole, toast, form, calculationData?.propertyId, calculationData?.currency]);

  useEffect(() => {
    const fetchTenants = async () => {
      if (!propertyId || userRole !== "landlord") return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("tenancies")
          .select(`
            tenant_id,
            tenant:profiles!tenancies_tenant_id_fkey (
              id,
              first_name,
              last_name
            )
          `)
          .eq("property_id", propertyId)
          .eq("status", "active");

        if (error) throw error;

        const tenantsData = data.map((item) => ({
          id: item.tenant.id,
          first_name: item.tenant.first_name,
          last_name: item.tenant.last_name,
        }));

        setTenants(tenantsData);
        
        if (tenantsData.length === 1 && !form.getValues("tenant_id")) {
          setDefaultTenantId(tenantsData[0].id);
          form.setValue("tenant_id", tenantsData[0].id);
        }
      } catch (error: any) {
        console.error("Error fetching tenants:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Could not fetch tenants",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenants();
  }, [propertyId, userRole, toast, form]);

  useEffect(() => {
    if (selectedProperty && !rentAlreadyInvoiced) {
      form.setValue("amount", selectedProperty.monthly_rent);
      if (!calculationData?.currency) {
        setInvoiceCurrency(selectedProperty.currency || 'EUR');
      }
    } else if (selectedProperty && rentAlreadyInvoiced) {
      if (!calculationData?.rentAmount) {
        form.setValue("amount", 0);
      }
    }
  }, [selectedProperty, form, calculationData?.currency, rentAlreadyInvoiced, calculationData?.rentAmount]);

  useEffect(() => {
    if (defaultTenantId && userRole === "landlord") {
      form.setValue("tenant_id", defaultTenantId);
    }
  }, [defaultTenantId, form, userRole]);

  useEffect(() => {
    const fetchLandlordVatSettings = async () => {
      if (!selectedProperty || !propertyId) return;
      
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("landlord_id")
          .eq("id", propertyId)
          .single();
        
        if (error) {
          console.error("Error fetching landlord ID:", error);
          return;
        }
        
        if (!data?.landlord_id) return;
        
        const { data: landlordProfile, error: profileError } = await supabase
          .from("profiles")
          .select("invoice_info")
          .eq("id", data.landlord_id)
          .single();
        
        if (profileError) {
          console.error("Error fetching landlord profile:", profileError);
          return;
        }
        
        if (landlordProfile?.invoice_info) {
          const invoiceInfo = landlordProfile.invoice_info as InvoiceSettings;
          
          if (typeof invoiceInfo === 'object' && !Array.isArray(invoiceInfo)) {
            setApplyVat(!!invoiceInfo.apply_vat);
            setVatRate(invoiceInfo.vat_rate || 19);
          }
        }
      } catch (error) {
        console.error("Error fetching VAT settings:", error);
      }
    };
    
    fetchLandlordVatSettings();
  }, [propertyId, selectedProperty]);

  const fetchUtilitiesForProperty = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('utilities')
        .select('*')
        .eq('property_id', propertyId)
        .eq('status', 'pending')
        .order('due_date', { ascending: false });
        
      if (error) throw error;
      
      const formattedUtilities = data?.map(utility => {
        const remainingPercentage = utility.invoiced_percentage 
          ? Math.min(100 - (utility.invoiced_percentage || 0), 100) 
          : 100;
        
        return {
          id: utility.id,
          type: utility.type,
          amount: utility.amount,
          currency: utility.currency,
          due_date: utility.due_date,
          original_amount: utility.amount,
          selected: false,
          percentage: remainingPercentage,
          invoiced_percentage: utility.invoiced_percentage || 0,
          is_partially_invoiced: utility.invoiced_percentage && utility.invoiced_percentage < 100,
          remaining_percentage: remainingPercentage
        };
      });
      
      if (calculationData?.utilities && Array.isArray(calculationData.utilities)) {
        setUtilities([
          ...calculationData.utilities.map(util => ({
            ...util,
            selected: true
          })),
          ...formattedUtilities.filter(util => 
            !calculationData.utilities.some(calcUtil => calcUtil.id === util.id)
          )
        ]);
      } else {
        setUtilities(formattedUtilities);
      }
      
      console.log("Fetched utilities:", formattedUtilities);
    } catch (error) {
      console.error("Error fetching utilities:", error);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchUtilitiesForProperty(propertyId);
    }
  }, [propertyId]);

  const handleUtilitySelection = (id: string, selected: boolean) => {
    const updatedUtilities = utilities.map(util => 
      util.id === id ? { ...util, selected } : util
    );
    
    setUtilities(updatedUtilities);
    updateGrandTotal(updatedUtilities);
  };

  const handleUtilityPercentageChange = (id: string, percentage: number) => {
    const updatedUtilities = utilities.map(util => {
      if (util.id === id) {
        const adjustableAmount = (util.original_amount || util.amount);
        const newAmount = (adjustableAmount * percentage) / 100;
        return { 
          ...util, 
          percentage, 
          amount: newAmount 
        };
      }
      return util;
    });
    
    setUtilities(updatedUtilities);
    updateGrandTotal(updatedUtilities);
  };

  const updateGrandTotal = (updatedUtilities: UtilityForInvoice[]) => {
    if (calculationData?.grandTotal) {
      return;
    }
    
    const baseAmount = form.getValues("amount") || 0;
    const vatAmount = applyVat ? (baseAmount * vatRate / 100) : 0;
    
    const utilitiesTotal = updatedUtilities
      .filter(util => util.selected)
      .reduce((sum, util) => {
        const adjustedAmount = getAdjustedUtilityAmount(util);
        return sum + adjustedAmount;
      }, 0);
      
    setGrandTotal(baseAmount + vatAmount + utilitiesTotal);
  };

  const getAdjustedUtilityAmount = (utility: UtilityForInvoice): number => {
    if (!utility.selected) return 0;
    
    if (calculationData?.utilities?.some(u => u.id === utility.id)) {
      return utility.amount;
    }
    
    const percentage = utility.percentage || 100;
    const originalAmount = utility.original_amount || utility.amount;
    const remainingAmount = originalAmount - (utility.invoiced_amount || 0);
    const adjustableAmount = remainingAmount;
    return (adjustableAmount * percentage) / 100;
  };

  const getSelectedUtilities = () => {
    if (calculationData?.utilities) {
      return calculationData.utilities.map(util => ({
        id: util.id,
        amount: getAdjustedUtilityAmount(util),
        type: util.type,
        percentage: util.percentage || 100,
        original_amount: util.original_amount || util.amount,
        currency: util.currency,
        current_invoiced_amount: util.invoiced_amount || 0
      }));
    }
    
    return utilities.filter(util => util.selected).map(util => ({
      id: util.id,
      amount: getAdjustedUtilityAmount(util),
      type: util.type,
      percentage: util.percentage || 100,
      original_amount: util.original_amount || util.amount,
      currency: util.currency,
      current_invoiced_amount: util.invoiced_amount || 0
    }));
  };

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;
    if (!exchangeRates || Object.keys(exchangeRates).length === 0) return amount;
    
    let amountInRON = amount;
    if (fromCurrency !== 'RON') {
      amountInRON = amount * (exchangeRates[fromCurrency] || 1);
    }
    
    if (toCurrency === 'RON') {
      return amountInRON;
    }
    
    return amountInRON / (exchangeRates[toCurrency] || 1);
  };

  const onSubmit = async (values: InvoiceFormValues) => {
    try {
      setIsLoading(true);
      
      let metadata: InvoiceMetadata = {};
      
      if (calculationData?.dateRange) {
        metadata.date_range = {
          from: format(calculationData.dateRange.from, 'yyyy-MM-dd'),
          to: format(calculationData.dateRange.to, 'yyyy-MM-dd')
        };
      }

      const selectedUtils = getSelectedUtilities();
      if (selectedUtils.length > 0) {
        metadata.utilities_included = selectedUtils;
      }
      
      const totalAmount = calculationData?.grandTotal || calculateTotal();
      
      console.log('Saving invoice with total amount:', totalAmount, 'breakdown:', {
        calculationData,
        selectedUtils
      });
      
      for (const util of selectedUtils) {
        const newInvoicedAmount = (util.current_invoiced_amount || 0) + util.amount;
        
        await supabase
          .from('utilities')
          .update({
            invoiced: true,
            invoiced_amount: newInvoicedAmount
          })
          .eq('id', util.id);
          
        console.log(`Updated utility ${util.id}: invoiced_amount set to ${newInvoicedAmount}`);  
      }
      
      const { data, error } = await supabase
        .from("invoices")
        .insert({
          property_id: values.property_id,
          tenant_id: values.tenant_id || userId,
          landlord_id: userRole === "landlord" ? userId : null,
          amount: totalAmount,
          due_date: values.due_date,
          status: "pending",
          currency: invoiceCurrency,
          vat_rate: applyVat ? vatRate : 0,
          metadata: metadata
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice created successfully",
      });

      form.reset();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not create invoice",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateVatAmount = () => {
    const baseAmount = rentAlreadyInvoiced ? 0 : (form.getValues("amount") || 0);
    const rentCurrency = selectedProperty?.currency || 'EUR';
    
    let convertedBaseAmount = baseAmount;
    if (rentCurrency !== invoiceCurrency) {
      convertedBaseAmount = convertCurrency(baseAmount, rentCurrency, invoiceCurrency);
    }
    
    return convertedBaseAmount * (vatRate / 100);
  };

  const calculateTotal = () => {
    const baseAmount = rentAlreadyInvoiced ? 0 : (form.getValues("amount") || 0);
    const rentCurrency = selectedProperty?.currency || 'EUR';
    
    let convertedBaseAmount = baseAmount;
    if (rentCurrency !== invoiceCurrency) {
      convertedBaseAmount = convertCurrency(baseAmount, rentCurrency, invoiceCurrency);
    }
    
    const totalRentWithVat = applyVat ? (convertedBaseAmount + calculateVatAmount()) : convertedBaseAmount;
    
    let utilitiesTotal = 0;
    utilities
      .filter(util => util.selected)
      .forEach(util => {
        const utilAmount = getAdjustedUtilityAmount(util);
        
        const utilCurrency = util.currency || 'EUR';
        if (utilCurrency !== invoiceCurrency) {
          utilitiesTotal += convertCurrency(utilAmount, utilCurrency, invoiceCurrency);
        } else {
          utilitiesTotal += utilAmount;
        }
      });
    
    return totalRentWithVat + utilitiesTotal;
  };

  const renderUtilitiesSection = () => {
    if (!utilities || utilities.length === 0) return null;
    
    return (
      <div className="mt-3 pt-2 border-t">
        <h4 className="text-sm font-medium mb-2">Utilities:</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {utilities.map((utility) => {
            const isFromCalculator = calculationData?.utilities?.some(u => u.id === utility.id);
            const isPartiallyInvoiced = utility.invoiced_amount > 0 && utility.invoiced_amount < utility.amount;
            const originalAmount = utility.original_amount || utility.amount;
            const remainingAmount = originalAmount - (utility.invoiced_amount || 0);
            const remainingPercentage = Math.round((remainingAmount / originalAmount) * 100);
            
            return (
              <div key={utility.id} className="flex items-center justify-between">
                <div className="flex items-start gap-2">
                  <Checkbox 
                    id={`utility-${utility.id}`}
                    checked={utility.selected}
                    onCheckedChange={(checked) => handleUtilitySelection(utility.id, !!checked)}
                    className="mt-1"
                    disabled={isFromCalculator}
                  />
                  <div>
                    <label htmlFor={`utility-${utility.id}`} className="text-sm cursor-pointer">
                      {utility.type}
                      {isPartiallyInvoiced && (
                        <Badge className="ml-2 text-xs bg-amber-100 text-amber-800">
                          Partially Invoiced ({formatAmount(utility.invoiced_amount || 0, utility.currency || invoiceCurrency)})
                        </Badge>
                      )}
                      {isFromCalculator && (
                        <Badge className="ml-2 text-xs bg-blue-100 text-blue-800">
                          From Calculator
                        </Badge>
                      )}
                    </label>
                    {utility.selected && !isFromCalculator && (
                      <div className="mt-1 w-48">
                        <Slider
                          value={[utility.percentage || 100]}
                          min={1}
                          max={100}
                          step={1}
                          onValueChange={([value]) => handleUtilityPercentageChange(utility.id, value)}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{utility.percentage || 100}% applied</span>
                          <span>
                            {formatAmount(getAdjustedUtilityAmount(utility), utility.currency || invoiceCurrency)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">
                    {formatAmount(
                      isFromCalculator ? utility.amount : getAdjustedUtilityAmount(utility),
                      utility.currency || invoiceCurrency
                    )}
                  </span>
                  <div className="text-xs text-gray-500">
                    {remainingAmount < originalAmount ? (
                      <>
                        <span>{formatAmount(remainingAmount, utility.currency || invoiceCurrency)}</span>
                        <span className="mx-1">of</span>
                      </>
                    ) : null}
                    <span>{formatAmount(originalAmount, utility.currency || invoiceCurrency)}</span>
                    {remainingAmount < originalAmount && (
                      <span className="ml-1">remaining</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="property_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    const prop = properties.find((p) => p.id === value);
                    setSelectedProperty(prop || null);
                    if (prop && !calculationData?.currency) {
                      setInvoiceCurrency(prop.currency || 'EUR');
                    }
                  }}
                  value={field.value}
                  disabled={isLoading || !!calculationData?.propertyId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name} ({property.monthly_rent} {property.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {userRole === "landlord" && (
            <FormField
              control={form.control}
              name="tenant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || !propertyId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.first_name} {tenant.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    disabled={isLoading}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rent Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    disabled={isLoading || !!calculationData?.rentAmount || rentAlreadyInvoiced}
                  />
                </FormControl>
                {rentAlreadyInvoiced && (
                  <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> 
                    Rent already invoiced for this period
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {rentAlreadyInvoiced && invoicedPeriod && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Rent already invoiced</AlertTitle>
            <AlertDescription className="text-amber-700">
              Rent has already been invoiced for this property from {format(invoicedPeriod.from, 'MMM d, yyyy')} to {format(invoicedPeriod.to, 'MMM d, yyyy')}.
              {form.getValues("amount") === 0 ? " Only utilities will be included in this invoice." : " Adding rent again may result in double-charging."}
            </AlertDescription>
          </Alert>
        )}

        <Card className="border bg-slate-100">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3">
              <h3 className="text-md font-medium flex items-center gap-2">
                <Calculator className="h-5 w-5 text-slate-500" />
                Invoice Summary ({invoiceCurrency})
              </h3>

              <div className="space-y-2 bg-white p-4 rounded-md border">
                {calculationData?.dateRange && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm">Period:</span>
                    <span className="text-sm font-medium">
                      {format(calculationData.dateRange.from, 'MMM d, yyyy')} to {format(calculationData.dateRange.to, 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm">Rent Amount:</span>
                  <span className="text-sm font-medium">
                    {rentAlreadyInvoiced ? (
                      <span className="text-amber-600">Already invoiced</span>
                    ) : (
                      formatAmount(calculationData?.rentAmount || 0, invoiceCurrency)
                    )}
                  </span>
                </div>

                {applyVat && !rentAlreadyInvoiced && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm">VAT ({vatRate}%):</span>
                    <span className="text-sm font-medium">
                      {formatAmount((calculationData?.rentAmount || 0) * vatRate / 100, invoiceCurrency)}
                    </span>
                  </div>
                )}

                {utilities.length > 0 && renderUtilitiesSection()}

                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
                  <span className="font-bold">Total Amount:</span>
                  <span className="text-lg font-bold">
                    {formatAmount(grandTotal, invoiceCurrency)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isLoading || !selectedProperty || (
              grandTotal === 0 ||
              !utilities.some(u => u.selected)
            )}
          >
            Create Invoice
          </Button>
        </div>
      </form>
    </Form>
  );
}
