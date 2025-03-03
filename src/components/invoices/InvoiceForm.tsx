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
import { Checkbox } from "@/components/ui/checkbox";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { CalendarIcon, Percent, BarChart3, FileText, Building, Clock, Upload, CreditCard } from "lucide-react";
import { UtilityItem, InvoiceFormProps, InvoiceMetadata } from "@/types/invoice";
import { Json } from "@/integrations/supabase/types/json";

interface InvoiceFormValues {
  property_id: string;
  tenant_id: string;
  amount: number;
  due_date: string;
  is_partial: boolean;
  calculation_method: string;
  partial_percentage: number;
  date_range: DateRange | undefined;
  include_utilities: boolean;
  days_calculated?: number;
}

interface Utility {
  id: string;
  type: string;
  amount: number;
  due_date: string;
  property_id: string;
  status: string;
}

interface PropertyOption {
  id: string;
  name: string;
  monthly_rent: number;
  currency: string;
  is_partial?: boolean;
}

interface InvoiceSettings {
  apply_vat?: boolean;
  [key: string]: any;
}

export function InvoiceForm({ onSuccess, userId, userRole }: InvoiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Array<PropertyOption>>([]);
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyOption | null>(null);
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [includeUtilities, setIncludeUtilities] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [daysInMonth, setDaysInMonth] = useState(30);
  const [dailyRate, setDailyRate] = useState(0);

  const formSchema = z.object({
    property_id: z.string({ required_error: "Please select a property" }),
    tenant_id: z.string({ required_error: "Please select a tenant" }),
    amount: z.number().min(0, "Amount must be a positive number"),
    due_date: z.string({ required_error: "Please select a due date" }),
    is_partial: z.boolean().default(false),
    calculation_method: z.string().optional(),
    partial_percentage: z.number().min(1).max(100).optional(),
    include_utilities: z.boolean().default(false),
    days_calculated: z.number().min(1).optional(),
  });

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      is_partial: false,
      calculation_method: "percentage",
      partial_percentage: 100,
      include_utilities: false,
    },
  });

  const isPartial = form.watch("is_partial");
  const calculationMethod = form.watch("calculation_method");
  const partialPercentage = form.watch("partial_percentage");
  const propertyId = form.watch("property_id");
  const includeUtilitiesValue = form.watch("include_utilities");

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
  }, [userId, userRole, toast]);

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
  }, [propertyId, userRole, toast]);

  useEffect(() => {
    const fetchUtilities = async () => {
      if (!propertyId) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("utilities")
          .select("*")
          .eq("property_id", propertyId)
          .eq("status", "pending");

        if (error) throw error;

        setUtilities(data);
      } catch (error: any) {
        console.error("Error fetching utilities:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Could not fetch utilities",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUtilities();
  }, [propertyId, toast]);

  useEffect(() => {
    if (!selectedProperty) return;

    const dailyRent = selectedProperty.monthly_rent / 30;
    setDailyRate(dailyRent);
    setDaysInMonth(30);

    if (dateRange?.from && dateRange?.to) {
      calculateDays();
    }
  }, [selectedProperty, dateRange]);

  useEffect(() => {
    calculateAmount();
  }, [propertyId, isPartial, calculationMethod, partialPercentage, dateRange, includeUtilitiesValue]);

  const calculateDays = () => {
    if (!dateRange?.from || !dateRange?.to) return 0;

    const from = new Date(dateRange.from);
    const to = new Date(dateRange.to);
    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    form.setValue("days_calculated", diffDays);
    return diffDays;
  };

  const calculateAmount = () => {
    if (!selectedProperty) return;

    let amount = selectedProperty.monthly_rent;
    const days = form.getValues("days_calculated") || 0;
    
    if (isPartial) {
      if (calculationMethod === "percentage") {
        amount = (selectedProperty.monthly_rent * (partialPercentage || 0)) / 100;
      } else if (calculationMethod === "days" && days > 0) {
        amount = dailyRate * days;
      }
    }

    if (includeUtilitiesValue && utilities.length > 0) {
      const utilitiesTotal = utilities.reduce((sum, utility) => sum + utility.amount, 0);
      
      if (isPartial && calculationMethod === "percentage") {
        amount += (utilitiesTotal * (partialPercentage || 0)) / 100;
      } else {
        amount += utilitiesTotal;
      }
    }

    form.setValue("amount", Math.round(amount * 100) / 100);
  };

  const onSubmit = async (values: InvoiceFormValues) => {
    try {
      setIsLoading(true);

      const days = calculateDays();

      const metadata: Record<string, any> = {};
      
      if (values.is_partial) {
        metadata.is_partial = true;
        metadata.calculation_method = values.calculation_method as 'percentage' | 'days';
        metadata.full_amount = selectedProperty?.monthly_rent;
        
        if (values.calculation_method === "percentage") {
          metadata.partial_percentage = values.partial_percentage;
        } else if (values.calculation_method === "days") {
          metadata.days_calculated = days;
          metadata.daily_rate = dailyRate;
          if (dateRange?.from && dateRange?.to) {
            metadata.date_range = {
              from: dateRange.from.toISOString(),
              to: dateRange.to.toISOString()
            };
          }
        }
      }

      if (values.include_utilities && utilities.length > 0) {
        const utilityItems = utilities.map(utility => {
          const item: Record<string, any> = {
            id: utility.id,
            type: utility.type,
            amount: utility.amount,
            due_date: utility.due_date
          };

          if (values.is_partial && values.calculation_method === "percentage") {
            item.original_amount = utility.amount;
            item.percentage = values.partial_percentage;
            item.amount = (utility.amount * values.partial_percentage) / 100;
          }

          return item;
        });
        
        metadata.utilities_included = utilityItems;
      }

      const { data: landlordProfile, error: profileError } = await supabase
        .from("profiles")
        .select("invoice_info")
        .eq("id", userRole === "landlord" ? userId : selectedProperty?.id)
        .single();

      if (profileError) {
        console.error("Error fetching landlord profile:", profileError);
      }

      let applyVat = false;
      
      if (landlordProfile?.invoice_info) {
        const invoiceInfo = landlordProfile.invoice_info as InvoiceSettings;
        if (typeof invoiceInfo === 'object' && !Array.isArray(invoiceInfo)) {
          applyVat = !!invoiceInfo.apply_vat;
        }
      }
      
      const vatRate = applyVat ? 19 : 0;

      const { data, error } = await supabase
        .from("invoices")
        .insert({
          property_id: values.property_id,
          tenant_id: values.tenant_id || userId,
          landlord_id: userRole === "landlord" ? userId : selectedProperty?.id,
          amount: values.amount,
          due_date: values.due_date,
          status: "pending",
          currency: selectedProperty?.currency || "EUR",
          metadata: metadata,
          vat_rate: vatRate
        });

      if (error) throw error;

      if (values.include_utilities && utilities.length > 0) {
        for (const utility of utilities) {
          const updateObj: any = {
            id: utility.id,
            invoiced: true
          };
          
          if (values.is_partial && values.calculation_method === "percentage") {
            updateObj.invoiced_percentage = values.partial_percentage;
          } else {
            updateObj.invoiced_percentage = 100; // Full invoice
          }
          
          const { error: utilityError } = await supabase
            .from("utilities")
            .update(updateObj)
            .eq("id", utility.id);
          
          if (utilityError) {
            console.error("Error updating utility:", utilityError);
          }
        }
      }

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
                  }}
                  value={field.value}
                  disabled={isLoading}
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
                  <Input type="date" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_partial"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-8">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormLabel className="cursor-pointer font-normal">
                  Partial Invoice
                </FormLabel>
              </FormItem>
            )}
          />
        </div>

        {isPartial && (
          <div className="bg-slate-50 p-4 rounded-md space-y-6 border">
            <h3 className="text-md font-medium flex items-center gap-2">
              <Percent className="h-5 w-5 text-slate-500" />
              Partial Invoice Settings
            </h3>

            <FormField
              control={form.control}
              name="calculation_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calculation Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select calculation method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="percentage">By Percentage</SelectItem>
                      <SelectItem value="days">By Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {calculationMethod === "percentage" && (
              <FormField
                control={form.control}
                name="partial_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Percentage of Monthly Rent (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {calculationMethod === "days" && (
              <>
                <div className="space-y-2">
                  <FormLabel>Date Range</FormLabel>
                  <DatePickerWithRange
                    date={dateRange}
                    onDateChange={(range) => {
                      setDateRange(range);
                    }}
                  />
                  <p className="text-sm text-slate-500">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Daily rate: {selectedProperty ? dailyRate.toFixed(2) : "0.00"} {selectedProperty?.currency || "EUR"}
                  </p>
                  {form.getValues("days_calculated") > 0 && (
                    <p className="text-sm text-slate-500">
                      <CalendarIcon className="w-4 h-4 inline mr-1" />
                      Days calculated: {form.getValues("days_calculated")}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {utilities.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-md space-y-6 border">
            <h3 className="text-md font-medium flex items-center gap-2">
              <Building className="h-5 w-5 text-slate-500" />
              Utilities
            </h3>

            <FormField
              control={form.control}
              name="include_utilities"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer font-normal">
                    Include pending utilities
                  </FormLabel>
                </FormItem>
              )}
            />

            {includeUtilitiesValue && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  The following utilities will be included in this invoice:
                </p>
                <ul className="space-y-2">
                  {utilities.map((utility) => (
                    <li key={utility.id} className="flex justify-between text-sm p-2 bg-white rounded border">
                      <span className="font-medium">{utility.type}</span>
                      <span>
                        {isPartial && calculationMethod === "percentage"
                          ? `${((utility.amount * (partialPercentage || 0)) / 100).toFixed(2)}`
                          : utility.amount.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex justify-between p-4 bg-slate-100 rounded-md">
            <span className="font-medium">Total Amount</span>
            <span className="text-lg font-bold">
              {form.getValues("amount") || 0} {selectedProperty?.currency || "EUR"}
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
