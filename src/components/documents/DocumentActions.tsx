
import { MoreHorizontal, Trash2, Download, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface DocumentActionsProps {
  document: {
    id: string;
    file_path?: string;
    isContract?: boolean;
  };
  userRole: "landlord" | "tenant";
  onDocumentUpdated: () => void;
}

export function DocumentActions({ document, userRole, onDocumentUpdated }: DocumentActionsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleDownload = async () => {
    if (!document.file_path) return;
    
    try {
      const cleanFilePath = document.file_path.replace(/^\/+/, '');
      const fileName = cleanFilePath.split('/').pop();

      const { data, error } = await supabase.storage
        .from('documents')
        .download(cleanFilePath);
      
      if (error) throw error;
      
      if (data) {
        const url = window.URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName || 'document';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: "Failed to download the document",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      if (document.isContract) {
        // Delete contract
        const { error } = await supabase
          .from('contracts')
          .delete()
          .eq('id', document.id);
        
        if (error) throw error;
      } else {
        // Delete document
        const { error } = await supabase
          .from('documents')
          .delete()
          .eq('id', document.id);
        
        if (error) throw error;
      }
      
      toast({
        title: "Success",
        description: document.isContract ? "Contract deleted successfully" : "Document deleted successfully",
      });
      
      onDocumentUpdated();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewContract = () => {
    if (document.isContract) {
      navigate(`/documents/contracts/${document.id}`);
    }
  };

  // Only landlords can delete documents
  if (userRole !== "landlord") {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {document.isContract ? (
            <DropdownMenuItem onClick={handleViewContract}>
              <Eye className="h-4 w-4 mr-2" />
              View Contract
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            className="text-destructive" 
            onClick={() => setIsConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {document.isContract ? 'contract' : 'document'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
