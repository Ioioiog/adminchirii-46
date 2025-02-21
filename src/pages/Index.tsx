
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { LandlordDashboard } from "@/components/dashboard/LandlordDashboard";
import { TenantDashboard } from "@/components/dashboard/TenantDashboard";
import { ServiceProviderDashboard } from "@/components/dashboard/ServiceProviderDashboard";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useUserRole } from "@/hooks/use-user-role";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [userName, setUserName] = React.useState<string>("");
  const [tenantInfo, setTenantInfo] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { userRole } = useUserRole();

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log("Initializing authentication state...");
        setIsLoading(true);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          navigate("/auth");
          return;
        }

        if (!session) {
          console.log("No active session found, redirecting to auth");
          navigate("/auth");
          return;
        }

        const currentUserId = session.user.id;
        console.log("Current user ID:", currentUserId);
        setUserId(currentUserId);

        // Fetch profile with role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, first_name, last_name')
          .eq('id', currentUserId)
          .single();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          if (profileError.code === 'PGRST301') {
            await supabase.auth.signOut();
            navigate("/auth");
            return;
          }
          toast({
            title: "Error",
            description: "Failed to load user profile. Please try refreshing the page.",
            variant: "destructive",
          });
          return;
        }

        if (!profile) {
          console.error("No profile found for user");
          toast({
            title: "Error",
            description: "User profile not found. Please contact support.",
            variant: "destructive",
          });
          return;
        }

        console.log("Profile loaded successfully:", profile);
        
        // Set user name from profile
        const fullName = [profile.first_name, profile.last_name]
          .filter(Boolean)
          .join(" ");
        setUserName(fullName || "User");

        // If user is a tenant, fetch their tenancy information
        if (profile.role === 'tenant') {
          console.log("Fetching tenant information...");
          const { data: tenancy, error: tenancyError } = await supabase.rpc(
            'get_latest_tenancy',
            { p_tenant_id: currentUserId }
          );

          if (tenancyError) {
            console.error("Error fetching tenancy:", tenancyError);
            toast({
              title: "Error",
              description: "Failed to load tenancy information.",
              variant: "destructive",
            });
          } else if (tenancy && tenancy.length > 0) {
            console.log("Tenant information loaded:", tenancy[0]);
            setTenantInfo(tenancy[0]);
          }
        }

      } catch (error: any) {
        console.error("Error in checkUser:", error);
        if (error.status === 401 || error.code === 'PGRST301') {
          navigate("/auth");
          return;
        }
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [navigate, toast, t]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Render different dashboards based on user role
  const renderDashboard = () => {
    if (!userId || !userRole) {
      console.log("No userId or userRole available");
      return null;
    }

    console.log("Rendering dashboard for role:", userRole);

    switch (userRole) {
      case "service_provider":
        return <ServiceProviderDashboard userId={userId} userName={userName} />;
      case "tenant":
        return tenantInfo ? (
          <TenantDashboard tenantInfo={tenantInfo} />
        ) : (
          <div className="p-4">Loading tenant information...</div>
        );
      case "landlord":
        return <LandlordDashboard userId={userId} userName={userName} />;
      default:
        console.error("Invalid user role:", userRole);
        return (
          <div className="p-4">
            <h1 className="text-xl font-semibold text-red-600">
              Invalid user role. Please contact support.
            </h1>
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      {renderDashboard()}
    </DashboardLayout>
  );
};

export default Index;
