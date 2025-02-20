
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MaintenanceDialog } from "@/components/maintenance/MaintenanceDialog";
import { MaintenanceHeader } from "@/components/maintenance/sections/MaintenanceHeader";
import { MaintenanceSection } from "@/components/maintenance/dashboard/MaintenanceSection";
import { ServiceProviderList } from "@/components/maintenance/ServiceProviderList";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <DashboardSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Role-specific header */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border shadow-sm">
            <div>
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
          </Card>

          {/* Tabs (only for landlord) */}
          {userRole === 'landlord' && (
            <Card className="bg-white/80 backdrop-blur-sm border shadow-sm">
              <Tabs defaultValue="dashboard" className="w-full">
                <div className="p-4 border-b">
                  <TabsList className="w-full">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2 flex-1">
                      <List className="h-4 w-4" />
                      Maintenance Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="providers" className="flex items-center gap-2 flex-1">
                      <Users className="h-4 w-4" />
                      Service Providers
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="dashboard" className="p-6">
                  {/* Action Bar */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 flex gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          placeholder="Search requests..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9"
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
                  <div className="grid grid-cols-1 gap-6">
                    <MaintenanceSection
                      title="Maintenance Requests"
                      description="Manage and monitor all property maintenance requests"
                      requests={filteredRequests}
                      onRequestClick={handleRequestClick}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="providers" className="p-6">
                  <ServiceProviderList />
                </TabsContent>
              </Tabs>
            </Card>
          )}

          {/* Non-landlord view */}
          {userRole !== 'landlord' && (
            <Card className="p-6 bg-white/80 backdrop-blur-sm border shadow-sm">
              {/* Action Bar */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                {userRole === 'tenant' && (
                  <Button onClick={handleNewRequest} className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    New Maintenance Request
                  </Button>
                )}
                
                <div className="flex-1 flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search requests..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9"
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
              <div className="grid grid-cols-1 gap-6">
                <MaintenanceSection
                  title="Maintenance Requests"
                  description={
                    userRole === 'tenant' 
                      ? "Track the status of your maintenance requests"
                      : "Your assigned maintenance tasks"
                  }
                  requests={filteredRequests}
                  onRequestClick={handleRequestClick}
                />
              </div>
            </Card>
          )}

          {/* Maintenance Request Dialog */}
          <MaintenanceDialog
            open={isDialogOpen}
            onOpenChange={handleDialogChange}
            requestId={selectedRequestId}
          />
        </div>
      </main>
    </div>
  );
}
