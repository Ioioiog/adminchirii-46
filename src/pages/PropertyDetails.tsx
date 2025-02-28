
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, User, Receipt, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PropertyStatus } from "@/utils/propertyUtils";
import { useToast } from "@/hooks/use-toast";
import { InvoiceSettings } from "@/types/invoice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyTab } from "@/components/properties/tabs/PropertyTab";
import { TenantsTab } from "@/components/properties/tabs/TenantsTab";
import { InvoiceSettingsTab } from "@/components/properties/tabs/InvoiceSettingsTab";
import { NavigationTabs } from "@/components/layout/NavigationTabs";
import { LandlordTab } from "@/components/properties/tabs/LandlordTab";

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("property");
  const [userId, setUserId] = useState<string | null>(null);
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
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUserId();
  }, []);

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
      
      // Add the missing properties required by the Property type
      const propertyWithStatus = {
        ...data,
        status: data.tenancies?.some((t: any) => t.status === 'active') ? 'occupied' : 'vacant',
        tenant_count: data.tenancies?.filter((t: any) => t.status === 'active').length || 0
      };
      
      return propertyWithStatus;
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

  const tabs = [
    { id: "property", label: "Property Details", icon: Home, showForTenant: true },
    { id: "tenants", label: "Tenants", icon: User, showForTenant: false },
    { id: "invoice", label: "Invoice Settings", icon: Receipt, showForTenant: false },
    { id: "landlord", label: "Landlord", icon: UserCircle, showForTenant: true },
  ];

  const activeTenants = property.tenancies?.filter((t: any) => t.status === 'active') || [];

  if (!userId) {
    return null; // or some loading/error state
  }

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/properties")}
              className="rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-soft-xl">
            <NavigationTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            <div className="p-8">
              {activeTab === "property" && (
                <PropertyTab
                  property={property}
                  isEditing={isEditing}
                  editedData={editedData}
                  setEditedData={setEditedData}
                  handleEdit={handleEdit}
                  handleCancel={handleCancel}
                  handleSave={handleSave}
                  getStatusColor={getStatusColor}
                />
              )}
              {activeTab === "tenants" && (
                <TenantsTab
                  property={property}
                  activeTenants={activeTenants}
                />
              )}
              {activeTab === "invoice" && (
                <InvoiceSettingsTab
                  propertyId={id || ''}
                  userId={userId}
                />
              )}
              {activeTab === "landlord" && (
                <LandlordTab propertyId={id || ''} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PropertyDetails;
