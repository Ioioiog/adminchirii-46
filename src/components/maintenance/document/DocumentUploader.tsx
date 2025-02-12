
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MaintenanceRequest } from "../hooks/useMaintenanceRequest";
import { Loader2 } from "lucide-react";

interface DocumentUploaderProps {
  request: MaintenanceRequest;
  onUpdateRequest: (request: Partial<MaintenanceRequest>) => void;
}

export function DocumentUploader({ request, onUpdateRequest }: DocumentUploaderProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      console.log("Starting document upload for request:", request.id);
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${request.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('maintenance-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      console.log("File uploaded successfully:", filePath);

      let currentPaths = Array.isArray(request.document_path) ? request.document_path : [];
      
      onUpdateRequest({ 
        document_path: [...currentPaths, fileName]
      });

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <Input
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleDocumentUpload}
          disabled={isUploading}
          className="cursor-pointer file:cursor-pointer file:border-0 file:bg-primary file:text-primary-foreground file:px-4 file:py-2 file:mr-4 file:rounded-md hover:file:bg-primary/90 transition-colors"
        />
      </div>
      {isUploading && (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      )}
    </div>
  );
}
