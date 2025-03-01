
import React, { useState, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { UtilityList } from "@/components/utilities/UtilityList";
import { UtilityDialog } from "@/components/utilities/UtilityDialog";
import { UtilityFilters } from "@/components/utilities/UtilityFilters";
import { UtilityCostAnalysis } from "@/components/utilities/UtilityCostAnalysis";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "@/hooks/useAuthState";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";

type UtilityType = "all" | "electricity" | "water" | "gas" | "internet" | "building maintenance";
type StatusType = "all" | "pending" | "paid" | "overdue";

export default function Utilities() {
  const [utilityType, setUtilityType] = useState<UtilityType>("all");
  const [status, setStatus] = useState<StatusType>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [utilities, setUtilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentUserId, isAuthenticated } = useAuthState();
  // We need to get userRole from a different way since it's not in useAuthState
  const [userRole, setUserRole] = useState<string>("tenant");

  useEffect(() => {
    if (currentUserId) {
      // Fetch user role
      const fetchUserRole = async () => {
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUserId)
          .single();
          
        if (!error && profileData) {
          setUserRole(profileData.role);
        }
      };
      
      fetchUserRole();
      fetchUtilities();
    }
  }, [currentUserId, utilityType, status, dateRange, activeTab]);

  const fetchUtilities = async () => {
    try {
      setLoading(true);
      let query = supabase.from("utilities").select(`
        *,
        property:properties(name, address)
      `);

      // Apply filters
      if (utilityType !== "all") {
        query = query.eq("type", utilityType);
      }

      if (status !== "all") {
        query = query.eq("status", status);
      }

      if (dateRange?.from) {
        query = query.gte("due_date", format(dateRange.from, "yyyy-MM-dd"));
      }

      if (dateRange?.to) {
        query = query.lte("due_date", format(dateRange.to, "yyyy-MM-dd"));
      }

      // Apply role-based filters
      if (userRole === "landlord") {
        // Get all properties owned by the landlord
        const { data: properties } = await supabase
          .from("properties")
          .select("id")
          .eq("landlord_id", currentUserId);

        if (properties && properties.length > 0) {
          const propertyIds = properties.map((p) => p.id);
          query = query.in("property_id", propertyIds);
        } else {
          // No properties found
          setUtilities([]);
          setLoading(false);
          return;
        }
      } else if (userRole === "tenant") {
        // Get properties rented by the tenant
        const { data: tenancies } = await supabase
          .from("tenancies")
          .select("property_id")
          .eq("tenant_id", currentUserId)
          .eq("status", "active");

        if (tenancies && tenancies.length > 0) {
          const propertyIds = tenancies.map((t) => t.property_id);
          query = query.in("property_id", propertyIds);
        } else {
          // No tenancies found
          setUtilities([]);
          setLoading(false);
          return;
        }
      }

      // Active tab filter
      if (activeTab === "pending") {
        query = query.eq("status", "pending");
      } else if (activeTab === "paid") {
        query = query.eq("status", "paid");
      } else if (activeTab === "overdue") {
        query = query
          .eq("status", "pending")
          .lt("due_date", format(new Date(), "yyyy-MM-dd"));
      }

      const { data, error } = await query;

      if (error) throw error;

      setUtilities(data || []);
    } catch (error) {
      console.error("Error fetching utilities:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load utility bills",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUtility = () => {
    setIsDialogOpen(true);
  };

  const onDialogClose = () => {
    fetchUtilities();
  };

  const getPendingCount = () => {
    return utilities.filter((u) => u.status === "pending").length;
  };

  const getPaidCount = () => {
    return utilities.filter((u) => u.status === "paid").length;
  };

  const getOverdueCount = () => {
    const today = new Date();
    return utilities.filter(
      (u) => u.status === "pending" && new Date(u.due_date) < today
    ).length;
  };

  const handleStatusUpdate = () => {
    fetchUtilities();
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        heading="Utility Bills"
        subheading="Manage and track all your utility bills"
      >
        {userRole === "landlord" && (
          <Button
            className="ml-auto flex items-center gap-2"
            onClick={handleAddUtility}
          >
            <PlusCircle className="h-4 w-4" />
            Add Utility Bill
          </Button>
        )}
      </PageHeader>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="all" className="relative">
              All
            </TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              Pending
              {getPendingCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {getPendingCount()}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="paid" className="relative">
              Paid
              {getPaidCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {getPaidCount()}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="overdue" className="relative">
              Overdue
              {getOverdueCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {getOverdueCount()}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="analysis" className="relative">
              Analysis
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-6">
          <Card className="p-6 bg-white">
            <UtilityFilters
              utilityType={utilityType}
              status={status}
              dateRange={dateRange}
              onUtilityTypeChange={(value) => setUtilityType(value as UtilityType)}
              onStatusChange={(value) => setStatus(value as StatusType)}
              onDateRangeChange={setDateRange}
            />
          </Card>
          <UtilityList 
            utilities={utilities} 
            userRole={userRole as "landlord" | "tenant"} 
            onStatusUpdate={handleStatusUpdate} 
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <Card className="p-6 bg-white">
            <UtilityFilters
              utilityType={utilityType}
              status={status}
              dateRange={dateRange}
              onUtilityTypeChange={(value) => setUtilityType(value as UtilityType)}
              onStatusChange={(value) => setStatus(value as StatusType)}
              onDateRangeChange={setDateRange}
            />
          </Card>
          <UtilityList 
            utilities={utilities} 
            userRole={userRole as "landlord" | "tenant"} 
            onStatusUpdate={handleStatusUpdate} 
          />
        </TabsContent>

        <TabsContent value="paid" className="space-y-6">
          <Card className="p-6 bg-white">
            <UtilityFilters
              utilityType={utilityType}
              status={status}
              dateRange={dateRange}
              onUtilityTypeChange={(value) => setUtilityType(value as UtilityType)}
              onStatusChange={(value) => setStatus(value as StatusType)}
              onDateRangeChange={setDateRange}
            />
          </Card>
          <UtilityList 
            utilities={utilities} 
            userRole={userRole as "landlord" | "tenant"} 
            onStatusUpdate={handleStatusUpdate} 
          />
        </TabsContent>

        <TabsContent value="overdue" className="space-y-6">
          <Card className="p-6 bg-white">
            <UtilityFilters
              utilityType={utilityType}
              status={status}
              dateRange={dateRange}
              onUtilityTypeChange={(value) => setUtilityType(value as UtilityType)}
              onStatusChange={(value) => setStatus(value as StatusType)}
              onDateRangeChange={setDateRange}
            />
          </Card>
          <UtilityList 
            utilities={utilities} 
            userRole={userRole as "landlord" | "tenant"} 
            onStatusUpdate={handleStatusUpdate} 
          />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <UtilityCostAnalysis 
            userId={currentUserId || ''}
            userRole={userRole as "landlord" | "tenant"}
          />
        </TabsContent>
      </Tabs>

      <UtilityDialog
        properties={[]} // This needs to be filled with property data
        onUtilityCreated={onDialogClose}
      />
    </div>
  );
}
