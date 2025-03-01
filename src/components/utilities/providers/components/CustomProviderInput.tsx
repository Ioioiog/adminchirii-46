
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../schema";

interface CustomProviderInputProps {
  form: UseFormReturn<FormData>;
  isCustomProvider: boolean;
}

export const CustomProviderInput = ({ form, isCustomProvider }: CustomProviderInputProps) => {
  if (!isCustomProvider) {
    return null;
  }

  return (
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
  );
};
