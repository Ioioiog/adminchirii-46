
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TenantsTabProps {
  property: any;
  activeTenants: any[];
}

export function TenantsTab({ property, activeTenants }: TenantsTabProps) {
  const navigate = useNavigate();

  // Fetch signed contracts for this property
  const { data: contracts } = useQuery({
    queryKey: ["property-contracts", property.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          id,
          tenant_id,
          status,
          metadata,
          valid_from,
          valid_until,
          invitation_email,
          tenant:profiles(
            first_name,
            last_name,
            email
          )
        `)
        .eq('property_id', property.id)
        .eq('status', 'signed');

      if (error) throw error;
      console.log('Fetched contracts:', data); // Debug log
      return data || [];
    }
  });

  // Create a Set to track tenant IDs we've already rendered
  const renderedTenantIds = new Set();

  const renderTenantCard = (tenancy: any) => {
    const tenantId = tenancy.tenant?.id;
    
    // Skip if we've already rendered this tenant
    if (renderedTenantIds.has(tenantId)) {
      return null;
    }
    
    // Mark this tenant as rendered
    renderedTenantIds.add(tenantId);
    
    const startDate = tenancy.start_date ? format(new Date(tenancy.start_date), 'PPP') : 'Not specified';
    const endDate = tenancy.end_date ? format(new Date(tenancy.end_date), 'PPP') : 'Ongoing';
    
    return (
      <div key={tenancy.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {tenancy.tenant.first_name} {tenancy.tenant.last_name}
                </h3>
                <p className="text-sm text-gray-500">{tenancy.tenant.email}</p>
              </div>
            </div>
            <Badge variant="secondary" className="rounded-full">
              {tenancy.status}
            </Badge>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Start Date</p>
              <p className="mt-1 text-sm text-gray-900">{startDate}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">End Date</p>
              <p className="mt-1 text-sm text-gray-900">{endDate}</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate(`/tenants/${tenancy.tenant.id}`)}
            >
              View Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate(`/chat?tenantId=${tenancy.tenant.id}`)}
            >
              Message
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderContractTenantCard = (contract: any) => {
    const tenantId = contract.tenant_id;
    
    // Skip if we've already rendered this tenant
    if (renderedTenantIds.has(tenantId)) {
      return null;
    }
    
    // Mark this tenant as rendered
    if (tenantId) {
      renderedTenantIds.add(tenantId);
    } else if (contract.invitation_email) {
      // For contracts without tenant_id, use email as unique identifier
      if (renderedTenantIds.has(contract.invitation_email)) {
        return null;
      }
      renderedTenantIds.add(contract.invitation_email);
    }
    
    // Try to get tenant name from different sources in order of preference
    const tenantName = contract.tenant 
      ? `${contract.tenant.first_name} ${contract.tenant.last_name}`
      : contract.metadata?.tenantSignatureName 
      || 'Not specified';
      
    const tenantEmail = contract.tenant?.email || contract.invitation_email || 'Not specified';
    
    const startDate = contract.valid_from ? format(new Date(contract.valid_from), 'PPP') : 'Not specified';
    const endDate = contract.valid_until ? format(new Date(contract.valid_until), 'PPP') : 'Ongoing';
    
    return (
      <div key={contract.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{tenantName}</h3>
                <p className="text-sm text-gray-500">{tenantEmail}</p>
              </div>
            </div>
            <Badge variant="secondary" className="rounded-full">
              Contract Signed
            </Badge>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Start Date</p>
              <p className="mt-1 text-sm text-gray-900">{startDate}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">End Date</p>
              <p className="mt-1 text-sm text-gray-900">{endDate}</p>
            </div>
          </div>
          <div className="mt-6">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate(`/contracts/${contract.id}`)}
            >
              View Contract
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const hasTenantsOrContracts = (property.tenancies && property.tenancies.length > 0) || 
                               (contracts && contracts.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Tenants</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and view details of all tenants associated with this property
          </p>
        </div>
        <Button
          onClick={() => navigate(`/properties/${property.id}/invite-tenant`)}
          size="sm"
          className="rounded-lg"
        >
          Invite Tenant
        </Button>
      </div>

      {hasTenantsOrContracts ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {property.tenancies?.map((tenancy: any) => renderTenantCard(tenancy))}
          {contracts?.map((contract: any) => renderContractTenantCard(contract))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <User className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="mt-4 text-sm font-medium text-gray-900">No Tenants</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by inviting tenants to this property
          </p>
          <Button
            onClick={() => navigate(`/properties/${property.id}/invite-tenant`)}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            Invite Tenant
          </Button>
        </div>
      )}
    </div>
  );
}
