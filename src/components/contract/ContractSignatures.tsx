
import { FormData } from "@/types/contract";

interface ContractSignaturesProps {
  formData: FormData;
}

export function ContractSignatures({ formData }: ContractSignaturesProps) {
  return (
    <div className="grid grid-cols-2 gap-8 mt-16">
      <div>
        <p className="font-bold mb-2">PROPRIETAR,</p>
        <p className="mb-2">Data: {formData.ownerSignatureDate || '_____'}</p>
        <p className="mb-2">Nume în clar și semnătură:</p>
        <p>{formData.ownerSignatureName || '___________________________'}</p>
      </div>
      <div>
        <p className="font-bold mb-2">CHIRIAȘ,</p>
        <p className="mb-2">Data: {formData.tenantSignatureDate || '_____'}</p>
        <p className="mb-2">Nume în clar și semnătură:</p>
        <p>{formData.tenantSignatureName || '___________________________'}</p>
      </div>
    </div>
  );
}
