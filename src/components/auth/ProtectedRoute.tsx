
import { Navigate, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [hasCheckedForContracts, setHasCheckedForContracts] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);

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
          setIsChecking(false);
          setHasValidSession(false);
          return;
        }

        if (!session) {
          console.log("No valid session found");
          await supabase.auth.signOut();
          setIsChecking(false);
          setHasValidSession(false);
          return;
        }

        // Set valid session to true as we've confirmed we have a session
        setHasValidSession(true);

        // Additional verification of the user
        const { error: userError, data: userData } = await supabase.auth.getUser();
        if (userError) {
          console.error("User verification error:", userError);
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please sign in again.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          setIsChecking(false);
          setHasValidSession(false);
          return;
        }

        console.log("Session verified successfully for user:", session.user.id);
        
        // Check user role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        // Only check for unsigned contracts if user is a tenant and we haven't checked already
        if (profile?.role === "tenant" && !hasCheckedForContracts) {
          console.log("Checking for unsigned contracts for tenant:", session.user.id);
          
          const { data: pendingContracts, error: contractError } = await supabase
            .from("contracts")
            .select("id, invitation_token")
            .eq("tenant_id", session.user.id)
            .eq("status", "pending_signature")
            .limit(1);
            
          if (contractError) {
            console.error("Error checking for pending contracts:", contractError);
          } else if (pendingContracts && pendingContracts.length > 0 && 
                    !(window.location.pathname.includes(pendingContracts[0].id))) {
            console.log("Found pending contract:", pendingContracts[0]);
            setHasCheckedForContracts(true);
            navigate(`/documents/contracts/${pendingContracts[0].id}?invitation_token=${pendingContracts[0].invitation_token}`);
            return;
          }
          
          setHasCheckedForContracts(true);
        }
        
        setIsChecking(false);
      } catch (error) {
        console.error("Session verification error:", error);
        if (mounted) {
          toast({
            title: "Authentication Error",
            description: "There was a problem verifying your session. Please sign in again.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          setIsChecking(false);
          setHasValidSession(false);
        }
      }
    };

    if (isAuthenticated) {
      checkSession();
    } else {
      setIsChecking(false);
    }

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, toast, navigate, hasCheckedForContracts]);

  if (!isAuthenticated && !hasValidSession) {
    console.log("User not authenticated, redirecting to:", redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  if (isChecking) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>;
  }

  return <>{children}</>;
}
