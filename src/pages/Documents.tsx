
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Grid, List, Plus, FileText, Files } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentDialog } from "@/components/documents/DocumentDialog";
import { DocumentType } from "@/integrations/supabase/types/document-types";
import { DocumentFilters } from "@/components/documents/DocumentFilters";
import { useQuery } from "@tanstack/react-query";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  const [activeTab, setActiveTab] = useState<"documents" | "contracts">("documents");

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

  const navigationItems = [
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
    },
    {
      id: 'contracts',
      label: 'Contracts',
      icon: Files,
    },
  ];

  const handleContractsTab = () => {
    navigate('/contracts');
  };

  if (!userId || !userRole) return null;

  return (
    <div className="flex bg-dashboard-background min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <header className="flex justify-between items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-xl">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-semibold text-gray-900">Document Management</h1>
                </div>
                <p className="text-gray-500 max-w-2xl">
                  Manage and view your property-related documents and contracts.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "grid" | "list")}>
                  <ToggleGroupItem value="grid" aria-label="Grid view">
                    <Grid className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="List view">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
                {userRole === "landlord" && (
                  <Button 
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Upload Document
                  </Button>
                )}
              </div>
            </header>
          </div>

          <Card className="p-4 bg-white shadow-sm">
            <div className="flex gap-4 overflow-x-auto">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? 'default' : 'ghost'}
                  className={cn(
                    "flex-shrink-0 gap-2 transition-all duration-200",
                    activeTab === item.id && "bg-primary text-primary-foreground shadow-sm"
                  )}
                  onClick={() => {
                    if (item.id === 'contracts') {
                      handleContractsTab();
                    } else {
                      setActiveTab(item.id as "documents" | "contracts");
                    }
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </div>
          </Card>

          <div className="bg-white rounded-lg shadow-sm p-6">
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
