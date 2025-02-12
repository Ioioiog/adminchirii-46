
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MaintenanceRequest } from "../hooks/useMaintenanceRequest";
import { FileObject } from "@supabase/storage-js";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileUp, Eye, Trash2, Loader2 } from "lucide-react";

interface DocumentListProps {
  request: MaintenanceRequest;
  onUpdateRequest: (request: Partial<MaintenanceRequest>) => void;
  documents?: FileObject[];
  isLoading?: boolean;
}

export function DocumentList({ 
  request, 
  onUpdateRequest, 
  documents,
  isLoading 
}: DocumentListProps) {
  const { toast } = useToast();
  const [isDeletingFile, setIsDeletingFile] = useState<string | null>(null);

  const handleViewDocument = async (fileName: string) => {
    try {
      console.log("Getting signed URL for document:", fileName);
      
      const fullPath = `${request.id}/${fileName}`;
      console.log("Using full path:", fullPath);
      
      const { data, error } = await supabase.storage
        .from('maintenance-documents')
        .createSignedUrl(fullPath, 300);

      if (error) throw error;

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

      let currentPaths = Array.isArray(request.document_path) ? request.document_path : [];
      currentPaths = currentPaths.filter(path => path !== fileName);
      
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
        <FileUp className="h-8 w-8 mb-2" />
        <p>No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] rounded-md border p-4">
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
    </ScrollArea>
  );
}
