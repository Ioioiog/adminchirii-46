import React, { useState, useEffect } from 'react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UtilityType } from '@/types/utilities';
import { DatePicker } from '@/components/ui/date-picker';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Property } from '@/types/tenant';

const formSchema = z.object({
  provider_name: z.string().min(2, {
    message: "Provider Name must be at least 2 characters.",
  }),
  property_id: z.string().uuid({
    message: "Please select a valid property.",
  }),
  utility_type: z.nativeEnum(UtilityType, {
    message: "Please select a utility type.",
  }),
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  landlord_id: z.string().uuid().optional(),
  location_name: z.string().optional(),
  start_day: z.date().optional(),
  end_day: z.date().optional(),
})

interface ProviderFormProps {
  landlordId: string;
  onSubmit: () => void;
}

export function ProviderForm({ landlordId, onSubmit }: ProviderFormProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const { toast } = useToast();

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider_name: "",
      property_id: "",
      utility_type: UtilityType.Electricity,
      username: "",
      password: "",
      landlord_id: landlordId,
      location_name: "",
      start_day: undefined,
      end_day: undefined,
    },
  })

  async function onSubmitForm(values: z.infer<typeof formSchema>) {
    try {
      const { error } = await supabase
        .from('utility_provider_credentials')
        .insert({
          provider_name: values.provider_name,
          property_id: values.property_id,
          utility_type: values.utility_type,
          username: values.username,
          password: values.password, // This will be encrypted by the trigger
          landlord_id: values.landlord_id,
          location_name: values.location_name,
          start_day: values.start_day,
          end_day: values.end_day
        });

      if (error) {
        console.error("Error inserting utility provider credentials:", error);
        toast({
          title: "Error",
          description: "Failed to add utility provider. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Utility provider added successfully!",
      });

      form.reset();
      onSubmit();
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-8">
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
                  <SelectItem value={UtilityType.Electricity}>{UtilityType.Electricity}</SelectItem>
                  <SelectItem value={UtilityType.Gas}>{UtilityType.Gas}</SelectItem>
                  <SelectItem value={UtilityType.Water}>{UtilityType.Water}</SelectItem>
                  <SelectItem value={UtilityType.Internet}>{UtilityType.Internet}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Please select the type of utility.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Password" {...field} />
              </FormControl>
              <FormDescription>
                This is the password for the utility provider account.
              </FormDescription>
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
                <FormLabel>Start Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePicker
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                <FormLabel>End Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePicker
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  The date until which the utility readings should be recorded.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
