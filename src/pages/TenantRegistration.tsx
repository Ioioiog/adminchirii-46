
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ContractMetadata {
  tenantEmail?: string;
  startDate?: string;
  [key: string]: any;  // Allow other metadata fields
}

interface Contract {
  id: string;
  properties?: { name: string };
  property_id: string;
  metadata: ContractMetadata;
  status: 'draft' | 'pending' | 'signed' | 'expired' | 'cancelled' | 'pending_signature';
}

const TenantRegistration = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Handle both URL formats
  const token = searchParams.get('invitation_token') || searchParams.get('token');
  const contractId = id || searchParams.get('contractId');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);

  const showError = (title: string, description: string) => {
    toast({ title, description, variant: "destructive" });
    navigate("/auth");
  };

  // First check authentication state
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          if (contractId && token) {
            // If user is authenticated and has both contractId and token, 
            // redirect to contract details
            navigate(`/documents/contracts/${contractId}?invitation_token=${token}`);
            return true; // Return true to indicate we've redirected
          }
        }
        return false; // Return false to indicate no redirect happened
      } catch (error) {
        console.error('Auth check error:', error);
        return false;
      }
    };

    checkAuthAndRedirect();
  }, [contractId, token, navigate]);

  // Then verify contract only if we haven't redirected
  useEffect(() => {
    const verifyContract = async () => {
      if (!contractId || !token) {
        showError("Invalid Contract", "Missing contract ID or invitation token.");
        return;
      }

      try {
        const { data, error } = await supabase
          .from('contracts')
          .select('*, properties(name)')
          .eq('id', contractId)
          .eq('invitation_token', token)
          .maybeSingle();

        if (error || !data) {
          console.error("Contract fetch error:", error);
          showError("Invalid Contract", "This contract does not exist or has expired.");
          return;
        }

        // Cast the metadata to our expected type and verify tenant email exists
        const metadata = data.metadata as ContractMetadata;
        if (!metadata?.tenantEmail) {
          showError("Invalid Contract", "Contract is missing tenant information.");
          return;
        }

        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', metadata.tenantEmail)
          .maybeSingle();

        setIsExistingUser(!!existingUser);
        setContract({
          id: data.id,
          properties: data.properties,
          property_id: data.property_id,
          metadata: metadata,
          status: data.status as Contract['status']
        });
        setIsLoading(false);
        
      } catch (error) {
        console.error("Contract verification error:", error);
        showError("Error", "Failed to verify invitation. Please try again.");
      }
    };

    verifyContract();
  }, [contractId, token, navigate, toast]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session && contract) {
          try {
            const { error: contractError } = await supabase
              .from('contracts')
              .update({
                tenant_id: session.user.id,
                status: 'pending_signature'
              })
              .eq('id', contractId);

            if (contractError) {
              throw contractError;
            }

            const { error: tenancyError } = await supabase
              .from('tenancies')
              .insert({
                property_id: contract.property_id,
                tenant_id: session.user.id,
                start_date: contract.metadata.startDate || new Date().toISOString(),
                status: 'pending'
              });

            if (tenancyError) {
              throw tenancyError;
            }

            toast({
              title: isExistingUser ? "Welcome Back!" : "Welcome!",
              description: "You can now review and sign the contract.",
            });

            navigate(`/documents/contracts/${contractId}?invitation_token=${token}`);
            
          } catch (error: any) {
            console.error("Error setting up tenant:", error);
            toast({
              title: "Error",
              description: "Failed to complete registration. Please contact support.",
              variant: "destructive",
            });
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [contract, contractId, isExistingUser, navigate, toast, token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <Skeleton className="h-8 w-3/4 mx-auto" />
            </CardTitle>
            <CardDescription className="text-center">
              <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contract) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {isExistingUser ? 'Sign In to View Contract' : 'Complete Your Registration'}
          </CardTitle>
          <CardDescription className="text-center">
            {isExistingUser
              ? `Welcome back! Please sign in to view and sign the contract for ${contract?.properties?.name || 'Property'}`
              : `You've been invited to sign a contract for ${contract?.properties?.name || 'Property'}. Please create your account to continue.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            view={isExistingUser ? "sign_in" : "sign_up"}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#0F172A',
                    brandAccent: '#1E293B',
                    brandButtonText: 'white',
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '0.5rem',
                    inputBorderRadius: '0.5rem',
                  },
                },
              },
              className: {
                container: 'w-full',
                button: 'w-full px-4 py-2 rounded-lg',
                input: 'rounded-lg border-gray-300',
                label: 'text-sm font-medium text-gray-700',
              },
            }}
            providers={[]}
            redirectTo={window.location.origin}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantRegistration;
