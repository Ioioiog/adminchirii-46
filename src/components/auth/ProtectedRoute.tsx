
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

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
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

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
          setIsValid(false);
          setIsValidating(false);
          return;
        }

        if (!session) {
          console.log("No valid session found");
          await supabase.auth.signOut();
          setIsValid(false);
          setIsValidating(false);
          return;
        }

        // Additional verification of the user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("User verification error:", userError);
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please sign in again.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          setIsValid(false);
          setIsValidating(false);
          return;
        }

        console.log("Session verified successfully for user:", session.user.id);
        setIsValid(true);
        setIsValidating(false);
      } catch (error) {
        console.error("Session verification error:", error);
        if (mounted) {
          toast({
            title: "Authentication Error",
            description: "There was a problem verifying your session. Please sign in again.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          setIsValid(false);
          setIsValidating(false);
        }
      }
    };

    if (isAuthenticated) {
      checkSession();
    } else {
      setIsValidating(false);
      setIsValid(false);
    }

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, toast]);

  if (isValidating) {
    // Show a loading state while validating the session
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isValid) {
    console.log("User not authenticated, redirecting to:", redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
