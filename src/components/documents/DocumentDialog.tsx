
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentType } from "@/integrations/supabase/types/document-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ContractStatus } from "@/types/contract";

interface DocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userRole: string;
}

const contractStatuses: { value: ContractStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "pending_signature", label: "Pending Signature" },
  { value: "signed", label: "Signed" },
];

const formSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  document_type: z.string(),
  property_id: z.string().optional(),
  tenant_id: z.string().optional(),
  status: z.enum(["draft", "pending_signature", "signed", "expired", "cancelled"]).optional(),
  valid_from: z.date().optional(),
  valid_until: z.date().optional(),
});

export function DocumentDialog({
  open,
  onOpenChange,
  userId,
  userRole,
}: DocumentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      document_type: "general",
      property_id: undefined,
      tenant_id: undefined,
      status: "draft",
      valid_from: undefined,
      valid_until: undefined,
    },
  });

  const documentType = form.watch("document_type");

  // Set showAdditionalFields based on document type
  React.useEffect(() => {
    setShowAdditionalFields(documentType === "lease_agreement");
  }, [documentType]);

  const { data: properties } = useQuery({
    queryKey: ["properties-for-document"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name")
        .eq("landlord_id", userId);

      if (error) throw error;
      return data;
    },
    enabled: open && userRole === "landlord",
  });

  const { data: tenants } = useQuery({
    queryKey: ["tenants-for-document"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("role", "tenant");

      if (error) throw error;
      return data.map((tenant) => ({
        ...tenant,
        fullName: `${tenant.first_name || ""} ${tenant.last_name || ""} (${
          tenant.email
        })`,
      }));
    },
    enabled: open && userRole === "landlord" && documentType === "lease_agreement",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);

    try {
      // First, upload the file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      // For lease agreements, use the document type in the file path to organize storage
      // Store directly in the bucket root to avoid permission issues with nested paths
      const filePath = values.document_type === "lease_agreement" 
        ? `lease_agreement/${fileName}`
        : `${values.document_type}/${fileName}`;

      console.log("Uploading file to path:", filePath);

      // Try uploading the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        
        // If there's a permission error, show a more detailed error
        if (uploadError.message && uploadError.message.includes("row-level security")) {
          throw new Error("Permission denied: You don't have rights to upload files to storage. Please contact your administrator.");
        }
        
        throw uploadError;
      }

      console.log("File uploaded successfully:", uploadData);

      // Then create a record in the documents table
      let documentData = {
        name: values.name,
        document_type: values.document_type,
        file_path: filePath,
        uploaded_by: userId,
        property_id: values.property_id || null,
        tenant_id: values.tenant_id || null,
      };

      const { data: document, error: documentError } = await supabase
        .from("documents")
        .insert(documentData)
        .select()
        .single();

      if (documentError) {
        console.error("Document insert error:", documentError);
        throw documentError;
      }

      // If it's a lease agreement, also create a contract record
      if (values.document_type === "lease_agreement" && showAdditionalFields) {
        // Use proper type for status field
        const status: ContractStatus = values.status || "draft";
        
        const contractData = {
          contract_type: "lease_agreement",
          property_id: values.property_id,
          landlord_id: userId,
          tenant_id: values.tenant_id || null,
          status: status,
          valid_from: values.valid_from ? values.valid_from.toISOString() : null,
          valid_until: values.valid_until ? values.valid_until.toISOString() : null,
          content: {},
          metadata: {
            document_id: document.id,
            file_path: filePath,
            document_name: values.name
          }
        };

        const { error: contractError } = await supabase
          .from("contracts")
          .insert(contractData);

        if (contractError) {
          console.error("Error creating contract record:", contractError);
          // Don't throw here, we still uploaded the document successfully
          toast({
            title: "Warning",
            description: "Document uploaded but contract record creation failed.",
            variant: "default",
          });
        }
      }

      // Success! Refresh document list and close dialog
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      form.reset();
      setFile(null);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a document to your property management system.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter document name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="document_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setShowAdditionalFields(value === "lease_agreement");
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="general">General Document</SelectItem>
                      <SelectItem value="lease_agreement">Lease Agreement</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="receipt">Receipt</SelectItem>
                      <SelectItem value="maintenance">Maintenance Document</SelectItem>
                      <SelectItem value="legal">Legal Document</SelectItem>
                      <SelectItem value="notice">Notice</SelectItem>
                      <SelectItem value="inspection">Inspection Report</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {userRole === "landlord" && (
              <FormField
                control={form.control}
                name="property_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties?.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showAdditionalFields && userRole === "landlord" && (
              <>
                <FormField
                  control={form.control}
                  name="tenant_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tenant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tenants?.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Status</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value as ContractStatus)}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contractStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valid_from"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Valid From</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
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
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valid_until"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Valid Until</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
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
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div>
              <FormLabel>Document File</FormLabel>
              <Input
                type="file"
                onChange={handleFileChange}
                className="mt-1"
                accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png"
              />
              {file && (
                <p className="text-sm text-gray-500 mt-1">
                  Selected: {file.name}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload Document"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
