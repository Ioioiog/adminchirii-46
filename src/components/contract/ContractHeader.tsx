
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Printer, Edit, Save, Send } from "lucide-react";
import type { ContractStatus } from "@/types/contract";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTenants } from "@/hooks/useTenants";
import type { FormData } from "@/types/contract";
import { useUserRole } from "@/hooks/use-user-role";

interface ContractHeaderProps {
  onBack: () => void;
  onPreview: () => void;
  onPrint: () => void;
  onEmail: (email: string) => void;
  canEdit: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onInviteTenant: (email: string) => void;
  contractStatus: ContractStatus;
  formData: FormData;
  showActions?: boolean;
}

export function ContractHeader({
  onBack,
  onPreview,
  onPrint,
  canEdit,
  isEditing,
  onEdit,
  onSave,
  onInviteTenant,
  contractStatus,
  formData,
  showActions = true
}: ContractHeaderProps) {
  const { data: tenants = [] } = useTenants();
  const { userRole } = useUserRole();
  const [inviteOption, setInviteOption] = useState<'contract-tenant' | 'tenant-list' | 'custom-email'>(
    formData.tenantEmail ? 'contract-tenant' : 'tenant-list'
  );
  const [selectedTenantEmail, setSelectedTenantEmail] = useState<string>("");
  const [customEmail, setCustomEmail] = useState<string>("");

  const showInviteButton = userRole === 'landlord' && 
    (contractStatus === 'draft' || contractStatus === 'pending_signature') && 
    !isEditing;

  const handleInvite = () => {
    let emailToUse = "";
    
    switch (inviteOption) {
      case 'contract-tenant':
        emailToUse = formData.tenantEmail || '';
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

  const renderExtraFields = () => {
    switch (inviteOption) {
      case 'contract-tenant':
        return formData.tenantEmail ? (
          <div className="mt-2 space-y-2">
            <Label className="text-sm text-gray-500">Contract Tenant Email</Label>
            <Input
              type="email"
              value={formData.tenantEmail}
              readOnly
              className="bg-gray-50"
            />
          </div>
        ) : (
          <div className="mt-2 text-sm text-gray-500">
            No tenant email available in contract. Please select another option.
          </div>
        );
      case 'tenant-list':
        const uniqueTenants = tenants.reduce((acc, current) => {
          const x = acc.find(item => item.email === current.email);
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, [] as typeof tenants);

        return (
          <Select value={selectedTenantEmail} onValueChange={setSelectedTenantEmail}>
            <SelectTrigger className="w-full mt-2">
              <SelectValue placeholder="Select a tenant" />
            </SelectTrigger>
            <SelectContent>
              {uniqueTenants.map((tenant, index) => {
                const uniqueKey = `${tenant.id}-${index}`;
                return (
                  <SelectItem key={uniqueKey} value={tenant.email || ''}>
                    {tenant.first_name} {tenant.last_name} ({tenant.email})
                  </SelectItem>
                );
              })}
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
                  {formData.tenantEmail && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="contract-tenant" id="contract-tenant" />
                      <Label htmlFor="contract-tenant">Contract Tenant ({formData.tenantEmail})</Label>
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
                    (inviteOption === 'custom-email' && !customEmail) ||
                    (inviteOption === 'contract-tenant' && !formData.tenantEmail)
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
      </div>
    </div>
  );
}
