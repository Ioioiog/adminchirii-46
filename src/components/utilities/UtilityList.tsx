
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
import { Checkbox } from "@/components/ui/checkbox";

interface UtilityListProps {
  utilities: UtilityWithProperty[];
  userRole: UserRole;
  onStatusUpdate: () => void;
}

export function UtilityList({ utilities, userRole, onStatusUpdate }: UtilityListProps) {
  const { toast } = useToast();
  const [selectedUtilityId, setSelectedUtilityId] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedUtilities, setSelectedUtilities] = useState<string[]>([]);
  
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

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedUtilities.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('utilities')
        .update({ status: newStatus })
        .in('id', selectedUtilities);
      
      if (error) throw error;
      
      onStatusUpdate();
      setSelectedUtilities([]);
      
      toast({
        title: "Success",
        description: `${selectedUtilities.length} utilities marked as ${newStatus}`,
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

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      // Only select unpaid utilities
      const unpaidUtilityIds = utilities
        .filter(utility => utility.status !== 'paid')
        .map(utility => utility.id);
      setSelectedUtilities(unpaidUtilityIds);
    } else {
      setSelectedUtilities([]);
    }
  };

  const toggleSelectUtility = (utilityId: string, checked: boolean) => {
    if (checked) {
      setSelectedUtilities(prev => [...prev, utilityId]);
    } else {
      setSelectedUtilities(prev => prev.filter(id => id !== utilityId));
    }
  };

  // Ensure we only pass 'landlord' or 'tenant' to components that require it
  const safeUserRole = userRole === 'landlord' || userRole === 'tenant' 
    ? userRole 
    : 'tenant'; // Default to tenant for other roles like service_provider

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

  // Count of unpaid utilities that are selected
  const selectedUnpaidCount = selectedUtilities.length;
  
  // All unpaid utilities are selected if selectedUtilities contains all unpaid utility IDs
  const allUnpaidSelected = 
    utilities.filter(u => u.status !== 'paid').length > 0 && 
    utilities.filter(u => u.status !== 'paid').every(u => selectedUtilities.includes(u.id));

  return (
    <div className="space-y-4">
      {userRole === "landlord" && selectedUnpaidCount > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedUnpaidCount} {selectedUnpaidCount === 1 ? 'utility' : 'utilities'} selected
            </span>
          </div>
          <Button
            variant="default"
            size="sm"
            className="gap-1"
            onClick={() => handleBulkStatusUpdate('paid')}
          >
            <Check className="h-4 w-4" /> Mark Selected as Paid
          </Button>
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {userRole === "landlord" && (
                <TableHead className="w-12">
                  <Checkbox 
                    checked={allUnpaidSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all unpaid utilities"
                  />
                </TableHead>
              )}
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
                  {userRole === "landlord" && (
                    <TableCell className="w-12">
                      {utility.status !== 'paid' && (
                        <Checkbox 
                          checked={selectedUtilities.includes(utility.id)}
                          onCheckedChange={(checked) => 
                            toggleSelectUtility(utility.id, checked === true)
                          }
                          aria-label={`Select ${utility.type} utility`}
                        />
                      )}
                    </TableCell>
                  )}
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
                        userRole={safeUserRole} // Use our safe version here
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
                <TableCell colSpan={userRole === "landlord" ? 10 : 9} className="h-24 text-center">
                  <Skeleton className="w-[800px] h-16 mx-auto" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
