
import { FormData } from "@/types/contract";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import SignaturePad from 'react-signature-canvas';
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

type ContractStatus = 'draft' | 'pending_signature' | 'signed' | 'expired' | 'cancelled';

interface ContractSignaturesProps {
  formData: FormData;
  contractId: string;
  canSign?: boolean;
  onFieldChange?: (field: keyof FormData, value: string) => void;
  readOnly?: boolean;
}

export function ContractSignatures({ 
  formData, 
  contractId, 
  canSign = false,
  onFieldChange,
  readOnly = false 
}: ContractSignaturesProps) {
  const { userRole, userId } = useUserRole();
  const { toast } = useToast();
  const [signatureName, setSignatureName] = useState("");
  const [localFormData, setLocalFormData] = useState(formData);
  const signaturePadRef = useRef<SignaturePad>(null);
  const [contractStatus, setContractStatus] = useState<ContractStatus>('draft');

  const { data: signatures, refetch: refetchSignatures, error: signatureError } = useQuery({
    queryKey: ['contract-signatures', contractId, userId, userRole],
    queryFn: async () => {
      console.log('Fetching signatures for contract:', contractId);
      console.log('Current user:', { userRole, userId });

      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('id, tenant_id, landlord_id, status')
        .eq('id', contractId)
        .maybeSingle();

      if (contractError) {
        console.error('Error fetching contract:', contractError);
        throw contractError;
      }

      if (!contract) {
        console.error('Contract not found:', contractId);
        throw new Error('Contract not found');
      }

      console.log('Found contract:', contract);

      console.log('Executing signatures query for:', {
        contractId,
        userRole,
        userId
      });

      const { data, error } = await supabase
        .from('contract_signatures')
        .select('*')
        .eq('contract_id', contractId);

      if (error) {
        console.error('Error fetching signatures:', error);
        throw error;
      }

      console.log('Raw signatures response:', data);

      if (data && data.length > 0) {
        data.forEach((sig, index) => {
          console.log(`Signature ${index + 1}:`, {
            signerRole: sig.signer_role,
            signerId: sig.signer_id,
            signedAt: sig.signed_at
          });
        });
      } else {
        console.log('No signatures found for contract');
      }

      return data || [];
    },
    retry: 1,
    enabled: !!userId && !!contractId // Only run query when we have both userId and contractId
  });

  useEffect(() => {
    if (signatureError) {
      console.error('Signature query error:', signatureError);
      toast({
        title: "Error",
        description: "Failed to load signatures. Please try refreshing the page.",
        variant: "destructive"
      });
    }
  }, [signatureError, toast]);

  useEffect(() => {
    if (signatures) {
      const tenantSignature = signatures.find(s => s.signer_role === 'tenant');
      const ownerSignature = signatures.find(s => s.signer_role === 'landlord');

      console.log('Processing signatures:', {
        tenantSignature,
        ownerSignature,
        currentFormData: formData
      });

      const updatedFormData = {
        ...formData,
        tenantSignatureName: tenantSignature?.signature_data || '',
        tenantSignatureImage: tenantSignature?.signature_image || '',
        tenantSignatureDate: tenantSignature?.signed_at?.split('T')[0] || '',
        ownerSignatureName: ownerSignature?.signature_data || '',
        ownerSignatureImage: ownerSignature?.signature_image || '',
        ownerSignatureDate: ownerSignature?.signed_at?.split('T')[0] || ''
      };

      console.log('Updated form data:', updatedFormData);
      setLocalFormData(updatedFormData);

      if (tenantSignature && ownerSignature) {
        console.log('Both signatures present, setting status to signed');
        setContractStatus('signed');
      }
    }
  }, [signatures, formData]);

  useEffect(() => {
    const fetchContractStatus = async () => {
      try {
        console.log('Fetching contract status for:', contractId);
        const { data, error } = await supabase
          .from('contracts')
          .select('status')
          .eq('id', contractId)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching contract status:', error);
          throw error;
        }

        console.log('Contract status:', data?.status);
        if (data) {
          setContractStatus(data.status as ContractStatus);
        }
      } catch (error) {
        console.error('Failed to fetch contract status:', error);
        toast({
          title: "Error",
          description: "Failed to load contract status",
          variant: "destructive"
        });
      }
    };

    fetchContractStatus();
  }, [contractId, toast]);

  const handleSign = async () => {
    console.log('Starting signing process:', {
      userRole,
      userId,
      contractStatus,
      currentSignatures: signatures
    });

    if (!userId || !userRole) {
      toast({
        title: "Error",
        description: "You must be logged in to sign the contract",
        variant: "destructive"
      });
      return;
    }

    if (!signaturePadRef.current?.isEmpty() && signatureName) {
      try {
        const signatureImage = signaturePadRef.current?.getTrimmedCanvas().toDataURL('image/png');
        const signatureDate = new Date().toISOString().split('T')[0];
        const isLandlord = userRole === 'landlord';
        const signerRole = isLandlord ? 'landlord' : 'tenant';

        console.log('Saving signature:', {
          contractId,
          signerRole,
          signatureName,
          signatureDate,
          userId
        });

        const { error: signatureError } = await supabase
          .from('contract_signatures')
          .insert({
            contract_id: contractId,
            signer_id: userId,
            signer_role: signerRole,
            signature_data: signatureName,
            signature_image: signatureImage,
            signed_at: new Date().toISOString(),
            ip_address: await fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => data.ip)
          });

        if (signatureError) {
          console.error('Error saving signature:', signatureError);
          throw signatureError;
        }

        console.log('Signature saved successfully');

        await refetchSignatures();

        const newStatus = 
          (signatures?.some(s => s.signer_role === 'landlord') && signerRole === 'tenant') ||
          (signatures?.some(s => s.signer_role === 'tenant') && signerRole === 'landlord')
            ? 'signed'
            : isLandlord
              ? 'pending_signature'
              : contractStatus;

        console.log('Updating contract status to:', newStatus);

        const { error: contractError } = await supabase
          .from('contracts')
          .update({ status: newStatus })
          .eq('id', contractId);

        if (contractError) {
          console.error('Error updating contract status:', contractError);
          throw contractError;
        }

        toast({
          title: "Success",
          description: "Contract signed successfully",
        });

        setSignatureName("");
        signaturePadRef.current?.clear();
        setContractStatus(newStatus);
      } catch (error: any) {
        console.error('Error signing contract:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to sign the contract",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Please provide both your name and signature",
        variant: "destructive"
      });
    }
  };

  const canSignAsLandlord = userRole === 'landlord' && 
    (contractStatus === 'draft' || 
    (contractStatus === 'pending_signature' && localFormData.tenantSignatureName && !localFormData.ownerSignatureName));
    
  const canSignAsTenant = userRole === 'tenant' && 
    contractStatus === 'pending_signature' && 
    !localFormData.tenantSignatureName;

  return (
    <div className="grid grid-cols-2 gap-8 mt-16">
      <div>
        <p className="font-bold mb-2">PROPRIETAR,</p>
        <p className="mb-2">Data: {localFormData.ownerSignatureDate || '_____'}</p>
        <p className="mb-2">Nume în clar și semnătură:</p>
        {localFormData.ownerSignatureName ? (
          <>
            <p>{localFormData.ownerSignatureName}</p>
            {localFormData.ownerSignatureImage && (
              <img 
                src={localFormData.ownerSignatureImage} 
                alt="Owner Signature" 
                className="mt-2 max-w-[200px]"
              />
            )}
          </>
        ) : (
          <p>___________________________</p>
        )}
        {canSignAsLandlord && (
          <div className="mt-4">
            <Input
              type="text"
              placeholder="Enter your full name"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              className="mb-2"
            />
            <Card className="p-4 mb-2">
              <p className="text-sm text-gray-500 mb-2">Draw your signature below:</p>
              <SignaturePad
                ref={signaturePadRef}
                canvasProps={{
                  className: 'border border-gray-200 rounded-md w-full',
                  width: 300,
                  height: 150
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => signaturePadRef.current?.clear()}
                className="mt-2"
              >
                Clear
              </Button>
            </Card>
            <Button onClick={handleSign} className="w-full">
              Sign as Landlord
            </Button>
          </div>
        )}
      </div>
      <div>
        <p className="font-bold mb-2">CHIRIAȘ,</p>
        <p className="mb-2">Data: {localFormData.tenantSignatureDate || '_____'}</p>
        <p className="mb-2">Nume în clar și semnătură:</p>
        {localFormData.tenantSignatureName ? (
          <>
            <p>{localFormData.tenantSignatureName}</p>
            {localFormData.tenantSignatureImage && (
              <img 
                src={localFormData.tenantSignatureImage} 
                alt="Tenant Signature" 
                className="mt-2 max-w-[200px]"
              />
            )}
          </>
        ) : (
          <p>___________________________</p>
        )}
        {canSignAsTenant && (
          <div className="mt-4">
            <Input
              type="text"
              placeholder="Enter your full name"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              className="mb-2"
            />
            <Card className="p-4 mb-2">
              <p className="text-sm text-gray-500 mb-2">Draw your signature below:</p>
              <SignaturePad
                ref={signaturePadRef}
                canvasProps={{
                  className: 'border border-gray-200 rounded-md w-full',
                  width: 300,
                  height: 150
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => signaturePadRef.current?.clear()}
                className="mt-2"
              >
                Clear
              </Button>
            </Card>
            <Button onClick={handleSign} className="w-full">
              Sign as Tenant
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
