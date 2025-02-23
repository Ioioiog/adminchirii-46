
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Printer, Mail } from "lucide-react";

interface ContractHeaderProps {
  onBack: () => void;
  onPreview: () => void;
  onPrint: () => void;
  onEmail: () => void;
}

export function ContractHeader({ onBack, onPreview, onPrint, onEmail }: ContractHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-white rounded-lg shadow-soft-md p-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Contract Details</h1>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={onPreview}
          size="sm"
          className="hover:bg-white hover:text-primary-600"
        >
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
        <Button
          variant="ghost"
          onClick={onPrint}
          size="sm"
          className="hover:bg-white hover:text-primary-600"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button
          variant="ghost"
          onClick={onEmail}
          size="sm"
          className="hover:bg-white hover:text-primary-600"
        >
          <Mail className="h-4 w-4 mr-2" />
          Send
        </Button>
      </div>
    </div>
  );
}
