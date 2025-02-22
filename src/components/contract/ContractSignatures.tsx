
import { FormData } from "@/types/contract";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface ContractSignaturesProps {
  formData: FormData;
  contractId: string;
}

export function ContractSignatures({ formData, contractId }: ContractSignaturesProps) {
  const { userRole, userId } = useUserRole();
  const { toast } = useToast();
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [signatureName, setSignatureName] = useState("");

  const handleSign = async () => {
    if (!userId || !userRole) {
      toast({
        title: "Error",
        description: "You must be logged in to sign the contract",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('contract_signatures')
        .insert({
          contract_id: contractId,
          signer_id: userId,
          signer_role: userRole === 'landlord' ? 'landlord' : 'tenant',
          signature_data: signatureName,
          ip_address: await fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => data.ip)
        });

      if (error) throw error;

      // Update the contract's metadata with the signature
      const signatureDate = new Date().toISOString().split('T')[0];
      const newMetadata = {
        ...formData,
        [`${userRole}SignatureDate`]: signatureDate,
        [`${userRole}SignatureName`]: signatureName
      };

      const { error: contractError } = await supabase
        .from('contracts')
        .update({
          metadata: newMetadata,
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
      setIsSigningModalOpen(false);

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
  };

  return (
    <div className="grid grid-cols-2 gap-8 mt-16">
      <div>
        <p className="font-bold mb-2">PROPRIETAR,</p>
        <p className="mb-2">Data: {formData.ownerSignatureDate || '_____'}</p>
        <p className="mb-2">Nume în clar și semnătură:</p>
        <p>{formData.ownerSignatureName || '___________________________'}</p>
        {userRole === 'landlord' && !formData.ownerSignatureName && (
          <div className="mt-4">
            <Input
              type="text"
              placeholder="Enter your full name"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              className="mb-2"
            />
            <Button onClick={handleSign} className="w-full">
              Sign as Landlord
            </Button>
          </div>
        )}
      </div>
      <div>
        <p className="font-bold mb-2">CHIRIAȘ,</p>
        <p className="mb-2">Data: {formData.tenantSignatureDate || '_____'}</p>
        <p className="mb-2">Nume în clar și semnătură:</p>
        <p>{formData.tenantSignatureName || '___________________________'}</p>
        {userRole === 'tenant' && !formData.tenantSignatureName && (
          <div className="mt-4">
            <Input
              type="text"
              placeholder="Enter your full name"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              className="mb-2"
            />
            <Button onClick={handleSign} className="w-full">
              Sign as Tenant
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
