
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileObject } from "@supabase/storage-js";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileUp, Eye, Trash2, Loader2 } from "lucide-react";

interface DocumentListProps {
  propertyId?: string;
  documentType?: string;
  searchTerm?: string;
  filter?: {
    propertyId?: string;
    documentType?: string;
    searchTerm?: string;
  };
  userId?: string;
  userRole?: "landlord" | "tenant";
  propertyFilter?: string;
  typeFilter?: string;
  viewMode?: "list" | "grid";
}

export function DocumentList({ 
  propertyId, 
  documentType = "", 
  searchTerm = "",
  filter,
  userId,
  userRole,
  propertyFilter,
  typeFilter,
  viewMode
}: DocumentListProps) {
  // If filter prop is provided, use its values
  const effectivePropertyId = filter?.propertyId || propertyId;
  const effectiveDocumentType = filter?.documentType || documentType;
  const effectiveSearchTerm = filter?.searchTerm || searchTerm;
  
  const { toast } = useToast();
  const [isDeletingFile, setIsDeletingFile] = useState<string | null>(null);
  const [documents, setDocuments] = useState<FileObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        
        // Fetch documents from Supabase Storage
        const { data, error } = await supabase.storage
          .from('property-documents')
          .list(effectivePropertyId || 'general', {
            sortBy: { column: 'name', order: 'asc' }
          });

        if (error) throw error;

        // Filter documents based on search term and document type
        let filteredDocs = data || [];
        
        if (effectiveSearchTerm) {
          filteredDocs = filteredDocs.filter(doc => 
            doc.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase())
          );
        }
        
        if (effectiveDocumentType) {
          filteredDocs = filteredDocs.filter(doc => {
            const fileExtension = doc.name.split('.').pop()?.toLowerCase();
            if (effectiveDocumentType === 'pdf') return fileExtension === 'pdf';
            if (effectiveDocumentType === 'image') {
              return ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '');
            }
            if (effectiveDocumentType === 'document') {
              return ['doc', 'docx', 'txt', 'rtf'].includes(fileExtension || '');
            }
            return true;
          });
        }

        setDocuments(filteredDocs);
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast({
          title: "Error",
          description: "Failed to load documents",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [effectivePropertyId, effectiveDocumentType, effectiveSearchTerm, toast]);

  const handleViewDocument = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('property-documents')
        .createSignedUrl(`${effectivePropertyId || 'general'}/${fileName}`, 300);

      if (error) throw error;

      if (!data?.signedUrl) {
        throw new Error('Failed to generate signed URL');
      }

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
      
      const { error } = await supabase.storage
        .from('property-documents')
        .remove([`${effectivePropertyId || 'general'}/${fileName}`]);

      if (error) throw error;

      setDocuments(prev => prev.filter(doc => doc.name !== fileName));
      
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
        <p>No documents available</p>
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
