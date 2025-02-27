
import { Button } from "@/components/ui/button";
import { Download, Trash2, UserPlus, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { AssignTenantDialog } from "./AssignTenantDialog";

interface DocumentActionsProps {
  document: {
    id: string;
    file_path: string;
    tenant_id?: string | null;
    property: {
      id: string;
      name: string;
      address: string;
    } | null;
  };
  userRole: "landlord" | "tenant";
  onDocumentUpdated: () => void;
}

export function DocumentActions({ document: doc, userRole, onDocumentUpdated }: DocumentActionsProps) {
  const { toast } = useToast();
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      // Remove any leading slashes from the file path
      const cleanFilePath = doc.file_path.replace(/^\/+/, '');
      
      console.log("Attempting to download document with details:", {
        id: doc.id,
        file_path: cleanFilePath,
        bucket: 'documents'
      });

      // First verify if the file exists
      const { data: fileInfo, error: fileCheckError } = await supabase.storage
        .from('documents')
        .list(cleanFilePath.split('/').slice(0, -1).join('/'));
      
      if (fileCheckError) {
        console.error("Error checking file existence:", fileCheckError);
      } else {
        const fileName = cleanFilePath.split('/').pop();
        const fileExists = fileInfo.some(file => file.name === fileName);
        
        if (!fileExists) {
          console.error("File does not exist in storage:", cleanFilePath);
          throw new Error("The document file could not be found in storage. It may have been moved or deleted.");
        }
      }

      // Attempt to download using direct download method first
      try {
        console.log("Attempting direct download...");
        const { data, error } = await supabase.storage
          .from('documents')
          .download(cleanFilePath);
          
        if (error) {
          console.error("Error with direct download:", error);
          throw error;
        }
          
        if (data) {
          // Create a downloadable link from the file data
          const url = window.URL.createObjectURL(data);
          const a = document.createElement("a");
          a.href = url;
          a.download = cleanFilePath.split('/').pop() || 'document';
          document.body.appendChild(a);
          a.click();
          
          // Clean up
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          console.log("File download completed successfully using direct download");
          
          toast({
            title: "Success",
            description: "Document downloaded successfully",
          });
          return;
        }
      } catch (directDownloadError) {
        console.error("Direct download failed, trying signed URL method...", directDownloadError);
      }

      // If direct download fails, try signed URL method
      const { data: signedURLData, error: signError } = await supabase.storage
        .from('documents')
        .createSignedUrl(cleanFilePath, 60); // 60 seconds expiry

      if (signError) {
        console.error("Error getting signed URL:", signError);
        throw new Error("Could not generate a secure download link for this document.");
      }

      if (!signedURLData?.signedUrl) {
        console.error("No signed URL received");
        throw new Error("Could not generate download link");
      }

      console.log("Successfully generated signed URL");

      // Download the file using the signed URL
      const signedResponse = await fetch(signedURLData.signedUrl);
      if (!signedResponse.ok) {
        console.error("Fetch error with signed URL:", signedResponse.status, signedResponse.statusText);
        throw new Error(`Failed to download file: ${signedResponse.statusText}`);
      }

      const signedBlob = await signedResponse.blob();
      const signedUrl = window.URL.createObjectURL(signedBlob);
      const link = document.createElement("a");
      link.href = signedUrl;
      link.download = cleanFilePath.split('/').pop() || 'document';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(signedUrl);
      document.body.removeChild(link);
      
      console.log("File download completed successfully using signed URL");

      toast({
        title: "Success",
        description: "Document downloaded successfully",
      });
    } catch (error: any) {
      console.error("Error downloading document:", error);
      
      toast({
        title: "Error",
        description: error.message || "Could not download the document. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", doc.id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      onDocumentUpdated();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Could not delete the document",
        variant: "destructive",
      });
    }
  };

  const handleRemoveTenant = async () => {
    try {
      const { error } = await supabase
        .from("documents")
        .update({ tenant_id: null })
        .eq("id", doc.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tenant access removed successfully",
      });
      onDocumentUpdated();
    } catch (error) {
      console.error("Error removing tenant access:", error);
      toast({
        title: "Error",
        description: "Could not remove tenant access",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={handleDownload}
        disabled={isDownloading}
      >
        <Download className="h-4 w-4 mr-2" />
        {isDownloading ? "Downloading..." : "Download"}
      </Button>
      {userRole === "landlord" && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAssignDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
          </Button>
          {doc.tenant_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveTenant}
            >
              <UserX className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}

      <AssignTenantDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        documentId={doc.id}
        propertyId={doc.property?.id || null}
        onAssigned={onDocumentUpdated}
      />
    </div>
  );
}
