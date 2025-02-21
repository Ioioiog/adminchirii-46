import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, User, DollarSign, MapPin, Calendar, Edit2, Save, X, CreditCard, Receipt, Calculator, Building, Bank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { PropertyStatus } from "@/utils/propertyUtils";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { InvoiceSettings } from "@/types/invoice";

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    apply_vat: false,
    auto_generate: true,
    generate_day: 1,
    company_name: '',
    company_address: '',
    bank_name: '',
    bank_account_number: '',
    additional_notes: ''
  });

  useEffect(() => {
    const fetchInvoiceSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('invoice_info')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (data?.invoice_info && typeof data.invoice_info === 'object') {
          const info = data.invoice_info as Record<string, any>;
          setInvoiceSettings({
            apply_vat: info.apply_vat || false,
            auto_generate: info.auto_generate || true,
            generate_day: info.generate_day || 1,
            company_name: info.company_name || '',
            company_address: info.company_address || '',
            bank_name: info.bank_name || '',
            bank_account_number: info.bank_account_number || '',
            additional_notes: info.additional_notes || ''
          });
        }
      } catch (error) {
        console.error("Error fetching invoice settings:", error);
      }
    };

    fetchInvoiceSettings();
  }, []);

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          tenancies(
            id,
            status,
            tenant:profiles(
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleEdit = () => {
    setEditedData({
      name: property.name,
      address: property.address,
      type: property.type,
      monthly_rent: property.monthly_rent,
      description: property.description,
      available_from: property.available_from,
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(null);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('properties')
        .update(editedData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Property updated successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["property", id] });
      setIsEditing(false);
      setEditedData(null);
    } catch (error) {
      console.error('Error updating property:', error);
      toast({
        title: "Error",
        description: "Failed to update property",
        variant: "destructive",
      });
    }
  };

  const handleInvoiceSettingChange = async (updates: Partial<InvoiceSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newSettings = { ...invoiceSettings, ...updates };
      
      const { error } = await supabase
        .from('profiles')
        .update({ invoice_info: newSettings })
        .eq('id', user.id);

      if (error) throw error;

      setInvoiceSettings(newSettings);
      toast({
        title: "Success",
        description: "Invoice settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating invoice settings:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice settings",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: PropertyStatus) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'occupied':
        return 'bg-green-100 text-green-800';
      case 'vacant':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex bg-[#F8F9FC] min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex bg-[#F8F9FC] min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center bg-white rounded-xl shadow-soft-xl p-8">
              <h2 className="text-2xl font-medium text-gray-900">Property not found</h2>
              <p className="mt-2 text-gray-600">The property you're looking for doesn't exist.</p>
              <Button
                onClick={() => navigate("/properties")}
                className="mt-6"
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Properties
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const status = property.tenancies?.some(t => t.status === 'active') ? 'occupied' : 'vacant';
  const activeTenants = property.tenancies?.filter(t => t.status === 'active') || [];

  const renderTenantCard = (tenancy: any) => {
    const startDate = tenancy.start_date ? format(new Date(tenancy.start_date), 'PPP') : 'Not specified';
    const endDate = tenancy.end_date ? format(new Date(tenancy.end_date), 'PPP') : 'Ongoing';
    
    return (
      <div key={tenancy.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {tenancy.tenant.first_name} {tenancy.tenant.last_name}
                </h3>
                <p className="text-sm text-gray-500">{tenancy.tenant.email}</p>
              </div>
            </div>
            <Badge variant="secondary" className="rounded-full">
              {tenancy.status}
            </Badge>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Start Date</p>
              <p className="mt-1 text-sm text-gray-900">{startDate}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">End Date</p>
              <p className="mt-1 text-sm text-gray-900">{endDate}</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate(`/tenants/${tenancy.tenant.id}`)}
            >
              View Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate(`/chat?tenantId=${tenancy.tenant.id}`)}
            >
              Message
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="bg-white rounded-xl shadow-soft-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/properties")}
                  className="rounded-lg hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div>
                  {isEditing ? (
                    <Input
                      value={editedData.name}
                      onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                      className="text-3xl font-semibold mb-2 border-none bg-gray-50 focus:ring-2 focus:ring-blue-500/20"
                    />
                  ) : (
                    <h1 className="text-3xl font-semibold text-gray-900 mb-2">{property.name}</h1>
                  )}
                  {isEditing ? (
                    <Input
                      value={editedData.address}
                      onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
                      className="text-gray-600 border-none bg-gray-50 focus:ring-2 focus:ring-blue-500/20"
                    />
                  ) : (
                    <p className="text-gray-600">{property.address}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge className={`${getStatusColor(status)} text-sm px-3 py-1 rounded-full font-medium`}>
                  {status}
                </Badge>
                {isEditing ? (
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={handleCancel} className="rounded-lg">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} className="rounded-lg bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleEdit} className="rounded-lg">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Address</p>
                    {isEditing ? (
                      <Input
                        value={editedData.address}
                        onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
                        className="mt-1 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500/20"
                      />
                    ) : (
                      <p className="text-base text-gray-900 mt-1">{property.address}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <Home className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Property Type</p>
                    {isEditing ? (
                      <select
                        value={editedData.type}
                        onChange={(e) => setEditedData({ ...editedData, type: e.target.value })}
                        className="mt-1 w-full rounded-lg border-gray-200 bg-white focus:ring-2 focus:ring-blue-500/20 text-base"
                      >
                        <option value="Apartment">Apartment</option>
                        <option value="House">House</option>
                        <option value="Condo">Condo</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    ) : (
                      <p className="text-base text-gray-900 mt-1">{property.type}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Monthly Rent</p>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedData.monthly_rent}
                        onChange={(e) => setEditedData({ ...editedData, monthly_rent: parseFloat(e.target.value) })}
                        className="mt-1 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500/20"
                      />
                    ) : (
                      <p className="text-base text-gray-900 mt-1">
                        ${property.monthly_rent?.toLocaleString() || 0}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <User className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Tenants</p>
                    <p className="text-base text-gray-900 mt-1">{activeTenants.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
              {isEditing ? (
                <Textarea
                  value={editedData.description || ''}
                  onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                  className="min-h-[120px] bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500/20 rounded-xl"
                />
              ) : (
                <p className="text-gray-600 leading-relaxed">{property.description || 'No description available.'}</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft-xl overflow-hidden">
            <div className="border-b border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Tenants</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage and view details of all tenants associated with this property
                  </p>
                </div>
                <Button
                  onClick={() => navigate(`/properties/${id}/invite-tenant`)}
                  size="sm"
                  className="rounded-lg"
                >
                  Invite Tenant
                </Button>
              </div>
            </div>
            <div className="p-6">
              {property.tenancies && property.tenancies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {property.tenancies.map((tenancy: any) => renderTenantCard(tenancy))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-gray-900">No Tenants</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by inviting tenants to this property
                  </p>
                  <Button
                    onClick={() => navigate(`/properties/${id}/invite-tenant`)}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Invite Tenant
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft-xl p-8">
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
                      <Building className="h-4 w-4 text-gray-400" />
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
                      <Bank className="h-4 w-4 text-gray-400" />
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
        </div>
      </main>
    </div>
  );
};

export default PropertyDetails;
