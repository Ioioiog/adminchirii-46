
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { PROVIDER_OPTIONS } from "../types";
import { FormData } from "../schema";

interface ProviderSelectorProps {
  form: UseFormReturn<FormData>;
  isCustomProvider: boolean;
  handleProviderChange: (value: string) => void;
}

export const ProviderSelector = ({ form, isCustomProvider, handleProviderChange }: ProviderSelectorProps) => {
  return (
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
  );
};
