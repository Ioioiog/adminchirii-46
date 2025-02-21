
import React from "react";
import { Tenant } from "@/types/tenant";
import { TableCell, TableRow } from "@/components/ui/table";
import { TenancyStatus } from "./TenancyStatus";
import { TenantActions } from "./TenantActions";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TenantRowProps {
  tenant: Tenant;
  onDelete: (tenantId: string) => Promise<void>;
  onUpdate: () => void;
  getTenantDisplayName: (tenant: Tenant) => string;
  isLandlord?: boolean;
}

export function TenantRow({
  tenant,
  onDelete,
  onUpdate,
  getTenantDisplayName,
  isLandlord = false,
}: TenantRowProps) {
  const { data: hasUnreadMessages } = useQuery({
    queryKey: ['unreadMessages', tenant.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', tenant.id)  // Check messages from this tenant's profile
        .eq('read', false);           // That are unread

      if (error) {
        console.error('Error checking unread messages:', error);
        return false;
      }

      console.log(`Unread messages for tenant ${tenant.id}:`, count);
      return count ? count > 0 : false;
    },
    enabled: isLandlord,
    // Refresh every 10 seconds to check for new messages
    refetchInterval: 10000,
  });

  if (!tenant || !tenant.property) return null;

  return (
    <TableRow>
      <TableCell className="flex items-center gap-2">
        {getTenantDisplayName(tenant)}
        {hasUnreadMessages && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            New message
          </Badge>
        )}
      </TableCell>
      <TableCell>{tenant.email || "N/A"}</TableCell>
      <TableCell>{tenant.phone || "N/A"}</TableCell>
      <TableCell>
        {tenant.property.name} ({tenant.property.address})
      </TableCell>
      <TableCell>
        {tenant.tenancy?.start_date ? format(new Date(tenant.tenancy.start_date), 'PP') : 'N/A'}
      </TableCell>
      <TableCell>
        {tenant.tenancy?.end_date ? format(new Date(tenant.tenancy.end_date), 'PP') : 'Ongoing'}
      </TableCell>
      <TableCell>
        {tenant.tenancy && (
          <TenancyStatus 
            status={tenant.tenancy.status} 
            tenancyId={tenant.tenancy.id}
            onStatusChange={onUpdate}
            isLandlord={isLandlord}
          />
        )}
      </TableCell>
      <TableCell className="text-right">
        <TenantActions
          tenantId={tenant.id}
          tenantName={getTenantDisplayName(tenant)}
          tenant={tenant}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      </TableCell>
    </TableRow>
  );
}
