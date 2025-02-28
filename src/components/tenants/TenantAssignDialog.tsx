
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Property } from "@/utils/propertyUtils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";

interface TenantAssignDialogProps {
  properties: Property[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
}

export function TenantAssignDialog({ properties, open, onOpenChange, onClose }: TenantAssignDialogProps) {
  const navigate = useNavigate();

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen && onClose) {
      onClose();
    }
  };

  const handleCreateContract = () => {
    handleOpenChange(false);
    navigate("/documents", { state: { activeTab: "contracts" } });
  };

  const handleGoToNewContract = () => {
    handleOpenChange(false);
    navigate("/generate-contract");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Tenant Through Contract</DialogTitle>
          <DialogDescription>
            Tenants can only be added by creating a contract. This ensures proper documentation and legal compliance.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-700">
            <p className="text-sm">
              Direct tenant assignment has been disabled. Tenants can now only be added by creating and signing a contract.
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-3">
            <h3 className="font-medium text-blue-800 mb-2">Guide to Adding a New Tenant:</h3>
            <ol className="list-decimal ml-4 text-sm text-blue-700 space-y-1">
              <li>Click "Create New Contract" below</li>
              <li>Fill in the contract details including tenant information and property selection</li>
              <li>Complete all required fields in the contract form</li>
              <li>Review and save the contract</li>
              <li>Send the contract to the tenant for signature</li>
              <li>Once signed, the tenant will be automatically assigned to the property</li>
            </ol>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleGoToNewContract}
              className="w-full flex items-center justify-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Create New Contract
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
