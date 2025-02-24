import { Json } from "@/integrations/supabase/types/json";

export interface Asset {
  [key: string]: string; // This makes Asset compatible with Json type
  name: string;
  value: string;
  condition: string;
}

export type ContractStatus = 'draft' | 'pending_signature' | 'signed' | 'expired' | 'cancelled';

export interface ContractStatusTransition {
  from: ContractStatus;
  to: ContractStatus;
  role: 'landlord' | 'tenant';
  action: string;
}

export const CONTRACT_STATUS_TRANSITIONS: ContractStatusTransition[] = [
  {
    from: 'draft',
    to: 'pending_signature',
    role: 'landlord',
    action: 'send_invite'
  },
  {
    from: 'pending_signature',
    to: 'signed',
    role: 'tenant',
    action: 'sign'
  },
  {
    from: 'pending_signature',
    to: 'cancelled',
    role: 'landlord',
    action: 'cancel'
  }
];

export const CONTRACT_STATUS_BADGES: Record<ContractStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}> = {
  draft: {
    label: 'Draft',
    variant: 'outline',
    className: 'bg-gray-100 text-gray-800'
  },
  pending_signature: {
    label: 'Pending Signature',
    variant: 'secondary',
    className: 'bg-yellow-100 text-yellow-800'
  },
  signed: {
    label: 'Signed',
    variant: 'default',
    className: 'bg-green-100 text-green-800'
  },
  expired: {
    label: 'Expired',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800'
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive',
    className: 'bg-gray-100 text-gray-800'
  }
};

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
