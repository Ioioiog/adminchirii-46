
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface FileUploaderProps {
  isProcessing: boolean;
  processingError: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileUploader({ isProcessing, processingError, onFileChange }: FileUploaderProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="file">Upload Utility Bill Image</Label>
      <div className="flex flex-col gap-2">
        <Input
          id="file"
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="cursor-pointer"
          disabled={isProcessing}
        />
        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing image...
          </div>
        )}
        {processingError && (
          <Alert variant="destructive">
            <AlertDescription>{processingError}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
