import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MaintenanceDialog } from "@/components/maintenance/MaintenanceDialog";
import { MaintenanceHeader } from "@/components/maintenance/sections/MaintenanceHeader";
import { MaintenanceSection } from "@/components/maintenance/dashboard/MaintenanceSection";
import { ServiceProviderList } from "@/components/maintenance/ServiceProviderList";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { List, Users } from "lucide-react";
import { useAuthState } from "@/hooks/useAuthState";
import { useUserRole } from "@/hooks/use-user-role";

type MaintenanceView = 'dashboard' | 'providers';

export default function Maintenance() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | undefined>();
  const [priority, setPriority] = useState<"all" | "low" | "medium" | "high">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { userRole } = useUserRole();
  const [activeView, setActiveView] = useState<MaintenanceView>('dashboard');
  const { currentUserId } = useAuthState();

  const { data: maintenanceRequests, isLoading } = useQuery({
    queryKey: ["maintenance-requests", priority],
    queryFn: async () => {
      console.log("Fetching maintenance requests with filters:", { 
        priority,
        userRole,
        currentUserId 
      });
      
      let query = supabase
        .from("maintenance_requests")
        .select(`
          *,
          property:properties(name),
          tenant:profiles!maintenance_requests_tenant_id_fkey(
            first_name,
            last_name
          )
        `);

      if (priority !== "all") {
        query = query.eq("priority", priority);
      }

      // Add role-specific filters
      if (userRole === 'tenant') {
        console.log('Adding tenant filter:', currentUserId);
        query = query.eq('tenant_id', currentUserId);
      } else if (userRole === 'service_provider') {
        console.log('Adding service provider filter:', currentUserId);
        query = query.eq('assigned_to', currentUserId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching maintenance requests:", error);
        throw error;
      }
      
      console.log("Fetched maintenance requests:", data);
      return data;
    },
  });

  const filteredRequests = React.useMemo(() => {
    if (!maintenanceRequests) return [];
    
    console.log("Filtering requests with search query:", searchQuery);
    
    return maintenanceRequests.filter(request => 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [maintenanceRequests, searchQuery]);

  const newRequests = filteredRequests.filter(r => r.status === "pending");
  const activeRequests = filteredRequests.filter(r => r.status === "in_progress");
  const completedRequests = filteredRequests.filter(r => r.status === "completed");
  const reviewRequests = filteredRequests.filter(r => 
    r.status !== "cancelled"
  );

  console.log("Filtered requests counts:", {
    new: newRequests.length,
    active: activeRequests.length,
    completed: completedRequests.length,
    review: reviewRequests.length,
    total: filteredRequests.length
  });

  const handleRequestClick = (requestId: string) => {
    console.log("Opening maintenance request:", requestId);
    setSelectedRequestId(requestId);
    setIsDialogOpen(true);
  };

  const handleNewRequest = () => {
    console.log("Creating new maintenance request");
    setSelectedRequestId(undefined);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedRequestId(undefined);
    }
  };

  // Only show navigation items if user is not a service provider
  const navigationItems = userRole !== 'service_provider' ? [
    {
      id: 'dashboard' as MaintenanceView,
      label: 'Property Maintenance Dashboard',
      icon: List,
    },
    {
      id: 'providers' as MaintenanceView,
      label: 'Service Providers List',
      icon: Users,
    },
  ] : [
    {
      id: 'dashboard' as MaintenanceView,
      label: 'Property Maintenance Dashboard',
      icon: List,
    }
  ];

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-8">
          <div className="w-full flex gap-4 bg-card p-4 rounded-lg shadow-sm overflow-x-auto mb-6">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={activeView === item.id ? 'default' : 'ghost'}
                className={cn(
                  "flex-shrink-0 gap-2",
                  activeView === item.id && "bg-primary text-primary-foreground"
                )}
                onClick={() => setActiveView(item.id)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>

          {activeView === 'dashboard' ? (
            <>
              <MaintenanceHeader
                onNewRequest={handleNewRequest}
              />

              <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
                <MaintenanceSection
                  title="Maintenance Requests"
                  description="All maintenance requests"
                  requests={filteredRequests}
                  onRequestClick={handleRequestClick}
                />
              </div>

              <MaintenanceDialog
                open={isDialogOpen}
                onOpenChange={handleDialogChange}
                requestId={selectedRequestId}
              />
            </>
          ) : userRole !== 'service_provider' && (
            <ServiceProviderList />
          )}
        </div>
      </div>
    </div>
  );
}
