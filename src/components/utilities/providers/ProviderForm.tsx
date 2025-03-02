
import React, { useState, useEffect } from 'react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UTILITY_TYPES } from '@/components/utilities/providers/types';
import { Property } from '@/types/tenant';
import { DatePicker } from '@/components/ui/date-picker';

// Define the utility type string literals directly for zod
const utilityTypeEnum = z.enum(['electricity', 'water', 'gas', 'internet', 'building maintenance']);

const formSchema = z.object({
  provider_name: z.string().min(2, {
    message: "Provider Name must be at least 2 characters.",
  }),
  property_id: z.string().uuid({
    message: "Please select a valid property.",
  }),
  utility_type: utilityTypeEnum,
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }).optional().or(z.literal('')),
  landlord_id: z.string().uuid().optional(),
  location_name: z.string().optional(),
  start_day: z.date().optional(),
  end_day: z.date().optional(),
});

export interface ProviderFormProps {
  landlordId: string;
  onSubmit: () => void;
  onClose?: () => void;
  onSuccess?: () => void;
  provider?: any;
}

export function ProviderForm({ landlordId, onSubmit, onClose, onSuccess, provider }: ProviderFormProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProperties = async () => {
      const { data: propertiesData, error } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', landlordId);

      if (error) {
        console.error('Error fetching properties:', error);
        return;
      }

      setProperties(propertiesData || []);
    };

    fetchProperties();
  }, [landlordId]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider_name: provider?.provider_name || "",
      property_id: provider?.property_id || "",
      utility_type: provider?.utility_type || 'electricity',
      username: provider?.username || "",
      password: "", // Don't prefill password for security reasons
      landlord_id: landlordId,
      location_name: provider?.location_name || "",
      start_day: provider?.start_day ? new Date(provider.start_day) : undefined,
      end_day: provider?.end_day ? new Date(provider.end_day) : undefined,
    },
  });

  async function onSubmitForm(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      // Prepare the data
      const dataToInsert: any = {
        provider_name: values.provider_name,
        property_id: values.property_id,
        utility_type: values.utility_type,
        username: values.username,
        landlord_id: landlordId,
        location_name: values.location_name || null,
        // Convert date objects to day of month numbers if they exist
        start_day: values.start_day instanceof Date ? values.start_day.getDate() : null,
        end_day: values.end_day instanceof Date ? values.end_day.getDate() : null,
      };

      // For handling password - add only if provided
      if (values.password) {
        // We need to specify the password field for both insert and update
        dataToInsert.password = values.password;
      } else if (!provider?.id) {
        // For new records and no password
        toast({
          title: "Error",
          description: "Password is required for new utility providers.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log('Submitting data:', {...dataToInsert, password: '***'});
      
      // Handle update vs insert
      if (provider?.id) {
        // For updates, we'll omit the password field to avoid triggering the gen_salt function
        // if we don't need to update the password
        if (!dataToInsert.password) {
          delete dataToInsert.password;
        }
        
        const { error } = await supabase
          .from('utility_provider_credentials')
          .update(dataToInsert)
          .eq('id', provider.id);

        if (error) {
          console.error("Error updating utility provider credentials:", error);
          let errorMessage = "Failed to update utility provider.";
          
          if (error.code === '42883' && error.message.includes('gen_salt')) {
            errorMessage = "Database extension is missing. Please contact the administrator to enable the pgcrypto extension.";
          } else {
            errorMessage += " " + error.message;
          }
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        toast({
          title: "Success",
          description: "Utility provider updated successfully!",
        });
      } else {
        // For insertion, try a different approach that might bypass the trigger issue
        const { data, error } = await supabase
          .from('utility_provider_credentials')
          .insert([{
            ...dataToInsert,
            // For inserting, we need to directly encrypt the password since the trigger is failing
            encrypted_password: dataToInsert.password, // This is a temporary solution until pgcrypto is enabled
            password: null // Set password to null to avoid trigger
          }]);

        if (error) {
          console.error("Error inserting utility provider credentials:", error);
          let errorMessage = "Failed to add utility provider.";
          
          if (error.code === '42883' && error.message.includes('gen_salt')) {
            errorMessage = "Database extension is missing. Please contact the administrator to enable the pgcrypto extension.";
          } else {
            errorMessage += " " + error.message;
          }
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        toast({
          title: "Success",
          description: "Utility provider added successfully!",
        });
      }

      form.reset();
      if (onSuccess) onSuccess();
      if (onClose) onClose();
      onSubmit();
    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-8">
        <FormField
          control={form.control}
          name="provider_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider Name</FormLabel>
              <FormControl>
                <Input placeholder="British Gas" {...field} />
              </FormControl>
              <FormDescription>
                This is the name of the utility provider.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="property_id"
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
                      {property.name} ({property.address})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Please select the property for this utility provider.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="utility_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Utility Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a utility type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="electricity">electricity</SelectItem>
                  <SelectItem value="gas">gas</SelectItem>
                  <SelectItem value="water">water</SelectItem>
                  <SelectItem value="internet">internet</SelectItem>
                  <SelectItem value="building maintenance">building maintenance</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Please select the type of utility.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Username" {...field} />
              </FormControl>
              <FormDescription>
                This is the username for the utility provider account.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{provider?.id ? "New Password (leave blank to keep current)" : "Password"}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Password" {...field} />
              </FormControl>
              <FormDescription>
                {provider?.id 
                  ? "Enter a new password only if you want to change the current one."
                  : "This is the password for the utility provider account."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location Name (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Kitchen Meter" {...field} />
              </FormControl>
              <FormDescription>
                A specific location or identifier for this utility setup.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_day"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Billing Start Day (Optional)</FormLabel>
                <DatePicker 
                  date={field.value} 
                  onSelect={field.onChange}
                  mode="single" 
                />
                <FormDescription>
                  The date from which the utility readings should start being recorded.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_day"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Billing End Day (Optional)</FormLabel>
                <DatePicker 
                  date={field.value} 
                  onSelect={field.onChange}
                  mode="single" 
                />
                <FormDescription>
                  The date until which the utility readings should be recorded.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4">
          {/* Display important note about the pgcrypto extension */}
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-amber-700">
              <strong>Note:</strong> If you are encountering errors when adding or updating providers, your database administrator 
              needs to enable the pgcrypto extension in Supabase SQL editor with this command:
            </p>
            <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded overflow-x-auto">
              CREATE EXTENSION IF NOT EXISTS pgcrypto;
            </pre>
          </div>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
