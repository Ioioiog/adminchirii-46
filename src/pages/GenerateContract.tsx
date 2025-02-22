import React, { useState } from 'react';
import { FormData, Asset } from '@/types/contract';
import { ContractForm } from '@/components/contract/ContractForm';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function GenerateContract() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([{
    name: '',
    value: '',
    condition: ''
  }]);

  const [formData, setFormData] = useState<FormData>({
    contractNumber: '1/01.01.2025',
    contractDate: '2025-01-01',
    ownerName: 'xxxx srl',
    ownerReg: 'Jxx/0000/0000',
    ownerFiscal: '000000',
    ownerAddress: 'Șoseaua ....., nr...., Bloc ..., Ap .... Et ....',
    ownerBank: 'RO00BREL0000000000000100',
    ownerBankName: 'BANK S.A.',
    ownerEmail: 'xxxxx@xxxx.com',
    ownerPhone: '0700000000',
    ownerCounty: 'București',
    ownerCity: 'București',
    ownerRepresentative: 'Administrator',
    tenantName: 'xxxx srl',
    tenantReg: 'J00/0000/0000',
    tenantFiscal: 'RO00000',
    tenantAddress: 'Șoseaua ....., nr...., Bloc ..., Ap .... Et ....',
    tenantBank: 'RO78BTRL00000000000',
    tenantBankName: 'Banca Transilvania',
    tenantEmail: 'xxxxxx@gmail.com',
    tenantPhone: '07000000',
    tenantCounty: 'București',
    tenantCity: 'București',
    tenantRepresentative: 'Administrator',
    propertyAddress: '',
    rentAmount: '1100',
    vatIncluded: 'nu',
    contractDuration: '12',
    paymentDay: '2',
    roomCount: '2',
    startDate: '2025-01-26',
    lateFee: '0.1',
    renewalPeriod: '12',
    unilateralNotice: '30',
    terminationNotice: '15',
    earlyTerminationFee: '2 chirii lunare',
    latePaymentTermination: '5',
    securityDeposit: '2 chirii lunare',
    depositReturnPeriod: '2',
    waterColdMeter: '0',
    waterHotMeter: '0',
    electricityMeter: '0',
    gasMeter: '0',
    ownerSignatureDate: '2025-01-26',
    ownerSignatureName: '',
    tenantSignatureDate: '2025-01-26',
    tenantSignatureName: '',
    assets: []
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAssetChange = (index: number, field: keyof Asset, value: string) => {
    const newAssets = [...assets];
    newAssets[index][field] = value;
    setAssets(newAssets);
    setFormData(prev => ({
      ...prev,
      assets: newAssets
    }));
  };

  const addAssetRow = () => {
    const newAsset = { name: '', value: '', condition: '' };
    setAssets(prev => [...prev, newAsset]);
    setFormData(prev => ({
      ...prev,
      assets: [...prev.assets, newAsset]
    }));
  };

  const deleteAssetRow = (index: number) => {
    setAssets(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      assets: prev.assets.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      <DashboardSidebar />

      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto relative">
          <div className="absolute left-0 -top-2">
            <Link to="/documents" state={{ activeTab: 'contracts' }}>
              <Button
                variant="ghost"
                className="gap-2 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
          
          <ContractForm
            formData={formData}
            assets={assets}
            onInputChange={handleInputChange}
            onAssetChange={handleAssetChange}
            onAddAsset={addAssetRow}
            onDeleteAsset={deleteAssetRow}
          />
        </div>
      </main>
    </div>
  );
}
