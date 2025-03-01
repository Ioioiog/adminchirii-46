
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useProperties } from "@/hooks/useProperties";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { PROVIDER_OPTIONS, UtilityType } from "./types";

const formSchema = z.object({
  provider_name: z.string().min(1, "Provider name is required"),
  custom_provider_name: z.string().optional(),
  property_id: z.string().min(1, "Property is required"),
  utility_type: z.enum(["electricity", "water", "gas", "internet", "building maintenance"] as const),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  location_name: z.string().optional(),
  start_day: z.coerce.number().int().min(1).max(31).optional(),
  end_day: z.coerce.number().int().min(1).max(31).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProviderFormProps {
  onClose: () => void;
  onSuccess: () => void;
  provider?: any;
}

export const ProviderForm = ({ onClose, onSuccess, provider }: ProviderFormProps) => {
  const { properties, isLoading } = useProperties({ userRole: "landlord" });
  const { userRole } = useUserRole();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomProvider, setIsCustomProvider] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider_name: "",
      custom_provider_name: "",
      property_id: "",
      utility_type: "electricity",
      username: "",
      password: "",
      location_name: "",
      start_day: 1,
      end_day: 28,
    },
  });

  useEffect(() => {
    if (provider) {
      const providerOption = PROVIDER_OPTIONS.find(
        (option) => option.value === provider.provider_name
      );
      
      // Check if it's a custom provider
      const isCustom = !providerOption && provider.provider_name !== "";
      setIsCustomProvider(isCustom);
      
      form.reset({
        provider_name: isCustom ? "custom" : provider.provider_name,
        custom_provider_name: isCustom ? provider.provider_name : "",
        property_id: provider.property_id || "",
        utility_type: provider.utility_type || "electricity",
        username: provider.username || "",
        password: "",
        location_name: provider.location_name || "",
        start_day: provider.start_day || 1,
        end_day: provider.end_day || 28,
      });
    }
  }, [provider, form]);

  const onSubmit = async (data: FormData) => {
    if (userRole !== "landlord") {
      toast({
        title: "Permission Denied",
        description: "Only landlords can manage utility providers",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!userData.user) {
        throw new Error("No authenticated user found");
      }

      const finalProviderName = data.provider_name === "custom" 
        ? data.custom_provider_name 
        : data.provider_name;

      if (provider) {
        // Update existing provider
        const updateData: any = {
          provider_name: finalProviderName,
          property_id: data.property_id,
          utility_type: data.utility_type,
          username: data.username,
          location_name: data.location_name,
          start_day: data.start_day,
          end_day: data.end_day,
        };

        // Only include password if it was changed
        if (data.password) {
          updateData.password = data.password;
        }

        const { error } = await supabase
          .from("utility_provider_credentials")
          .update(updateData)
          .eq("id", provider.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Utility provider updated successfully",
        });
      } else {
        // Create new provider
        const { error } = await supabase.from("utility_provider_credentials").insert({
          provider_name: finalProviderName,
          property_id: data.property_id,
          utility_type: data.utility_type,
          username: data.username,
          password: data.password, // password will be encrypted by Supabase trigger
          landlord_id: userData.user.id,
          location_name: data.location_name,
          start_day: data.start_day,
          end_day: data.end_day,
        });

        if (error) throw error;
        toast({
          title: "Success",
          description: "Utility provider added successfully",
        });

        // Set up scraping job
        const { data: providerData, error: providerError } = await supabase
          .from("utility_provider_credentials")
          .select("id")
          .eq("landlord_id", userData.user.id)
          .eq("provider_name", finalProviderName)
          .eq("username", data.username)
          .limit(1)
          .single();

        if (providerError) {
          console.error("Error fetching provider ID:", providerError);
        } else {
          const { error: scrapingError } = await supabase.from("scraping_jobs").insert({
            utility_provider_id: providerData.id,
            status: "pending",
            provider: finalProviderName,
            type: data.utility_type,
            location: data.location_name,
          });

          if (scrapingError) {
            console.error("Error creating scraping job:", scrapingError);
          }
        }
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving provider:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save utility provider. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle provider selection change
  const handleProviderChange = (value: string) => {
    // Set isCustomProvider flag
    setIsCustomProvider(value === "custom");
    
    // Find the selected provider option
    const selectedProvider = PROVIDER_OPTIONS.find(option => option.value === value);
    
    // If not custom and has a default type, set it
    if (value !== "custom" && selectedProvider?.default_type) {
      form.setValue("utility_type", selectedProvider.default_type as UtilityType);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-6">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{provider ? "Edit Utility Provider" : "Add Utility Provider"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="provider_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleProviderChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROVIDER_OPTIONS.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isCustomProvider && (
              <FormField
                control={form.control}
                name="custom_provider_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Provider Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter provider name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                      {properties?.map((property) => (
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
                      <SelectItem value="electricity">Electricity</SelectItem>
                      <SelectItem value="water">Water</SelectItem>
                      <SelectItem value="gas">Gas</SelectItem>
                      <SelectItem value="internet">Internet</SelectItem>
                      <SelectItem value="building maintenance">Building Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Input placeholder="Username for provider" {...field} />
                  </FormControl>
                  <FormDescription>
                    Username used to login to the provider's website
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
                  <FormLabel>{provider ? "New Password" : "Password"}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Password for provider" {...field} />
                  </FormControl>
                  {provider && (
                    <FormDescription>
                      Leave empty to keep the current password
                    </FormDescription>
                  )}
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
                    <Input placeholder="Location identifier" {...field} />
                  </FormControl>
                  <FormDescription>
                    Some utility providers need a specific location identifier
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Start Day</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={31} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing End Day</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={31} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : provider ? "Update Provider" : "Add Provider"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
