
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
import { ContractStatus, FormData } from "@/types/contract";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  // Lease agreement specific fields (when relevant)
  contractNumber: z.string().optional(),
  contractDate: z.string().optional(),
  ownerName: z.string().optional(),
  ownerReg: z.string().optional(),
  ownerFiscal: z.string().optional(),
  ownerAddress: z.string().optional(),
  ownerBank: z.string().optional(),
  ownerBankName: z.string().optional(),
  ownerEmail: z.string().optional(),
  ownerPhone: z.string().optional(),
  ownerCounty: z.string().optional(),
  ownerCity: z.string().optional(),
  ownerRepresentative: z.string().optional(),
  tenantName: z.string().optional(),
  tenantReg: z.string().optional(),
  tenantFiscal: z.string().optional(),
  tenantAddress: z.string().optional(),
  tenantBank: z.string().optional(),
  tenantBankName: z.string().optional(),
  tenantEmail: z.string().optional(),
  tenantPhone: z.string().optional(),
  tenantCounty: z.string().optional(),
  tenantCity: z.string().optional(),
  tenantRepresentative: z.string().optional(),
  propertyAddress: z.string().optional(),
  rentAmount: z.string().optional(),
  vatIncluded: z.string().optional(),
  contractDuration: z.string().optional(),
  paymentDay: z.string().optional(),
  roomCount: z.string().optional(),
  lateFee: z.string().optional(),
  renewalPeriod: z.string().optional(),
  unilateralNotice: z.string().optional(),
  terminationNotice: z.string().optional(),
  earlyTerminationFee: z.string().optional(),
  latePaymentTermination: z.string().optional(),
  securityDeposit: z.string().optional(),
  depositReturnPeriod: z.string().optional(),
  waterColdMeter: z.string().optional(),
  waterHotMeter: z.string().optional(),
  electricityMeter: z.string().optional(),
  gasMeter: z.string().optional(),
});

