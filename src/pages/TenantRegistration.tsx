
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TenantInvitation {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  token: string;
  status: string;
  start_date: string;
  end_date: string | null;
  properties?: Array<{
    property_id: string;
    property: {
      name: string;
    }
  }>;
}

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
  const [invitation, setInvitation] = useState<TenantInvitation | null>(null);
  const [invitationType, setInvitationType] = useState<'contract' | 'direct' | null>(null);

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
          } else if (token) {
            // If only token is present, process direct invitation
            await processDirectInvitation(token, session.user.id);
            return true;
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

  // Process direct tenant invitation
  const processDirectInvitation = async (invitationToken: string, userId: string) => {
    try {
      // Get invitation details
      const { data: invitationData, error: invitationError } = await supabase
        .from('tenant_invitations')
        .select(`
          id, email, first_name, last_name, token, status, start_date, end_date,
          tenant_invitation_properties(
            property_id,
            properties:property_id(name)
          )
        `)
        .eq('token', invitationToken)
        .eq('status', 'pending')
        .eq('used', false)
        .single();

      if (invitationError || !invitationData) {
        throw new Error("Invalid or expired invitation.");
      }

      // Update invitation status to used
      const { error: updateError } = await supabase
        .from('tenant_invitations')
        .update({
          status: 'accepted',
          used: true
        })
        .eq('id', invitationData.id);

      if (updateError) {
        throw updateError;
      }

      // Create tenancy records for each property in the invitation
      if (invitationData.tenant_invitation_properties) {
        for (const prop of invitationData.tenant_invitation_properties) {
          const { error: tenancyError } = await supabase
            .from('tenancies')
            .insert({
              property_id: prop.property_id,
              tenant_id: userId,
              start_date: invitationData.start_date,
              end_date: invitationData.end_date,
              status: 'active'
            })
            .single();

          if (tenancyError) {
            console.error("Error creating tenancy:", tenancyError);
            // Continue with other properties even if one fails
          }
        }
      }

      toast({
        title: "Invitation Accepted",
        description: "You have successfully accepted the invitation.",
      });

      // Redirect to properties page
      navigate("/properties");
    } catch (error: any) {
      console.error("Error processing invitation:", error);
      showError("Error", error.message || "Failed to process invitation");
    }
  };

  // Verify invitation or contract based on available parameters
  useEffect(() => {
    const verifyInvitation = async () => {
      setIsLoading(true);
      
      try {
        if (contractId && token) {
          // Contract flow
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
          setInvitationType('contract');
          
        } else if (token) {
          // Direct invitation flow
          const { data, error } = await supabase
            .from('tenant_invitations')
            .select(`
              id, email, first_name, last_name, token, status, start_date, end_date,
              tenant_invitation_properties(
                property_id,
                properties:property_id(name)
              )
            `)
            .eq('token', token)
            .eq('status', 'pending')
            .eq('used', false)
            .single();

          if (error || !data) {
            console.error("Invitation fetch error:", error);
            showError("Invalid Invitation", "This invitation does not exist or has expired.");
            return;
          }

          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', data.email)
            .maybeSingle();

          setIsExistingUser(!!existingUser);
          setInvitation(data as TenantInvitation);
          setInvitationType('direct');
          
        } else {
          showError("Invalid Request", "Missing invitation token.");
          return;
        }
      } catch (error) {
        console.error("Verification error:", error);
        showError("Error", "Failed to verify invitation. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    verifyInvitation();
  }, [contractId, token, navigate, toast]);

  useEffect(() => {
    const handleAuthStateChange = async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          if (invitationType === 'contract' && contract) {
            // Contract flow
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
            
          } else if (invitationType === 'direct' && invitation) {
            // Direct invitation flow
            await processDirectInvitation(invitation.token, session.user.id);
          }
        } catch (error: any) {
          console.error("Error processing after authentication:", error);
          toast({
            title: "Error",
            description: "Failed to complete registration. Please contact support.",
            variant: "destructive",
          });
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => subscription.unsubscribe();
  }, [invitationType, contract, invitation, contractId, isExistingUser, navigate, toast, token]);

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

  let title = "";
  let description = "";
  let propertyName = "";

  if (invitationType === 'contract' && contract) {
    propertyName = contract.properties?.name || 'Property';
    title = isExistingUser ? 'Sign In to View Contract' : 'Complete Your Registration';
    description = isExistingUser
      ? `Welcome back! Please sign in to view and sign the contract for ${propertyName}`
      : `You've been invited to sign a contract for ${propertyName}. Please create your account to continue.`;
  } else if (invitationType === 'direct' && invitation) {
    const properties = invitation.tenant_invitation_properties?.map(p => p.properties?.name).join(', ') || 'properties';
    title = isExistingUser ? 'Sign In to Accept Invitation' : 'Complete Your Registration';
    description = isExistingUser
      ? `Welcome back! Please sign in to accept your invitation to ${properties}`
      : `You've been invited to ${properties}. Please create your account to continue.`;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{title}</CardTitle>
          <CardDescription className="text-center">{description}</CardDescription>
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
