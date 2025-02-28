
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Property } from "@/utils/propertyUtils";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

const tenantFormSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  propertyIds: z.array(z.string().uuid()).min(1, "Select at least one property"),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
});

export type TenantFormValues = z.infer<typeof tenantFormSchema>;

interface TenantInviteFormProps {
  properties: Property[];
  onSubmit: (data: TenantFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function TenantInviteForm({ properties, onSubmit, isSubmitting }: TenantInviteFormProps) {
  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      propertyIds: [],
      startDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="tenant@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="propertyIds"
          render={() => (
            <FormItem>
              <FormLabel>Properties</FormLabel>
              <ScrollArea className="h-[200px] border rounded-md p-4">
                {properties.map((property) => (
                  <FormField
                    key={property.id}
                    control={form.control}
                    name="propertyIds"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={property.id}
                          className="flex flex-row items-start space-x-3 space-y-0 py-2"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(property.id)}
                              onCheckedChange={(checked) => {
                                const value = field.value || [];
                                if (checked) {
                                  field.onChange([...value, property.id]);
                                } else {
                                  field.onChange(value.filter((id) => id !== property.id));
                                }
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium leading-none">
                              {property.name}
                            </FormLabel>
                            <p className="text-sm text-muted-foreground">
                              {property.address}
                            </p>
                          </div>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </ScrollArea>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date (Optional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating Tenant..." : "Create Tenant"}
        </Button>
      </form>
    </Form>
  );
}
