
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export function useAuthState() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log("Initializing authentication state...");
        setIsLoading(true);
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (mounted) {
            setIsAuthenticated(false);
            setCurrentUserId(null);
            setAuthError(sessionError.message);
            setIsLoading(false);
          }
          return;
        }

        // Verify the session with getUser to ensure it's still valid
        if (session?.user) {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('Error verifying user:', userError);
            if (mounted) {
              setIsAuthenticated(false);
              setCurrentUserId(null);
              setAuthError(userError.message);
              
              // Sign out if there's an authentication error
              await supabase.auth.signOut();
              
              toast({
                title: "Authentication Error",
                description: "Your session has expired. Please sign in again.",
                variant: "destructive",
              });
            }
          } else if (user) {
            console.log("Valid session found:", user.id);
            if (mounted) {
              setIsAuthenticated(true);
              setCurrentUserId(user.id);
              setAuthError(null);
            }
          } else {
            console.log("No valid user found in session");
            if (mounted) {
              setIsAuthenticated(false);
              setCurrentUserId(null);
            }
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

      } catch (error: any) {
        console.error("Authentication initialization error:", error);
        if (mounted) {
          setIsLoading(false);
          setIsAuthenticated(false);
          setCurrentUserId(null);
          setAuthError(error.message);
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user && mounted) {
            setIsAuthenticated(true);
            setCurrentUserId(session.user.id);
            setAuthError(null);
          }
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          if (mounted) {
            setIsAuthenticated(false);
            setCurrentUserId(null);
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
  }, [toast]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setCurrentUserId(null);
    } catch (error: any) {
      console.error("Error signing out:", error);
      setAuthError(error.message);
    }
  };

  return { 
    isLoading, 
    isAuthenticated, 
    setIsAuthenticated, 
    currentUserId, 
    authError,
    signOut 
  };
}
