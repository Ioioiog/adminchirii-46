
import { useState } from "react";
import { UtilityWithProperty } from "@/pages/utilities/Utilities";
import { UserRole } from "@/hooks/use-user-role";
import { TableCell, TableRow, TableHeader, TableHead, Table, TableBody } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Check, X, FilePlus, FileText } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentUploader } from "./components/DocumentUploader";
import { UtilityDocumentViewer } from "./UtilityDocumentViewer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UtilityListProps {
  utilities: UtilityWithProperty[];
  userRole: UserRole;
  onStatusUpdate: () => void;
}

export function UtilityList({ utilities, userRole, onStatusUpdate }: UtilityListProps) {
  const { toast } = useToast();
  const [selectedUtilityId, setSelectedUtilityId] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  
  const handleDocumentUploaded = async () => {
    setShowUploadDialog(false);
    onStatusUpdate();
    toast({
      title: "Success",
      description: "Document uploaded successfully",
    });
  };

  const handleStatusUpdate = async (utilityId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('utilities')
        .update({ status: newStatus })
        .eq('id', utilityId);
      
      if (error) throw error;
      
      onStatusUpdate();
      
      toast({
        title: "Success",
        description: `Utility marked as ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status",
      });
    }
  };

  if (!utilities || utilities.length === 0) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center">
        <h3 className="text-lg font-medium">No utility bills found</h3>
        <p className="text-muted-foreground mt-2">
          {userRole === "landlord"
            ? "Add your first utility bill to track your expenses."
            : "No utility bills have been added yet."}
        </p>
      </Card>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Issued Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Invoiced</TableHead>
            <TableHead>Documents</TableHead>
            {userRole === "landlord" && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {utilities.length ? (
            utilities.map((utility) => (
              <TableRow key={utility.id}>
                <TableCell className="font-medium capitalize">
                  {utility.type}
                </TableCell>
                <TableCell>{utility.property?.name || "Unknown"}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: utility.currency,
                  }).format(utility.amount)}
                </TableCell>
                <TableCell>
                  {utility.issued_date
                    ? format(new Date(utility.issued_date), "MMM d, yyyy")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {utility.due_date
                    ? format(new Date(utility.due_date), "MMM d, yyyy")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      utility.status === "paid"
                        ? "default"
                        : utility.status === "pending"
                        ? "outline"
                        : "destructive"
                    }
                  >
                    {utility.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {utility.invoiced ? (
                    <Badge variant="secondary">
                      {utility.invoiced_percentage 
                        ? `${utility.invoiced_percentage}%` 
                        : "Yes"}
                    </Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {utility.document_path ? (
                    <UtilityDocumentViewer
                      utilityId={utility.id}
                      documentPath={utility.document_path}
                      onDocumentDeleted={onStatusUpdate}
                      userRole={userRole}
                    />
                  ) : (
                    userRole === "landlord" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          setSelectedUtilityId(utility.id);
                          setShowUploadDialog(true);
                        }}
                      >
                        <FilePlus className="h-4 w-4" /> Add
                      </Button>
                    )
                  )}
                </TableCell>
                {userRole === "landlord" && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {utility.status !== "paid" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 border-green-500 text-green-500 hover:text-green-600 hover:bg-green-50"
                          onClick={() => handleStatusUpdate(utility.id, "paid")}
                        >
                          <Check className="h-4 w-4" /> Mark Paid
                        </Button>
                      )}
                      {utility.status !== "cancelled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 border-red-500 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleStatusUpdate(utility.id, "cancelled")}
                        >
                          <X className="h-4 w-4" /> Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={userRole === "landlord" ? 9 : 8} className="h-24 text-center">
                <Skeleton className="w-[800px] h-16 mx-auto" />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedUtilityId && (
              <DocumentUploader
                utilityId={selectedUtilityId}
                onDocumentUploaded={handleDocumentUploaded}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
