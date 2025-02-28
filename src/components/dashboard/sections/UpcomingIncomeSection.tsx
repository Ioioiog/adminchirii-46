import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UpcomingPayment {
  amount: number;
  due_date: string;
  property: {
    name: string;
  };
  tenant: {
    first_name: string;
    last_name: string;
  };
}

export function UpcomingIncomeSection({ userId }: { userId: string }) {
  const { t } = useTranslation();

  const { data: upcomingPayments, isLoading } = useQuery({
    queryKey: ["upcoming-payments", userId],
    queryFn: async () => {
      console.log("Fetching upcoming payments for landlord:", userId);
      
      const { data, error } = await supabase
        .from("payments")
        .select(`
          amount,
          due_date,
          tenancy:tenancies (
            property:properties (
              name
            ),
            tenant:profiles (
              first_name,
              last_name
            )
          )
        `)
        .eq("status", "pending")
        .gte("due_date", new Date().toISOString())
        .order("due_date", { ascending: true })
        .limit(5);

      if (error) {
        console.error("Error fetching upcoming payments:", error);
        throw error;
      }

      return data?.map(payment => ({
        amount: payment.amount,
        due_date: payment.due_date,
        property: payment.tenancy.property,
        tenant: payment.tenancy.tenant
      })) as UpcomingPayment[];
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!upcomingPayments?.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          {t('dashboard.revenue.noUpcomingPayments', 'No upcoming payments')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {t('dashboard.revenue.upcomingPayments', 'Upcoming Payments')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingPayments.map((payment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="space-y-1">
                <p className="font-medium">{payment.property.name}</p>
                <p className="text-sm text-muted-foreground">
                  {payment.tenant.first_name} {payment.tenant.last_name}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${payment.amount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(payment.due_date), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}