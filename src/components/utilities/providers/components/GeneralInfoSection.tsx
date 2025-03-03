
import React from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
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
import { UseFormReturn } from "react-hook-form";
import { ProviderFormData } from "../hooks/useProviderForm";
import { Property } from '@/types/tenant';

interface GeneralInfoSectionProps {
  form: UseFormReturn<ProviderFormData>;
  properties: Property[];
}

export function GeneralInfoSection({ form, properties }: GeneralInfoSectionProps) {
  return (
    <>
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
                <SelectItem value="other">other</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Please select the type of utility.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
