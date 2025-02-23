
import { Json } from "@/integrations/supabase/types/json";

export interface Asset {
  [key: string]: string; // This makes Asset compatible with Json type
  name: string;
  value: string;
  condition: string;
}

export type ContractStatus = 'draft' | 'pending' | 'signed' | 'expired' | 'cancelled' | 'pending_signature';

export interface FormData {
  contractNumber: string;
  contractDate: string;
  ownerName: string;
  ownerReg: string;
  ownerFiscal: string;
  ownerAddress: string;
  ownerBank: string;
  ownerBankName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerCounty: string;
  ownerCity: string;
  ownerRepresentative: string;
  tenantName: string;
  tenantReg: string;
  tenantFiscal: string;
  tenantAddress: string;
  tenantBank: string;
  tenantBankName: string;
  tenantEmail: string;
  tenantPhone: string;
  tenantCounty: string;
  tenantCity: string;
  tenantRepresentative: string;
  propertyAddress: string;
  rentAmount: string;
  vatIncluded: string;
  contractDuration: string;
  paymentDay: string;
  roomCount: string;
  startDate: string;
  lateFee: string;
  renewalPeriod: string;
  unilateralNotice: string;
  terminationNotice: string;
  earlyTerminationFee: string;
  latePaymentTermination: string;
  securityDeposit: string;
  depositReturnPeriod: string;
  waterColdMeter: string;
  waterHotMeter: string;
  electricityMeter: string;
  gasMeter: string;
  ownerSignatureDate: string;
  ownerSignatureName: string;
  ownerSignatureImage?: string;
  tenantSignatureDate: string;
  tenantSignatureName: string;
  tenantSignatureImage?: string;
  assets: Asset[];
}
