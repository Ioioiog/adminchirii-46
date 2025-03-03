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

interface InvoiceFormValues {
  property_id: string;
  details?: string;
  document?: File;
  tenant_email?: string;
  amount: number;
  currency: string;
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
        .select("id, name")
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
    };

    fetchTenantEmail();
  }, [selectedPropertyId, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const { error: itemError } = await supabase
        .from("invoice_items")
        .insert({
          invoice_id: invoice.id,
          description: values.details || "Invoice payment",
          amount: values.amount,
          type: "utility"
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
