
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ImagePreviewDialogProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export function ImagePreviewDialog({
  isOpen,
  imageUrl,
  onClose
}: ImagePreviewDialogProps) {
  if (!imageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto p-0 bg-black/90">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 text-white hover:bg-white/20 z-50"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
        <div className="relative flex items-center justify-center p-2">
          <img
            src={imageUrl}
            alt="Full size preview"
            className="max-w-full max-h-[90vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
