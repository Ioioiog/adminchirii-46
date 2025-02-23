
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Printer, Mail, Edit, Save, Send } from "lucide-react";
import type { ContractStatus } from "@/types/contract";

interface ContractHeaderProps {
  onBack: () => void;
  onPreview: () => void;
  onPrint: () => void;
  onEmail: () => void;
  canEdit: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onInviteTenant: () => void;
  contractStatus: ContractStatus;
}

export function ContractHeader({
  onBack,
  onPreview,
  onPrint,
  onEmail,
  canEdit,
  isEditing,
  onEdit,
  onSave,
  onInviteTenant,
  contractStatus
}: ContractHeaderProps) {
  const showInviteButton = contractStatus === 'draft' && !isEditing;

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
        {canEdit && (
          isEditing ? (
            <Button
              variant="default"
              onClick={onSave}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={onEdit}
              size="sm"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )
        )}

        {showInviteButton && (
          <Button
            variant="default"
            onClick={onInviteTenant}
            size="sm"
          >
            <Send className="h-4 w-4 mr-2" />
            Invite to Sign
          </Button>
        )}

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
