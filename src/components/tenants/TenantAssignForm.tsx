
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Property } from "@/utils/propertyUtils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfileSchema } from "@/integrations/supabase/database-types/profile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  tenantId: z.string().min(1, "Tenant is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

export interface TenantAssignFormProps {
  properties: Property[];
  availableTenants: ProfileSchema["Tables"]["profiles"]["Row"][];
  onSubmit?: (data: z.infer<typeof formSchema>) => void;
  isLoading?: boolean;
  onClose: () => void;
}

export function TenantAssignForm({
  properties,
  availableTenants,
  onSubmit,
  isLoading = false,
  onClose,
}: TenantAssignFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: "",
      tenantId: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setError(null);
      
      // Get the current authenticated user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to assign tenants");
      }
      
      // First check if this property belongs to the current landlord
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("landlord_id")
        .eq("id", data.propertyId)
        .single();
      
      if (propertyError) {
        throw propertyError;
      }
      
      if (propertyData.landlord_id !== session.user.id) {
        throw new Error("You don't have permission to assign tenants to this property");
      }
      
      // Check if tenant is already assigned to this property
      const { data: existingTenancy, error: tenancyError } = await supabase
        .from("tenancies")
        .select("id")
        .eq("property_id", data.propertyId)
        .eq("tenant_id", data.tenantId)
        .eq("status", "active")
        .maybeSingle();
        
      if (tenancyError) {
        console.error("Error checking existing tenancy:", tenancyError);
      }
      
      if (existingTenancy) {
        throw new Error("This tenant is already assigned to this property");
      }
      
      // Create the tenancy with a service role if possible, otherwise try direct insertion
      const { error: insertError } = await supabase
        .from("tenancies")
        .insert({
          property_id: data.propertyId,
          tenant_id: data.tenantId,
          start_date: data.startDate,
          end_date: data.endDate || null,
          status: "active",
        });

      if (insertError) {
        console.error("Error creating tenancy:", insertError);
        throw new Error(insertError.message || "Failed to assign tenant");
      }

      toast({
        title: "Success",
        description: "Tenant assigned successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      onClose();
    } catch (error: any) {
      console.error("Error assigning tenant:", error);
      setError(error.message || "Failed to assign tenant");
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to assign tenant",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <FormField
          control={form.control}
          name="propertyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
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
          name="tenantId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tenant</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tenant" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableTenants.map((tenant) => (
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

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <input
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date (Optional)</FormLabel>
              <FormControl>
                <input
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Assigning..." : "Assign Tenant"}
        </Button>
      </form>
    </Form>
  );
}
