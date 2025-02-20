
import { FormData } from "@/types/contract";

interface ContractPartiesProps {
  formData: FormData;
}

export function ContractParties({ formData }: ContractPartiesProps) {
  return (
    <div className="mb-8">
      <p className="mb-4">{formData.ownerName || '_____'}, Nr. ordine Reg. com./an: {formData.ownerReg || '_____'}, 
      Cod fiscal (C.U.I.): {formData.ownerFiscal || '_____'}, cu sediul in {formData.ownerAddress || '_____'}, 
      cont bancar {formData.ownerBank || '_____'}, deschis la {formData.ownerBankName || '_____'}, 
      reprezentat: {formData.ownerRepresentative || '_____'}, e-mail: {formData.ownerEmail || '_____'}, 
      telefon: {formData.ownerPhone || '_____'} în calitate de PROPRIETAR,</p>
      
      <p className="mb-4">și</p>

      <p className="mb-4">{formData.tenantName || '_____'}, Nr. ordine Reg. com./an: {formData.tenantReg || '_____'}, 
      Cod fiscal (C.U.I.): {formData.tenantFiscal || '_____'}, cu domiciliul în {formData.tenantAddress || '_____'}, 
      cont bancar {formData.tenantBank || '_____'}, deschis la {formData.tenantBankName || '_____'}, 
      reprezentat: {formData.tenantRepresentative || '_____'}, e-mail: {formData.tenantEmail || '_____'}, 
      telefon: {formData.tenantPhone || '_____'} în calitate de CHIRIAȘ,</p>
    </div>
  );
}
