
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "landlord" | "tenant" | "service_provider" | null;

export function useUserRole() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    // Use localStorage to cache the role to prevent flickering
    const cachedRole = localStorage.getItem('userRole');
    const cachedUserId = localStorage.getItem('userId');
    
    // Initialize with cached values if available
    if (cachedRole && cachedUserId) {
      setUserRole(cachedRole as UserRole);
      setUserId(cachedUserId);
    }

    async function getUserRole() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("Error fetching user:", userError);
          if (mounted) {
            setUserRole(null);
            setUserId(null);
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
          }
          setIsLoading(false);
          return;
        }

        if (!user) {
          console.log("No authenticated user found");
          if (mounted) {
            setUserRole(null);
            setUserId(null);
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
          }
          setIsLoading(false);
          return;
        }

        // Only fetch role if user ID changed or no cached role
        if (user.id !== cachedUserId || !cachedRole) {
          console.log("Fetching role for user:", user.id);
          setUserId(user.id);
          localStorage.setItem('userId', user.id);

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (profileError) {
            console.error("Error fetching user profile:", profileError);
            if (mounted) {
              setUserRole(null);
              localStorage.removeItem('userRole');
            }
            setIsLoading(false);
            return;
          }

          if (!profile?.role) {
            console.log("No role found in profile");
            if (mounted) {
              setUserRole(null);
              localStorage.removeItem('userRole');
            }
            setIsLoading(false);
            return;
          }

          const validRole = profile.role === "landlord" || 
                           profile.role === "tenant" || 
                           profile.role === "service_provider";

          if (!validRole) {
            console.error("Invalid role found:", profile.role);
            if (mounted) {
              setUserRole(null);
              localStorage.removeItem('userRole');
            }
            setIsLoading(false);
            return;
          }

          console.log("Setting user role to:", profile.role);
          const typedRole = profile.role as UserRole;
          if (mounted) {
            setUserRole(typedRole);
            localStorage.setItem('userRole', typedRole);
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Unexpected error in getUserRole:", error);
        if (mounted) {
          setUserRole(null);
          setUserId(null);
          localStorage.removeItem('userRole');
          localStorage.removeItem('userId');
        }
        setIsLoading(false);
      }
    }

    getUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await getUserRole();
      } else if (event === 'SIGNED_OUT') {
        setUserRole(null);
        setUserId(null);
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { userRole, userId, isLoading };
}
