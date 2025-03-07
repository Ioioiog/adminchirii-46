import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tenant } from "@/types/tenant";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TenantListHeader } from "./TenantListHeader";
import { TenantCard } from "./TenantCard";
import { TenantRow } from "./TenantRow";

interface TenantListProps {
  tenants: Tenant[];
  isLandlord?: boolean;
}

export function TenantList({ tenants, isLandlord = false }: TenantListProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showInactive, setShowInactive] = useState(false);
  const { toast } = useToast();

  // Fetch tenants from both contracts and tenancies
  const { data: contractTenants = [] } = useQuery({
    queryKey: ["contract-tenants"],
    queryFn: async () => {
      console.log("Fetching contract and tenancy-based tenants...");
      
      // First, get tenants from contracts
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select(`
          id,
          tenant_id,
          property_id,
          valid_from,
          valid_until,
          status,
          metadata,
          invitation_email,
          tenant:profiles(
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          property:properties(
            id,
            name,
            address
          )
        `)
        .not('status', 'eq', 'cancelled');

      if (contractsError) {
        console.error("Error fetching contracts:", contractsError);
        throw contractsError;
      }

      // Then, get tenants from tenancies
      const { data: tenanciesData, error: tenanciesError } = await supabase
        .from('tenancies')
        .select(`
          id,
          tenant_id,
          property_id,
          start_date,
          end_date,
          status,
          tenant:profiles(
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          property:properties(
            id,
            name,
            address
          )
        `)
        .eq('status', 'active');

      if (tenanciesError) {
        console.error("Error fetching tenancies:", tenanciesError);
        throw tenanciesError;
      }

      // Transform contracts data
      const contractTenants = (contractsData || []).map((contract: any) => {
        const metadata = contract.metadata as { tenantSignatureName?: string } | null;
        return {
          id: contract.tenant?.id || contract.id,
          first_name: contract.tenant?.first_name || (metadata?.tenantSignatureName?.split(' ')[0]) || 'Unknown',
          last_name: contract.tenant?.last_name || (metadata?.tenantSignatureName?.split(' ').slice(1).join(' ')) || 'Tenant',
          email: contract.tenant?.email || contract.invitation_email || '',
          phone: contract.tenant?.phone || null,
          role: 'tenant',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          property: {
            id: contract.property?.id || '',
            name: contract.property?.name || '',
            address: contract.property?.address || '',
          },
          tenancy: {
            id: contract.id,
            start_date: contract.valid_from,
            end_date: contract.valid_until,
            status: contract.status === 'signed' ? 'active' : 'pending',
          },
        } as Tenant;
      });

      // Transform tenancies data
      const tenancyTenants = (tenanciesData || []).map((tenancy: any) => ({
        id: tenancy.tenant?.id || tenancy.tenant_id,
        first_name: tenancy.tenant?.first_name || 'Unknown',
        last_name: tenancy.tenant?.last_name || 'Tenant',
        email: tenancy.tenant?.email || '',
        phone: tenancy.tenant?.phone || null,
        role: 'tenant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        property: {
          id: tenancy.property?.id || '',
          name: tenancy.property?.name || '',
          address: tenancy.property?.address || '',
        },
        tenancy: {
          id: tenancy.id,
          start_date: tenancy.start_date,
          end_date: tenancy.end_date,
          status: tenancy.status,
        },
      }));

      // Combine and deduplicate tenants based on tenant_id and property_id
      const uniqueTenantsMap = new Map();
      [...contractTenants, ...tenancyTenants].forEach(tenant => {
        const key = `${tenant.id}-${tenant.property.id}`;
        if (!uniqueTenantsMap.has(key) || tenant.tenancy.status === 'active') {
          uniqueTenantsMap.set(key, tenant);
        }
      });

      const uniqueTenants = Array.from(uniqueTenantsMap.values());
      console.log("Combined unique tenants:", uniqueTenants);
      return uniqueTenants;
    },
  });

  const handleTenantUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ["tenants"] });
  };

  const handleDeleteTenant = async (tenantId: string) => {
    try {
      console.log("Deleting tenant:", tenantId);
      const { error: observationsError } = await supabase
        .from('tenant_observations')
        .delete()
        .eq('tenant_id', tenantId);

      if (observationsError) throw observationsError;

      const { data: tenancies, error: tenanciesFetchError } = await supabase
        .from('tenancies')
        .select('id, status')
        .eq('tenant_id', tenantId);

      if (tenanciesFetchError) throw tenanciesFetchError;

      for (const tenancy of tenancies || []) {
        if (tenancy.status !== 'inactive') {
          const { error: tenancyError } = await supabase
            .from('tenancies')
            .update({ status: 'inactive' })
            .eq('id', tenancy.id);

          if (tenancyError) throw tenancyError;
        }
      }

      toast({
        title: "Tenant deleted",
        description: "The tenant has been successfully removed.",
      });

      await queryClient.invalidateQueries({ queryKey: ["tenants"] });
    } catch (error) {
      console.error("Error in deletion process:", error);
      toast({
        title: "Error",
        description: "Failed to delete tenant. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTenantDisplayName = (tenant: Tenant) => {
    if (!tenant) return "No name provided";
    if (!tenant.first_name && !tenant.last_name) {
      return tenant.email || "No name provided";
    }
    return `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim();
  };

  // Combine regular tenants with contract tenants and deduplicate
  const allTenants = [...tenants, ...contractTenants];
  const uniqueTenantsMap = new Map();
  allTenants.forEach(tenant => {
    if (!tenant) return;
    const key = `${tenant.id}-${tenant.property?.id}`;
    if (!uniqueTenantsMap.has(key) || tenant.tenancy?.status === 'active') {
      uniqueTenantsMap.set(key, tenant);
    }
  });
  
  const uniqueTenants = Array.from(uniqueTenantsMap.values());
  console.log("Final unique tenants:", uniqueTenants);

  const filteredTenants = uniqueTenants.filter((tenant) => {
    if (!tenant) return false;
    
    const searchString = searchTerm.toLowerCase();
    const tenantName = getTenantDisplayName(tenant).toLowerCase();
    const tenantEmail = (tenant.email || "").toLowerCase();
    const propertyName = (tenant.property?.name || "").toLowerCase();
    const propertyAddress = (tenant.property?.address || "").toLowerCase();

    const matchesSearch = 
      tenantName.includes(searchString) ||
      tenantEmail.includes(searchString) ||
      propertyName.includes(searchString) ||
      propertyAddress.includes(searchString);
    
    const matchesStatus = showInactive ? true : tenant.tenancy?.status === 'active';

    return matchesSearch && matchesStatus;
  });

  console.log("Filtered tenants:", filteredTenants);

  return (
    <div className="space-y-6 animate-fade-in">
      <TenantListHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showInactive={showInactive}
        onShowInactiveChange={setShowInactive}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenants.map((tenant) => (
            <TenantCard
              key={`${tenant.id}-${tenant.tenancy?.id || 'no-tenancy'}`}
              tenant={tenant}
              onDelete={handleDeleteTenant}
              onUpdate={handleTenantUpdate}
              getTenantDisplayName={getTenantDisplayName}
              isLandlord={isLandlord}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Phone</TableHead>
                <TableHead className="font-semibold">Property</TableHead>
                <TableHead className="font-semibold">Start Date</TableHead>
                <TableHead className="font-semibold">End Date</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TenantRow
                  key={`${tenant.id}-${tenant.tenancy?.id || 'no-tenancy'}`}
                  tenant={tenant}
                  onDelete={handleDeleteTenant}
                  onUpdate={handleTenantUpdate}
                  getTenantDisplayName={getTenantDisplayName}
                  isLandlord={isLandlord}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
