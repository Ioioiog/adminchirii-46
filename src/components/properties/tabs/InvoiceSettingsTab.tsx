
import React from "react";
import { Building2, MapPin, CreditCard, Receipt, Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { InvoiceSettings } from "@/types/invoice";

interface InvoiceSettingsTabProps {
  invoiceSettings: InvoiceSettings;
  handleInvoiceSettingChange: (updates: Partial<InvoiceSettings>) => Promise<void>;
  property: any;
}

export function InvoiceSettingsTab({
  invoiceSettings,
  handleInvoiceSettingChange,
  property,
}: InvoiceSettingsTabProps) {
  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Invoice Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure how invoices are handled for this property
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">Monthly Rent</h3>
              <p className="text-2xl font-semibold mt-1">
                ${property?.monthly_rent?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Calculator className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Apply VAT (19%)</h3>
                <Switch
                  checked={invoiceSettings.apply_vat}
                  onCheckedChange={(checked) => handleInvoiceSettingChange({ apply_vat: checked })}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {invoiceSettings.apply_vat ? "VAT will be added" : "No VAT applied"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Auto-Generate</h3>
                <Switch
                  checked={invoiceSettings.auto_generate}
                  onCheckedChange={(checked) => handleInvoiceSettingChange({ auto_generate: checked })}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {invoiceSettings.auto_generate ? "Invoices generate automatically" : "Manual generation"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {invoiceSettings.auto_generate && (
        <div className="mt-6 space-y-4">
          <div className="max-w-xs">
            <label htmlFor="generate_day" className="block text-sm font-medium text-gray-700 mb-1">
              Generation Day
            </label>
            <Input
              id="generate_day"
              type="number"
              min={1}
              max={28}
              value={invoiceSettings.generate_day}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 1 && value <= 28) {
                  handleInvoiceSettingChange({ generate_day: value });
                }
              }}
              className="w-full"
              placeholder="Enter day (1-28)"
            />
            <p className="text-sm text-gray-500 mt-1">
              Select the day of the month when invoices should be generated (1-28)
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information for Invoices</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <Input
                  id="company_name"
                  value={invoiceSettings.company_name || ''}
                  onChange={(e) => handleInvoiceSettingChange({ company_name: e.target.value })}
                  placeholder="Enter company name"
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="company_address" className="block text-sm font-medium text-gray-700 mb-1">
                Company Address
              </label>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-2" />
                <Textarea
                  id="company_address"
                  value={invoiceSettings.company_address || ''}
                  onChange={(e) => handleInvoiceSettingChange({ company_address: e.target.value })}
                  placeholder="Enter company address"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <Input
                  id="bank_name"
                  value={invoiceSettings.bank_name || ''}
                  onChange={(e) => handleInvoiceSettingChange({ bank_name: e.target.value })}
                  placeholder="Enter bank name"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bank_account_number" className="block text-sm font-medium text-gray-700 mb-1">
                Bank Account Number
              </label>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <Input
                  id="bank_account_number"
                  value={invoiceSettings.bank_account_number || ''}
                  onChange={(e) => handleInvoiceSettingChange({ bank_account_number: e.target.value })}
                  placeholder="Enter bank account number"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label htmlFor="additional_notes" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <Textarea
                id="additional_notes"
                value={invoiceSettings.additional_notes || ''}
                onChange={(e) => handleInvoiceSettingChange({ additional_notes: e.target.value })}
                placeholder="Enter any additional information to appear on invoices"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>
          {invoiceSettings.auto_generate 
            ? `Invoices are generated on day ${invoiceSettings.generate_day} of each month.`
            : "Automatic invoice generation is disabled."
          }
          VAT is {invoiceSettings.apply_vat ? "applied at 19%" : "not applied"} to the rent amount.
        </p>
      </div>
    </div>
  );
}
