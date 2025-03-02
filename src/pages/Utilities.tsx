import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Gauge, Plug, Building2, FileSpreadsheet } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { UtilityDialog } from "@/components/utilities/UtilityDialog";
import { UtilityList } from "@/components/utilities/UtilityList";
import { MeterReadingDialog } from "@/components/meter-readings/MeterReadingDialog";
import { MeterReadingList } from "@/components/meter-readings/MeterReadingList";
import { useProperties } from "@/hooks/useProperties";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProviderList } from "@/components/utilities/providers/ProviderList";
import { ProviderForm } from "@/components/utilities/providers/ProviderForm";
import { useToast } from "@/hooks/use-toast";
import { UtilityFilters } from "@/components/utilities/UtilityFilters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type UtilitiesSection = 'bills' | 'readings' | 'providers';

interface UtilityWithProperty {
  id: string;
  property_id: string;
  type: string;
  amount: number;
  due_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  currency: string;
  issued_date: string | null;
  invoice_number: string | null;
  utility_provider_id: string | null;
  property?: {
    name: string;
    address: string;
  };
}

const Utilities = () => {
  const [activeSection, setActiveSection] = useState<UtilitiesSection>('bills');
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [showCsvImporter, setShowCsvImporter] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { userRole } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { properties, isLoading: propertiesLoading } = useProperties({
    userRole: userRole === "landlord" || userRole === "tenant" ? userRole : "tenant"
  });

  const { data: utilities = [], isLoading: utilitiesLoading } = useQuery({
    queryKey: ['utilities'],
    queryFn: async () => {
      console.log('Fetching utilities...');
      const { data, error } = await supabase
        .from('utilities')
        .select(`
          *,
          property:properties (
            name,
            address
          )
        `);
      if (error) {
        console.error('Error fetching utilities:', error);
        throw error;
      }
      console.log('Fetched utilities:', data);
      return data as UtilityWithProperty[];
    },
    enabled: !!userRole
  });

  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ["utility-providers"],
    queryFn: async () => {
      console.log("Fetching utility providers");
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error("Error fetching user:", userError);
          throw userError;
        }
        
        if (!userData.user) {
          console.error("No authenticated user found");
          return [];
        }
        
        const { data, error } = await supabase.from("utility_provider_credentials").select(`
            *,
            property:properties (
              name,
              address
            )
          `).eq("landlord_id", userData.user.id);
          
        if (error) {
          console.error("Error fetching providers:", error);
          throw error;
        }
        
        console.log("Fetched providers:", data);
        return data;
      } catch (error) {
        console.error("Error in utility providers query:", error);
        return [];
      }
    }
  });

  const filteredUtilities = utilities.filter((utility) => {
    const matchesSearch = 
      searchTerm === "" || 
      utility.property?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      utility.property?.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      utility.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || utility.status === statusFilter;
    const matchesType = typeFilter === "all" || utility.type === typeFilter;
    const matchesProperty = propertyFilter === "all" || utility.property_id === propertyFilter;

    return matchesSearch && matchesStatus && matchesType && matchesProperty;
  });

  const handleDeleteProvider = async (id: string) => {
    try {
      console.log("Deleting utility provider:", id);
      const { data: scrapingData, error: scrapingJobsError } = await supabase.from("scraping_jobs").delete().eq("utility_provider_id", id).select();
      console.log("Scraping jobs deletion result:", { scrapingData, scrapingJobsError });
      if (scrapingJobsError) {
        console.error("Error deleting scraping jobs:", scrapingJobsError);
        throw scrapingJobsError;
      }
      const { data: providerData, error: providerError } = await supabase.from("utility_provider_credentials").delete().eq("id", id).select();
      console.log("Provider deletion result:", { providerData, providerError });
      if (providerError) {
        console.error("Error deleting provider:", providerError);
        throw providerError;
      }
      toast({
        title: "Success",
        description: "Utility provider deleted successfully"
      });
      await queryClient.invalidateQueries({ queryKey: ["utility-providers"] });
      await queryClient.refetchQueries({ queryKey: ["utility-providers"] });
    } catch (error) {
      console.error("Error in delete operation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete utility provider. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditProvider = (provider: any) => {
    setEditingProvider(provider);
    setShowProviderForm(true);
  };

  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setCsvFile(files[0]);
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      toast({
        title: "Error",
        description: "Please select a CSV file first",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csv = e.target?.result as string;
        if (!csv) {
          throw new Error("Failed to read CSV file");
        }

        // Parse CSV
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Expected headers: property_id,type,amount,currency,due_date,issued_date,invoice_number
        const requiredHeaders = ['property_id', 'type', 'amount', 'due_date'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          throw new Error(`CSV is missing required headers: ${missingHeaders.join(', ')}`);
        }

        const utilityBills = [];
        
        // Process each line
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim());
          const bill: any = {};
          
          headers.forEach((header, index) => {
            bill[header] = values[index] || null;
          });
          
          // Validate required fields
          if (!bill.property_id || !bill.type || !bill.amount || !bill.due_date) {
            continue; // Skip incomplete rows
          }
          
          // Convert amount to number
          bill.amount = parseFloat(bill.amount);
          
          // Set default status
          bill.status = 'pending';
          
          utilityBills.push(bill);
        }
        
        if (utilityBills.length === 0) {
          throw new Error("No valid utility bills found in CSV");
        }
        
        // Insert bills into database
        const { data, error } = await supabase
          .from('utilities')
          .insert(utilityBills)
          .select();
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: `Imported ${utilityBills.length} utility bills successfully`
        });
        
        // Refresh the list
        queryClient.invalidateQueries({ queryKey: ['utilities'] });
        
        // Close the dialog and reset state
        setShowCsvImporter(false);
        setCsvFile(null);
      };
      
      reader.readAsText(csvFile);
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to import utility bills",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (!userRole || userRole === "service_provider") {
    return <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
        <p>This page is only available for landlords and tenants.</p>
      </div>
    </div>;
  }

  const navigationItems = [
    {
      id: 'bills' as UtilitiesSection,
      label: 'Utility Bills',
      icon: Plug
    },
    {
      id: 'readings' as UtilitiesSection,
      label: 'Meter Readings',
      icon: Gauge
    },
    ...(userRole === 'landlord' ? [{
      id: 'providers' as UtilitiesSection,
      label: 'Utility Providers',
      icon: Building2,
      hideForRole: 'tenant'
    }] : [])
  ];

  const renderSection = () => {
    if (userRole !== "landlord" && userRole !== "tenant") return null;
    switch (activeSection) {
      case 'bills':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600/10 rounded-xl">
                    <Plug className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Utilities</CardTitle>
                    <p className="text-gray-500 mt-1">
                      Manage and track utility services for your properties.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {userRole === "landlord" && properties && (
                  <>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setShowCsvImporter(true)}
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Import CSV
                    </Button>
                    <UtilityDialog properties={properties} onUtilityCreated={() => {}} />
                  </>
                )}
              </div>
            </div>

            <UtilityFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              typeFilter={typeFilter}
              onTypeChange={setTypeFilter}
              propertyFilter={propertyFilter}
              onPropertyChange={setPropertyFilter}
              properties={properties || []}
            />

            <UtilityList 
              utilities={filteredUtilities}
              userRole={userRole}
              onStatusUpdate={() => {}}
            />

            {/* CSV Import Dialog */}
            <Dialog open={showCsvImporter} onOpenChange={setShowCsvImporter}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Import Utility Bills from CSV</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file with utility bill data. The CSV must include these headers: property_id, type, amount, due_date
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="csvFile">
                      CSV File
                    </label>
                    <input
                      id="csvFile"
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileChange}
                      className="cursor-pointer rounded-md border border-input bg-transparent px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
                    />
                  </div>

                  <div className="pt-2">
                    <Button 
                      onClick={handleCsvImport} 
                      disabled={!csvFile || isImporting}
                      className="w-full"
                    >
                      {isImporting ? "Importing..." : "Import Utility Bills"}
                    </Button>

                    <div className="mt-4 text-xs text-gray-500">
                      <p className="font-semibold">CSV Format Example:</p>
                      <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        property_id,type,amount,currency,due_date,issued_date,invoice_number{"\n"}
                        uuid-here,Electricity,150.50,USD,2023-11-15,2023-10-15,INV-12345
                      </pre>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );
      case 'readings':
        return <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600/10 rounded-xl">
                    <Gauge className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Meter Readings</CardTitle>
                    <p className="text-gray-500 mt-1">
                      Track and manage utility meter readings for your properties.
                    </p>
                  </div>
                </div>
              </div>
              <MeterReadingDialog properties={properties} onReadingCreated={() => {}} userRole={userRole} userId={null} />
            </div>
            <MeterReadingList readings={[]} userRole={userRole} onUpdate={() => {}} />
          </div>;
      case 'providers':
        if (userRole !== 'landlord') return null;
        return <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600/10 rounded-xl">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Utility Providers</CardTitle>
                    <p className="text-gray-500 mt-1">
                      Manage your utility provider connections and automated bill fetching.
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={() => setShowProviderForm(true)} disabled={showProviderForm} className="bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                Add Provider
              </Button>
            </div>
            {showProviderForm ? (
              <ProviderForm 
                landlordId={userRole === 'landlord' ? (supabase.auth.getUser() || {}).data?.user?.id || '' : ''} 
                onSubmit={() => {
                  queryClient.invalidateQueries({ queryKey: ["utility-providers"] });
                }}
                onClose={() => {
                  setShowProviderForm(false);
                  setEditingProvider(null);
                }} 
                onSuccess={() => {
                  setShowProviderForm(false);
                  setEditingProvider(null);
                  queryClient.invalidateQueries({ queryKey: ["utility-providers"] });
                }} 
                provider={editingProvider} 
              />
            ) : (
              <ProviderList 
                providers={providers} 
                onDelete={handleDeleteProvider} 
                onEdit={handleEditProvider} 
                isLoading={providersLoading} 
              />
            )}
          </div>;
      default:
        return null;
    }
  };

  if (propertiesLoading) {
    return <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F1F0FB]">
      <DashboardSidebar />
      <div className="flex-1 p-8 bg-zinc-50">
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-white">
            <div className="w-full flex gap-4 overflow-x-auto">
              {navigationItems.map(item => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? 'default' : 'ghost'}
                  className={cn("flex-shrink-0 gap-2", activeSection === item.id && "bg-blue-600 text-white hover:bg-blue-700")}
                  onClick={() => setActiveSection(item.id)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            {renderSection()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Utilities;
