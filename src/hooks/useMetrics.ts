
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

// Type definition for service provider metrics response
interface ServiceProviderMetricsResponse {
  active_jobs: number;
  completed_jobs: number;
  monthly_earnings: number;
}

// Type definition for landlord metrics response
interface LandlordMetricsResponse {
  total_properties: number;
  monthly_revenue: number;
  active_tenants: number;
  pending_maintenance: number;
  revenue_details: Array<{
    property_name: string;
    amount: number;
    due_date: string;
    status: string;
  }>;
}

// Type definition for tenant metrics response
interface TenantMetricsResponse {
  total_properties: number;
  pending_maintenance: number;
  payment_status: string;
  revenue_details: Array<{
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

  // Use a traditional query approach instead of the RPC since it's not in the database types
  const activeJobsPromise = supabase
    .from("maintenance_requests")
    .select("id", { count: "exact" })
    .eq("assigned_to", userId)
    .eq("status", "in_progress");

  const completedJobsPromise = supabase
    .from("maintenance_requests")
    .select("id", { count: "exact" })
    .eq("assigned_to", userId)
    .eq("status", "completed")
    .gte("updated_at", firstDayOfMonth.toISOString())
    .lte("updated_at", lastDayOfMonth.toISOString());

  const earningsPromise = supabase
    .from("maintenance_requests")
    .select("service_provider_fee")
    .eq("assigned_to", userId)
    .eq("status", "completed")
    .gte("updated_at", firstDayOfMonth.toISOString())
    .lte("updated_at", lastDayOfMonth.toISOString());

  const [activeJobs, completedJobs, earnings] = await Promise.all([
    activeJobsPromise,
    completedJobsPromise,
    earningsPromise
  ]);

  const monthlyEarnings = earnings.data?.reduce(
    (sum, job) => sum + (job.service_provider_fee || 0), 
    0
  ) || 0;

  return {
    activeJobs: activeJobs.count || 0,
    completedJobs: completedJobs.count || 0,
    monthlyEarnings: monthlyEarnings,
    pendingMaintenance: 0 // Required by type but not used for service providers
  };
}

async function fetchLandlordMetrics(userId: string): Promise<Metrics> {
  console.log("Fetching landlord metrics for user:", userId);
  
  // Use traditional queries instead of RPC
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
    gcTime: METRICS_CACHE_TIME, // Changed from cacheTime to gcTime for TanStack Query v5
  });
}
