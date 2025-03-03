
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
import { FileText, Building, CreditCard, Calculator } from "lucide-react";
import { InvoiceFormProps, InvoiceMetadata } from "@/types/invoice";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

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
  [key: string]: any;
}

interface UtilityForInvoice {
  id: string;
  type: string;
  amount: number;
  percentage?: number;
  original_amount?: number;
  selected?: boolean;
}

export function InvoiceForm({ onSuccess, userId, userRole, calculationData }: InvoiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Array<PropertyOption>>([]);
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyOption | null>(null);
  const [utilities, setUtilities] = useState<UtilityForInvoice[]>([]);

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
    },
  });

  const propertyId = form.watch("property_id");

  useEffect(() => {
    if (calculationData?.propertyId) {
      form.setValue("property_id", calculationData.propertyId);
    }
    
    if (calculationData?.rentAmount) {
      form.setValue("amount", calculationData.rentAmount);
    }
    
    // Set default due date to 14 days from today if not provided
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    form.setValue("due_date", dueDate.toISOString().split('T')[0]);

    // Check if calculationData contains utilities
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
    if (selectedProperty) {
      form.setValue("amount", selectedProperty.monthly_rent);
    }
  }, [selectedProperty, form]);

  const handleUtilitySelection = (id: string, selected: boolean) => {
    setUtilities(prevUtilities => 
      prevUtilities.map(util => 
        util.id === id ? { ...util, selected } : util
      )
    );
  };

  const getSelectedUtilities = () => {
    return utilities.filter(util => util.selected).map(util => ({
      id: util.id,
      amount: util.amount,
      type: util.type,
      percentage: util.percentage,
      original_amount: util.original_amount,
    }));
  };

  const onSubmit = async (values: InvoiceFormValues) => {
    try {
      setIsLoading(true);

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
      
      // Prepare metadata with date range and selected utilities
      let metadata: InvoiceMetadata = {};
      
      if (calculationData?.dateRange) {
        metadata.date_range = {
          from: format(calculationData.dateRange.from, 'yyyy-MM-dd'),
          to: format(calculationData.dateRange.to, 'yyyy-MM-dd')
        };
      }

      // Add selected utilities to metadata
      const selectedUtils = getSelectedUtilities();
      if (selectedUtils.length > 0) {
        metadata.utilities_included = selectedUtils;
      }

      const { data, error } = await supabase
        .from("invoices")
        .insert({
          property_id: values.property_id,
          tenant_id: values.tenant_id || userId,
          landlord_id: userRole === "landlord" ? userId : selectedProperty?.id,
          amount: values.amount,
          due_date: values.due_date,
          status: "pending",
          currency: calculationData?.currency || selectedProperty?.currency || "EUR",
          vat_rate: vatRate,
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

  // Calculate total including selected utilities
  const calculateTotal = () => {
    const baseAmount = form.getValues("amount") || 0;
    const selectedUtilsTotal = utilities
      .filter(util => util.selected)
      .reduce((sum, util) => sum + util.amount, 0);
    
    return baseAmount + selectedUtilsTotal;
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
                    min={new Date().toISOString().split('T')[0]} // No past dates
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
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    disabled={isLoading || !!calculationData?.rentAmount}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Card className="border bg-slate-100">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3">
              <h3 className="text-md font-medium flex items-center gap-2">
                <Calculator className="h-5 w-5 text-slate-500" />
                Invoice Summary
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
                    {form.getValues("amount")} {calculationData?.currency || selectedProperty?.currency || "EUR"}
                  </span>
                </div>

                {/* Display utilities section only if there are utilities */}
                {utilities.length > 0 && (
                  <div className="mt-3 pt-2 border-t">
                    <h4 className="text-sm font-medium mb-2">Utilities:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {utilities.map((utility) => (
                        <div key={utility.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              id={`utility-${utility.id}`}
                              checked={utility.selected}
                              onCheckedChange={(checked) => handleUtilitySelection(utility.id, !!checked)}
                            />
                            <label htmlFor={`utility-${utility.id}`} className="text-sm cursor-pointer">
                              {utility.type} 
                              {utility.percentage && <span className="text-xs text-gray-500 ml-1">({utility.percentage}%)</span>}
                            </label>
                          </div>
                          <span className="text-sm font-medium">
                            {utility.amount} {calculationData?.currency || selectedProperty?.currency || "EUR"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
                  <span className="font-bold">Total Amount:</span>
                  <span className="text-lg font-bold">
                    {calculateTotal()} {calculationData?.currency || selectedProperty?.currency || "EUR"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isLoading || !selectedProperty} 
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>Creating...</>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Create Invoice
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
