
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../schema";

interface CredentialsInputProps {
  form: UseFormReturn<FormData>;
  isEditing: boolean;
}

export const CredentialsInput = ({ form, isEditing }: CredentialsInputProps) => {
  return (
    <>
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
            <FormLabel>{isEditing ? "New Password" : "Password"}</FormLabel>
            <FormControl>
              <Input type="password" placeholder="Password for provider" {...field} />
            </FormControl>
            {isEditing && (
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
    </>
  );
};
