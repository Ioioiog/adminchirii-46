import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MaintenanceDialog } from "@/components/maintenance/MaintenanceDialog";
import { MaintenanceSection } from "@/components/maintenance/dashboard/MaintenanceSection";
import { ServiceProviderList } from "@/components/maintenance/ServiceProviderList";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { List, Users, PlusCircle, Search, Filter } from "lucide-react";
import { useAuthState } from "@/hooks/useAuthState";
import { useUserRole } from "@/hooks/use-user-role";
import { cn } from "@/lib/utils";

type MaintenanceView = 'dashboard' | 'providers';

export default function Maintenance() {
  const [activeSection, setActiveSection] = useState<MaintenanceView>('dashboard');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | undefined>();
  const [priority, setPriority] = useState<"all" | "low" | "medium" | "high">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { userRole } = useUserRole();
  const { currentUserId } = useAuthState();

  const {
    data: maintenanceRequests,
    isLoading
  } = useQuery({
    queryKey: ["maintenance-requests", priority],
    queryFn: async () => {
      console.log("Fetching maintenance requests with filters:", {
        priority,
        userRole,
        currentUserId
      });
      let query = supabase.from("maintenance_requests").select(`
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
      const {
        data,
        error
      } = await query;
      if (error) {
        console.error("Error fetching maintenance requests:", error);
        throw error;
      }
      console.log("Fetched maintenance requests:", data);
      return data;
    }
  });

  const filteredRequests = React.useMemo(() => {
    if (!maintenanceRequests) return [];
    return maintenanceRequests.filter(request => request.title.toLowerCase().includes(searchQuery.toLowerCase()) || request.description.toLowerCase().includes(searchQuery.toLowerCase()));
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

  const navigationItems = userRole === 'service_provider' 
    ? [{
        id: 'dashboard' as MaintenanceView,
        label: 'Maintenance Requests',
        icon: List
      }]
    : [{
        id: 'dashboard' as MaintenanceView,
        label: 'Maintenance Requests',
        icon: List
      }, {
        id: 'providers' as MaintenanceView,
        label: 'Service Providers',
        icon: Users
      }];

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm">
                    <List className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900">Maintenance Requests</h2>
                </div>
                <p className="text-sm md:text-base text-gray-500">
                  Manage and track all your property maintenance requests.
                </p>
              </div>
              {userRole === 'tenant' && <Button onClick={handleNewRequest} className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  New Request
                </Button>}
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border shadow-sm">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input placeholder="Search requests..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9" />
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
            </div>
            <MaintenanceSection title="Maintenance Requests" description="Track and manage all maintenance requests for your properties" requests={filteredRequests} onRequestClick={handleRequestClick} />
          </div>;
      case 'providers':
        return <ServiceProviderList />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <DashboardSidebar />
      <main className="flex-1 p-8 overflow-y-auto bg-zinc-50">
        <div className="max-w-7xl mx-auto space-y-8">
          <Card className="p-4 bg-white/80 backdrop-blur-sm border shadow-sm">
            <div className="flex gap-4 overflow-x-auto">
              {navigationItems.map(item => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? 'default' : 'ghost'}
                  className={cn(
                    "flex-shrink-0 gap-2 transition-all duration-200",
                    activeSection === item.id && "bg-primary text-primary-foreground shadow-sm"
                  )}
                  onClick={() => setActiveSection(item.id)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-white/80 backdrop-blur-sm border shadow-sm">
            {renderSection()}
          </Card>

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
