import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useToast } from "@/hooks/use-toast";
import { PaymentList } from "@/components/payments/PaymentList";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { PaymentFilters } from "@/components/payments/PaymentFilters";
import { useProperties } from "@/hooks/useProperties";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const Payments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"landlord" | "tenant" | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const { properties, isLoading: propertiesLoading } = useProperties({
    userRole: userRole === "landlord" || userRole === "tenant" ? userRole : "tenant",
  });

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log("Checking user session...");
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }

        if (!session) {
          console.log("No active session found, redirecting to auth");
          navigate("/auth");
          return;
        }

        setUserId(session.user.id);
        console.log("User ID set:", session.user.id);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          throw profileError;
        }

        if (!profile) {
          console.log("No profile found");
          return;
        }

        console.log("Profile role:", profile.role);
        setUserRole(profile.role as "landlord" | "tenant");
        setIsCheckingProfile(false);
      } catch (error: any) {
        console.error("Error in checkUser:", error);
        toast({
          title: t("common.error"),
          description: error.message || t("common.unexpectedError"),
          variant: "destructive",
        });
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast, t]);

  if (isCheckingProfile) {
    return (
      <div className="flex bg-dashboard-background min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!userId || !userRole) return null;

  return (
    <div className="flex bg-dashboard-background min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="bg-white p-8 rounded-lg shadow-sm mb-6 animate-fade-in">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-600 rounded-xl">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    {t("payments.title")}
                  </h1>
                </div>
                <p className="text-gray-500 max-w-2xl">
                  {t("payments.description")}
                </p>
              </div>
              {userRole === "landlord" && (
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="w-full sm:w-auto flex items-center gap-2 bg-green-600 hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t("payments.addPayment")}</span>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <PaymentFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              propertyFilter={propertyFilter}
              setPropertyFilter={setPropertyFilter}
              properties={properties}
            />

            <PaymentList
              userId={userId}
              userRole={userRole}
              propertyFilter={propertyFilter}
              statusFilter={statusFilter}
              searchTerm={searchTerm}
            />
          </div>
        </div>
      </main>

      <PaymentDialog
        open={showAddModal}
        onOpenChange={setShowAddModal}
        userId={userId}
        userRole={userRole}
        properties={properties}
      />
    </div>
  );
};

export default Payments;
