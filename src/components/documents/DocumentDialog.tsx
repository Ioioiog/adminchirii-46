
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Property } from "@/utils/propertyUtils";
import { PropertySelect } from "./PropertySelect";
import { TenantSelect } from "./TenantSelect";

interface DocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userRole: "landlord" | "tenant";
}

type DocumentType = "lease_agreement" | "invoice" | "receipt" | "other";

export function DocumentDialog({
  open,
  onOpenChange,
  userId,
  userRole,
}: DocumentDialogProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("other");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedTenantId, setSelectedTenantId] = useState<string>("none");

  const { data: properties } = useQuery({
    queryKey: ["properties", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("landlord_id", userId);

      if (error) throw error;
      return data as Property[];
    },
    enabled: userRole === "landlord",
  });

  const { data: tenants } = useQuery({
    queryKey: ["property-tenants", selectedPropertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenancies")
        .select(`
          tenant_id,
          tenant:profiles!inner(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("property_id", selectedPropertyId)
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
    enabled: !!selectedPropertyId && userRole === "landlord",
  });

  const handlePropertyChange = (value: string) => {
    setSelectedPropertyId(value);
    setSelectedTenantId("none");
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (userRole === "landlord" && !selectedPropertyId) {
      toast({
        title: "Error",
        description: "Please select a property",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      // Store files in a subdirectory based on document type
      const filePath = `${documentType}/${userId}/${fileName}`;

      console.log("Attempting to upload file:", {
        bucket: 'documents',
        filePath,
        contentType: file.type
      });

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error("Error uploading document:", uploadError);
        throw uploadError;
      }

      const { error: dbError } = await supabase
        .from("documents")
        .insert({
          name: file.name,
          file_path: filePath,
          uploaded_by: userId,
          document_type: documentType,
          property_id: userRole === "landlord" ? selectedPropertyId : null,
          tenant_id: selectedTenantId === "none" ? null : selectedTenantId,
        });

      if (dbError) {
        console.error("Error saving document metadata:", dbError);
        throw dbError;
      }

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Error",
        description: "Could not upload the document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="document-upload-description">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription id="document-upload-description">
            Upload a document and assign it to a property or tenant. Supported file types include PDF, images, and documents.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              aria-required="true"
              aria-label="Document file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>
          {userRole === "landlord" && (
            <>
              <PropertySelect
                properties={properties}
                selectedPropertyId={selectedPropertyId}
                onPropertyChange={handlePropertyChange}
              />
              {selectedPropertyId && (
                <TenantSelect
                  tenants={tenants}
                  selectedTenantId={selectedTenantId}
                  onTenantChange={setSelectedTenantId}
                />
              )}
            </>
          )}
          <div>
            <Label htmlFor="type">Document Type</Label>
            <Select
              value={documentType}
              onValueChange={(value: DocumentType) => setDocumentType(value)}
            >
              <SelectTrigger aria-label="Document type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lease_agreement">Lease Agreement</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="receipt">Receipt</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={!file || isUploading}>
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
