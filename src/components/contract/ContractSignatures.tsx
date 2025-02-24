import { FormData } from "@/types/contract";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import SignaturePad from 'react-signature-canvas';
import { Card } from "@/components/ui/card";

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

  useEffect(() => {
    setLocalFormData(formData);
  }, [formData]);

  useEffect(() => {
    const fetchContractStatus = async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('status')
        .eq('id', contractId)
        .single();
      
      if (data) {
        setContractStatus(data.status as ContractStatus);
        console.log('Contract status:', data.status);
      }
    };

    fetchContractStatus();
  }, [contractId]);

  const handleSign = async () => {
    console.log('Signing attempt - Role:', userRole);

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

        // Save signature to contract_signatures table
        const { data: existingSignatures } = await supabase
          .from('contract_signatures')
          .select('*')
          .eq('contract_id', contractId)
          .eq('signer_role', signerRole);

        if (existingSignatures && existingSignatures.length > 0) {
          const { error: updateError } = await supabase
            .from('contract_signatures')
            .update({
              signature_data: signatureName,
              signature_image: signatureImage,
              signed_at: new Date().toISOString()
            })
            .eq('id', existingSignatures[0].id);

          if (updateError) throw updateError;
        } else {
          const { error } = await supabase
            .from('contract_signatures')
            .insert({
              contract_id: contractId,
              signer_id: userId,
              signer_role: signerRole,
              signature_data: signatureName,
              signature_image: signatureImage,
              ip_address: await fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => data.ip)
            });

          if (error) throw error;
        }

        // Update contract metadata
        let updatedMetadata = {
          ...localFormData
        };

        if (isLandlord) {
          updatedMetadata.ownerSignatureDate = signatureDate;
          updatedMetadata.ownerSignatureName = signatureName;
          updatedMetadata.ownerSignatureImage = signatureImage;
        } else {
          updatedMetadata.tenantSignatureDate = signatureDate;
          updatedMetadata.tenantSignatureName = signatureName;
          updatedMetadata.tenantSignatureImage = signatureImage;
        }

        let newStatus: ContractStatus = contractStatus;
        if (isLandlord && !localFormData.tenantSignatureName) {
          newStatus = 'pending_signature';
        } else if (!isLandlord && localFormData.ownerSignatureName) {
          newStatus = 'signed';
        } else if (isLandlord && localFormData.tenantSignatureName) {
          newStatus = 'signed';
        }

        const { error: contractError } = await supabase
          .from('contracts')
          .update({
            metadata: updatedMetadata,
            status: newStatus
          })
          .eq('id', contractId);

        if (contractError) throw contractError;

        // Update both local state and parent component
        setLocalFormData(updatedMetadata);
        if (onFieldChange) {
          if (isLandlord) {
            onFieldChange('ownerSignatureDate', signatureDate);
            onFieldChange('ownerSignatureName', signatureName);
            onFieldChange('ownerSignatureImage', signatureImage);
          } else {
            onFieldChange('tenantSignatureDate', signatureDate);
            onFieldChange('tenantSignatureName', signatureName);
            onFieldChange('tenantSignatureImage', signatureImage);
          }
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

  const clearSignature = () => {
    signaturePadRef.current?.clear();
  };

  const canSignAsLandlord = userRole === 'landlord' && 
    (contractStatus === 'draft' || 
    (contractStatus === 'pending_signature' && localFormData.tenantSignatureName && !localFormData.ownerSignatureName));
    
  const canSignAsTenant = userRole === 'tenant' && 
    contractStatus === 'pending_signature' && 
    !localFormData.tenantSignatureName;
  
  console.log('Render conditions:', {
    userRole,
    contractStatus,
    canSignAsLandlord,
    canSignAsTenant,
    ownerSignature: localFormData.ownerSignatureName,
    tenantSignature: localFormData.tenantSignatureName
  });

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
                onClick={clearSignature}
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
                onClick={clearSignature}
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
