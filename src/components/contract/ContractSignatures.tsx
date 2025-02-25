
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

  console.log("ContractSignatures component mounted with:", {
    contractId,
    userRole,
    userId,
    formData
  });

  // Query to get contract details
  const { data: contract, isLoading: isContractLoading } = useQuery({
    queryKey: ['contract', contractId],
    enabled: !!userId, // Only run query when userId is available
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

  // Query to get signatures
  const { data: signatures, isLoading: isSignaturesLoading, error: signaturesError } = useQuery({
    queryKey: ['contract-signatures', contractId],
    enabled: !!userId, // Only run query when userId is available
    queryFn: async () => {
      console.log('Fetching signatures for contract:', contractId);
      
      const { data, error } = await supabase
        .from('contract_signatures')
        .select('*')
        .eq('contract_id', contractId);

      if (error) {
        console.error('Error fetching signatures:', error);
        throw error;
      }

      console.log('Signatures data:', data);
      return data || [];
    }
  });

  useEffect(() => {
    // Wait for both userRole and userId to be available
    if (userRole && userId && !isInitialized) {
      setIsInitialized(true);
    }
  }, [userRole, userId, isInitialized]);

  useEffect(() => {
    console.log('Processing signatures effect:', {
      signatures,
      signaturesError,
      isSignaturesLoading
    });

    if (signatures && signatures.length > 0) {
      const tenantSignature = signatures.find(s => s.signer_role === 'tenant');
      const ownerSignature = signatures.find(s => s.signer_role === 'landlord');

      console.log('Found signatures:', {
        tenantSignature,
        ownerSignature,
        status: contractStatus
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

        // Verify contract status matches role
        if (isLandlord && contractStatus !== 'draft') {
          throw new Error('Landlords can only sign contracts in draft status');
        }
        if (!isLandlord && contractStatus !== 'pending_signature') {
          throw new Error('Tenants can only sign contracts in pending signature status');
        }

        // Save the signature
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

        // Get all signatures after adding the new one
        const { data: currentSignatures, error: fetchError } = await supabase
          .from('contract_signatures')
          .select('*')
          .eq('contract_id', contractId);

        if (fetchError) {
          console.error('Error fetching current signatures:', fetchError);
          throw fetchError;
        }

        console.log('All signatures after adding new one:', currentSignatures);

        // Check signature status
        const hasLandlordSig = currentSignatures?.some(s => s.signer_role === 'landlord');
        const hasTenantSig = currentSignatures?.some(s => s.signer_role === 'tenant');

        // Prepare contract update
        const updateData: {
          status: ContractStatus;
          tenant_id?: string;
        } = {
          status: hasLandlordSig && hasTenantSig ? 'signed' : 'pending_signature'
        };

        // Set tenant_id if tenant is signing
        if (!isLandlord) {
          updateData.tenant_id = userId;
        }

        console.log('Updating contract with:', updateData);

        // Update contract status
        const { error: updateError } = await supabase
          .from('contracts')
          .update(updateData)
          .eq('id', contractId);

        if (updateError) {
          console.error('Error updating contract:', updateError);
          throw updateError;
        }

        // Update local state and refetch data
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

  console.log('Rendering signatures with state:', {
    canSignAsLandlord,
    canSignAsTenant,
    contractStatus,
    localFormData,
    isInitialized
  });

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
