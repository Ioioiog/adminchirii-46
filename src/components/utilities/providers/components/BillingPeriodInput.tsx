
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../schema";

interface BillingPeriodInputProps {
  form: UseFormReturn<FormData>;
}

export const BillingPeriodInput = ({ form }: BillingPeriodInputProps) => {
  return (
    <div className="space-y-4">
      <FormDescription className="text-sm text-muted-foreground">
        Set the billing period for this utility. The start day should be before the end day.
      </FormDescription>
      
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
    </div>
  );
};
