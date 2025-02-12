import React from 'react';
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { ImageUpload } from "../forms/ImageUpload";
import type { MaintenanceRequest } from "../hooks/useMaintenanceRequest";

interface MaintenanceDetailsTabProps {
  request?: MaintenanceRequest;
  onUpdateRequest: (request: Partial<MaintenanceRequest>) => void;
  isNew?: boolean;
  properties: Array<{ id: string; name: string }>;
  userRole: string;
}

type MaintenanceFormData = Pick<MaintenanceRequest, 
  | 'title' 
  | 'description' 
  | 'property_id' 
  | 'priority' 
  | 'status' 
  | 'images' 
  | 'tenant_id' 
  | 'contact_phone' 
  | 'preferred_times'
  | 'is_emergency'
  | 'emergency_contact_name'
  | 'emergency_contact_phone'
  | 'emergency_instructions'
>;

export function MaintenanceDetailsTab({
  request,
  onUpdateRequest,
  isNew = false,
  properties,
  userRole
}: MaintenanceDetailsTabProps) {
  console.log("MaintenanceDetailsTab - Initializing with request:", request);

  const form = useForm<MaintenanceFormData>({
    defaultValues: {
      title: request?.title || "",
      description: request?.description || "",
      property_id: request?.property_id || "",
      priority: request?.priority || "medium",
      status: request?.status || "pending",
      images: request?.images || [],
      tenant_id: request?.tenant_id || "",
      contact_phone: request?.contact_phone || "",
      preferred_times: request?.preferred_times || [],
      is_emergency: request?.is_emergency || false,
      emergency_contact_name: request?.emergency_contact_name || "",
      emergency_contact_phone: request?.emergency_contact_phone || "",
      emergency_instructions: request?.emergency_instructions || ""
    }
  });

  React.useEffect(() => {
    if (request) {
      console.log("MaintenanceDetailsTab - Setting form values from request:", request);
      form.reset({
        ...request,
        preferred_times: request.preferred_times || []
      });
    }
  }, [request, form]);

  const isEmergency = form.watch("is_emergency");

  const handleSubmit = (data: MaintenanceFormData) => {
    console.log("Form submitted with data:", data);
    if (!data.description?.trim()) {
      form.setError("description", {
        type: "required",
        message: "Description is required"
      });
      return;
    }
    onUpdateRequest(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-base font-semibold">
              Issue Title<span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              {...form.register("title")}
              className="mt-1"
              disabled={userRole === "landlord"}
            />
          </div>

          <div>
            <Label htmlFor="property_id" className="text-base font-semibold">
              Property Address<span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.watch("property_id")}
              onValueChange={(value) => form.setValue("property_id", value)}
              disabled={userRole === "landlord" || !isNew}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description" className="text-base font-semibold">
              Detailed Description<span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Please provide as much detail as possible about the issue"
              {...form.register("description")}
              className="mt-1 min-h-[120px]"
              disabled={userRole === "landlord"}
            />
          </div>

          <div>
            <Label htmlFor="contact_phone" className="text-base font-semibold">
              Contact Phone<span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact_phone"
              type="tel"
              placeholder="Your contact phone number"
              {...form.register("contact_phone")}
              className="mt-1"
              disabled={userRole === "landlord"}
            />
          </div>

          <div>
            <Label htmlFor="priority" className="text-base font-semibold">
              Priority Level<span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.watch("priority")}
              onValueChange={(value: "low" | "medium" | "high") => form.setValue("priority", value)}
              disabled={userRole === "landlord"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Can be addressed anytime</SelectItem>
                <SelectItem value="medium">Medium - Should be addressed within 2-3 days</SelectItem>
                <SelectItem value="high">High - Requires immediate attention</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="is_emergency" className="flex items-center space-x-2">
              <Checkbox
                id="is_emergency"
                checked={isEmergency}
                onCheckedChange={(checked) => 
                  form.setValue("is_emergency", checked as boolean)
                }
                disabled={userRole === "landlord"}
              />
              <span className="text-base font-semibold">Mark as Emergency</span>
            </Label>
          </div>

          {isEmergency && (
            <div className="space-y-4 border-l-2 border-red-500 pl-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Emergency requests will be prioritized and handled as soon as possible.
                </AlertDescription>
              </Alert>
              
              <div>
                <Label>Emergency Contact Name</Label>
                <Input
                  {...form.register("emergency_contact_name")}
                  className="mt-1"
                  disabled={userRole === "landlord"}
                />
              </div>

              <div>
                <Label>Emergency Contact Phone</Label>
                <Input
                  type="tel"
                  {...form.register("emergency_contact_phone")}
                  className="mt-1"
                  disabled={userRole === "landlord"}
                />
              </div>

              <div>
                <Label>Emergency Instructions</Label>
                <Textarea
                  {...form.register("emergency_instructions")}
                  placeholder="Any specific instructions for emergency handling..."
                  className="mt-1"
                  disabled={userRole === "landlord"}
                />
              </div>
            </div>
          )}

          <div>
            <Label className="text-base font-semibold">
              Preferred Service Times
            </Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              {["morning", "afternoon", "evening"].map((time) => (
                <label key={time} className="flex items-center space-x-2">
                  <Checkbox
                    checked={form.watch("preferred_times")?.includes(time)}
                    onCheckedChange={(checked) => {
                      const currentTimes = form.watch("preferred_times") || [];
                      const newTimes = checked
                        ? [...currentTimes, time]
                        : currentTimes.filter((t) => t !== time);
                      form.setValue("preferred_times", newTimes);
                    }}
                    disabled={userRole === "landlord"}
                  />
                  <span className="capitalize">{time}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold">
              Upload Images <span className="text-gray-500 text-sm">(Optional - Max 5MB per image)</span>
            </Label>
            <ImageUpload
              images={form.watch("images") || []}
              onChange={(images) => form.setValue("images", images)}
              disabled={userRole !== "tenant"}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit">
            {isNew ? "Create Request" : "Update Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
