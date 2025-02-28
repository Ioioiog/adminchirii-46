
import { useEffect, useState, useCallback, useRef } from 'react';
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

  return isValid;
}

export function useSidebarNotifications() {
  const [data, setData] = useState<Notification[]>([]);
  const { userRole, userId } = useUserRole();
  const { toast } = useToast();
  const lastFetchTimeRef = useRef<number>(0);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeMs = 5000; // 5 seconds debounce

  const fetchNotifications = useCallback(async () => {
    // Skip if we've fetched recently
    const currentTime = Date.now();
    if (currentTime - lastFetchTimeRef.current < debounceTimeMs) {
      return;
    }
    
    lastFetchTimeRef.current = currentTime;
    
    if (!userId) {
      console.log("No user ID available");
      return;
    }

    console.log("Fetching notifications for user:", userId);

    try {
      // Use parallel queries for improved performance
      const [directMessagesResult, tenantMessagesResult, maintenanceResult, paymentsResult] = await Promise.all([
        // Direct messages to the user
        supabase
          .from('messages')
          .select(`
            *,
            profiles:profile_id (
              role
            )
          `)
          .eq('receiver_id', userId)
          .eq('read', false)
          .order('created_at', { ascending: false }),
          
        // Broadcast messages (only if user is landlord)
        userRole === 'landlord' ? 
          supabase
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
            .order('created_at', { ascending: false }) : 
          Promise.resolve({ data: [], error: null }),
          
        // Maintenance requests  
        supabase
          .from('maintenance_requests')
          .select('*')
          .eq(userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant', false),
          
        // Payments
        supabase
          .from('payments')
          .select('*')
          .eq(userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant', false)
      ]);

      if (directMessagesResult.error) throw directMessagesResult.error;
      if (tenantMessagesResult.error) throw tenantMessagesResult.error;
      if (maintenanceResult.error) throw maintenanceResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      // Combine both message types
      const allMessages = [...(directMessagesResult.data || []), ...(tenantMessagesResult.data || [])];

      console.log('Messages query result:', {
        total: allMessages.length,
        directMessages: directMessagesResult.data?.length || 0,
        broadcastMessages: tenantMessagesResult.data?.length || 0,
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
          count: maintenanceResult.data?.length || 0,
          items: maintenanceResult.data?.map(m => ({
            id: m.id,
            message: m.title,
            created_at: m.created_at,
            read: false
          }))
        },
        {
          type: 'payments',
          count: paymentsResult.data?.length || 0,
          items: paymentsResult.data?.map(p => ({
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

      // Debounced refresh to ensure consistency but avoid immediate refetch
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      fetchTimeoutRef.current = setTimeout(() => {
        fetchNotifications();
      }, 1000);

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
    // Skip if we don't have userId or userRole yet
    if (!userId || !userRole) {
      return;
    }
    
    fetchNotifications();

    const channel = supabase.channel('db-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages'
        },
        async () => {
          console.log('Message change detected');
          // Debounce fetches to avoid repeated calls
          if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
          }
          
          fetchTimeoutRef.current = setTimeout(() => {
            fetchNotifications();
          }, 300);
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
          if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
          }
          
          fetchTimeoutRef.current = setTimeout(() => {
            fetchNotifications();
          }, 300);
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
          if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
          }
          
          fetchTimeoutRef.current = setTimeout(() => {
            fetchNotifications();
          }, 300);
        }
      )
      .subscribe();

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [userId, userRole, fetchNotifications]);

  return { data, markAsRead };
}
