
import React, { useEffect, useState } from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { FormData } from "@/types/contract";
import { Json } from "@/integrations/supabase/types/json";

interface InvoiceSettings {
  apply_vat: boolean;
  auto_generate: boolean;
  generate_day: number;
  company_name: string;
  company_address: string;
  bank_name: string;
  bank_account_number: string;
  additional_notes: string;
  tenant_company_name: string;
  tenant_company_address: string;
  tenant_registration_number: string;
  tenant_vat_number: string;
  [key: string]: string | number | boolean; // Add index signature for Json compatibility
}

interface InvoiceSettingsTabProps {
  propertyId: string;
  userId: string;
}

export function InvoiceSettingsTab({ propertyId, userId }: InvoiceSettingsTabProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<InvoiceSettings>({
    apply_vat: false,
    auto_generate: false,
    generate_day: 1,
    company_name: '',
    company_address: '',
    bank_name: '',
    bank_account_number: '',
    additional_notes: '',
    tenant_company_name: '',
    tenant_company_address: '',
    tenant_registration_number: '',
    tenant_vat_number: '',
  });

  // Fetch existing contract for the property
  const { data: contract } = useQuery({
    queryKey: ['contract', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('metadata')
        .eq('property_id', propertyId)
        .eq('status', 'signed')
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      if (error) throw error;
      
      // Safe type casting
      const metadata = data?.metadata as { [key: string]: any } | null;
      if (!metadata) return null;
      
      return {
        tenantName: metadata.tenantName as string,
        tenantAddress: metadata.tenantAddress as string,
        tenantReg: metadata.tenantReg as string,
        tenantFiscal: metadata.tenantFiscal as string,
      };
    }
  });

  // Fetch existing invoice settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('invoice_info')
        .eq('id', userId)
        .single();

      if (profile?.invoice_info) {
        // Safe type casting of invoice_info
        const invoiceInfo = profile.invoice_info as { [key: string]: any };
        setSettings(prevSettings => ({
          ...prevSettings,
          apply_vat: Boolean(invoiceInfo.apply_vat),
          auto_generate: Boolean(invoiceInfo.auto_generate),
          generate_day: Number(invoiceInfo.generate_day) || 1,
          company_name: String(invoiceInfo.company_name || ''),
          company_address: String(invoiceInfo.company_address || ''),
          bank_name: String(invoiceInfo.bank_name || ''),
          bank_account_number: String(invoiceInfo.bank_account_number || ''),
          additional_notes: String(invoiceInfo.additional_notes || ''),
          tenant_company_name: String(invoiceInfo.tenant_company_name || ''),
          tenant_company_address: String(invoiceInfo.tenant_company_address || ''),
          tenant_registration_number: String(invoiceInfo.tenant_registration_number || ''),
          tenant_vat_number: String(invoiceInfo.tenant_vat_number || ''),
        }));
      }
    };

    fetchSettings();
  }, [userId]);

  // Update settings when contract is loaded
  useEffect(() => {
    if (contract) {
      setSettings(prevSettings => ({
        ...prevSettings,
        tenant_company_name: contract.tenantName || '',
        tenant_company_address: contract.tenantAddress || '',
        tenant_registration_number: contract.tenantReg || '',
        tenant_vat_number: contract.tenantFiscal || '',
      }));
    }
  }, [contract]);

  const handleSave = async () => {
    try {
      // Convert settings to a JSON-compatible object
      const jsonSettings: { [key: string]: Json } = {
        apply_vat: settings.apply_vat,
        auto_generate: settings.auto_generate,
        generate_day: settings.generate_day,
        company_name: settings.company_name,
        company_address: settings.company_address,
        bank_name: settings.bank_name,
        bank_account_number: settings.bank_account_number,
        additional_notes: settings.additional_notes,
        tenant_company_name: settings.tenant_company_name,
        tenant_company_address: settings.tenant_company_address,
        tenant_registration_number: settings.tenant_registration_number,
        tenant_vat_number: settings.tenant_vat_number,
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          invoice_info: jsonSettings
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice settings updated successfully"
      });
    } catch (error) {
      console.error('Error saving invoice settings:', error);
      toast({
        title: "Error",
        description: "Failed to save invoice settings",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Settings</CardTitle>
          <CardDescription>Configure your invoice generation preferences</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="apply_vat">Apply VAT</Label>
              <Switch
                id="apply_vat"
                checked={settings.apply_vat}
                onCheckedChange={(checked) => setSettings({ ...settings, apply_vat: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto_generate">Auto Generate Invoices</Label>
              <Switch
                id="auto_generate"
                checked={settings.auto_generate}
                onCheckedChange={(checked) => setSettings({ ...settings, auto_generate: checked })}
              />
            </div>
            <div>
              <Label htmlFor="generate_day">Generate On Day</Label>
              <Input
                id="generate_day"
                type="number"
                min="1"
                max="28"
                value={settings.generate_day}
                onChange={(e) => setSettings({ ...settings, generate_day: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-4 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="company_address">Company Address</Label>
              <Input
                id="company_address"
                value={settings.company_address}
                onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                value={settings.bank_name}
                onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bank_account_number">Bank Account Number</Label>
              <Input
                id="bank_account_number"
                value={settings.bank_account_number}
                onChange={(e) => setSettings({ ...settings, bank_account_number: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Information</CardTitle>
          <CardDescription>This information will appear on the generated invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tenant_company_name">Tenant Company Name</Label>
            <Input
              id="tenant_company_name"
              value={settings.tenant_company_name}
              onChange={(e) => setSettings({ ...settings, tenant_company_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="tenant_company_address">Tenant Company Address</Label>
            <Input
              id="tenant_company_address"
              value={settings.tenant_company_address}
              onChange={(e) => setSettings({ ...settings, tenant_company_address: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="tenant_registration_number">Tenant Registration Number</Label>
            <Input
              id="tenant_registration_number"
              value={settings.tenant_registration_number}
              onChange={(e) => setSettings({ ...settings, tenant_registration_number: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="tenant_vat_number">Tenant VAT Number</Label>
            <Input
              id="tenant_vat_number"
              value={settings.tenant_vat_number}
              onChange={(e) => setSettings({ ...settings, tenant_vat_number: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  );
}
