
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FormData } from "@/types/contract";
import { Json } from "@/integrations/supabase/types/json";

interface Contract {
  id: string;
  properties?: { name: string };
  property_id: string;
  metadata: FormData;
  status: 'draft' | 'pending' | 'signed' | 'expired' | 'cancelled' | 'pending_signature';
}

// Type for the raw contract data from Supabase
interface RawContract {
  id: string;
  properties?: { name: string };
  property_id: string;
  metadata: Json;
  status: 'draft' | 'pending' | 'signed' | 'expired' | 'cancelled' | 'pending_signature';
}

const TenantRegistration = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const token = searchParams.get('token');
  const contractId = searchParams.get('contractId');
  const [isLoading, setIsLoading] = useState(true);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !contractId) {
        console.log("Missing token or contractId");
        toast({
          title: "Invalid Invitation",
          description: "This invitation link is invalid or has expired.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      try {
        console.log("Verifying contract invitation token");
        
        // Verify the token and get contract details
        const { data: rawContract, error: contractError } = await supabase
          .from('contracts')
          .select('*, properties(*)')
          .eq('id', contractId)
          .eq('invitation_token', token)
          .eq('status', 'pending_signature')
          .single();

        if (contractError || !rawContract) {
          console.log("Invalid or expired contract invitation");
          toast({
            title: "Invalid Contract Invitation",
            description: "This contract invitation link is invalid or has expired.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        // Cast the raw contract data to our Contract type
        const typedContract: Contract = {
          ...rawContract,
          metadata: rawContract.metadata as FormData
        };

        setContract(typedContract);

        // Check if the user exists using tenantEmail from metadata
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', (rawContract.metadata as FormData).tenantEmail)
          .single();

        setIsExistingUser(!!existingUser);
        console.log("User status:", existingUser ? "Existing user" : "New user");

      } catch (error) {
        console.error("Error verifying invitation:", error);
        toast({
          title: "Error",
          description: "Failed to verify invitation. Please try again.",
          variant: "destructive",
        });
        navigate("/auth");
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token, contractId, navigate, toast]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, "Session:", session ? "exists" : "null");
        
        if (event === 'SIGNED_IN' && session && contract) {
          try {
            console.log("Processing new tenant registration");
            
            // Update contract with tenant's user ID
            const { error: contractError } = await supabase
              .from('contracts')
              .update({
                tenant_id: session.user.id,
                status: 'pending_signature'
              })
              .eq('id', contractId);

            if (contractError) {
              console.error("Error updating contract:", contractError);
              throw contractError;
            }

            // Create tenancy
            const { error: tenancyError } = await supabase
              .from('tenancies')
              .insert({
                property_id: contract.property_id,
                tenant_id: session.user.id,
                start_date: contract.metadata.startDate || new Date().toISOString(),
                status: 'pending'
              });

            if (tenancyError) {
              console.error("Error creating tenancy:", tenancyError);
              throw tenancyError;
            }

            toast({
              title: isExistingUser ? "Welcome Back!" : "Welcome!",
              description: "You can now review and sign the contract.",
            });

            // Redirect to the contract page
            navigate(`/documents/contracts/${contractId}`);
            
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
  }, [contract, contractId, isExistingUser, navigate, toast]);

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

  const propertyName = contract.properties?.name || 'Property';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {isExistingUser ? 'Sign In to View Contract' : 'Complete Your Registration'}
          </CardTitle>
          <CardDescription className="text-center">
            {isExistingUser
              ? `Welcome back! Please sign in to view and sign the contract for ${propertyName}`
              : `You've been invited to sign a contract for ${propertyName}. Please create your account to continue.`
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
