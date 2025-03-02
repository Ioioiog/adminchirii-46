
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

interface CredentialsSectionProps {
  form: UseFormReturn<ProviderFormData>;
  isUpdate: boolean;
}

export function CredentialsSection({ form, isUpdate }: CredentialsSectionProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="username"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Username</FormLabel>
            <FormControl>
              <Input placeholder="Username" {...field} />
            </FormControl>
            <FormDescription>
              This is the username for the utility provider account.
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
            <FormLabel>{isUpdate ? "New Password (leave blank to keep current)" : "Password"}</FormLabel>
            <FormControl>
              <Input type="password" placeholder="Password" {...field} />
            </FormControl>
            <FormDescription>
              {isUpdate 
                ? "Enter a new password only if you want to change the current one."
                : "This is the password for the utility provider account."}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
