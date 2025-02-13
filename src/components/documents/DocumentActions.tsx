
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
      // Verify session before download
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error("Session error before download:", sessionError);
        throw new Error("Please sign in again to download documents");
      }

      console.log("Starting download process for document:", {
        id: doc.id,
        file_path: doc.file_path,
        bucket: 'documents'
      });

      // Get the file data from Supabase Storage
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error) {
        console.error("Storage download error:", error);
        console.error("Error message:", error.message);
        
        // Try to parse the error message if it's JSON
        try {
          const errorBody = JSON.parse(error.message);
          if (errorBody.statusCode === "404" || errorBody.error === "not_found") {
            throw new Error("The document file could not be found. Please contact support.");
          }
        } catch (parseError) {
          // If parsing fails, check the raw message
          if (error.message?.includes("not_found") || error.message?.includes("404")) {
            throw new Error("The document file could not be found. Please contact support.");
          }
        }
        
        throw new Error("Could not download the document. Please try again later.");
      }

      if (!data) {
        console.error("No data received from storage");
        throw new Error("No data received from storage");
      }

      // Create a blob URL and trigger download
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_path.split('/').pop() || 'document';
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
      
      if (error.message?.includes("sign in")) {
        await supabase.auth.signOut();
        window.location.href = "/auth";
        return;
      }

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
