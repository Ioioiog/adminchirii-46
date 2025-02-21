
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
      // First, check if the user has a conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('tenant_id', tenant.id)
        .single();

      if (convError && convError.code !== 'PGRST116') {
        console.error('Error checking conversation:', convError);
        return false;
      }

      if (!conversation) {
        return false;
      }

      // Then check for unread messages in that conversation
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .eq('read', false)
        .eq('profile_id', tenant.id);

      if (error) {
        console.error('Error checking unread messages:', error);
        return false;
      }

      console.log(`Unread messages check for tenant ${tenant.id}:`, {
        tenantId: tenant.id,
        conversationId: conversation.id,
        messages: messages,
        count: messages?.length || 0
      });
      
      return messages && messages.length > 0;
    },
    enabled: isLandlord,
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
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}
