
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Download, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface UtilityDocumentViewerProps {
  utilityId: string;
  documentPath: string | null;
  onDocumentDeleted: () => void;
  userRole: "landlord" | "tenant";
}

export function UtilityDocumentViewer({
  utilityId,
  documentPath,
  onDocumentDeleted,
  userRole
}: UtilityDocumentViewerProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fileType, setFileType] = useState<"pdf" | "image" | null>(null);

  useEffect(() => {
    if (documentPath && isViewerOpen) {
      fetchDocumentUrl();
    }
  }, [documentPath, isViewerOpen]);

  const fetchDocumentUrl = async () => {
    if (!documentPath) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase.storage
        .from('utility-documents')
        .createSignedUrl(documentPath, 60);

      if (error) throw error;

      setDocumentUrl(data.signedUrl);
      
      // Determine file type based on extension
      const extension = documentPath.split('.').pop()?.toLowerCase();
      if (extension === 'pdf') {
        setFileType('pdf');
      } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
        setFileType('image');
      }
    } catch (error) {
      console.error("Error fetching document URL:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to retrieve document",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!documentUrl) return;
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = documentPath?.split('/').pop() || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async () => {
    if (!documentPath || userRole !== 'landlord') return;
    
    try {
      setIsDeleting(true);
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('utility-documents')
        .remove([documentPath]);
      
      if (storageError) throw storageError;
      
      // Update utility record to remove reference
      const { error: updateError } = await supabase
        .from('utilities')
        .update({
          document_path: null
        })
        .eq('id', utilityId);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      
      setIsViewerOpen(false);
      onDocumentDeleted();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete document",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={() => setIsViewerOpen(true)}
      >
        <Eye className="h-4 w-4" /> View
      </Button>

      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Document Viewer</DialogTitle>
          </DialogHeader>
          
          <div className="mt-2 p-1">
            {isLoading ? (
              <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : documentUrl ? (
              <div className="space-y-4">
                <div className="bg-muted rounded-md overflow-hidden h-[60vh]">
                  {fileType === 'pdf' ? (
                    <iframe
                      src={`${documentUrl}#toolbar=0`}
                      className="w-full h-full"
                      title="PDF Document"
                    />
                  ) : fileType === 'image' ? (
                    <AspectRatio ratio={16 / 9} className="h-full flex items-center justify-center bg-black">
                      <img
                        src={documentUrl}
                        alt="Document"
                        className="max-h-full max-w-full object-contain"
                      />
                    </AspectRatio>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      Unsupported file type
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    className="gap-1"
                  >
                    <Download className="h-4 w-4" /> Download
                  </Button>
                  
                  {userRole === 'landlord' && (
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="gap-1"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-[60vh]">
                No document available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
