
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Metrics {
  totalProperties?: number;
  monthlyRevenue?: number;
  activeTenants?: number;
  pendingMaintenance: number;
  paymentStatus?: string;
  activeJobs?: number;
  completedJobs?: number;
  monthlyEarnings?: number;
  revenueDetails?: Array<{
    property_name: string;
    amount: number;
    due_date: string;
    status: string;
  }>;
}

async function fetchServiceProviderMetrics(userId: string): Promise<Metrics> {
  console.log("Fetching service provider metrics for user:", userId);
  
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const [activeJobs, completedJobs, earnings] = await Promise.all([
    supabase
      .from("maintenance_requests")
      .select("id", { count: "exact" })
      .eq("assigned_to", userId)
      .eq("status", "in_progress"),
    supabase
      .from("maintenance_requests")
      .select("id", { count: "exact" })
      .eq("assigned_to", userId)
      .eq("status", "completed")
      .gte("updated_at", firstDayOfMonth.toISOString())
      .lte("updated_at", lastDayOfMonth.toISOString()),
    supabase
      .from("maintenance_requests")
      .select("service_provider_fee")
      .eq("assigned_to", userId)
      .eq("status", "completed")
      .gte("updated_at", firstDayOfMonth.toISOString())
      .lte("updated_at", lastDayOfMonth.toISOString())
  ]);

  const monthlyEarnings = earnings.data?.reduce((sum, job) => sum + (job.service_provider_fee || 0), 0) || 0;

  return {
    activeJobs: activeJobs.count || 0,
    completedJobs: completedJobs.count || 0,
    monthlyEarnings: monthlyEarnings,
    pendingMaintenance: 0 // Required by type but not used for service providers
  };
}

async function fetchLandlordMetrics(userId: string): Promise<Metrics> {
  console.log("Fetching landlord metrics for user:", userId);
  
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // First get properties with tenancies
  const { data: properties, error } = await supabase
    .from("properties")
    .select(`
      id,
      name,
      monthly_rent,
      tenancies (
        id,
        status,
        start_date,
        end_date,
        tenant_id
      )
    `)
    .eq("landlord_id", userId);

  if (error) {
    console.error("Error fetching properties:", error);
    throw error;
  }

  if (!properties) {
    console.log("No properties found for landlord");
    return {
      totalProperties: 0,
      monthlyRevenue: 0,
      activeTenants: 0,
      pendingMaintenance: 0,
      revenueDetails: []
    };
  }

  console.log("Found properties:", properties);

  const revenueDetails: Array<{ property_name: string; amount: number; due_date: string; status: string }> = [];
  let totalMonthlyRevenue = 0;
  let activeTenanciesCount = 0;

  // Process each property
  for (const property of properties) {
    // Check for active tenancy
    const hasActiveTenancy = property.tenancies?.some(tenancy => 
      tenancy.status === 'active' && 
      new Date(tenancy.start_date) <= currentDate &&
      (!tenancy.end_date || new Date(tenancy.end_date) > currentDate)
    );
    
    if (hasActiveTenancy) {
      totalMonthlyRevenue += Number(property.monthly_rent);
      activeTenanciesCount++;

      // Get payment status for this month
      const activeTenancy = property.tenancies.find(t => t.status === 'active');
      if (activeTenancy) {
        const { data: payment } = await supabase
          .from("payments")
          .select("status")
          .eq("tenancy_id", activeTenancy.id)
          .gte("due_date", firstDayOfMonth.toISOString())
          .lte("due_date", lastDayOfMonth.toISOString())
          .maybeSingle();

        console.log(`Payment status for property ${property.name}:`, payment);

        revenueDetails.push({
          property_name: property.name,
          amount: Number(property.monthly_rent),
          due_date: firstDayOfMonth.toISOString(),
          status: payment?.status || "pending"
        });
      }
    }
  }

  console.log("Calculated metrics:", {
    totalProperties: properties.length,
    monthlyRevenue: totalMonthlyRevenue,
    activeTenants: activeTenanciesCount,
    revenueDetails: revenueDetails
  });

  // Get pending maintenance count
  const propertyIds = properties.map(p => p.id);
  const { count: maintenanceCount } = await supabase
    .from("maintenance_requests")
    .select("id", { count: "exact" })
    .eq("status", "pending")
    .in("property_id", propertyIds);

  return {
    totalProperties: properties.length,
    monthlyRevenue: totalMonthlyRevenue,
    activeTenants: activeTenanciesCount,
    pendingMaintenance: maintenanceCount || 0,
    revenueDetails: revenueDetails
  };
}

async function fetchTenantMetrics(userId: string): Promise<Metrics> {
  console.log("Fetching tenant metrics for user:", userId);
  
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const { count: propertiesCount, error: tenancyError } = await supabase
    .from("tenancies")
    .select("id", { count: "exact" })
    .eq("tenant_id", userId)
    .eq("status", "active");

  if (tenancyError) {
    console.error("Error fetching tenancies:", tenancyError);
    throw tenancyError;
  }

  const { data: tenancies } = await supabase
    .from("tenancies")
    .select("id, property:properties(id, name, monthly_rent)")
    .eq("tenant_id", userId)
    .eq("status", "active");

  const tenancyIds = tenancies?.map(t => t.id) || [];

  const [maintenanceCount, latestPayment, revenueDetails] = await Promise.all([
    supabase
      .from("maintenance_requests")
      .select("id", { count: "exact" })
      .eq("tenant_id", userId)
      .eq("status", "pending"),
    supabase
      .from("payments")
      .select("status")
      .in("tenancy_id", tenancyIds)
      .order("due_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("payments")
      .select(`
        amount,
        due_date,
        status,
        tenancy:tenancies(
          property:properties(name)
        )
      `)
      .in("tenancy_id", tenancyIds)
      .gte("due_date", firstDayOfMonth.toISOString())
      .lte("due_date", lastDayOfMonth.toISOString())
  ]);

  const formattedRevenueDetails = revenueDetails.data?.map(payment => ({
    property_name: payment.tenancy.property.name,
    amount: payment.amount,
    due_date: payment.due_date,
    status: payment.status
  })) || [];

  return {
    totalProperties: propertiesCount || 0,
    pendingMaintenance: maintenanceCount.count || 0,
    paymentStatus: latestPayment.data?.status || "No payments",
    revenueDetails: formattedRevenueDetails
  };
}

export function useMetrics(userId: string, userRole: "landlord" | "tenant" | "service_provider") {
  return useQuery({
    queryKey: ["dashboard-metrics", userId, userRole],
    queryFn: () => {
      switch (userRole) {
        case "landlord":
          return fetchLandlordMetrics(userId);
        case "tenant":
          return fetchTenantMetrics(userId);
        case "service_provider":
          return fetchServiceProviderMetrics(userId);
      }
    },
  });
}
