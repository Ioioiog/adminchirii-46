
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, Calendar, Key } from "lucide-react";
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
            email,
            phone
          )
        `)
        .eq('property_id', property.id)
        .eq('status', 'signed');

      if (error) throw error;
      return data || [];
    }
  });

  // Create a Set to track tenant IDs we've already rendered
  const renderedTenantIds = new Set();

  const renderTenantCard = (tenant: any, source: 'tenancy' | 'contract') => {
    // Extract tenant ID based on source
    const tenantId = source === 'tenancy' 
      ? tenant.tenant?.id 
      : tenant.tenant_id;
    
    // Skip if we've already rendered this tenant
    if (tenantId && renderedTenantIds.has(tenantId)) {
      return null;
    }
    
    // For contracts without tenant_id, use email as unique identifier
    if (source === 'contract' && !tenantId && tenant.invitation_email) {
      if (renderedTenantIds.has(tenant.invitation_email)) {
        return null;
      }
      renderedTenantIds.add(tenant.invitation_email);
    } else if (tenantId) {
      // Mark this tenant as rendered
      renderedTenantIds.add(tenantId);
    }
    
    // Determine tenant name and email based on source
    let tenantName;
    let tenantEmail;
    let tenantPhone;
    let startDate;
    let endDate;
    let cardKey;
    let detailsUrl;
    let statusLabel;
    
    if (source === 'tenancy') {
      tenantName = `${tenant.tenant.first_name} ${tenant.tenant.last_name}`;
      tenantEmail = tenant.tenant.email;
      tenantPhone = tenant.tenant.phone || 'Not provided';
      startDate = tenant.start_date ? format(new Date(tenant.start_date), 'PPP') : 'Not specified';
      endDate = tenant.end_date ? format(new Date(tenant.end_date), 'PPP') : 'Ongoing';
      cardKey = tenant.id;
      detailsUrl = `/tenants/${tenant.tenant.id}`;
      statusLabel = tenant.status;
    } else { // contract
      tenantName = tenant.tenant 
        ? `${tenant.tenant.first_name} ${tenant.tenant.last_name}`
        : tenant.metadata?.tenantSignatureName || 'Not specified';
      tenantEmail = tenant.tenant?.email || tenant.invitation_email || 'Not specified';
      tenantPhone = tenant.tenant?.phone || 'Not provided';
      startDate = tenant.valid_from ? format(new Date(tenant.valid_from), 'PPP') : 'Not specified';
      endDate = tenant.valid_until ? format(new Date(tenant.valid_until), 'PPP') : 'Ongoing';
      cardKey = tenant.id;
      detailsUrl = tenant.tenant_id ? `/tenants/${tenant.tenant_id}` : `/contracts/${tenant.id}`;
      statusLabel = 'Contract Signed';
    }
    
    return (
      <div key={cardKey} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{tenantName}</h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Mail className="h-3.5 w-3.5 mr-1" />
                  <span>{tenantEmail}</span>
                </div>
                {tenantPhone && (
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Phone className="h-3.5 w-3.5 mr-1" />
                    <span>{tenantPhone}</span>
                  </div>
                )}
              </div>
            </div>
            <Badge variant="secondary" className="rounded-full">
              {statusLabel}
            </Badge>
          </div>
          
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <div>
                <span className="font-medium text-gray-600">Lease Period: </span>
                <span className="text-gray-800">{startDate} - {endDate === 'Ongoing' ? 'Ongoing' : endDate}</span>
              </div>
            </div>
            
            {source === 'contract' && (
              <div className="flex items-center text-sm">
                <Key className="h-4 w-4 mr-2 text-gray-500" />
                <div>
                  <span className="font-medium text-gray-600">Contract Type: </span>
                  <span className="text-gray-800">{tenant.contract_type || 'Standard Lease'}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate(detailsUrl)}
            >
              View Details
            </Button>
            {tenant.tenant?.id && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate(`/chat?tenantId=${tenant.tenant?.id || tenant.tenant_id}`)}
              >
                Message
              </Button>
            )}
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
          {property.tenancies?.map((tenancy: any) => renderTenantCard(tenancy, 'tenancy'))}
          {contracts?.map((contract: any) => renderTenantCard(contract, 'contract'))}
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
