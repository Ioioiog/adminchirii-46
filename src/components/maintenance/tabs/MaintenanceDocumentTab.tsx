
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MaintenanceRequest } from "../hooks/useMaintenanceRequest";
import { FileObject } from "@supabase/storage-js";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { FileUp, Eye, Trash2, Loader2 } from "lucide-react";

interface MaintenanceDocumentTabProps {
  request: MaintenanceRequest;
  onUpdateRequest: (request: Partial<MaintenanceRequest>) => void;
  documents?: FileObject[];
  isLoading?: boolean;
}

export function MaintenanceDocumentTab({ 
  request, 
  onUpdateRequest,
  documents,
  isLoading 
}: MaintenanceDocumentTabProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState<string | null>(null);

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

      // Get current document paths
      let currentPaths = Array.isArray(request.document_path) ? request.document_path : [];
      
      // Update the request with the new file name
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

  const handleViewDocument = async (fileName: string) => {
    try {
      console.log("Getting signed URL for document:", fileName);
      
      const fullPath = `${request.id}/${fileName}`;
      console.log("Using full path:", fullPath);
      
      const { data, error } = await supabase.storage
        .from('maintenance-documents')
        .createSignedUrl(fullPath, 300); // URL valid for 5 minutes

      if (error) {
        console.error("Error creating signed URL:", error);
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error('Failed to generate signed URL');
      }

      console.log("Generated signed URL:", data.signedUrl);
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error("Error getting document URL:", error);
      toast({
        title: "Error",
        description: "Failed to retrieve document",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDocument = async (fileName: string) => {
    try {
      setIsDeletingFile(fileName);
      const fullPath = `${request.id}/${fileName}`;
      
      const { error } = await supabase.storage
        .from('maintenance-documents')
        .remove([fullPath]);

      if (error) throw error;

      // Get current document paths and remove the deleted file
      let currentPaths = Array.isArray(request.document_path) ? request.document_path : [];
      currentPaths = currentPaths.filter(path => path !== fileName);
      
      // Update the request with the updated paths
      onUpdateRequest({ 
        document_path: currentPaths
      });

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    } finally {
      setIsDeletingFile(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="space-y-4">
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

          <ScrollArea className="h-[300px] rounded-md border p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : documents && documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div 
                    key={doc.name}
                    className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <span className="text-sm font-medium truncate flex-1">
                      {doc.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDocument(doc.name)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteDocument(doc.name)}
                        disabled={isDeletingFile === doc.name}
                      >
                        {isDeletingFile === doc.name ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FileUp className="h-8 w-8 mb-2" />
                <p>No documents uploaded yet</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
}
