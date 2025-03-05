import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CalculationData, InvoiceMetadata, UtilityForInvoice } from "@/types/invoice";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAdjustedUtilityAmount } from "@/components/invoices/utils/invoiceCalculations";

export interface PropertyOption {
  id: string;
  name: string;
  monthly_rent: number;
  currency: string;
}

const formSchema = z.object({
  property_id: z.string({ required_error: "Please select a property" }),
  tenant_id: z.string({ required_error: "Please select a tenant" }),
  amount: z.number().min(0, "Amount must be a positive number"),
  due_date: z.string({ required_error: "Please select a due date" }),
});

export type InvoiceFormValues = z.infer<typeof formSchema>;

export const useInvoiceForm = (
  userId: string,
  userRole: "landlord" | "tenant",
  calculationData?: CalculationData,
  onSuccess?: () => void
) => {
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
    const checkExistingInvoices = async () => {
      if (!propertyId) return;
      
      try {
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
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
          const invoiceInfo = landlordProfile.invoice_info as any;
          
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

  const fetchUtilitiesForProperty = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('utilities')
        .select('*')
        .eq('property_id', propertyId)
        .order('due_date', { ascending: false });
        
      if (error) throw error;
      
      const formattedUtilities = data?.map(utility => {
        const invoicedAmount = utility.invoiced_amount || 0;
        const originalAmount = utility.amount;
        const remainingAmount = originalAmount - invoicedAmount;
        const remainingPercentage = Math.min(Math.round((remainingAmount / originalAmount) * 100), 100);
        
        const shouldInclude = remainingAmount > 0 || utility.status === 'pending';
        
        if (!shouldInclude && !calculationData?.utilities?.some(u => u.id === utility.id)) {
          return null;
        }
        
        return {
          id: utility.id,
          type: utility.type,
          amount: remainingAmount,
          currency: utility.currency,
          due_date: utility.due_date,
          original_amount: utility.amount,
          selected: false,
          percentage: remainingPercentage,
          invoiced_amount: invoicedAmount,
          is_partially_invoiced: invoicedAmount > 0 && invoicedAmount < utility.amount,
          remaining_percentage: remainingPercentage
        };
      }).filter(Boolean);
      
      if (calculationData?.utilities && Array.isArray(calculationData.utilities)) {
        setUtilities([
          ...calculationData.utilities.map(util => ({
            ...util,
            selected: true
          })),
          ...formattedUtilities.filter(util => 
            util && !calculationData.utilities.some(calcUtil => calcUtil.id === util.id)
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
        const adjustedAmount = getAdjustedAmount(util);
        return sum + adjustedAmount;
      }, 0);
      
    setGrandTotal(baseAmount + vatAmount + utilitiesTotal);
  };

  const getAdjustedAmount = (utility: UtilityForInvoice): number => {
    return getAdjustedUtilityAmount(utility, calculationData);
  };

  const getSelectedUtilities = () => {
    if (calculationData?.utilities) {
      return calculationData.utilities.map(util => ({
        id: util.id,
        amount: getAdjustedAmount(util),
        type: util.type,
        percentage: util.percentage || 100,
        original_amount: util.original_amount || util.amount,
        currency: util.currency,
        current_invoiced_amount: util.invoiced_amount || 0
      }));
    }
    
    return utilities.filter(util => util.selected).map(util => ({
      id: util.id,
      amount: getAdjustedAmount(util),
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
        const utilAmount = getAdjustedAmount(util);
        
        const utilCurrency = util.currency || 'EUR';
        if (utilCurrency !== invoiceCurrency) {
          utilitiesTotal += convertCurrency(utilAmount, utilCurrency, invoiceCurrency);
        } else {
          utilitiesTotal += utilAmount;
        }
      });
    
    return totalRentWithVat + utilitiesTotal;
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
      
      const baseAmount = rentAlreadyInvoiced ? 0 : (form.getValues("amount") || 0);
      const vatAmount = applyVat ? calculateVatAmount() : 0;
      
      metadata.subtotal = baseAmount;
      metadata.vat_amount = vatAmount;
      
      for (const util of selectedUtils) {
        const currentInvoicedAmount = util.current_invoiced_amount || 0;
        const newInvoicedAmount = currentInvoicedAmount + util.amount;
        const originalAmount = util.original_amount || util.amount;
        const isPaid = newInvoicedAmount >= originalAmount;
        
        console.log(`Updating utility ${util.id}:`, {
          id: util.id,
          currentInvoicedAmount,
          newInvoicedAmount,
          originalAmount,
          isPaid,
          amount: util.amount
        });

        const { error: updateError } = await supabase
          .from('utilities')
          .update({
            invoiced: true,
            invoiced_amount: newInvoicedAmount,
            status: isPaid ? 'paid' : 'pending'
          })
          .eq('id', util.id);
          
        if (updateError) {
          console.error(`Error updating utility ${util.id}:`, updateError);
          throw new Error(`Failed to update utility: ${updateError.message}`);
        } else {
          console.log(`Updated utility ${util.id}: invoiced_amount set to ${newInvoicedAmount}, status set to ${isPaid ? 'paid' : 'pending'}`);  
        }
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

  return {
    form,
    propertyId,
    selectedProperty,
    setSelectedProperty,
    isLoading,
    properties,
    tenants,
    utilities,
    applyVat,
    vatRate,
    invoiceCurrency,
    rentAlreadyInvoiced,
    invoicedPeriod,
    grandTotal,
    exchangeRates,
    handleUtilitySelection,
    handleUtilityPercentageChange,
    getAdjustedAmount,
    convertCurrency,
    calculateVatAmount,
    calculateTotal,
    onSubmit,
    getSelectedUtilities
  };
};

function isWithinInterval(date: Date, interval: { start: Date; end: Date }): boolean {
  return date >= interval.start && date <= interval.end;
}
