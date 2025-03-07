import { useState } from "react";
import { UtilityWithProperty } from "@/pages/utilities/Utilities";
import { UserRole } from "@/hooks/use-user-role";
import { TableCell, TableRow, TableHeader, TableHead, Table, TableBody } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Check, X, FilePlus, FileText, Trash2, Ban, Ungroup } from "lucide-react";
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
  const [isProcessingDuplicates, setIsProcessingDuplicates] = useState(false);
  
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

  const handleDeleteSelected = async () => {
    if (selectedUtilities.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('utilities')
        .delete()
        .in('id', selectedUtilities);
      
      if (error) throw error;
      
      onStatusUpdate();
      setSelectedUtilities([]);
      
      toast({
        title: "Success",
        description: `${selectedUtilities.length} utilities deleted successfully`,
      });
    } catch (error) {
      console.error("Error deleting utilities:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete utilities",
      });
    }
  };

  const handleDeleteDuplicateInvoices = async () => {
    setIsProcessingDuplicates(true);
    
    try {
      // Find utilities with duplicate invoice numbers
      const invoiceMap = new Map<string, string[]>();
      
      // Skip utilities with no invoice number
      utilities
        .filter(utility => utility.invoice_number)
        .forEach(utility => {
          const invoiceNumber = utility.invoice_number as string;
          if (!invoiceMap.has(invoiceNumber)) {
            invoiceMap.set(invoiceNumber, [utility.id]);
          } else {
            invoiceMap.get(invoiceNumber)?.push(utility.id);
          }
        });
      
      // Get IDs of duplicate utilities (keep the first one, delete the rest)
      const duplicateIds: string[] = [];
      
      invoiceMap.forEach((ids) => {
        if (ids.length > 1) {
          // Keep the first entry, remove the duplicates
          duplicateIds.push(...ids.slice(1));
        }
      });
      
      if (duplicateIds.length === 0) {
        toast({
          title: "Information",
          description: "No duplicate invoice numbers found",
        });
        setIsProcessingDuplicates(false);
        return;
      }
      
      // Delete the duplicate utilities
      const { error } = await supabase
        .from('utilities')
        .delete()
        .in('id', duplicateIds);
      
      if (error) throw error;
      
      onStatusUpdate();
      
      toast({
        title: "Success",
        description: `Deleted ${duplicateIds.length} duplicate ${duplicateIds.length === 1 ? 'utility' : 'utilities'}`,
      });
    } catch (error) {
      console.error("Error deleting duplicate utilities:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete duplicate utilities",
      });
    } finally {
      setIsProcessingDuplicates(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all utilities, not just unpaid ones
      const allUtilityIds = utilities.map(utility => utility.id);
      setSelectedUtilities(allUtilityIds);
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

  // Count of selected utilities
  const selectedCount = selectedUtilities.length;
  
  // All utilities are selected if selectedUtilities contains all utility IDs
  const allSelected = 
    utilities.length > 0 && 
    utilities.every(u => selectedUtilities.includes(u.id));

  return (
    <div className="space-y-4">
      {userRole === "landlord" && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedCount} {selectedCount === 1 ? 'utility' : 'utilities'} selected
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handleDeleteDuplicateInvoices}
              disabled={isProcessingDuplicates}
            >
              <Ungroup className="h-4 w-4" /> 
              {isProcessingDuplicates ? "Processing..." : "Remove Duplicate Invoices"}
            </Button>
            
            {selectedCount > 0 && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1"
                  onClick={() => handleBulkStatusUpdate('paid')}
                >
                  <Check className="h-4 w-4" /> Mark as Paid
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 border-yellow-500 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50"
                  onClick={() => handleBulkStatusUpdate('pending')}
                >
                  <Ban className="h-4 w-4" /> Mark as Unpaid
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 border-red-500 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="h-4 w-4" /> Delete Selected
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {userRole === "landlord" && (
                <TableHead className="w-12">
                  <Checkbox 
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all utilities"
                  />
                </TableHead>
              )}
              <TableHead>Type</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Invoiced Amount</TableHead>
              <TableHead>Invoice #</TableHead>
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
                      <Checkbox 
                        checked={selectedUtilities.includes(utility.id)}
                        onCheckedChange={(checked) => 
                          toggleSelectUtility(utility.id, checked === true)
                        }
                        aria-label={`Select ${utility.type} utility`}
                      />
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
                    {utility.invoiced_amount ? (
                      <span className="text-blue-600">
                        {new Intl.NumberFormat(undefined, {
                          style: "currency",
                          currency: utility.currency,
                        }).format(utility.invoiced_amount)}
                        {utility.invoiced_amount < utility.amount && (
                          <span className="ml-1 text-xs text-gray-500">
                            (Remaining: {new Intl.NumberFormat(undefined, {
                              style: "currency",
                              currency: utility.currency,
                            }).format(utility.amount - utility.invoiced_amount)})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {utility.invoice_number ? (
                      <span className="text-blue-600">
                        {utility.invoice_number}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
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
                        {utility.invoiced_amount > 0 
                          ? `${new Intl.NumberFormat(undefined, {
                              style: "currency",
                              currency: utility.currency,
                            }).format(utility.invoiced_amount)}` 
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
                        userRole={safeUserRole}
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
                <TableCell colSpan={userRole === "landlord" ? 12 : 11} className="h-24 text-center">
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
