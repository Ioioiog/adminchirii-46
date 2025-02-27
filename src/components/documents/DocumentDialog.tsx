
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PropertySelect } from "./PropertySelect";
import { TenantSelect } from "./TenantSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentType } from "@/integrations/supabase/types/document-types";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface DocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userRole: "landlord" | "tenant";
  leaseUploadMode?: boolean;
  onSuccess?: () => void;
}

export function DocumentDialog({ 
  open, 
  onOpenChange, 
  userId, 
  userRole,
  leaseUploadMode = false,
  onSuccess
}: DocumentDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>(leaseUploadMode ? "lease_agreement" : "general");
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens or closes
  const handleOpenChange = (newOpenState: boolean) => {
    if (!newOpenState) {
      // Reset form state when closing
      setFile(null);
      setName("");
      setDocumentType(leaseUploadMode ? "lease_agreement" : "general");
      setPropertyId(null);
      setTenantId(null);
      setError(null);
    }
    onOpenChange(newOpenState);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    
    // Auto-fill name field with file name (without extension)
    if (selectedFile) {
      const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
      if (!name) {
        setName(fileName);
      }
    }
  };

  const handleUpload = async () => {
    setError(null);
    
    // Validate inputs
    if (!file) {
      setError("Please select a file to upload");
      return;
    }
    
    if (!name.trim()) {
      setError("Please enter a document name");
      return;
    }
    
    if (!propertyId) {
      setError("Please select a property");
      return;
    }
    
    // Start upload process
    setIsUploading(true);
    
    try {
      // 1. Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // 2. Create document record in database
      if (leaseUploadMode) {
        // For lease agreements, create a contract record
        const { error: contractError } = await supabase
          .from("contracts")
          .insert({
            contract_type: "lease_agreement",
            status: "draft",
            property_id: propertyId,
            tenant_id: tenantId,
            landlord_id: userId,
            metadata: { 
              document_name: name,
              file_path: filePath 
            }
          });
        
        if (contractError) throw contractError;
      } else {
        // For regular documents
        const { error: docError } = await supabase
          .from("documents")
          .insert({
            name,
            file_path: filePath,
            document_type: documentType,
            property_id: propertyId,
            tenant_id: tenantId,
            uploaded_by: userId
          });
        
        if (docError) throw docError;
      }
      
      // Success! Close the dialog and show toast
      toast({
        title: leaseUploadMode ? "Lease agreement uploaded" : "Document uploaded",
        description: leaseUploadMode 
          ? "Your lease agreement has been uploaded successfully" 
          : "Your document has been uploaded successfully",
      });
      
      handleOpenChange(false);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error.message || "Failed to upload document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {leaseUploadMode ? "Upload Lease Agreement" : "Upload Document"}
          </DialogTitle>
          <DialogDescription>
            {leaseUploadMode 
              ? "Upload a lease agreement document to associate with a property and tenant"
              : "Upload a document to associate with a property and tenant"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file">Document File</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {file && (
              <p className="text-sm text-gray-500">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="name">Document Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter document name"
            />
          </div>
          
          {!leaseUploadMode && (
            <div className="grid gap-2">
              <Label htmlFor="type">Document Type</Label>
              <Select value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Document</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="receipt">Receipt</SelectItem>
                  <SelectItem value="maintenance">Maintenance Document</SelectItem>
                  <SelectItem value="legal">Legal Document</SelectItem>
                  <SelectItem value="notice">Notice</SelectItem>
                  <SelectItem value="inspection">Inspection Report</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="property">Property</Label>
            <PropertySelect 
              selectedPropertyId={propertyId} 
              onPropertySelect={setPropertyId} 
              userId={userId}
              userRole={userRole}
            />
          </div>
          
          {userRole === "landlord" && (
            <div className="grid gap-2">
              <Label htmlFor="tenant">Tenant (Optional)</Label>
              <TenantSelect 
                selectedTenantId={tenantId} 
                onTenantSelect={setTenantId} 
                propertyId={propertyId}
                landlordId={userId}
              />
            </div>
          )}
          
          {error && (
            <div className="text-sm font-medium text-red-500">
              {error}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
