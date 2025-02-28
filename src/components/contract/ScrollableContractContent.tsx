
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormData } from "@/types/contract";
import { ContractContent } from "./ContractContent";

interface ScrollableContractContentProps {
  formData: FormData;
  isEditing?: boolean;
  onFieldChange?: (field: keyof FormData, value: string) => void;
  readOnly?: boolean;
  maxHeight?: string;
}

export function ScrollableContractContent({
  formData,
  isEditing = false,
  onFieldChange,
  readOnly = false,
  maxHeight = "70vh" // Default max height
}: ScrollableContractContentProps) {
  return (
    <div className="relative">
      <ScrollArea className="max-h-[70vh] overflow-auto">
        <div className="text-black bg-white p-8 rounded-lg shadow-sm">
          <ContractContent
            formData={formData}
            isEditing={isEditing}
            onFieldChange={onFieldChange}
            readOnly={readOnly}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
