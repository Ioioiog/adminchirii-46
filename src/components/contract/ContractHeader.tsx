
import { FormData } from "@/types/contract";

interface ContractHeaderProps {
  formData: FormData;
}

export function ContractHeader({ formData }: ContractHeaderProps) {
  return (
    <>
      <h1 className="text-3xl font-bold text-center mb-8">CONTRACT DE ÎNCHIRIERE A LOCUINȚEI</h1>
      <p className="mb-4">Nr. {formData.contractNumber || '_____'}/{formData.contractDate || '_____'}</p>
      <p className="mb-8 font-bold">Părțile,</p>
    </>
  );
}
