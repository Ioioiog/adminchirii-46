
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../schema";

interface UtilityTypeSelectorProps {
  form: UseFormReturn<FormData>;
}

export const UtilityTypeSelector = ({ form }: UtilityTypeSelectorProps) => {
  return (
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
  );
};
