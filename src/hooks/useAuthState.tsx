
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export function useAuthState() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
            setIsLoading(false);
          }
          return;
        }

        if (session?.user) {
          console.log("Valid session found:", session.user.id);
          if (mounted) {
            setIsAuthenticated(true);
            setCurrentUserId(session.user.id);
          }
        } else {
          console.log("No active session found");
          if (mounted) {
            setIsAuthenticated(false);
            setCurrentUserId(null);
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
        }
      }
    };

    initializeAuth();

    // Setup auth state change subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in:', session.user.id);
        setIsAuthenticated(true);
        setCurrentUserId(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setIsAuthenticated(false);
        setCurrentUserId(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { isLoading, isAuthenticated, setIsAuthenticated, currentUserId };
}
