
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

// Increased cache time to reduce API calls
const METRICS_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

async function fetchServiceProviderMetrics(userId: string): Promise<Metrics> {
  console.log("Fetching service provider metrics for user:", userId);
  
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Fetch all data in a single query with count aggregation
  const { data, error } = await supabase.rpc('get_service_provider_metrics', {
    user_id: userId,
    month_start: firstDayOfMonth.toISOString(),
    month_end: lastDayOfMonth.toISOString()
  });

  if (error) {
    console.error("Error fetching service provider metrics:", error);
    
    // Fallback to traditional queries if the RPC fails
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

  // If the RPC was successful, use its data
  return {
    activeJobs: data.active_jobs || 0,
    completedJobs: data.completed_jobs || 0,
    monthlyEarnings: data.monthly_earnings || 0,
    pendingMaintenance: 0
  };
}

async function fetchLandlordMetrics(userId: string): Promise<Metrics> {
  console.log("Fetching landlord metrics for user:", userId);
  
  // First try to get metrics from the RPC function (which you would need to create)
  try {
    const { data, error } = await supabase.rpc('get_landlord_metrics', { 
      user_id: userId 
    });
    
    if (!error && data) {
      return {
        totalProperties: data.total_properties || 0,
        monthlyRevenue: data.monthly_revenue || 0,
        activeTenants: data.active_tenants || 0,
        pendingMaintenance: data.pending_maintenance || 0,
        revenueDetails: data.revenue_details || []
      };
    }
  } catch (err) {
    console.log("RPC not available, falling back to regular queries");
  }
  
  // Fallback to existing code if RPC fails or doesn't exist
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Use a more efficient SQL join to get all the data in one query
  const { data: propertiesWithTenancies, error } = await supabase
    .from("properties")
    .select(`
      id,
      name,
      monthly_rent,
      tenancies!inner(
        id,
        status,
        start_date,
        end_date,
        tenant_id
      )
    `)
    .eq("landlord_id", userId)
    .eq("tenancies.status", "active");

  if (error) {
    console.error("Error fetching properties:", error);
    throw error;
  }

  if (!propertiesWithTenancies?.length) {
    console.log("No properties with active tenancies found for landlord");
    return {
      totalProperties: 0,
      monthlyRevenue: 0,
      activeTenants: 0,
      pendingMaintenance: 0,
      revenueDetails: []
    };
  }

  const revenueDetails: Array<{ property_name: string; amount: number; due_date: string; status: string }> = [];
  let totalMonthlyRevenue = 0;
  let activeTenanciesCount = 0;

  const propertyIds = propertiesWithTenancies.map(p => p.id);
  const { count: maintenanceCount } = await supabase
    .from("maintenance_requests")
    .select("id", { count: "exact" })
    .eq("status", "pending")
    .in("property_id", propertyIds);

  // Get all payments in a single query instead of one per property
  const { data: payments } = await supabase
    .from("payments")
    .select(`
      status,
      tenancy_id
    `)
    .in("tenancy_id", propertiesWithTenancies.map(p => p.tenancies[0].id))
    .gte("due_date", firstDayOfMonth.toISOString())
    .lte("due_date", lastDayOfMonth.toISOString());

  // Process properties and payments
  propertiesWithTenancies.forEach(property => {
    totalMonthlyRevenue += Number(property.monthly_rent);
    activeTenanciesCount++;

    const payment = payments?.find(p => p.tenancy_id === property.tenancies[0].id);

    revenueDetails.push({
      property_name: property.name,
      amount: Number(property.monthly_rent),
      due_date: firstDayOfMonth.toISOString(),
      status: payment?.status || "pending"
    });
  });

  return {
    totalProperties: propertiesWithTenancies.length,
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

  // Try to use an RPC for better performance
  try {
    const { data, error } = await supabase.rpc('get_tenant_metrics', { 
      user_id: userId,
      month_start: firstDayOfMonth.toISOString(),
      month_end: lastDayOfMonth.toISOString()
    });
    
    if (!error && data) {
      return {
        totalProperties: data.total_properties || 0,
        pendingMaintenance: data.pending_maintenance || 0,
        paymentStatus: data.payment_status || "No payments",
        revenueDetails: data.revenue_details || []
      };
    }
  } catch (err) {
    console.log("RPC not available, falling back to regular queries");
  }

  // More efficient single query with JOIN to get tenancies
  const { data: tenanciesWithProperties, error: tenancyError } = await supabase
    .from("tenancies")
    .select(`
      id,
      property:properties(id, name, address, monthly_rent)
    `)
    .eq("tenant_id", userId)
    .eq("status", "active");

  if (tenancyError) {
    console.error("Error fetching tenancies:", tenancyError);
    throw tenancyError;
  }

  const tenancyIds = tenanciesWithProperties?.map(t => t.id) || [];
  const propertiesCount = tenanciesWithProperties?.length || 0;

  // Run these queries in parallel for better performance
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
        tenancy_id
      `)
      .in("tenancy_id", tenancyIds)
      .gte("due_date", firstDayOfMonth.toISOString())
      .lte("due_date", lastDayOfMonth.toISOString())
  ]);

  // Map the payment data to properties
  const formattedRevenueDetails = revenueDetails.data?.map(payment => {
    const tenancy = tenanciesWithProperties?.find(t => t.id === payment.tenancy_id);
    return {
      property_name: tenancy?.property?.name || 'Unknown',
      amount: payment.amount,
      due_date: payment.due_date,
      status: payment.status
    };
  }) || [];

  return {
    totalProperties: propertiesCount,
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
    staleTime: METRICS_CACHE_TIME,
    cacheTime: METRICS_CACHE_TIME,
  });
}
