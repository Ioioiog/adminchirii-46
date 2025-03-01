
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export function useAuthState() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log("Initializing authentication state...");
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (mounted) {
            setIsAuthenticated(false);
            setCurrentUserId(null);
            setUser(null);
            setUserRole(null);
            setIsLoading(false);
          }
          return;
        }

        if (session?.user) {
          console.log("Valid session found:", session.user.id);
          if (mounted) {
            setIsAuthenticated(true);
            setCurrentUserId(session.user.id);
            setUser(session.user);
            
            // Fetch user role from profiles
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", session.user.id)
              .single();
              
            if (!profileError && profileData) {
              setUserRole(profileData.role);
            }
          }
        } else {
          console.log("No active session found");
          if (mounted) {
            setIsAuthenticated(false);
            setCurrentUserId(null);
            setUser(null);
            setUserRole(null);
          }
        }

        if (mounted) {
          setIsLoading(false);
        }

      } catch (error) {
        console.error("Authentication initialization error:", error);
        if (mounted) {
          setIsLoading(false);
          setIsAuthenticated(false);
          setCurrentUserId(null);
          setUser(null);
          setUserRole(null);
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        if (session?.user) {
          if (mounted) {
            setIsAuthenticated(true);
            setCurrentUserId(session.user.id);
            setUser(session.user);
            
            // Fetch user role from profiles
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", session.user.id)
              .single();
              
            if (!profileError && profileData) {
              setUserRole(profileData.role);
            }
          }
        } else {
          if (mounted) {
            setIsAuthenticated(false);
            setCurrentUserId(null);
            setUser(null);
            setUserRole(null);
          }
        }
      }
    );

    return () => {
      mounted = false;
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  return { isLoading, isAuthenticated, setIsAuthenticated, currentUserId, user, userRole };
}
