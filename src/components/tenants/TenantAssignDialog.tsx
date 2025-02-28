
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
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleCreateContract}
              className="w-full flex items-center justify-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Go to Contracts
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
