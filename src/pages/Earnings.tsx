
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthState } from "@/hooks/useAuthState";
import { format } from "date-fns";
import { DollarSign, TrendingUp, Calendar, CheckCircle, CreditCard, Receipt, Building, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/hooks/useCurrency";

interface EarningsSummary {
  totalEarnings: number;
  completedJobs: number;
  averageJobValue: number;
  pendingPayments: number;
  recentPayments: Array<{
    id: string;
    amount: number;
    date: string;
    status: string;
    title: string;
  }>;
}

const Earnings = () => {
  const { currentUserId } = useAuthState();
  const { formatAmount } = useCurrency();

  const { data: earningsSummary, isLoading } = useQuery({
    queryKey: ["earnings-summary", currentUserId],
    enabled: !!currentUserId,
    queryFn: async (): Promise<EarningsSummary> => {
      console.log("Fetching earnings for user:", currentUserId);
      
      const { data: maintenanceRequests, error } = await supabase
        .from("maintenance_requests")
        .select("*")
        .eq("assigned_to", currentUserId)
        .eq("status", "completed")
        .order("completion_date", { ascending: false });

      if (error) {
        console.error("Error fetching maintenance requests:", error);
        throw error;
      }

      const totalEarnings = maintenanceRequests?.reduce(
        (sum, job) => sum + (job.service_provider_fee || 0),
        0
      );

      const pendingPayments = maintenanceRequests
        ?.filter(job => job.payment_status === 'pending')
        .reduce((sum, job) => sum + (job.service_provider_fee || 0), 0);

      const recentPayments = maintenanceRequests?.slice(0, 5).map((job) => ({
        id: job.id,
        amount: job.service_provider_fee || 0,
        date: job.completion_date,
        status: job.payment_status || "pending",
        title: job.title,
      }));

      return {
        totalEarnings: totalEarnings || 0,
        completedJobs: maintenanceRequests?.length || 0,
        averageJobValue:
          maintenanceRequests?.length > 0
            ? totalEarnings / maintenanceRequests.length
            : 0,
        pendingPayments: pendingPayments || 0,
        recentPayments: recentPayments || [],
      };
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Earnings Dashboard</h1>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Earnings Overview</h3>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-card rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Total Earnings</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatAmount(earningsSummary?.totalEarnings || 0)}
                </p>
              </div>

              <div className="p-4 bg-card rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Pending Payments</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatAmount(earningsSummary?.pendingPayments || 0)}
                </p>
              </div>

              <div className="p-4 bg-card rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Completed Jobs</span>
                </div>
                <p className="text-2xl font-bold">
                  {earningsSummary?.completedJobs || 0}
                </p>
              </div>

              <div className="p-4 bg-card rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Average Job Value</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatAmount(earningsSummary?.averageJobValue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {earningsSummary?.recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{payment.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.date && format(new Date(payment.date), "PPP")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        payment.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {payment.status}
                    </span>
                    <span className="font-semibold">
                      {formatAmount(payment.amount)}
                    </span>
                  </div>
                </div>
              ))}

              {(!earningsSummary?.recentPayments ||
                earningsSummary.recentPayments.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  No recent payments found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Earnings;
