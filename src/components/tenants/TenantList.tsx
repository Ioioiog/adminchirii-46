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
import { useQueryClient } from "@tanstack/react-query";
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

  const filteredTenants = tenants.filter((tenant) => {
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