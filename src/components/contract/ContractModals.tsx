
import React from 'react';
import ReactDOM from 'react-dom';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ContractContent } from "./ContractContent";
import { ContractSignatures } from "./ContractSignatures";
import { FormData } from "@/types/contract";

interface ContractModalsProps {
  isPreviewModalOpen: boolean;
  setIsPreviewModalOpen: (open: boolean) => void;
  metadata: FormData;
  contractId: string;
}

export function ContractModals({ 
  isPreviewModalOpen, 
  setIsPreviewModalOpen,
  metadata,
  contractId
}: ContractModalsProps) {
  return (
    <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="contract-preview">
          <ContractContent formData={metadata} />
          <ContractSignatures formData={metadata} contractId={contractId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
