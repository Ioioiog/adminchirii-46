
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

// Higher cache time to reduce API calls
const METRICS_CACHE_TIME = 15 * 60 * 1000; // 15 minutes

// Use a cache for expensive metrics calculations
const metricsCache = new Map<string, { data: Metrics, timestamp: number }>();

async function fetchServiceProviderMetrics(userId: string): Promise<Metrics> {
  const cacheKey = `service_provider_${userId}`;
  const cachedMetrics = metricsCache.get(cacheKey);
  
  // Return cached data if it's less than 5 minutes old
  if (cachedMetrics && (Date.now() - cachedMetrics.timestamp < 5 * 60 * 1000)) {
    console.log("Using cached service provider metrics for user:", userId);
    return cachedMetrics.data;
  }
  
  console.log("Fetching service provider metrics for user:", userId);
  
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Optimize by using a single query with specific select fields
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

  const metrics = {
    activeJobs,
    completedJobs,
    monthlyEarnings,
    pendingMaintenance: 0 // Required by type but not used for service providers
  };
  
  // Cache the results
  metricsCache.set(cacheKey, { data: metrics, timestamp: Date.now() });
  
  return metrics;
}

async function fetchLandlordMetrics(userId: string): Promise<Metrics> {
  const cacheKey = `landlord_${userId}`;
  const cachedMetrics = metricsCache.get(cacheKey);
  
  // Return cached data if it's less than 5 minutes old
  if (cachedMetrics && (Date.now() - cachedMetrics.timestamp < 5 * 60 * 1000)) {
    console.log("Using cached landlord metrics for user:", userId);
    return cachedMetrics.data;
  }
  
  console.log("Fetching landlord metrics for user:", userId);
  
  // Use a more efficient approach with fewer queries
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
  
  // Get properties with active tenancies in a single query
  const { data: propertiesData, error: propsError } = await supabase
    .from("properties")
    .select(`
      id,
      name,
      monthly_rent
    `)
    .eq("landlord_id", userId);

  if (propsError) {
    console.error("Error fetching properties:", propsError);
    throw propsError;
  }

  if (!propertiesData?.length) {
    console.log("No properties found for landlord");
    return {
      totalProperties: 0,
      monthlyRevenue: 0,
      activeTenants: 0,
      pendingMaintenance: 0,
      revenueDetails: []
    };
  }

  // Get all property IDs 
  const propertyIds = propertiesData.map(p => p.id);
  
  // Get active tenancies for these properties in a single query
  const { data: tenanciesData, error: tenanciesError } = await supabase
    .from("tenancies")
    .select(`
      id, 
      property_id,
      status
    `)
    .in("property_id", propertyIds)
    .eq("status", "active");
    
  if (tenanciesError) {
    console.error("Error fetching tenancies:", tenanciesError);
    throw tenanciesError;
  }

  // Get maintenance counts in a single query
  const { count: maintenanceCount, error: maintenanceError } = await supabase
    .from("maintenance_requests")
    .select("id", { count: "exact" })
    .eq("status", "pending")
    .in("property_id", propertyIds);
    
  if (maintenanceError) {
    console.error("Error fetching maintenance:", maintenanceError);
    throw maintenanceError;
  }

  // Get all active tenancy IDs
  const activeTenancyIds = tenanciesData?.map(t => t.id) || [];
  
  // Get payments for this month in a single query (only if we have active tenancies)
  let paymentsData = [];
  if (activeTenancyIds.length > 0) {
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select(`
        status,
        tenancy_id,
        amount,
        due_date
      `)
      .in("tenancy_id", activeTenancyIds)
      .gte("due_date", firstDayOfMonth);
      
    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
      throw paymentsError;
    }
    
    paymentsData = payments || [];
  }

  // Create a map of property_id to property for faster lookups
  const propertyMap = new Map(propertiesData.map(p => [p.id, p]));
  
  // Create a map of active tenancies by property_id
  const tenanciesByProperty = new Map();
  tenanciesData?.forEach(tenancy => {
    tenanciesByProperty.set(tenancy.property_id, tenancy);
  });

  // Calculate totals and build response
  const activeTenanciesCount = tenanciesData?.length || 0;
  let totalMonthlyRevenue = 0;
  const revenueDetails: Array<{
    property_name: string;
    amount: number;
    due_date: string;
    status: string;
  }> = [];

  // Process revenue details
  propertyIds.forEach(propertyId => {
    const property = propertyMap.get(propertyId);
    const tenancy = tenanciesByProperty.get(propertyId);
    
    if (property && tenancy) {
      totalMonthlyRevenue += Number(property.monthly_rent);
      
      // Find payment for this tenancy
      const payment = paymentsData.find(p => p.tenancy_id === tenancy.id);
      
      revenueDetails.push({
        property_name: property.name,
        amount: Number(property.monthly_rent),
        due_date: payment?.due_date || firstDayOfMonth,
        status: payment?.status || "pending"
      });
    }
  });

  const metrics = {
    totalProperties: propertiesData.length,
    monthlyRevenue: totalMonthlyRevenue,
    activeTenants: activeTenanciesCount,
    pendingMaintenance: maintenanceCount || 0,
    revenueDetails: revenueDetails
  };
  
  // Cache the results
  metricsCache.set(cacheKey, { data: metrics, timestamp: Date.now() });
  
  return metrics;
}

async function fetchTenantMetrics(userId: string): Promise<Metrics> {
  const cacheKey = `tenant_${userId}`;
  const cachedMetrics = metricsCache.get(cacheKey);
  
  // Return cached data if it's less than 5 minutes old
  if (cachedMetrics && (Date.now() - cachedMetrics.timestamp < 5 * 60 * 1000)) {
    console.log("Using cached tenant metrics for user:", userId);
    return cachedMetrics.data;
  }
  
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
  let revenueDetails: Array<{
    property_name: string;
    amount: number;
    due_date: string;
    status: string;
  }> = [];
  
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
      
    revenueDetails = (revenueData || []).map(payment => {
      const tenancy = tenanciesWithProperties?.find(t => t.id === payment.tenancy_id);
      return {
        property_name: tenancy?.property?.name || 'Unknown',
        amount: payment.amount,
        due_date: payment.due_date,
        status: payment.status
      };
    });
  }

  const metrics = {
    totalProperties: propertiesCount,
    pendingMaintenance: maintenanceCount || 0,
    paymentStatus: latestPaymentData?.[0]?.status || "No payments",
    revenueDetails
  };
  
  // Cache the results
  metricsCache.set(cacheKey, { data: metrics, timestamp: Date.now() });
  
  return metrics;
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
    enabled: !!userId && !!userRole,
  });
}
