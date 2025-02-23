import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Printer, Mail, Edit, Save, Send } from "lucide-react";
import type { ContractStatus } from "@/types/contract";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";

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
  tenantEmail?: string;
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
  contractStatus,
  tenantEmail
}: ContractHeaderProps) {
  const [inviteOption, setInviteOption] = useState<'contract-tenant' | 'tenant-list' | 'custom-email'>(
    tenantEmail ? 'contract-tenant' : 'tenant-list'
  );
  const [sendOption, setSendOption] = useState<'contract-tenant' | 'tenant-list' | 'custom-email'>(
    tenantEmail ? 'contract-tenant' : 'tenant-list'
  );

  const showInviteButton = (contractStatus === 'draft' || contractStatus === 'pending_signature') && !isEditing;

  const handleInvite = () => {
    console.log('Invite option selected:', inviteOption);
    onInviteTenant();
  };

  const handleSend = () => {
    console.log('Send option selected:', sendOption);
    onEmail();
  };

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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="default"
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Invite to Sign
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <RadioGroup 
                value={inviteOption} 
                onValueChange={(value: 'contract-tenant' | 'tenant-list' | 'custom-email') => setInviteOption(value)}
                className="gap-3"
              >
                {tenantEmail && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="contract-tenant" id="contract-tenant" />
                    <Label htmlFor="contract-tenant">Contract Tenant ({tenantEmail})</Label>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tenant-list" id="tenant-list" />
                  <Label htmlFor="tenant-list">Select from Tenant List</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom-email" id="custom-email" />
                  <Label htmlFor="custom-email">Custom Email</Label>
                </div>
              </RadioGroup>
              <Button onClick={handleInvite} className="w-full mt-4">
                Send Invitation
              </Button>
            </PopoverContent>
          </Popover>
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

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-white hover:text-primary-600"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <RadioGroup 
              value={sendOption} 
              onValueChange={(value: 'contract-tenant' | 'tenant-list' | 'custom-email') => setSendOption(value)}
              className="gap-3"
            >
              {tenantEmail && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="contract-tenant" id="send-contract-tenant" />
                  <Label htmlFor="send-contract-tenant">Contract Tenant ({tenantEmail})</Label>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tenant-list" id="send-tenant-list" />
                <Label htmlFor="send-tenant-list">Select from Tenant List</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom-email" id="send-custom-email" />
                <Label htmlFor="send-custom-email">Custom Email</Label>
              </div>
            </RadioGroup>
            <Button onClick={handleSend} className="w-full mt-4">
              Send Contract
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
