import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  isAuthenticated, 
  children, 
  redirectTo = "/auth" 
}: ProtectedRouteProps) {
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        console.log("Verifying session validity...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error("Session verification error:", error);
          toast({
            title: "Session Error",
            description: "There was a problem verifying your session. Please sign in again.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          return;
        }

        if (!session) {
          console.log("No valid session found");
          await supabase.auth.signOut();
          return;
        }

        // Additional verification of the user
        const { error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error("User verification error:", userError);
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please sign in again.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          return;
        }

        console.log("Session verified successfully for user:", session.user.id);
      } catch (error) {
        console.error("Session verification error:", error);
        if (mounted) {
          toast({
            title: "Authentication Error",
            description: "There was a problem verifying your session. Please sign in again.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
        }
      }
    };

    if (isAuthenticated) {
      checkSession();
    }

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, toast]);

  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to:", redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}