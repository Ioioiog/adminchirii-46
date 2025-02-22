
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContractContent } from "./ContractContent";
import { ContractSignatures } from "./ContractSignatures";
import { FormData } from "@/types/contract";

interface ContractModalsProps {
  isPreviewModalOpen: boolean;
  setIsPreviewModalOpen: (open: boolean) => void;
  isEmailModalOpen: boolean;
  setIsEmailModalOpen: (open: boolean) => void;
  isInviteModalOpen: boolean;
  setIsInviteModalOpen: (open: boolean) => void;
  selectedEmailOption: string;
  setSelectedEmailOption: (value: string) => void;
  customEmail: string;
  setCustomEmail: (value: string) => void;
  selectedTenantEmail: string;
  setSelectedTenantEmail: (value: string) => void;
  inviteEmail: string;
  setInviteEmail: (value: string) => void;
  metadata: FormData;
  contractId: string;
  tenants: any[];
  handleEmailSubmit: () => void;
  handleInviteTenant: () => void;
}

export function ContractModals({
  isPreviewModalOpen,
  setIsPreviewModalOpen,
  isEmailModalOpen,
  setIsEmailModalOpen,
  isInviteModalOpen,
  setIsInviteModalOpen,
  selectedEmailOption,
  setSelectedEmailOption,
  customEmail,
  setCustomEmail,
  selectedTenantEmail,
  setSelectedTenantEmail,
  inviteEmail,
  setInviteEmail,
  metadata,
  contractId,
  tenants,
  handleEmailSubmit,
  handleInviteTenant
}: ContractModalsProps) {
  return (
    <>
      {/* Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Contract Preview</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            <div className="p-6 space-y-8 contract-content">
              <ContractContent formData={metadata} />
              <ContractSignatures formData={metadata} contractId={contractId} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={isEmailModalOpen} onOpenChange={() => setIsEmailModalOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Contract via Email</DialogTitle>
            <DialogDescription>
              Choose where to send the contract
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup
              value={selectedEmailOption}
              onValueChange={setSelectedEmailOption}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tenant" id="email-tenant" />
                <Label htmlFor="email-tenant">
                  Contract Tenant ({metadata.tenantEmail || 'Not provided'})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tenant-list" id="email-tenant-list" />
                <Label htmlFor="email-tenant-list">Select from Tenant List</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="email-custom" />
                <Label htmlFor="email-custom">Custom Email</Label>
              </div>
            </RadioGroup>

            {selectedEmailOption === 'tenant-list' && (
              <div className="space-y-2">
                <Label>Select Tenant</Label>
                <Select
                  value={selectedTenantEmail}
                  onValueChange={setSelectedTenantEmail}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem 
                        key={tenant.id} 
                        value={tenant.email || ''}
                      >
                        {tenant.first_name} {tenant.last_name} ({tenant.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedEmailOption === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customEmail">Custom Email Address</Label>
                <Input
                  id="customEmail"
                  type="email"
                  placeholder="Enter email address"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                />
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEmailModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEmailSubmit}>
                Send
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite Tenant to Sign Contract</DialogTitle>
            <DialogDescription>
              Choose where to send the invitation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup
              value={selectedEmailOption}
              onValueChange={(value) => {
                setSelectedEmailOption(value);
                if (value !== 'tenant-list') {
                  setSelectedTenantEmail('');
                }
              }}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tenant" id="invite-tenant" />
                <Label htmlFor="invite-tenant">
                  Contract Tenant ({metadata.tenantEmail || 'Not provided'})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tenant-list" id="invite-tenant-list" />
                <Label htmlFor="invite-tenant-list">Select from Tenant List</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="invite-custom" />
                <Label htmlFor="invite-custom">Custom Email</Label>
              </div>
            </RadioGroup>

            {selectedEmailOption === 'tenant-list' && (
              <div className="space-y-2">
                <Label>Select Tenant</Label>
                <Select
                  value={selectedTenantEmail}
                  onValueChange={setSelectedTenantEmail}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem 
                        key={tenant.id} 
                        value={tenant.email || ''}
                      >
                        {tenant.first_name} {tenant.last_name} ({tenant.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedEmailOption === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Custom Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteTenant} className="bg-blue-600 hover:bg-blue-700">
                Send Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
