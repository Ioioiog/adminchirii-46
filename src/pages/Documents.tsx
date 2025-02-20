
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, List, Plus, FileText, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentDialog } from "@/components/documents/DocumentDialog";
import { DocumentType } from "@/integrations/supabase/types/document-types";
import { DocumentFilters } from "@/components/documents/DocumentFilters";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { NavigationTabs } from "@/components/layout/NavigationTabs";

const Documents = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"landlord" | "tenant" | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | DocumentType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [activeTab, setActiveTab] = useState("documents");

  const { data: properties } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name");
      
      if (error) throw error;
      return data;
    },
    enabled: userRole === "landlord"
  });

  const { data: contracts } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          id,
          contract_type,
          status,
          valid_from,
          valid_until,
          properties(name)
        `);
      
      if (error) throw error;
      return data;
    },
    enabled: userRole === "landlord"
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("No active session found, redirecting to auth");
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.role) {
        setUserRole(profile.role as "landlord" | "tenant");
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Documents page auth state changed:", event);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  if (!userId || !userRole) return null;

  const navigationItems = [
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
    },
    {
      id: 'contracts',
      label: 'Contracts',
      icon: CreditCard,
    },
  ];

  const renderSection = () => {
    switch (activeTab) {
      case 'documents':
        return (
          <div className="space-y-4">
            <DocumentFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              propertyFilter={propertyFilter}
              setPropertyFilter={setPropertyFilter}
              properties={properties}
            />
            <DocumentList 
              userId={userId} 
              userRole={userRole}
              propertyFilter={propertyFilter}
              typeFilter={typeFilter}
              searchTerm={searchTerm}
              viewMode={viewMode}
            />
          </div>
        );
      case 'contracts':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contracts?.map((contract) => (
              <Card key={contract.id} className="p-4">
                <h3 className="font-medium">{contract.properties?.name || 'Untitled Property'}</h3>
                <p className="text-sm text-gray-500 capitalize">{contract.contract_type}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    contract.status === 'signed' ? 'bg-green-100 text-green-800' :
                    contract.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {contract.status}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <NavigationTabs
            tabs={navigationItems}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id)}
          />
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-semibold">Documents</h1>
                </div>
                <p className="text-gray-500">
                  Manage and track all your property-related documents and contracts.
                </p>
              </div>

              {userRole === "landlord" && (
                <div className="flex gap-2">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Contract
                  </Button>
                  {activeTab === "contracts" && (
                    <Button 
                      onClick={() => navigate("/generate-contract")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Contract
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-6">
              {renderSection()}
            </div>
          </div>
        </div>
      </main>

      <DocumentDialog
        open={showAddModal}
        onOpenChange={setShowAddModal}
        userId={userId}
        userRole={userRole}
      />
    </div>
  );
};

export default Documents;
