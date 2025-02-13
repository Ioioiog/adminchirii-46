
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
        original_file_path: doc.file_path,
        cleaned_file_path: cleanFilePath,
        bucket: 'documents'
      });

      // First verify the file exists
      const { data: fileList, error: listError } = await supabase.storage
        .from('documents')
        .list(cleanFilePath.split('/').slice(0, -1).join('/'));

      console.log("File list result:", { fileList, listError });

      if (listError) {
        console.error("Error listing files:", listError);
        throw new Error("Could not verify file existence");
      }

      const fileName = cleanFilePath.split('/').pop();
      const fileExists = fileList?.some(file => file.name === fileName);

      if (!fileExists) {
        console.error("File not found in storage:", cleanFilePath);
        throw new Error("The requested file could not be found");
      }

      // Get a signed URL for the verified file
      const { data: signedURL, error: signError } = await supabase.storage
        .from('documents')
        .createSignedUrl(cleanFilePath, 60); // 60 seconds expiry

      if (signError) {
        console.error("Error getting signed URL:", signError);
        throw new Error("Could not generate download link");
      }

      if (!signedURL?.signedUrl) {
        console.error("No signed URL received");
        throw new Error("Could not generate download link");
      }

      console.log("Successfully generated signed URL");

      // Download the file using the signed URL
      const response = await fetch(signedURL.signedUrl);
      if (!response.ok) {
        console.error("Fetch error:", response.status, response.statusText);
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = cleanFilePath.split('/').pop() || 'document';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log("File download completed successfully");

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
