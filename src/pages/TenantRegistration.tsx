
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FormData } from "@/types/contract";

interface Contract {
  id: string;
  properties?: { name: string };
  property_id: string;
  metadata: FormData;
  status: 'draft' | 'pending' | 'signed' | 'expired' | 'cancelled' | 'pending_signature';
}

const transformMetadataToFormData = (metadata: any): FormData => {
  return {
    contractNumber: metadata?.contractNumber || '',
    contractDate: metadata?.contractDate || '',
    ownerName: metadata?.ownerName || '',
    ownerReg: metadata?.ownerReg || '',
    ownerFiscal: metadata?.ownerFiscal || '',
    ownerAddress: metadata?.ownerAddress || '',
    ownerBank: metadata?.ownerBank || '',
    ownerBankName: metadata?.ownerBankName || '',
    ownerEmail: metadata?.ownerEmail || '',
    ownerPhone: metadata?.ownerPhone || '',
    ownerCounty: metadata?.ownerCounty || '',
    ownerCity: metadata?.ownerCity || '',
    ownerRepresentative: metadata?.ownerRepresentative || '',
    tenantName: metadata?.tenantName || '',
    tenantReg: metadata?.tenantReg || '',
    tenantFiscal: metadata?.tenantFiscal || '',
    tenantAddress: metadata?.tenantAddress || '',
    tenantBank: metadata?.tenantBank || '',
    tenantBankName: metadata?.tenantBankName || '',
    tenantEmail: metadata?.tenantEmail || '',
    tenantPhone: metadata?.tenantPhone || '',
    tenantCounty: metadata?.tenantCounty || '',
    tenantCity: metadata?.tenantCity || '',
    tenantRepresentative: metadata?.tenantRepresentative || '',
    propertyAddress: metadata?.propertyAddress || '',
    rentAmount: metadata?.rentAmount || '',
    vatIncluded: metadata?.vatIncluded || '',
    contractDuration: metadata?.contractDuration || '',
    paymentDay: metadata?.paymentDay || '',
    roomCount: metadata?.roomCount || '',
    startDate: metadata?.startDate || '',
    lateFee: metadata?.lateFee || '',
    renewalPeriod: metadata?.renewalPeriod || '',
    unilateralNotice: metadata?.unilateralNotice || '',
    terminationNotice: metadata?.terminationNotice || '',
    earlyTerminationFee: metadata?.earlyTerminationFee || '',
    latePaymentTermination: metadata?.latePaymentTermination || '',
    securityDeposit: metadata?.securityDeposit || '',
    depositReturnPeriod: metadata?.depositReturnPeriod || '',
    waterColdMeter: metadata?.waterColdMeter || '',
    waterHotMeter: metadata?.waterHotMeter || '',
    electricityMeter: metadata?.electricityMeter || '',
    gasMeter: metadata?.gasMeter || '',
    ownerSignatureDate: metadata?.ownerSignatureDate || '',
    ownerSignatureName: metadata?.ownerSignatureName || '',
    ownerSignatureImage: metadata?.ownerSignatureImage,
    tenantSignatureDate: metadata?.tenantSignatureDate || '',
    tenantSignatureName: metadata?.tenantSignatureName || '',
    tenantSignatureImage: metadata?.tenantSignatureImage,
    assets: Array.isArray(metadata?.assets) ? metadata.assets : []
  };
};

const TenantRegistration = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Extract params from the URL
  const token = searchParams.get('token') || '';
  const contractId = searchParams.get('contractId') || '';
  
  const [isLoading, setIsLoading] = useState(true);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);

  const showError = (title: string, description: string) => {
    toast({ title, description, variant: "destructive" });
    navigate("/auth");
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Current session:", session?.user?.id);
        
        if (session?.user) {
          if (!token && contractId) {
            const { data } = await supabase
              .from('contracts')
              .select('tenant_id')
              .eq('id', contractId)
              .maybeSingle();

            if (data?.tenant_id === session.user.id) {
              navigate(`/documents/contracts/${contractId}`);
              return;
            }
          }
        } else if (!token) {
          navigate('/auth');
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };

    checkSession();
  }, [navigate, token, contractId]);

  useEffect(() => {
    const verifyContract = async () => {
      if (!token || !contractId) {
        showError("Invalid Invitation", "This invitation link is invalid or has expired.");
        return;
      }

      try {
        const { data, error } = await supabase
          .from('contracts')
          .select(`
            *,
            properties(*)
          `)
          .eq('id', contractId)
          .maybeSingle();

        if (error || !data) {
          showError("Invalid Contract", "This contract does not exist or has been deleted.");
          return;
        }
        
        if (data.invitation_token !== token) {
          showError("Invalid Invitation", "This invitation link is invalid or has expired.");
          return;
        }
        
        if (!['pending', 'pending_signature'].includes(data.status)) {
          showError("Invalid Contract Status", "This contract is no longer available for signing.");
          return;
        }

        const formData = transformMetadataToFormData(data.metadata);
        
        if (!formData.tenantEmail) {
          showError("Invalid Contract", "Contract is missing tenant information.");
          return;
        }

        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', formData.tenantEmail)
          .maybeSingle();

        const transformedContract: Contract = {
          id: data.id,
          properties: data.properties,
          property_id: data.property_id,
          metadata: formData,
          status: data.status
        };

        setIsExistingUser(!!existingUser);
        setContract(transformedContract);
        
      } catch (error) {
        console.error("Contract verification error:", error);
        showError("Error", "Failed to verify invitation. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (token && contractId) {
      verifyContract();
    } else {
      setIsLoading(false);
    }
  }, [token, contractId, navigate, toast]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session && contract) {
          try {
            console.log("Processing new tenant registration");
            
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

            navigate(`/documents/contracts/${contractId}?token=${token}`);
            
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

  if (!contract && !token) {
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
