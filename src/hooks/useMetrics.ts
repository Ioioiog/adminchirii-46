
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
const METRICS_CACHE_TIME = 10 * 60 * 1000; // 10 minutes

async function fetchServiceProviderMetrics(userId: string): Promise<Metrics> {
  console.log("Fetching service provider metrics for user:", userId);
  
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Optimize by using a single query with count() and combining related queries
  const { data, error } = await supabase
    .from("maintenance_requests")
    .select(`
      id,
      status,
      updated_at,
      service_provider_fee
    `)
    .eq("assigned_to", userId);
    
  if (error) {
    console.error("Error fetching provider metrics:", error);
    throw error;
  }
  
  // Process the data client-side to reduce database load
  const activeJobs = data?.filter(job => job.status === 'in_progress').length || 0;
  const completedJobs = data?.filter(job => 
    job.status === 'completed' && 
    new Date(job.updated_at) >= firstDayOfMonth && 
    new Date(job.updated_at) <= lastDayOfMonth
  ).length || 0;
  
  const monthlyEarnings = data
    ?.filter(job => 
      job.status === 'completed' && 
      new Date(job.updated_at) >= firstDayOfMonth && 
      new Date(job.updated_at) <= lastDayOfMonth
    )
    .reduce((sum, job) => sum + (job.service_provider_fee || 0), 0) || 0;

  return {
    activeJobs,
    completedJobs,
    monthlyEarnings,
    pendingMaintenance: 0 // Required by type but not used for service providers
  };
}

async function fetchLandlordMetrics(userId: string): Promise<Metrics> {
  console.log("Fetching landlord metrics for user:", userId);
  
  // Use a more efficient approach with fewer queries
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();

  // Get properties with active tenancies and maintenance counts in one query using Postgres CTEs
  const { data, error } = await supabase.rpc('get_dashboard_metrics', { 
    p_user_id: userId, 
    p_first_day_of_month: firstDayOfMonth 
  }).maybeSingle();

  // Fallback to manual queries if RPC is not available
  if (error && error.message.includes('does not exist')) {
    console.log("RPC function not available, using standard queries");
    
    // Get properties with active tenancies in a single query with proper joins
    const { data: propertiesWithTenancies, error: propsError } = await supabase
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

    if (propsError) {
      console.error("Error fetching properties:", propsError);
      throw propsError;
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

    // Get maintenance counts in a single query
    const propertyIds = propertiesWithTenancies.map(p => p.id);
    const { count: maintenanceCount } = await supabase
      .from("maintenance_requests")
      .select("id", { count: "exact" })
      .eq("status", "pending")
      .in("property_id", propertyIds);

    // Get all payments for this month in a single query
    const { data: payments } = await supabase
      .from("payments")
      .select(`
        status,
        tenancy_id
      `)
      .in("tenancy_id", propertiesWithTenancies.map(p => p.tenancies[0].id))
      .gte("due_date", firstDayOfMonth);

    // Calculate totals and build response
    let totalMonthlyRevenue = 0;
    let activeTenanciesCount = 0;
    const revenueDetails = [];

    for (const property of propertiesWithTenancies) {
      totalMonthlyRevenue += Number(property.monthly_rent);
      activeTenanciesCount++;

      const payment = payments?.find(p => p.tenancy_id === property.tenancies[0].id);

      revenueDetails.push({
        property_name: property.name,
        amount: Number(property.monthly_rent),
        due_date: firstDayOfMonth,
        status: payment?.status || "pending"
      });
    }

    return {
      totalProperties: propertiesWithTenancies.length,
      monthlyRevenue: totalMonthlyRevenue,
      activeTenants: activeTenanciesCount,
      pendingMaintenance: maintenanceCount || 0,
      revenueDetails: revenueDetails
    };
  }
  
  // If RPC was successful, use its data
  return {
    totalProperties: data?.total_properties || 0,
    monthlyRevenue: data?.monthly_revenue || 0,
    activeTenants: data?.active_tenants || 0,
    pendingMaintenance: data?.pending_maintenance || 0,
    revenueDetails: data?.revenue_details || []
  };
}

async function fetchTenantMetrics(userId: string): Promise<Metrics> {
  console.log("Fetching tenant metrics for user:", userId);
  
  if (!userId) return { pendingMaintenance: 0 };
  
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();

  // Optimize by doing parallel queries - this is more efficient than sequential
  const [tenanciesPromise, maintenancePromise, paymentsPromise] = await Promise.all([
    supabase
      .from("tenancies")
      .select(`
        id,
        property:properties(id, name, address, monthly_rent)
      `)
      .eq("tenant_id", userId)
      .eq("status", "active"),
      
    supabase
      .from("maintenance_requests")
      .select("id", { count: "exact" })
      .eq("tenant_id", userId)
      .eq("status", "pending"),
      
    supabase
      .from("payments")
      .select(`
        status
      `)
      .order("due_date", { ascending: false })
      .limit(1)
  ]);

  const { data: tenanciesWithProperties, error: tenancyError } = tenanciesPromise;
  const { count: maintenanceCount, error: maintenanceError } = maintenancePromise;
  const { data: latestPaymentData, error: paymentsError } = paymentsPromise;

  if (tenancyError) {
    console.error("Error fetching tenancies:", tenancyError);
    throw tenancyError;
  }

  if (maintenanceError) {
    console.error("Error fetching maintenance:", maintenanceError);
    throw maintenanceError;
  }

  if (paymentsError) {
    console.error("Error fetching payments:", paymentsError);
    throw paymentsError;
  }

  const tenancyIds = tenanciesWithProperties?.map(t => t.id) || [];
  const propertiesCount = tenanciesWithProperties?.length || 0;
  
  // Only fetch revenue details if there are tenancies
  let revenueDetails = [];
  if (tenancyIds.length > 0) {
    const { data: revenueData } = await supabase
      .from("payments")
      .select(`
        amount,
        due_date,
        status,
        tenancy_id
      `)
      .in("tenancy_id", tenancyIds)
      .gte("due_date", firstDayOfMonth);
      
    revenueDetails = revenueData?.map(payment => {
      const tenancy = tenanciesWithProperties?.find(t => t.id === payment.tenancy_id);
      return {
        property_name: tenancy?.property?.name || 'Unknown',
        amount: payment.amount,
        due_date: payment.due_date,
        status: payment.status
      };
    }) || [];
  }

  return {
    totalProperties: propertiesCount,
    pendingMaintenance: maintenanceCount || 0,
    paymentStatus: latestPaymentData?.[0]?.status || "No payments",
    revenueDetails
  };
}

export function useMetrics(userId: string, userRole: "landlord" | "tenant" | "service_provider") {
  return useQuery({
    queryKey: ["dashboard-metrics", userId, userRole],
    queryFn: async () => {
      if (!userId) {
        console.warn("No userId provided to useMetrics");
        return { pendingMaintenance: 0 };
      }
      
      switch (userRole) {
        case "landlord":
          return fetchLandlordMetrics(userId);
        case "tenant":
          return fetchTenantMetrics(userId);
        case "service_provider":
          return fetchServiceProviderMetrics(userId);
        default:
          throw new Error(`Unknown user role: ${userRole}`);
      }
    },
    staleTime: METRICS_CACHE_TIME,
    gcTime: METRICS_CACHE_TIME,
  });
}
