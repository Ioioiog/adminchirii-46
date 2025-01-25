import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Metrics {
  totalProperties?: number;
  monthlyRevenue?: number;
  activeTenants?: number;
  pendingMaintenance: number;
  paymentStatus?: string;
  revenueDetails?: Array<{
    property_name: string;
    amount: number;
    due_date: string;
    status: string;
  }>;
}

async function fetchLandlordMetrics(userId: string): Promise<Metrics> {
  console.log("Fetching landlord metrics for user:", userId);
  
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

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

  const revenueDetails: Array<{ property_name: string; amount: number; due_date: string; status: string }> = [];
  let totalMonthlyRevenue = 0;
  let activeTenanciesCount = 0;

  for (const property of properties) {
    const hasActiveTenancy = property.tenancies?.some(tenancy => 
      tenancy.status === 'active' && 
      tenancy.start_date <= currentDate.toISOString() &&
      (!tenancy.end_date || tenancy.end_date > currentDate.toISOString())
    );
    
    if (hasActiveTenancy) {
      totalMonthlyRevenue += Number(property.monthly_rent);
      activeTenanciesCount++;

      const { data: payments } = await supabase
        .from("payments")
        .select("status")
        .eq("tenancy_id", property.tenancies[0].id)
        .gte("due_date", firstDayOfMonth.toISOString())
        .lte("due_date", lastDayOfMonth.toISOString())
        .maybeSingle();

      revenueDetails.push({
        property_name: property.name,
        amount: Number(property.monthly_rent),
        due_date: firstDayOfMonth.toISOString(),
        status: payments?.status || "pending"
      });
    }
  }

  const propertyIds = properties.map(p => p.id);
  const [maintenanceCount] = await Promise.all([
    supabase
      .from("maintenance_requests")
      .select("id", { count: "exact" })
      .eq("status", "pending")
      .in("property_id", propertyIds),
  ]);

  return {
    totalProperties: properties.length,
    monthlyRevenue: totalMonthlyRevenue,
    activeTenants: activeTenanciesCount,
    pendingMaintenance: maintenanceCount.count || 0,
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

export function useMetrics(userId: string, userRole: "landlord" | "tenant") {
  return useQuery({
    queryKey: ["dashboard-metrics", userId, userRole],
    queryFn: () =>
      userRole === "landlord"
        ? fetchLandlordMetrics(userId)
        : fetchTenantMetrics(userId),
  });
}