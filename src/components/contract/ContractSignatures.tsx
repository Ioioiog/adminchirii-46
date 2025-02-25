import { FormData } from "@/types/contract";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import SignaturePad from 'react-signature-canvas';
import { Card } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  const [signatureName, setSignatureName] = useState("");
  const [localFormData, setLocalFormData] = useState(formData);
  const signaturePadRef = useRef<SignaturePad>(null);
  const [contractStatus, setContractStatus] = useState<ContractStatus>('draft');
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: contract, isLoading: isContractLoading } = useQuery({
    queryKey: ['contract', contractId],
    enabled: !!userId,
    queryFn: async () => {
      console.log('Fetching contract details for:', contractId);
      const { data, error } = await supabase
        .from('contracts')
        .select('*, properties(name)')
        .eq('id', contractId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching contract:', error);
        throw error;
      }
      
      console.log('Contract details:', data);
      if (data) {
        setContractStatus(data.status as ContractStatus);
      }
      return data;
    }
  });

  const { data: signatures, isLoading: isSignaturesLoading } = useQuery({
    queryKey: ['contract-signatures', contractId],
    enabled: !!userId,
    queryFn: async () => {
      console.log('Starting signature fetch for contract:', contractId);
      
      const { data, error } = await supabase
        .from('contract_signatures')
        .select('*')
        .eq('contract_id', contractId);

      if (error) {
        console.error('Error fetching signatures:', error);
        throw error;
      }

      console.log('Contract signatures found:', data);
      console.log('Number of signatures:', data?.length);
      
      if (data) {
        data.forEach(sig => {
          console.log('Signature details:', {
            id: sig.id,
            signer_role: sig.signer_role,
            signer_id: sig.signer_id,
            signed_at: sig.signed_at,
            has_image: !!sig.signature_image,
            has_data: !!sig.signature_data
          });
        });

        const hasLandlordSig = data.some(s => s.signer_role === 'landlord');
        const hasTenantSig = data.some(s => s.signer_role === 'tenant');
        console.log('Signature status check:', {
          hasLandlordSignature: hasLandlordSig,
          hasTenantSignature: hasTenantSig,
          shouldBeMarkedAsSigned: hasLandlordSig && hasTenantSig
        });
      }

      return data || [];
    }
  });

  useEffect(() => {
    if (userRole && userId && !isInitialized) {
      console.log('Component initialized with:', { userRole, userId });
      setIsInitialized(true);
    }
  }, [userRole, userId, isInitialized]);

  useEffect(() => {
    if (signatures && signatures.length > 0) {
      const tenantSignature = signatures.find(s => s.signer_role === 'tenant');
      const ownerSignature = signatures.find(s => s.signer_role === 'landlord');

      console.log('Processing signatures:', {
        foundTenantSignature: !!tenantSignature,
        foundOwnerSignature: !!ownerSignature,
        tenantDetails: tenantSignature ? {
          date: tenantSignature.signed_at,
          hasImage: !!tenantSignature.signature_image,
          hasName: !!tenantSignature.signature_data
        } : null,
        ownerDetails: ownerSignature ? {
          date: ownerSignature.signed_at,
          hasImage: !!ownerSignature.signature_image,
          hasName: !!ownerSignature.signature_data
        } : null
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

      console.log('Updated form data with signatures:', {
        hasOwnerSig: !!updatedFormData.ownerSignatureName,
        hasOwnerImage: !!updatedFormData.ownerSignatureImage,
        hasOwnerDate: !!updatedFormData.ownerSignatureDate,
        hasTenantSig: !!updatedFormData.tenantSignatureName,
        hasTenantImage: !!updatedFormData.tenantSignatureImage,
        hasTenantDate: !!updatedFormData.tenantSignatureDate
      });

      setLocalFormData(updatedFormData);
    }
  }, [signatures, formData, contractStatus]);

  const handleSign = async () => {
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
        const isLandlord = userRole === 'landlord';
        const signerRole = isLandlord ? 'landlord' : 'tenant';

        console.log('Starting signature process:', {
          isLandlord,
          signerRole,
          userId,
          currentStatus: contractStatus
        });

        if (isLandlord && contractStatus !== 'draft') {
          throw new Error('Landlords can only sign contracts in draft status');
        }
        if (!isLandlord && contractStatus !== 'pending_signature') {
          throw new Error('Tenants can only sign contracts in pending signature status');
        }

        const { data: newSignature, error: signatureError } = await supabase
          .from('contract_signatures')
          .insert({
            contract_id: contractId,
            signer_id: userId,
            signer_role: signerRole,
            signature_data: signatureName,
            signature_image: signatureImage,
            signed_at: new Date().toISOString(),
            ip_address: await fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => data.ip)
          })
          .select()
          .single();

        if (signatureError) {
          console.error('Error saving signature:', signatureError);
          throw signatureError;
        }

        const { data: currentSignatures, error: fetchError } = await supabase
          .from('contract_signatures')
          .select('*')
          .eq('contract_id', contractId);

        if (fetchError) {
          console.error('Error fetching current signatures:', fetchError);
          throw fetchError;
        }

        console.log('All signatures after adding new one:', currentSignatures);

        const hasLandlordSig = currentSignatures?.some(s => s.signer_role === 'landlord');
        const hasTenantSig = currentSignatures?.some(s => s.signer_role === 'tenant');

        console.log('Signature verification:', {
          hasLandlordSig,
          hasTenantSig,
          shouldUpdateToSigned: hasLandlordSig && hasTenantSig
        });

        const updateData: {
          status: ContractStatus;
          tenant_id?: string;
        } = {
          status: hasLandlordSig && hasTenantSig ? 'signed' : 'pending_signature'
        };

        if (!isLandlord) {
          updateData.tenant_id = userId;
        }

        console.log('Updating contract with:', updateData);

        const { error: updateError, data: updatedContract } = await supabase
          .from('contracts')
          .update(updateData)
          .eq('id', contractId)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating contract:', updateError);
          throw updateError;
        }

        console.log('Contract updated successfully:', updatedContract);

        setContractStatus(updateData.status);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['contract', contractId] }),
          queryClient.invalidateQueries({ queryKey: ['contract-signatures', contractId] })
        ]);

        toast({
          title: "Success",
          description: "Contract signed successfully",
        });

        setSignatureName("");
        signaturePadRef.current?.clear();

      } catch (error: any) {
        console.error('Error in contract signing process:', error);
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

  const canSignAsLandlord = userRole === 'landlord' && contractStatus === 'draft';
  const canSignAsTenant = userRole === 'tenant' && contractStatus === 'pending_signature';
  
  const hasSignedAsLandlord = signatures?.some(s => s.signer_role === 'landlord' && s.signer_id === userId);
  const hasSignedAsTenant = signatures?.some(s => s.signer_role === 'tenant' && s.signer_id === userId);

  if (!isInitialized) {
    return <div>Loading signatures...</div>;
  }

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
        {canSignAsLandlord && !hasSignedAsLandlord && (
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
        {canSignAsTenant && !hasSignedAsTenant && (
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
