
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useProperties } from "@/hooks/useProperties";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { PROVIDER_OPTIONS, UtilityType } from "./types";
import { formSchema, FormData } from "./schema";
import { ProviderSelector } from "./components/ProviderSelector";
import { CustomProviderInput } from "./components/CustomProviderInput";
import { PropertySelector } from "./components/PropertySelector";
import { UtilityTypeSelector } from "./components/UtilityTypeSelector";
import { CredentialsInput } from "./components/CredentialsInput";
import { BillingPeriodInput } from "./components/BillingPeriodInput";
import { FormActions } from "./components/FormActions";

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

  const handleProviderChange = (value: string) => {
    setIsCustomProvider(value === "custom");
    
    const selectedProvider = PROVIDER_OPTIONS.find(option => option.value === value);
    
    if (value !== "custom" && selectedProvider?.default_type) {
      form.setValue("utility_type", selectedProvider.default_type as UtilityType);
    }
  };

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
        // When updating a provider
        const updateData: {
          provider_name: string;
          property_id: string;
          utility_type: UtilityType;
          username: string;
          password?: string;
          location_name: string | null;
          start_day: number;
          end_day: number;
        } = {
          provider_name: finalProviderName,
          property_id: data.property_id,
          utility_type: data.utility_type,
          username: data.username,
          location_name: data.location_name || null,
          start_day: data.start_day || 1,
          end_day: data.end_day || 28,
        };

        // Only include password if it was provided
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
        // When creating a new provider
        // NOTE: We don't need to explicitly include encrypted_password
        // The database trigger will handle the encryption and set encrypted_password
        const { error } = await supabase
          .from("utility_provider_credentials")
          .insert({
            provider_name: finalProviderName,
            property_id: data.property_id,
            utility_type: data.utility_type,
            username: data.username,
            password: data.password, // This will be encrypted by the database trigger
            landlord_id: userData.user.id,
            location_name: data.location_name || null,
            start_day: data.start_day || 1,
            end_day: data.end_day || 28,
          });

        if (error) throw error;
        toast({
          title: "Success",
          description: "Utility provider added successfully",
        });

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
            location: data.location_name || null,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{provider ? "Edit Utility Provider" : "Add Utility Provider"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ProviderSelector 
              form={form} 
              isCustomProvider={isCustomProvider} 
              handleProviderChange={handleProviderChange} 
            />
            
            <CustomProviderInput form={form} isCustomProvider={isCustomProvider} />
            
            <PropertySelector form={form} properties={properties} />
            
            <UtilityTypeSelector form={form} />
            
            <CredentialsInput form={form} isEditing={!!provider} />
            
            <BillingPeriodInput form={form} />

            <FormActions 
              onClose={onClose}
              isSubmitting={isSubmitting}
              isEditing={!!provider}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
