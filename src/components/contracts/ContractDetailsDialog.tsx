
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ContractDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: {
    id: string;
    properties?: { name: string };
    contract_type: string;
    status: string;
    valid_from: string | null;
    valid_until: string | null;
  } | null;
}

export function ContractDetailsDialog({ open, onOpenChange, contract }: ContractDetailsDialogProps) {
  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Contract Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Property</h3>
            <p className="mt-1">{contract.properties?.name || 'Untitled Property'}</p>
          </div>
          <Separator />
          <div>
            <h3 className="text-sm font-medium text-gray-500">Contract Type</h3>
            <p className="mt-1 capitalize">{contract.contract_type}</p>
          </div>
          <Separator />
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <div className="mt-1">
              <Badge variant="secondary" className={
                contract.status === 'signed' ? 'bg-green-100 text-green-800' :
                contract.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }>
                {contract.status}
              </Badge>
            </div>
          </div>
          <Separator />
          <div>
            <h3 className="text-sm font-medium text-gray-500">Validity Period</h3>
            <p className="mt-1">
              From: {contract.valid_from ? format(new Date(contract.valid_from), 'PPP') : 'Not specified'}
            </p>
            <p className="mt-1">
              Until: {contract.valid_until ? format(new Date(contract.valid_until), 'PPP') : 'Not specified'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
