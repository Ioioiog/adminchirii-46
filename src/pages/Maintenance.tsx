
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MaintenanceDialog } from "@/components/maintenance/MaintenanceDialog";
import { MaintenanceHeader } from "@/components/maintenance/sections/MaintenanceHeader";
import { MaintenanceSection } from "@/components/maintenance/dashboard/MaintenanceSection";
import { ServiceProviderList } from "@/components/maintenance/ServiceProviderList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { List, Users, PlusCircle, Search, Filter } from "lucide-react";
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
    return maintenanceRequests.filter(request => 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [maintenanceRequests, searchQuery]);

  const handleRequestClick = (requestId: string) => {
    setSelectedRequestId(requestId);
    setIsDialogOpen(true);
  };

  const handleNewRequest = () => {
    setSelectedRequestId(undefined);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedRequestId(undefined);
    }
  };

  // Only show providers view for landlords
  const navigationItems = userRole === 'landlord' ? [
    {
      id: 'dashboard' as MaintenanceView,
      label: 'Maintenance Dashboard',
      icon: List,
    },
    {
      id: 'providers' as MaintenanceView,
      label: 'Service Providers',
      icon: Users,
    },
  ] : [
    {
      id: 'dashboard' as MaintenanceView,
      label: 'Maintenance Dashboard',
      icon: List,
    }
  ];

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-8">
          {/* Role-specific header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">
              {userRole === 'tenant' && "My Maintenance Requests"}
              {userRole === 'landlord' && "Property Maintenance Management"}
              {userRole === 'service_provider' && "Assigned Maintenance Tasks"}
            </h1>
            <p className="text-muted-foreground">
              {userRole === 'tenant' && "Submit and track your maintenance requests"}
              {userRole === 'landlord' && "Monitor and manage property maintenance"}
              {userRole === 'service_provider' && "View and update your assigned maintenance tasks"}
            </p>
          </div>

          {/* Navigation (only for landlord) */}
          {userRole === 'landlord' && (
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
          )}

          {activeView === 'dashboard' ? (
            <>
              {/* Action Bar */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* New Request Button (only for tenants) */}
                {userRole === 'tenant' && (
                  <Button onClick={handleNewRequest} className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    New Maintenance Request
                  </Button>
                )}
                
                {/* Search and Filter */}
                <div className="flex-1 flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search requests..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                      prefix={<Search className="h-4 w-4 text-muted-foreground" />}
                    />
                  </div>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Maintenance Requests List */}
              <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
                <MaintenanceSection
                  title="Maintenance Requests"
                  description={
                    userRole === 'tenant' 
                      ? "Track the status of your maintenance requests"
                      : userRole === 'landlord'
                      ? "Manage and monitor all property maintenance requests"
                      : "Your assigned maintenance tasks"
                  }
                  requests={filteredRequests}
                  onRequestClick={handleRequestClick}
                />
              </div>

              {/* Maintenance Request Dialog */}
              <MaintenanceDialog
                open={isDialogOpen}
                onOpenChange={handleDialogChange}
                requestId={selectedRequestId}
              />
            </>
          ) : userRole === 'landlord' && (
            <ServiceProviderList />
          )}
        </div>
      </div>
    </div>
  );
}
