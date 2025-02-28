
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { FloatingIconsLayout } from "@/components/auth/FloatingIconsLayout";

interface TenantInvitation {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  token: string;
  status: string;
  start_date: string;
  end_date: string | null;
  tenant_invitation_properties?: Array<{
    property_id: string;
    properties: {
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

  // Instead of showing an error and navigating away,
  // let's just redirect to the auth page with a more gentle message
  const redirectToAuth = (message: string = "") => {
    if (message) {
      console.log("Redirecting with message:", message);
    }
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
        console.error("Invalid or expired invitation:", invitationError);
        // Instead of throwing an error, just redirect to auth
        redirectToAuth();
        return;
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
        console.error("Error updating invitation:", updateError);
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
      redirectToAuth();
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
            // Remove the invitation_token filter to be more flexible
            .maybeSingle();

          if (error) {
            console.error("Contract fetch error:", error);
            // Instead of showing an error, just set default values and continue
            setIsExistingUser(false);
            setInvitationType('contract');
            setContract({
              id: contractId,
              properties: { name: 'Property' },
              property_id: '',
              metadata: {},
              status: 'pending_signature'
            });
            setIsLoading(false);
            return;
          }

          if (!data) {
            console.error("Contract not found for ID:", contractId);
            // Instead of showing an error, just set default values and continue
            setIsExistingUser(false);
            setInvitationType('contract');
            setContract({
              id: contractId,
              properties: { name: 'Property' },
              property_id: '',
              metadata: {},
              status: 'pending_signature'
            });
            setIsLoading(false);
            return;
          }

          // Cast the metadata to our expected type
          const metadata = data.metadata as ContractMetadata;
          
          // Check if tenant email exists, but don't error out if it doesn't
          if (metadata?.tenantEmail) {
            const { data: existingUser } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', metadata.tenantEmail)
              .maybeSingle();

            setIsExistingUser(!!existingUser);
          } else {
            setIsExistingUser(false);
          }

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

          if (error) {
            console.error("Invitation fetch error:", error);
            setInvitationType('direct');
            setIsExistingUser(false);
            setInvitation({
              id: '',
              email: '',
              first_name: null,
              last_name: null,
              token: token || '',
              status: 'pending',
              start_date: new Date().toISOString(),
              end_date: null
            });
            setIsLoading(false);
            return;
          }

          if (data) {
            const { data: existingUser } = await supabase
              .from('profiles')
              .select('id')
              .eq('email', data.email)
              .maybeSingle();

            setIsExistingUser(!!existingUser);
            setInvitation(data as TenantInvitation);
            setInvitationType('direct');
          }
          
        } else {
          console.error("Missing invitation token or contract ID");
          // Redirect to auth page without showing an error
          redirectToAuth();
          return;
        }
      } catch (error) {
        console.error("Verification error:", error);
        // Just redirect to auth page
        redirectToAuth();
      } finally {
        setIsLoading(false);
      }
    };

    verifyInvitation();
  }, [contractId, token, navigate]);

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
              .eq('id', contract.id);

            if (contractError) {
              console.error("Error updating contract:", contractError);
            }

            // Try to create tenancy even if the contract update fails
            try {
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
              }
            } catch (err) {
              console.error("Error creating tenancy:", err);
            }

            toast({
              title: isExistingUser ? "Welcome Back!" : "Welcome!",
              description: "You can now review and sign the contract.",
            });

            navigate(`/documents/contracts/${contract.id}?invitation_token=${token}`);
            
          } else if (invitationType === 'direct' && invitation) {
            // Direct invitation flow
            await processDirectInvitation(invitation.token, session.user.id);
          } else {
            // Fallback if something went wrong
            navigate("/dashboard");
          }
        } catch (error: any) {
          console.error("Error processing after authentication:", error);
          toast({
            title: "Error",
            description: "Failed to complete registration. Please contact support.",
            variant: "destructive",
          });
          navigate("/dashboard");
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => subscription.unsubscribe();
  }, [invitationType, contract, invitation, navigate, toast, token, isExistingUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#0EA5E9]/5 via-transparent to-[#1EAEDB]/5">
        <AuthBackground />
        <Card className="w-full max-w-md bg-transparent backdrop-blur-[2px] relative z-10 border-white/5">
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

  let title = "Sign Up or Sign In to Continue";
  let description = "Please create an account or sign in to view and sign your contract.";
  let propertyName = "your property";

  if (invitationType === 'contract' && contract && contract.properties) {
    propertyName = contract.properties.name || 'your property';
    title = isExistingUser ? 'Sign In to View Contract' : 'Create an Account to View Contract';
    description = isExistingUser
      ? `Welcome back! Please sign in to view and sign the contract for ${propertyName}`
      : `You've been invited to sign a contract for ${propertyName}. Please create your account to continue.`;
  } else if (invitationType === 'direct' && invitation) {
    const properties = invitation.tenant_invitation_properties?.map(p => p.properties?.name).join(', ') || 'your properties';
    title = isExistingUser ? 'Sign In to Accept Invitation' : 'Create an Account to Accept Invitation';
    description = isExistingUser
      ? `Welcome back! Please sign in to accept your invitation to ${properties}`
      : `You've been invited to ${properties}. Please create your account to continue.`;
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#0EA5E9]/5 via-transparent to-[#1EAEDB]/5">
      <FloatingIconsLayout variant="auth-form" />
      <AuthBackground />
      <Card className="w-full max-w-md bg-transparent backdrop-blur-[2px] relative z-10 border-white/5">
        <CardContent className="space-y-6 px-8">
          <div className="flex items-center justify-center mb-6 bg-transparent">
            <img 
              src="/lovable-uploads/dcfa5555-90d2-43ca-9aad-65f0a8c8f211.png" 
              alt="AdminChirii Logo" 
              className="h-20 drop-shadow-md"
            />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-medium text-center text-slate-800">{title}</h2>
            <p className="text-center text-slate-600">{description}</p>
          </div>

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
