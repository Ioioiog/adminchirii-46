
import { FormData } from "@/types/contract";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import SignaturePad from 'react-signature-canvas';
import { Card } from "@/components/ui/card";

interface ContractSignaturesProps {
  formData: FormData;
  contractId: string;
}

export function ContractSignatures({ formData, contractId }: ContractSignaturesProps) {
  const { userRole, userId } = useUserRole();
  const { toast } = useToast();
  const [signatureName, setSignatureName] = useState("");
  const signaturePadRef = useRef<SignaturePad>(null);

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
        
        // First, check if a signature already exists for this user and role
        const { data: existingSignatures } = await supabase
          .from('contract_signatures')
          .select('*')
          .eq('contract_id', contractId)
          .eq('signer_role', userRole === 'landlord' ? 'landlord' : 'tenant');

        if (existingSignatures && existingSignatures.length > 0) {
          // If signature exists, update it instead of creating a new one
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
          // If no signature exists, create a new one
          const { error } = await supabase
            .from('contract_signatures')
            .insert({
              contract_id: contractId,
              signer_id: userId,
              signer_role: userRole === 'landlord' ? 'landlord' : 'tenant',
              signature_data: signatureName,
              signature_image: signatureImage,
              ip_address: await fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => data.ip)
            });

          if (error) throw error;
        }

        // Update the contract's metadata with the signature
        const signatureDate = new Date().toISOString().split('T')[0];
        const updatedMetadata = {
          ...formData,
          [`${userRole}SignatureDate`]: signatureDate,
          [`${userRole}SignatureName`]: signatureName,
          [`${userRole}SignatureImage`]: signatureImage
        };

        const { error: contractError } = await supabase
          .from('contracts')
          .update({
            metadata: updatedMetadata,
            status: 'signed'
          })
          .eq('id', contractId);

        if (contractError) throw contractError;

        toast({
          title: "Success",
          description: "Contract signed successfully",
        });

        // Reset state
        setSignatureName("");
        signaturePadRef.current?.clear();

        // Refresh the page to show updated signatures
        window.location.reload();
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

  // Render only one signature section based on user role
  const shouldShowLandlordSection = userRole === 'landlord' || formData.ownerSignatureName;
  const shouldShowTenantSection = userRole === 'tenant' || formData.tenantSignatureName;

  if (!shouldShowLandlordSection && !shouldShowTenantSection) {
    return null;
  }

  return (
    <div className="mt-16">
      {shouldShowLandlordSection && (
        <div>
          <p className="font-bold mb-2">PROPRIETAR,</p>
          <p className="mb-2">Data: {formData.ownerSignatureDate || '_____'}</p>
          <p className="mb-2">Nume în clar și semnătură:</p>
          {formData.ownerSignatureName ? (
            <>
              <p>{formData.ownerSignatureName}</p>
              {formData.ownerSignatureImage && (
                <img 
                  src={formData.ownerSignatureImage} 
                  alt="Owner Signature" 
                  className="mt-2 max-w-[200px]"
                />
              )}
            </>
          ) : (
            userRole === 'landlord' ? (
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
            ) : (
              <p>___________________________</p>
            )
          )}
        </div>
      )}
      {shouldShowTenantSection && (
        <div className="mt-8">
          <p className="font-bold mb-2">CHIRIAȘ,</p>
          <p className="mb-2">Data: {formData.tenantSignatureDate || '_____'}</p>
          <p className="mb-2">Nume în clar și semnătură:</p>
          {formData.tenantSignatureName ? (
            <>
              <p>{formData.tenantSignatureName}</p>
              {formData.tenantSignatureImage && (
                <img 
                  src={formData.tenantSignatureImage} 
                  alt="Tenant Signature" 
                  className="mt-2 max-w-[200px]"
                />
              )}
            </>
          ) : (
            userRole === 'tenant' ? (
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
            ) : (
              <p>___________________________</p>
            )
          )}
        </div>
      )}
    </div>
  );
}
