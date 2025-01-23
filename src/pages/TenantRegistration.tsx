import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const TenantRegistration = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const invitationToken = searchParams.get('invitation');
  const [invitation, setInvitation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!invitationToken) {
        console.log("No invitation token found");
        toast({
          title: "Invalid Invitation",
          description: "No invitation token provided.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      try {
        console.log("Setting token in database context");
        await supabase.rpc('set_claim', {
          params: { value: invitationToken }
        });

        console.log("Fetching invitation details");
        const { data, error } = await supabase
          .from('tenant_invitations')
          .select('*, tenant_invitation_properties!inner(property:properties(*))')
          .eq('token', invitationToken)
          .eq('status', 'pending')
          .single();

        if (error) {
          console.error("Error fetching invitation:", error);
          throw error;
        }

        if (!data) {
          console.log("Invalid or expired invitation");
          toast({
            title: "Invalid Invitation",
            description: "This invitation link is invalid or has expired.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        console.log("Invitation found:", data);
        setInvitation(data);
      } catch (error) {
        console.error("Error in invitation process:", error);
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

    fetchInvitation();
  }, [invitationToken, navigate, toast]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, "Session:", session ? "exists" : "null");
        
        if (event === 'SIGNED_IN' && session && invitation) {
          try {
            console.log("Processing new tenant registration with session:", session.user.id);
            
            // Update the profile
            const { error: profileError } = await supabase
              .from('profiles')
              .update({
                first_name: invitation.first_name,
                last_name: invitation.last_name,
                email: invitation.email,
                role: 'tenant'
              })
              .eq('id', session.user.id);

            if (profileError) {
              console.error("Profile update error:", profileError);
              throw profileError;
            }

            console.log("Profile updated successfully");

            // Create tenancies for all assigned properties
            const tenancyPromises = invitation.tenant_invitation_properties.map(async (tip: any) => {
              console.log("Creating tenancy for property:", tip.property.id);
              
              const { error } = await supabase
                .from('tenancies')
                .insert({
                  property_id: tip.property.id,
                  tenant_id: session.user.id,
                  start_date: invitation.start_date,
                  end_date: invitation.end_date,
                  status: 'active'
                });

              if (error) {
                console.error("Error creating tenancy:", error);
                throw error;
              }
              
              return { success: true };
            });

            console.log("Waiting for all tenancies to be created...");
            const results = await Promise.all(tenancyPromises);
            console.log("Tenancy creation results:", results);

            // Update invitation status
            const { error: updateError } = await supabase
              .from('tenant_invitations')
              .update({ 
                status: 'accepted',
                used: true 
              })
              .eq('token', invitationToken);

            if (updateError) {
              console.error("Error updating invitation status:", updateError);
              throw updateError;
            }

            console.log("Invitation status updated successfully");

            toast({
              title: "Welcome!",
              description: "Your account has been set up successfully. Redirecting to your dashboard...",
            });

            // Add a small delay to ensure the toast is visible
            setTimeout(() => {
              navigate("/dashboard");
            }, 1500);
            
          } catch (error: any) {
            console.error("Error setting up tenant account:", error);
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
  }, [invitation, invitationToken, navigate, toast]);

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

  if (!invitation) {
    return null;
  }

  const propertyNames = invitation.tenant_invitation_properties
    .map((tip: any) => tip.property.name)
    .join(', ');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Complete Your Registration</CardTitle>
          <CardDescription className="text-center">
            You've been invited to join {propertyNames} as a tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            view="sign_up"
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