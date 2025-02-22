
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useTenants } from "@/hooks/useTenants";

interface SendContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
}

export function SendContractModal({ open, onOpenChange, contractId }: SendContractModalProps) {
  const [selectedEmailOption, setSelectedEmailOption] = useState('tenant');
  const [selectedTenantEmail, setSelectedTenantEmail] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  const { data: tenants } = useTenants();

  const handleSend = async () => {
    // Handle send logic here
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Contract</DialogTitle>
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
              <RadioGroupItem value="tenant" id="send-tenant" />
              <Label htmlFor="send-tenant">Contract Tenant</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="tenant-list" id="send-tenant-list" />
              <Label htmlFor="send-tenant-list">Select from Tenant List</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="send-custom" />
              <Label htmlFor="send-custom">Custom Email</Label>
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
                  {tenants?.map((tenant) => (
                    <SelectItem 
                      key={tenant.id} 
                      value={tenant.email || ''}
                    >
                      {tenant.first_name} {tenant.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedEmailOption === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="sendEmail">Custom Email Address</Label>
              <Input
                id="sendEmail"
                type="email"
                placeholder="Enter email address"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend}>
              Send Contract
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
