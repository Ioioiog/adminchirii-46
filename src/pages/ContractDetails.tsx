import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Printer, Mail } from "lucide-react";
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useToast } from "@/hooks/use-toast";
import { ContractContent } from "@/components/contract/ContractContent";
import { ContractSignatures } from "@/components/contract/ContractSignatures";
import { ContractModals } from "@/components/contract/ContractModals";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { useTenants } from "@/hooks/useTenants";
import { useUserRole } from "@/hooks/use-user-role";
import type { FormData } from "@/types/contract";
import * as ReactDOMServer from 'react-dom/server';

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
  const { toast } = useToast();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedEmailOption, setSelectedEmailOption] = useState<string>('contract-tenant');
  const [customEmail, setCustomEmail] = useState('');
  const [selectedTenantEmail, setSelectedTenantEmail] = useState('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [editedData, setEditedData] = useState<FormData | null>(null);
  const { data: tenants = [] } = useTenants();
  const { userRole } = useUserRole();
  const [showDashboard, setShowDashboard] = useState(true);

  const { data: contract, isLoading, error } = useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      if (!id) throw new Error('Contract ID is required');

      console.log('Fetching contract with ID:', id);
      
      const query = supabase
        .from('contracts')
        .select('*, properties(name)')
        .eq('id', id);

      if (token) {
        query.eq('invitation_token', token);
        setShowDashboard(false);
      }

      const { data: contractData, error: contractError } = await query.single();

      if (contractError) {
        console.error('Error fetching contract:', contractError);
        throw contractError;
      }

      if (!contractData) {
        console.error('No contract found with ID:', id);
        throw new Error('Contract not found');
      }

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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex bg-[#F8F9FC] min-h-screen">
        {showDashboard && (
          <div className="print:hidden">
            <DashboardSidebar />
          </div>
        )}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/documents')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-xl font-semibold">Error Loading Contract</h1>
              </div>
            </div>
            <Card>
              <CardContent className="pt-6">
                <p className="text-red-500">
                  {error instanceof Error ? error.message : 'Failed to load contract details'}
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!contract) {
    return <div>Contract not found</div>;
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Could not open print window. Please check your popup blocker settings.",
        variant: "destructive"
      });
      return;
    }

    const contentHtml = ReactDOMServer.renderToString(
      <QueryClientProvider client={queryClient}>
        <div className="contract-preview">
          <ContractContent formData={contract.metadata} />
          <ContractSignatures formData={contract.metadata} contractId={id!} />
        </div>
      </QueryClientProvider>
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contract ${contract.metadata.contractNumber || ''}</title>
          <style>
            @media print {
              @page { size: A4; margin: 20mm; }
              body { font-family: Arial, sans-serif; }
            }
          </style>
        </head>
        <body>
          ${contentHtml}
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="flex bg-[#F8F9FC] min-h-screen">
      {showDashboard && (
        <div className="print:hidden">
          <DashboardSidebar />
        </div>
      )}
      <main className="flex-1 p-8 pt-12">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between bg-white rounded-lg shadow-soft-md p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/documents')}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 text-gray-600" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Contract Details</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setIsPreviewModalOpen(true)}
                size="sm"
                className="hover:bg-white hover:text-primary-600"
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button
                variant="ghost"
                onClick={handlePrint}
                size="sm"
                className="hover:bg-white hover:text-primary-600"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsEmailModalOpen(true)}
                size="sm"
                className="hover:bg-white hover:text-primary-600"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </div>

          <ContractContent formData={contract.metadata} />
          <ContractSignatures formData={contract.metadata} contractId={id!} />

          <ContractModals
            isPreviewModalOpen={isPreviewModalOpen}
            setIsPreviewModalOpen={setIsPreviewModalOpen}
            isEmailModalOpen={isEmailModalOpen}
            setIsEmailModalOpen={setIsEmailModalOpen}
            selectedEmailOption={selectedEmailOption}
            setSelectedEmailOption={setSelectedEmailOption}
            customEmail={customEmail}
            setCustomEmail={setCustomEmail}
            selectedTenantEmail={selectedTenantEmail}
            setSelectedTenantEmail={setSelectedTenantEmail}
            metadata={contract.metadata}
            contractId={id!}
            onSendEmail={() => {
              setIsEmailModalOpen(false);
            }}
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
