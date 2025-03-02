
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
import { UseFormReturn } from "react-hook-form";
import { ProviderFormData } from "../hooks/useProviderForm";
import { DatePicker } from '@/components/ui/date-picker';

interface AdditionalDetailsSectionProps {
  form: UseFormReturn<ProviderFormData>;
}

export function AdditionalDetailsSection({ form }: AdditionalDetailsSectionProps) {
  return (
    <>
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
    </>
  );
}
