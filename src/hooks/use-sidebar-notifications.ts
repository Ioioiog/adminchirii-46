
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/use-user-role';
import { Notification, NotificationType } from '@/types/notifications';
import { useToast } from '@/hooks/use-toast';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type Message = {
  id: string;
  content: string;
  created_at: string;
  read: boolean;
  receiver_id: string | null;
  sender_id: string;
  profile_id: string;
};

function getReceiverId(message: any): string | null {
  if (!message || typeof message !== 'object') {
    return null;
  }

  if (!('receiver_id' in message)) {
    return null;
  }

  const receiverId = message.receiver_id;
  if (receiverId === null) {
    return null;
  }

  if (typeof receiverId === 'object') {
    return receiverId.toString();
  }

  return typeof receiverId === 'string' ? receiverId : null;
}

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const msg = value as any;
  
  const isValid = 
    typeof msg.id === 'string' &&
    'receiver_id' in msg &&
    'sender_id' in msg;

  console.log('Message validation:', {
    value,
    isValid,
    hasId: 'id' in msg,
    hasReceiverId: 'receiver_id' in msg,
    hasSenderId: 'sender_id' in msg,
    receiverIdRaw: msg.receiver_id,
    senderIdRaw: msg.sender_id,
    receiverIdProcessed: getReceiverId(msg),
    receiverIdType: msg.receiver_id === null ? 'null' : typeof msg.receiver_id
  });

  return isValid;
}

export function useSidebarNotifications() {
  const [data, setData] = useState<Notification[]>([]);
  const { userRole, userId } = useUserRole();
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      console.log("No user ID available");
      return;
    }

    console.log("Fetching notifications for user:", userId);

    try {
      // First query: Direct messages to the user
      const { data: directMessages, error: directMessagesError } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:profile_id (
            role
          )
        `)
        .eq('receiver_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (directMessagesError) {
        console.error('Error fetching direct messages:', directMessagesError);
        throw directMessagesError;
      }

      // Second query: Messages from tenants with null receiver_id (if user is landlord)
      let broadcastMessages = [];
      if (userRole === 'landlord') {
        const { data: tenantMessages, error: tenantMessagesError } = await supabase
          .from('messages')
          .select(`
            *,
            profiles:profile_id (
              role
            )
          `)
          .is('receiver_id', null)
          .eq('read', false)
          .eq('profiles.role', 'tenant')
          .order('created_at', { ascending: false });

        if (tenantMessagesError) {
          console.error('Error fetching tenant messages:', tenantMessagesError);
        } else {
          broadcastMessages = tenantMessages || [];
        }
      }

      // Fetch maintenance requests
      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq(userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant', false);

      if (maintenanceError) {
        console.error('Error fetching maintenance:', maintenanceError);
        throw maintenanceError;
      }

      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq(userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant', false);

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        throw paymentsError;
      }

      // Combine both message types
      const allMessages = [...(directMessages || []), ...broadcastMessages];

      console.log('Messages query result:', {
        total: allMessages.length,
        directMessages: directMessages?.length || 0,
        broadcastMessages: broadcastMessages.length,
        messages: allMessages,
        userId,
      });

      // Map all notifications
      const notifications: Notification[] = [
        {
          type: 'messages',
          count: allMessages.length,
          items: allMessages.map(m => ({
            id: m.id,
            message: m.content,
            created_at: m.created_at,
            read: m.read,
            sender_id: m.profile_id
          }))
        },
        {
          type: 'maintenance',
          count: maintenance?.length || 0,
          items: maintenance?.map(m => ({
            id: m.id,
            message: m.title,
            created_at: m.created_at,
            read: false
          }))
        },
        {
          type: 'payments',
          count: payments?.length || 0,
          items: payments?.map(p => ({
            id: p.id,
            message: `New payment: $${p.amount}`,
            created_at: p.created_at,
            read: false
          }))
        }
      ];

      console.log('Setting notifications:', {
        messages: notifications[0],
        maintenance: notifications[1],
        payments: notifications[2]
      });
      
      setData(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    }
  }, [userId, userRole, toast]);

  const markAsRead = useCallback(async (type: NotificationType, messageId?: string) => {
    if (!userId || !userRole) return;

    try {
      if (type === 'messages') {
        const query = supabase
          .from('messages')
          .update({ 
            read: true,
            updated_at: new Date().toISOString()
          });

        if (messageId) {
          // If messageId is provided, only mark that specific message as read
          await query.eq('id', messageId);
        } else {
          // Otherwise mark all unread messages as read
          await query.eq('receiver_id', userId).eq('read', false);
        }

        // Immediately update local state
        setData(prevData => 
          prevData.map(item => {
            if (item.type === 'messages') {
              if (messageId) {
                // Update only specific message
                return {
                  ...item,
                  count: item.count - 1,
                  items: item.items?.filter(msg => msg.id !== messageId) || []
                };
              } else {
                // Clear all messages
                return { ...item, count: 0, items: [] };
              }
            }
            return item;
          })
        );
      } else if (type === 'maintenance') {
        const { error } = await supabase
          .from('maintenance_requests')
          .update({ 
            [userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant']: true 
          })
          .eq(userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant', false);

        if (error) throw error;
      } else if (type === 'payments') {
        const { error } = await supabase
          .from('payments')
          .update({ 
            [userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant']: true 
          })
          .eq(userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant', false);

        if (error) throw error;
      }

      setData(prevData => 
        prevData.map(item => 
          item.type === type ? { ...item, count: 0, items: [] } : item
        )
      );

      // After marking as read, refresh notifications to ensure consistency
      await fetchNotifications();

    } catch (error) {
      console.error(`Error marking ${type} as read:`, error);
      toast({
        title: "Error",
        description: `Failed to mark ${type} as read`,
        variant: "destructive",
      });
      throw error;
    }
  }, [userId, userRole, toast, fetchNotifications]);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase.channel('db-changes')
      .on('postgres_changes', 
        { 
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public', 
          table: 'messages'
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Message change detected:', payload);
          await fetchNotifications(); // Immediately fetch new notifications
        }
      )
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'maintenance_requests' 
        },
        async () => {
          console.log('Maintenance change detected');
          await fetchNotifications();
        }
      )
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'payments'
        },
        async () => {
          console.log('Payment change detected');
          await fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userRole, fetchNotifications]);

  return { data, markAsRead };
}