type FormSchemaType = z.infer<typeof formSchema>;

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
  const [currentTab, setCurrentTab] = useState("basic");

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      document_type: "lease_agreement",
      property_id: undefined,
      tenant_id: undefined,
      status: "draft",
      valid_from: undefined,
      valid_until: undefined,
      // Default lease agreement values
      contractNumber: "1/01.01.2025",
      contractDate: new Date().toISOString().substring(0, 10),
      ownerName: "",
      ownerReg: "",
      ownerFiscal: "",
      ownerAddress: "",
      ownerBank: "",
      ownerBankName: "",
      ownerEmail: "",
      ownerPhone: "",
      ownerCounty: "",
      ownerCity: "",
      ownerRepresentative: "",
      tenantName: "",
      tenantReg: "",
      tenantFiscal: "",
      tenantAddress: "",
      tenantBank: "",
      tenantBankName: "",
      tenantEmail: "",
      tenantPhone: "",
      tenantCounty: "",
      tenantCity: "",
      tenantRepresentative: "",
      propertyAddress: "",
      rentAmount: "",
      vatIncluded: "nu",
      contractDuration: "12",
      paymentDay: "1",
      roomCount: "1",
      lateFee: "0.1",
      renewalPeriod: "12",
      unilateralNotice: "30",
      terminationNotice: "15",
      earlyTerminationFee: "2 chirii lunare",
      latePaymentTermination: "5",
      securityDeposit: "2 chirii lunare",
      depositReturnPeriod: "2",
      waterColdMeter: "0",
      waterHotMeter: "0",
      electricityMeter: "0",
      gasMeter: "0",
    },
  });

  const documentType = form.watch("document_type");

  // Set showAdditionalFields based on document type
  React.useEffect(() => {
    setShowAdditionalFields(documentType === "lease_agreement" || documentType === "lease");
    // Reset current tab to basic when document type changes
    setCurrentTab("basic");
  }, [documentType]);

  const { data: properties } = useQuery({
    queryKey: ["properties-for-document"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name, address")
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
    enabled: open && userRole === "landlord" && (documentType === "lease_agreement" || documentType === "lease"),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  // Function to fetch property details when a property is selected
  const handlePropertySelect = async (propertyId: string) => {
    try {
      // Find the selected property from the properties array
      const selectedProperty = properties?.find(property => property.id === propertyId);
      
      if (selectedProperty) {
        form.setValue("propertyAddress", selectedProperty.address);
        
        // Get detailed property info including monthly_rent
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", propertyId)
          .single();
        
        if (error) throw error;
        
        if (data && data.monthly_rent) {
          form.setValue("rentAmount", data.monthly_rent.toString());
        }
      }
    } catch (error) {
      console.error("Error fetching property details:", error);
    }
  };

  // Function to fetch tenant details when a tenant is selected
  const handleTenantSelect = async (tenantId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", tenantId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        form.setValue("tenantName", `${data.first_name || ""} ${data.last_name || ""}`);
        form.setValue("tenantEmail", data.email || "");
        form.setValue("tenantPhone", data.phone || "");
      }
    } catch (error) {
      console.error("Error fetching tenant details:", error);
    }
  };

  const onSubmit = async (values: FormSchemaType) => {
    if (showAdditionalFields) {
      // Validate lease-specific fields
      const requiredLeaseFields = ["contractNumber", "contractDate", "ownerName", "rentAmount"];
      const missingFields = requiredLeaseFields.filter(field => !values[field as keyof FormSchemaType]);
      
      if (missingFields.length > 0) {
        toast({
          title: "Missing required fields",
          description: `Please fill in: ${missingFields.join(", ")}`,
          variant: "destructive",
        });
        return;
      }
    } else if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);

    try {
      let filePath = "";
      let fileUploadComplete = false;
      
      // Upload file if provided
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        // For lease agreements, use the document type in the file path to organize storage
        filePath = values.document_type === "lease_agreement" || values.document_type === "lease"
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
        fileUploadComplete = true;
      }

      // Prepare metadata for lease agreements
      let contractMetadata = {};
      
      if (values.document_type === "lease_agreement" || values.document_type === "lease") {
        contractMetadata = {
          contractNumber: values.contractNumber,
          contractDate: values.contractDate,
          ownerName: values.ownerName,
          ownerReg: values.ownerReg,
          ownerFiscal: values.ownerFiscal,
          ownerAddress: values.ownerAddress,
          ownerBank: values.ownerBank,
          ownerBankName: values.ownerBankName,
          ownerEmail: values.ownerEmail,
          ownerPhone: values.ownerPhone,
          ownerCounty: values.ownerCounty,
          ownerCity: values.ownerCity,
          ownerRepresentative: values.ownerRepresentative,
          tenantName: values.tenantName,
          tenantReg: values.tenantReg,
          tenantFiscal: values.tenantFiscal,
          tenantAddress: values.tenantAddress,
          tenantBank: values.tenantBank,
          tenantBankName: values.tenantBankName,
          tenantEmail: values.tenantEmail,
          tenantPhone: values.tenantPhone,
          tenantCounty: values.tenantCounty,
          tenantCity: values.tenantCity,
          tenantRepresentative: values.tenantRepresentative,
          propertyAddress: values.propertyAddress,
          rentAmount: values.rentAmount,
          vatIncluded: values.vatIncluded,
          contractDuration: values.contractDuration,
          paymentDay: values.paymentDay,
          roomCount: values.roomCount,
          startDate: values.valid_from ? format(values.valid_from, 'yyyy-MM-dd') : '',
          lateFee: values.lateFee,
          renewalPeriod: values.renewalPeriod,
          unilateralNotice: values.unilateralNotice,
          terminationNotice: values.terminationNotice,
          earlyTerminationFee: values.earlyTerminationFee,
          latePaymentTermination: values.latePaymentTermination,
          securityDeposit: values.securityDeposit,
          depositReturnPeriod: values.depositReturnPeriod,
          waterColdMeter: values.waterColdMeter,
          waterHotMeter: values.waterHotMeter,
          electricityMeter: values.electricityMeter,
          gasMeter: values.gasMeter,
          assets: [],
        };
      }

      // Create document in documents table if a file was uploaded
      let documentId = "";
      
      if (fileUploadComplete) {
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
        
        documentId = document.id;
      }

      // Create contract record for lease agreement
      if (values.document_type === "lease_agreement" || values.document_type === "lease") {
        // Use proper type for status field
        const status: ContractStatus = values.status || "draft";
        
        // For the end date calculation
        let validUntil = null;
        if (values.valid_from && values.contractDuration) {
          const validFrom = new Date(values.valid_from);
          const months = parseInt(values.contractDuration);
          validUntil = new Date(validFrom);
          validUntil.setMonth(validUntil.getMonth() + months);
        }
        
        const contractData = {
          contract_type: values.document_type === "lease" ? "lease" : "lease_agreement",
          property_id: values.property_id,
          landlord_id: userId,
          tenant_id: values.tenant_id || null,
          status: status,
          valid_from: values.valid_from ? values.valid_from.toISOString() : null,
          valid_until: validUntil ? validUntil.toISOString() : null,
          content: {},
          metadata: {
            ...contractMetadata,
            document_id: documentId || undefined,
            file_path: filePath || undefined,
            document_name: values.name
          }
        };

        const { error: contractError } = await supabase
          .from("contracts")
          .insert(contractData);

        if (contractError) {
          console.error("Error creating contract record:", contractError);
          toast({
            title: "Warning",
            description: "Lease agreement metadata saved but contract record creation failed.",
            variant: "default",
          });
        }
      }

      // Success! Refresh document list and close dialog
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({
        title: "Success",
        description: fileUploadComplete 
          ? "Document uploaded successfully" 
          : "Lease agreement created successfully",
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

  // Function to render the appropriate form content based on document type and tab
  const renderFormContent = () => {
    if (!showAdditionalFields) {
      // For non-lease documents, show the basic file upload form
      return (
        <div className="space-y-6">
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
                    setShowAdditionalFields(value === "lease_agreement" || value === "lease");
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
                    <SelectItem value="lease">Lease</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="maintenance">Maintenance Document</SelectItem>
                    <SelectItem value="legal">Legal Document</SelectItem>
                    <SelectItem value="notice">Notice</SelectItem>
                    <SelectItem value="inspection">Inspection Report</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
        </div>
      );
    }

    // For lease agreements, show tabbed interface with many fields
    return (
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="owner">Owner</TabsTrigger>
          <TabsTrigger value="tenant">Tenant</TabsTrigger>
          <TabsTrigger value="property">Property</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
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
                    setShowAdditionalFields(value === "lease_agreement" || value === "lease");
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
                    <SelectItem value="lease">Lease</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="maintenance">Maintenance Document</SelectItem>
                    <SelectItem value="legal">Legal Document</SelectItem>
                    <SelectItem value="notice">Notice</SelectItem>
                    <SelectItem value="inspection">Inspection Report</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contractNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Contract number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contractDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              name="property_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handlePropertySelect(value);
                    }}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="tenant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleTenantSelect(value);
                    }}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              name="contractDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Duration (months)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormLabel>Document File (Optional)</FormLabel>
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
        </TabsContent>
        
        <TabsContent value="owner" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="ownerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner Name/Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Owner name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="ownerReg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Reg. number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="ownerFiscal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fiscal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Fiscal code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="ownerRepresentative"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Representative</FormLabel>
                  <FormControl>
                    <Input placeholder="Representative" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="ownerAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Owner address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="ownerCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="ownerCounty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>County</FormLabel>
                  <FormControl>
                    <Input placeholder="County" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="ownerBank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Account</FormLabel>
                  <FormControl>
                    <Input placeholder="Bank account" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="ownerBankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Bank name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="ownerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="ownerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </TabsContent>

        <TabsContent value="tenant" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="tenantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant Name/Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Tenant name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tenantReg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Reg. number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="tenantFiscal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fiscal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Fiscal code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tenantRepresentative"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Representative</FormLabel>
                  <FormControl>
                    <Input placeholder="Representative" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="tenantAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Tenant address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="tenantCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tenantCounty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>County</FormLabel>
                  <FormControl>
                    <Input placeholder="County" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="tenantBank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Account</FormLabel>
                  <FormControl>
                    <Input placeholder="Bank account" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tenantBankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Bank name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="tenantEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tenantPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </TabsContent>

        <TabsContent value="property" className="space-y-4">
          <FormField
            control={form.control}
            name="propertyAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Address</FormLabel>
                <FormControl>
                  <Input placeholder="Property address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="rentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rent Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Rent amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="vatIncluded"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VAT Included</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="VAT included?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="da">Yes</SelectItem>
                      <SelectItem value="nu">No (+ VAT)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="roomCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Count</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paymentDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Day (of month)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="31" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="securityDeposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Security Deposit</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 2 monthly rents" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-medium">Utility Meter Readings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="waterColdMeter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cold Water</FormLabel>
                    <FormControl>
                      <Input placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="waterHotMeter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hot Water</FormLabel>
                    <FormControl>
                      <Input placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="electricityMeter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Electricity</FormLabel>
                    <FormControl>
                      <Input placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gasMeter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gas</FormLabel>
                    <FormControl>
                      <Input placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="lateFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Late Fee (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="latePaymentTermination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Late Payment Termination (days)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="renewalPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Renewal Period (months)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="depositReturnPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Return Period (days)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="unilateralNotice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unilateral Notice Period (days)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="terminationNotice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Termination Notice (days)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="earlyTerminationFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Early Termination Fee</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 2 monthly rents" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={showAdditionalFields ? "sm:max-w-[700px]" : "sm:max-w-[520px]"}>
        <DialogHeader>
          <DialogTitle>
            {showAdditionalFields ? "Create Lease Agreement" : "Upload Document"}
          </DialogTitle>
          <DialogDescription>
            {showAdditionalFields 
              ? "Fill in the lease agreement details. You can navigate between sections using the tabs."
              : "Upload a document to your property management system."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {renderFormContent()}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? "Saving..." : (showAdditionalFields ? "Create Lease" : "Upload Document")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
