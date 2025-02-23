
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ContractContent } from "./ContractContent";
import { ContractSignatures } from "./ContractSignatures";
import type { FormData } from "@/types/contract";

interface ContractPreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  metadata: FormData;
  contractId: string;
}

export function ContractPreviewDialog({
  isOpen,
  onOpenChange,
  metadata,
  contractId
}: ContractPreviewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="contract-preview">
          <ContractContent formData={metadata} />
          <ContractSignatures formData={metadata} contractId={contractId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
