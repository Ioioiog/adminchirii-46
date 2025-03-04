
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, File, X } from "lucide-react";

interface DocumentUploaderProps {
  utilityId: string;
  onDocumentUploaded: () => void;
}

export function DocumentUploader({ utilityId, onDocumentUploaded }: DocumentUploaderProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Validate file type and size
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(selectedFile.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF or image file (JPEG, PNG).",
      });
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        variant: "destructive",
        title: "File too large",
        description: "File size must be less than 5MB.",
      });
      return;
    }
    
    setFile(selectedFile);
  };

  const clearFile = () => {
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${utilityId}/${fileName}`;
      
      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('utility-documents')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Update utility record to store document reference
      const { error: updateError } = await supabase
        .from('utilities')
        .update({
          document_path: filePath
        })
        .eq('id', utilityId);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      
      onDocumentUploaded();
      setFile(null);
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload document",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            disabled={isUploading}
            className="flex-1"
          />
        </div>
      ) : (
        <div className="flex items-center justify-between p-2 bg-muted rounded-md">
          <div className="flex items-center gap-2 truncate">
            <File size={16} className="shrink-0" />
            <span className="text-sm truncate">{file.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFile}
              disabled={isUploading}
            >
              <X size={16} />
            </Button>
            <Button 
              size="sm" 
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
