import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useEffect, useState } from "react";
import { ContractContent } from "@/components/contract/ContractContent";
import { ContractSignatures } from "@/components/contract/ContractSignatures";
import { ContractHeader } from "@/components/contract/ContractHeader";
import { ContractError } from "@/components/contract/ContractError";
import { ContractPrintPreview } from "@/components/contract/ContractPrintPreview";
import { ContractPreviewDialog } from "@/components/contract/ContractPreviewDialog";

const queryClient = new QueryClient();

type ContractStatus = 'draft' | 'pending' | 'signed' | 'expired' | 'cancelled' | 'pending_signature';

interface Contract {
  id: string;
  properties?: { name: string };
  contract_type: string;
  status: ContractStatus;
  valid_from: string | null;
  valid_until: string | null;
  metadata: any;
}

function ContractDetailsContent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);

  const { data: contract, isLoading, error } = useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      if (!id) throw new Error('Contract ID is required');
      
      const query = supabase
        .from('contracts')
        .select('*, properties(name)')
        .eq('id', id);

      if (token) {
        query.eq('invitation_token', token);
        setShowDashboard(false);
      }

      const { data: contractData, error: contractError } = await query.single();

      if (contractError) throw contractError;
      if (!contractData) throw new Error('Contract not found');
      if (token && contractData.status !== 'pending' && contractData.status !== 'pending_signature') {
        throw new Error('This contract invitation has expired or been used');
      }

      return contractData as Contract;
    },
    retry: false
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && token) {
        navigate(`/tenant-registration?token=${token}&contractId=${id}`);
      }
    };

    checkAuth();
  }, [token, id, navigate]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <ContractError showDashboard={showDashboard} error={error} onBack={() => navigate('/documents')} />;
  if (!contract) return <div>Contract not found</div>;

  const { handlePrint } = ContractPrintPreview({
    queryClient,
    metadata: contract.metadata,
    contractId: id!,
    contractNumber: contract.metadata.contractNumber
  });

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      {showDashboard && (
        <div className="print:hidden">
          <DashboardSidebar />
        </div>
      )}
      <main className="flex-1 p-8 pt-12">
        <div className="max-w-7xl mx-auto space-y-6">
          <ContractHeader
            onBack={() => navigate('/documents')}
            onPreview={() => setIsPreviewModalOpen(true)}
            onPrint={handlePrint}
            onEmail={() => {}} // Implement email functionality later
          />

          <ContractContent formData={contract.metadata} />
          <ContractSignatures formData={contract.metadata} contractId={id!} />

          <ContractPreviewDialog
            isOpen={isPreviewModalOpen}
            onOpenChange={setIsPreviewModalOpen}
            metadata={contract.metadata}
            contractId={id!}
          />
        </div>
      </main>
    </div>
  );
}

export default function ContractDetails() {
  return (
    <QueryClientProvider client={queryClient}>
      <ContractDetailsContent />
    </QueryClientProvider>
  );
}
