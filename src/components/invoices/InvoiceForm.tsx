
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

interface InvoiceFormValues {
  property_id: string;
  details?: string;
  document?: File;
  tenant_email?: string;
  amount: number;
  currency: string;
  is_partial: boolean;
  partial_percentage?: number;
}

interface InvoiceFormProps {
  onSuccess?: () => void;
}

export function InvoiceForm({ onSuccess }: InvoiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Array<{ id: string; name: string }>>([]);
  const { toast } = useToast();
  const form = useForm<InvoiceFormValues>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [tenantEmail, setTenantEmail] = useState<string | null>(null);
  const { availableCurrencies } = useCurrency();
  const [isPartialInvoice, setIsPartialInvoice] = useState(false);
  const [propertyFullAmount, setPropertyFullAmount] = useState<number | null>(null);
  const [partialPercentage, setPartialPercentage] = useState<number>(50);

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

      // Fetch the property's monthly rent
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
          updatePartialAmount(property.monthly_rent, partialPercentage);
        }
      }
    };

    fetchTenantEmail();
  }, [selectedPropertyId, form]);

  const updatePartialAmount = (fullAmount: number, percentage: number) => {
    const calculatedAmount = (fullAmount * percentage) / 100;
    form.setValue("amount", calculatedAmount);
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
        updatePartialAmount(propertyFullAmount, partialPercentage);
        form.setValue("partial_percentage", partialPercentage);
      } else {
        form.setValue("amount", propertyFullAmount);
        form.setValue("partial_percentage", undefined);
      }
    }
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseInt(e.target.value, 10);
    setPartialPercentage(percentage);
    form.setValue("partial_percentage", percentage);
    
    if (propertyFullAmount && isPartialInvoice) {
      updatePartialAmount(propertyFullAmount, percentage);
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

      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Create invoice metadata for partial invoices
      const metadata = values.is_partial 
        ? {
            is_partial: true,
            partial_percentage: values.partial_percentage,
            full_amount: propertyFullAmount
          }
        : {};

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
          metadata: metadata
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const invoiceItemType = values.is_partial ? "partial_rent" : "utility";
      const description = values.details || (values.is_partial ? 
        `Partial rent payment (${values.partial_percentage}%)` : 
        "Invoice payment");

      const { error: itemError } = await supabase
        .from("invoice_items")
        .insert({
          invoice_id: invoice.id,
          description: description,
          amount: values.amount,
          type: invoiceItemType
        });

      if (itemError) throw itemError;

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
        <div className="flex items-center space-x-2 my-4">
          <Switch 
            id="is_partial"
            checked={isPartialInvoice}
            onCheckedChange={handlePartialToggle}
          />
          <Label htmlFor="is_partial" className="cursor-pointer">Create Partial Invoice</Label>
        </div>
      )}

      {isPartialInvoice && selectedPropertyId && (
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            required
            {...form.register("amount", { valueAsNumber: true })}
            placeholder="Enter invoice amount"
            readOnly={selectedPropertyId && (isPartialInvoice || propertyFullAmount !== null)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select 
            onValueChange={(value) => form.setValue("currency", value)}
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
