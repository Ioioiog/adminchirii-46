import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Printer, Mail, Edit, Save, Send } from "lucide-react";
import type { ContractStatus } from "@/types/contract";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenants } from "@/hooks/useTenants";

interface ContractHeaderProps {
  onBack: () => void;
  onPreview: () => void;
  onPrint: () => void;
  onEmail: () => void;
  canEdit: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onInviteTenant: (email: string) => void;
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
  const { data: tenants = [] } = useTenants();
  const [inviteOption, setInviteOption] = useState<'contract-tenant' | 'tenant-list' | 'custom-email'>(
    tenantEmail ? 'contract-tenant' : 'tenant-list'
  );
  const [selectedTenantEmail, setSelectedTenantEmail] = useState<string>("");
  const [customEmail, setCustomEmail] = useState<string>("");
  const [sendOption, setSendOption] = useState<'contract-tenant' | 'tenant-list' | 'custom-email'>(
    tenantEmail ? 'contract-tenant' : 'tenant-list'
  );

  const showInviteButton = (contractStatus === 'draft' || contractStatus === 'pending_signature') && !isEditing;

  const handleInvite = () => {
    let emailToUse = "";
    
    switch (inviteOption) {
      case 'contract-tenant':
        emailToUse = tenantEmail || '';
        break;
      case 'tenant-list':
        emailToUse = selectedTenantEmail;
        break;
      case 'custom-email':
        emailToUse = customEmail;
        break;
    }

    if (!emailToUse) {
      console.error('No email selected for invitation');
      return;
    }

    console.log('Inviting tenant with email:', emailToUse);
    onInviteTenant(emailToUse);
  };

  const handleSend = () => {
    console.log('Send option selected:', sendOption);
    onEmail();
  };

  const renderExtraFields = () => {
    switch (inviteOption) {
      case 'contract-tenant':
        return (
          <Input
            type="email"
            value={tenantEmail || ''}
            readOnly
            className="mt-2 bg-gray-50"
          />
        );
      case 'tenant-list':
        return (
          <Select value={selectedTenantEmail} onValueChange={setSelectedTenantEmail}>
            <SelectTrigger className="w-full mt-2">
              <SelectValue placeholder="Select a tenant" />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.email || ''}>
                  {tenant.first_name} {tenant.last_name} ({tenant.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'custom-email':
        return (
          <Input
            type="email"
            placeholder="Enter email address"
            value={customEmail}
            onChange={(e) => setCustomEmail(e.target.value)}
            className="mt-2"
          />
        );
      default:
        return null;
    }
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
              <div className="space-y-4">
                <RadioGroup 
                  value={inviteOption} 
                  onValueChange={(value: 'contract-tenant' | 'tenant-list' | 'custom-email') => {
                    setInviteOption(value);
                    setSelectedTenantEmail("");
                    setCustomEmail("");
                  }}
                  className="gap-3"
                >
                  {tenantEmail && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="contract-tenant" id="contract-tenant" />
                      <Label htmlFor="contract-tenant">Contract Tenant</Label>
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

                {renderExtraFields()}

                <Button 
                  onClick={handleInvite} 
                  className="w-full mt-4"
                  disabled={
                    (inviteOption === 'tenant-list' && !selectedTenantEmail) ||
                    (inviteOption === 'custom-email' && !customEmail)
                  }
                >
                  Send Invitation
                </Button>
              </div>
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
