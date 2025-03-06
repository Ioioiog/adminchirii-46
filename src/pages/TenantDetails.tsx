import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { ArrowLeft, User, Home, Calendar, Mail, Phone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tenant } from "@/types/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { ContractStatus } from "@/types/contract";
import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";

interface TenantContract {
  id: string;
  contract_type: string;
  status: ContractStatus;
  valid_from: string | null;
  valid_until: string | null;
  property_name: string;
}

const TenantDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [contracts, setContracts] = useState<TenantContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);

  useEffect(() => {
    const fetchTenantDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('tenant_details')
          .select('*')
          .eq('tenant_id', id);
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          const tenantData = data[0];
          
          const formattedTenant: Tenant = {
            id: tenantData.tenant_id,
            first_name: tenantData.first_name,
            last_name: tenantData.last_name,
            email: tenantData.email,
            phone: tenantData.phone,
            role: tenantData.role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            property: {
              id: tenantData.property_id,
              name: tenantData.property_name,
              address: tenantData.property_address,
            },
            tenancy: {
              id: tenantData.tenancy_id,
              start_date: tenantData.start_date,
              end_date: tenantData.end_date,
              status: tenantData.tenancy_status,
            },
          };
          
          setTenant(formattedTenant);
        } else {
          toast({
            title: "Not Found",
            description: "Tenant details could not be found",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error fetching tenant details:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to fetch tenant details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchTenantContracts = async () => {
      if (!id) return;
      
      try {
        setIsLoadingContracts(true);
        
        const { data, error } = await supabase
          .from('contracts')
          .select(`
            id, 
            contract_type, 
            status, 
            valid_from, 
            valid_until,
            properties:property_id (name)
          `)
          .eq('tenant_id', id);
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          const formattedContracts: TenantContract[] = data.map(contract => {
            let validStatus: ContractStatus = 'draft';
            
            if (
              contract.status === 'draft' || 
              contract.status === 'pending_signature' || 
              contract.status === 'signed' || 
              contract.status === 'expired' || 
              contract.status === 'cancelled'
            ) {
              validStatus = contract.status as ContractStatus;
            } else if (contract.status === 'pending') {
              validStatus = 'pending_signature';
            }
            
            return {
              id: contract.id,
              contract_type: contract.contract_type,
              status: validStatus,
              valid_from: contract.valid_from,
              valid_until: contract.valid_until,
              property_name: contract.properties?.name || 'Unknown property'
            };
          });
          
          setContracts(formattedContracts);
        }
      } catch (error: any) {
        console.error("Error fetching tenant contracts:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to fetch tenant contracts.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingContracts(false);
      }
    };

    fetchTenantDetails();
    fetchTenantContracts();
  }, [id, toast]);

  const renderContractStatusBadge = (status: ContractStatus) => {
    return <ContractStatusBadge status={status} />;
  };

  return (
    <div className="flex bg-dashboard-background min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/tenants")}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tenants
            </Button>
          </div>

          <PageHeader
            icon={User}
            title={tenant ? `${tenant.first_name} ${tenant.last_name}` : "Tenant Details"}
            description="View and manage tenant information"
          />

          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
            </div>
          ) : tenant ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium">{tenant.first_name} {tenant.last_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge variant={tenant.tenancy.status === 'active' ? 'default' : 'secondary'} 
                        className={tenant.tenancy.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}
                      >
                        {tenant.tenancy.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Email
                      </p>
                      <p className="font-medium">{tenant.email || "Not provided"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Phone
                      </p>
                      <p className="font-medium">{tenant.phone || "Not provided"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Property Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Home className="h-4 w-4" /> Property
                      </p>
                      <p className="font-medium">{tenant.property.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{tenant.property.address}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Tenancy Start Date
                      </p>
                      <p className="font-medium">
                        {tenant.tenancy.start_date ? 
                          format(new Date(tenant.tenancy.start_date), 'MMM d, yyyy') : 
                          "Not set"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Tenancy End Date
                      </p>
                      <p className="font-medium">
                        {tenant.tenancy.end_date ? 
                          format(new Date(tenant.tenancy.end_date), 'MMM d, yyyy') : 
                          "Not set"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Contracts
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingContracts ? (
                    <div className="flex justify-center p-4">
                      <div className="w-6 h-6 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
                    </div>
                  ) : contracts.length > 0 ? (
                    <div className="space-y-4">
                      {contracts.map((contract) => (
                        <div 
                          key={contract.id} 
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          onClick={() => navigate(`/documents/contracts/${contract.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold capitalize">
                                  {contract.contract_type.replace('_', ' ')}
                                </h3>
                                {renderContractStatusBadge(contract.status)}
                              </div>
                              <p className="text-sm text-gray-600">Property: {contract.property_name}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                {contract.valid_from && (
                                  <span>
                                    <span className="font-medium">From:</span> {format(new Date(contract.valid_from), 'MMM d, yyyy')}
                                  </span>
                                )}
                                {contract.valid_until && (
                                  <span>
                                    <span className="font-medium">To:</span> {format(new Date(contract.valid_until), 'MMM d, yyyy')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-3 md:mt-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/documents/contracts/${contract.id}`);
                              }}
                            >
                              View Contract
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <FileText className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No Contracts</h3>
                      <p className="text-gray-500 mt-2 mb-4">
                        This tenant doesn't have any contracts yet.
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => navigate(`/generate-contract?tenantId=${tenant.id}`)}
                      >
                        Generate Contract
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-4 mt-6">
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/chat?tenantId=${tenant.id}`)}
                >
                  Message Tenant
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Tenant Not Found</h3>
                <p className="text-gray-500 mb-6">The tenant you're looking for doesn't exist or you don't have permission to view it.</p>
                <Button onClick={() => navigate("/tenants")}>
                  Return to Tenant List
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default TenantDetails;
