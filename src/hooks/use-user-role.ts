
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "landlord" | "tenant" | "service_provider" | null;

export function useUserRole() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function getUserRole() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("Error fetching user:", userError);
          setUserRole(null);
          setUserId(null);
          return;
        }

        if (!user) {
          console.log("No authenticated user found");
          setUserRole(null);
          setUserId(null);
          return;
        }

        console.log("Fetching role for user:", user.id);
        setUserId(user.id);

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

      } catch (error) {
        console.error("Unexpected error in getUserRole:", error);
        if (mounted) {
          setUserRole(null);
          setUserId(null);
        }
      }
    }

    getUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await getUserRole();
      } else if (event === 'SIGNED_OUT') {
        setUserRole(null);
        setUserId(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { userRole, userId };
}
