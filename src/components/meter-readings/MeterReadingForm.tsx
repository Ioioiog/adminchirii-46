
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Property } from "@/utils/propertyUtils";
import { format } from "date-fns";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  property_id: z.string().min(1, "Property is required"),
  reading_type: z.enum(["electricity", "water", "gas"], {
    required_error: "Meter type is required",
  }),
  reading_value: z.number().min(0, "Reading value must be positive"),
  reading_date: z.string().min(1, "Reading date is required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface MeterReadingFormProps {
  properties: Property[];
  onSuccess: () => void;
  userRole: "landlord" | "tenant";
  userId: string | null;
  initialData?: {
    id: string;
    property_id: string;
    reading_type: 'electricity' | 'water' | 'gas';
    reading_value: number;
    reading_date: string;
    notes?: string;
  };
}

export function MeterReadingForm({
  properties,
  onSuccess,
  userRole,
  userId,
  initialData
}: MeterReadingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Session check error:", error);
          return;
        }

        if (session?.user) {
          console.log("Session found, user ID:", session.user.id);
          setCurrentUserId(session.user.id);
        } else {
          console.log("No active session found");
          setCurrentUserId(null);
        }
      } catch (err) {
        console.error("Error checking session:", err);
      }
    };

    checkSession();
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      property_id: properties[0]?.id || "",
      reading_type: "water",
      reading_value: 0,
      reading_date: format(new Date(), 'yyyy-MM-dd'),
      notes: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!currentUserId) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Please log in to submit meter readings",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Submitting meter reading form data:", data);
      console.log("Current user ID:", currentUserId);
      console.log("User role:", userRole);

      // For tenants, use their own ID. For landlords, try to get the tenant ID from active tenancy or null if none
      let tenant_id = currentUserId;
      
      if (userRole === 'landlord') {
        // Try to find an active tenant for this property
        const { data: tenancy, error: tenancyError } = await supabase
          .from('tenancies')
          .select('tenant_id')
          .eq('property_id', data.property_id)
          .eq('status', 'active')
          .single();

        if (tenancyError) {
          console.log("No active tenant found for this property or other error:", tenancyError);
          // If no active tenant is found, we'll use null for tenant_id
          tenant_id = null;
        } else {
          tenant_id = tenancy.tenant_id;
        }
      }

      // Prepare the data object with all required fields
      const meterReadingData = {
        property_id: data.property_id,
        reading_type: data.reading_type,
        reading_value: Number(data.reading_value),
        reading_date: data.reading_date,
        tenant_id,
        created_by: currentUserId,
        updated_by: currentUserId,
        notes: data.notes || null
      };

      console.log("Submitting meter reading data:", meterReadingData);

      if (initialData) {
        // Update existing reading
        const { error: updateError } = await supabase
          .from('meter_readings')
          .update(meterReadingData)
          .eq('id', initialData.id);

        if (updateError) {
          console.error("Error updating meter reading:", updateError);
          throw updateError;
        }

        toast({
          title: "Success",
          description: "Meter reading has been updated",
        });
      } else {
        // Insert new reading
        const { error: insertError } = await supabase
          .from('meter_readings')
          .insert(meterReadingData);

        if (insertError) {
          console.error("Error inserting meter reading:", insertError);
          throw insertError;
        }

        toast({
          title: "Success",
          description: "Meter reading has been recorded",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error submitting meter reading:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to record meter reading",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="property_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
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
          name="reading_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meter Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select meter type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="electricity">Electricity</SelectItem>
                  <SelectItem value="water">Water</SelectItem>
                  <SelectItem value="gas">Gas</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reading_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reading Value</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reading_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reading Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : (initialData ? "Update Reading" : "Save Reading")}
        </Button>
      </form>
    </Form>
  );
}
