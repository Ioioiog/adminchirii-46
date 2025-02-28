
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "landlord" | "tenant" | "service_provider" | null;

export function useUserRole() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function getUserRole() {
      try {
        setIsLoading(true);
        
        // First check if we have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error fetching session:", sessionError);
          if (mounted) {
            setUserRole(null);
            setUserId(null);
            setAuthError(sessionError.message);
          }
          return;
        }

        if (!session) {
          console.log("No active session found");
          if (mounted) {
            setUserRole(null);
            setUserId(null);
          }
          return;
        }

        // If we have a valid session, get the user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("Error fetching user:", userError);
          if (mounted) {
            setUserRole(null);
            setUserId(null);
            setAuthError(userError.message);
          }
          return;
        }

        if (!user) {
          console.log("No authenticated user found");
          if (mounted) {
            setUserRole(null);
            setUserId(null);
          }
          return;
        }

        console.log("Fetching role for user:", user.id);
        if (mounted) {
          setUserId(user.id);
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          if (mounted) {
            setUserRole(null);
            setUserId(null);
            setAuthError(profileError.message);
          }
          return;
        }

        if (!profile?.role) {
          console.log("No role found in profile");
          if (mounted) {
            setUserRole(null);
            setUserId(null);
          }
          return;
        }

        const validRole = profile.role === "landlord" || 
                         profile.role === "tenant" || 
                         profile.role === "service_provider";

        if (!validRole) {
          console.error("Invalid role found:", profile.role);
          if (mounted) {
            setUserRole(null);
            setUserId(null);
          }
          return;
        }

        console.log("Setting user role to:", profile.role);
        if (mounted) {
          setUserRole(profile.role as UserRole);
        }

      } catch (error: any) {
        console.error("Unexpected error in getUserRole:", error);
        if (mounted) {
          setUserRole(null);
          setUserId(null);
          setAuthError(error.message);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    getUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      console.log("Auth state changed:", event);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await getUserRole();
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUserRole(null);
          setUserId(null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { userRole, userId, isLoading, authError };
}
