
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useToast } from "@/hooks/use-toast";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentDialog } from "@/components/documents/DocumentDialog";
import { DocumentType } from "@/integrations/supabase/types/document-types";
import { DocumentFilters } from "@/components/documents/DocumentFilters";
import { useQuery } from "@tanstack/react-query";
import { DocumentPageHeader } from "@/components/documents/DocumentPageHeader";
import { useDocuments } from "@/hooks/useDocuments";

function Documents() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"landlord" | "tenant" | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | DocumentType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Fetch properties data
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

  // Use our custom hook for document operations
  const { 
    contracts, 
    isLoadingContracts, 
    deleteContractMutation,
    handleGeneratePDF,
    handleDownloadDocument
  } = useDocuments(userId, userRole);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log("No active session found, redirecting to auth");
          navigate("/auth");
          return;
        }
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, email")
          .eq("id", session.user.id)
          .maybeSingle();
        
        if (profile?.role) {
          setUserRole(profile.role as "landlord" | "tenant");
          console.log("User role set:", profile.role);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive"
        });
      }
    };

    checkUser();
  }, [navigate, toast]);

  if (!userId || !userRole) return null;

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <DocumentPageHeader 
              activeTab="all"
              userRole={userRole}
              onUploadClick={() => setShowAddModal(true)}
            />
            
            <div className="mt-6 space-y-6">
              <DocumentFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                propertyFilter={propertyFilter}
                setPropertyFilter={setPropertyFilter}
                properties={properties}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />
              
              <DocumentList
                userId={userId}
                userRole={userRole}
                propertyFilter={propertyFilter}
                typeFilter={typeFilter}
                searchTerm={searchTerm}
                viewMode={viewMode}
                contracts={contracts}
                isLoadingContracts={isLoadingContracts}
                handleDownloadDocument={handleDownloadDocument}
                handleGeneratePDF={handleGeneratePDF}
                deleteContractMutation={deleteContractMutation}
              />
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
}

export default Documents;
