
import React, { useEffect, useState } from "react";
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
  const [userName, setUserName] = React.useState<string>("");
  const { userRole, userId, isLoading: roleLoading, authError } = useUserRole();
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("Checking session in Index page...");
        setIsSessionLoading(true);
        
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

        // Verify the user is still valid
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("User verification error:", userError);
          toast({
            title: "Authentication Error",
            description: userError.message || "Session expired. Please sign in again.",
            variant: "destructive",
          });
          
          await supabase.auth.signOut();
          navigate("/auth");
          return;
        }

        if (!user) {
          console.error("No user returned from getUser");
          navigate("/auth");
          return;
        }

        const currentUserId = session.user.id;
        console.log("Current user ID:", currentUserId);

        // Only fetch profile if we have a valid session and user
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

      } catch (error: any) {
        console.error("Error in checkSession:", error);
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
        
        // If there's an auth error, redirect to auth page
        if (error.status === 401 || error.code === 'PGRST301') {
          navigate("/auth");
        }
      } finally {
        setIsSessionLoading(false);
      }
    };

    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log("Auth state changed in Index:", event);
      if (event === 'SIGNED_OUT') {
        navigate("/auth");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast, t]);

  // Show loading state while checking session or role
  if (isSessionLoading || roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  // If there's an auth error, show it and redirect
  if (authError) {
    toast({
      title: "Authentication Error",
      description: authError,
      variant: "destructive",
    });
    navigate("/auth");
    return null;
  }

  // Render different dashboards based on user role
  const renderDashboard = () => {
    if (!userId || !userRole) {
      console.log("No userId or userRole available, redirecting to auth");
      navigate("/auth");
      return null;
    }

    console.log("Rendering dashboard for role:", userRole);

    switch (userRole) {
      case "service_provider":
        return <ServiceProviderDashboard userId={userId} userName={userName} />;
      case "tenant":
        return <TenantDashboard userId={userId} userName={userName} />;
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
