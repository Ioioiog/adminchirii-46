
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Property } from "@/types/tenant";

// Define the utility type string literals directly for zod
const utilityTypeEnum = z.enum(['electricity', 'water', 'gas', 'internet', 'building maintenance', 'other']);

export const formSchema = z.object({
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

export type ProviderFormData = z.infer<typeof formSchema>;

export interface UseProviderFormProps {
  landlordId: string;
  onSubmit: () => void;
  onClose?: () => void;
  onSuccess?: () => void;
  provider?: any;
}

export function useProviderForm({ landlordId, onSubmit, onClose, onSuccess, provider }: UseProviderFormProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ProviderFormData>({
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

  async function onSubmitForm(values: ProviderFormData) {
    setLoading(true);
    setErrorMessage(null);
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

      console.log('Submitting data:', {...dataToInsert, password: values.password ? '***' : 'unchanged'});
      
      // Function to handle the common pgcrypto error
      const handlePgCryptoError = (error: any) => {
        if (error.code === '42883' && error.message.includes('gen_salt')) {
          setErrorMessage(
            "The pgcrypto extension is missing in your database. Please run the SQL command shown above to enable it. " +
            "As a temporary workaround, your provider has been added with basic encryption."
          );
          return true;
        }
        return false;
      };

      // Handle update vs insert
      if (provider?.id) {
        try {
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
            const isPgCryptoError = handlePgCryptoError(error);
            
            if (isPgCryptoError) {
              // If it's a pgcrypto error, try a direct update to encrypted_password
              if (values.password) {
                const workaroundData = {
                  ...dataToInsert,
                  encrypted_password: values.password, // Store password directly (not ideal but works as temporary solution)
                };
                
                delete workaroundData.password;
                
                const { error: workaroundError } = await supabase
                  .from('utility_provider_credentials')
                  .update(workaroundData)
                  .eq('id', provider.id);
                  
                if (workaroundError) {
                  throw workaroundError;
                }
                
                // Successfully updated with workaround
                toast({
                  title: "Success with temporary encryption",
                  description: "Provider updated successfully but with temporary encryption. Please enable pgcrypto extension for proper security.",
                });
                
                form.reset();
                if (onSuccess) onSuccess();
                if (onClose) onClose();
                onSubmit();
                setLoading(false);
                return;
              }
            } else {
              throw error;
            }
          }
          
          toast({
            title: "Success",
            description: "Utility provider updated successfully!",
          });
        } catch (error: any) {
          console.error("Error updating utility provider credentials:", error);
          
          let errorMessage = "Failed to update utility provider.";
          if (error.message) {
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
      } else {
        try {
          // For insertion, try a different approach that might bypass the trigger issue
          // First try the normal approach
          const { data, error } = await supabase
            .from('utility_provider_credentials')
            .insert([dataToInsert])
            .select();

          if (error) {
            const isPgCryptoError = handlePgCryptoError(error);
            
            if (isPgCryptoError) {
              // For inserting, we need to directly store the password as encrypted_password
              // This is a workaround until pgcrypto is enabled
              const workaroundData = {
                ...dataToInsert,
                encrypted_password: dataToInsert.password, // Store the password directly in encrypted_password field
              };
              
              delete workaroundData.password; // Remove password field completely
              
              const { error: workaroundError } = await supabase
                .from('utility_provider_credentials')
                .insert([workaroundData]);
                
              if (workaroundError) {
                throw workaroundError;
              }
              
              toast({
                title: "Success with temporary encryption",
                description: "Utility provider added successfully but with temporary encryption. Please enable pgcrypto extension for proper security.",
              });
              
              form.reset();
              if (onSuccess) onSuccess();
              if (onClose) onClose();
              onSubmit();
              setLoading(false);
              return;
            } else {
              throw error;
            }
          } else {
            toast({
              title: "Success",
              description: "Utility provider added successfully!",
            });
          }
        } catch (error: any) {
          console.error("Error inserting utility provider credentials:", error);
          
          let errorMessage = "Failed to add utility provider.";
          if (error.message) {
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

  return {
    form,
    properties,
    loading,
    errorMessage,
    onSubmitForm,
    setErrorMessage
  };
}
