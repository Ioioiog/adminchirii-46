
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/use-user-role';
import { Notification, NotificationType } from '@/types/notifications';
import { useToast } from '@/hooks/use-toast';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Define the message type
type Message = {
  id: string;
  content: string;
  created_at: string;
  read: boolean;
  receiver_id: string;
  sender_id: string;
};

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
      // Fetch unread messages with more detailed query
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          read,
          receiver_id,
          sender_id
        `)
        .eq('receiver_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        throw messagesError;
      }

      console.log('Messages query result:', {
        total: messages?.length || 0,
        messages,
        userId,
        receiverFilter: `receiver_id=${userId}`
      });

      // Fetch maintenance requests
      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('id, title, created_at')
        .eq(userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant', false);

      if (maintenanceError) {
        console.error('Error fetching maintenance:', maintenanceError);
        throw maintenanceError;
      }

      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('id, amount, created_at')
        .eq(userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant', false);

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        throw paymentsError;
      }

      const notifications: Notification[] = [
        {
          type: 'messages',
          count: messages?.length || 0,
          items: messages?.map(m => ({
            id: m.id,
            message: m.content,
            created_at: m.created_at,
            read: m.read
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

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: userId ? `receiver_id=eq.${userId}` : undefined
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          console.log('Messages change detected:', {
            event: payload.eventType,
            data: payload.new,
            userId,
            receiverId: payload.new && 'receiver_id' in payload.new ? payload.new.receiver_id : undefined
          });
          fetchNotifications();
        }
      )
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'maintenance_requests' 
        },
        (payload) => {
          console.log('Maintenance change detected:', payload);
          fetchNotifications();
        }
      )
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'payments'
        },
        (payload) => {
          console.log('Payment change detected:', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  const markAsRead = async (type: NotificationType) => {
    if (!userId || !userRole) return;

    try {
      if (type === 'messages') {
        const { error } = await supabase
          .from('messages')
          .update({ read: true })
          .eq('receiver_id', userId)
          .eq('read', false);

        if (error) throw error;
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

      // Update local state
      setData(prevData => 
        prevData.map(item => 
          item.type === type ? { ...item, count: 0, items: [] } : item
        )
      );
    } catch (error) {
      console.error(`Error marking ${type} as read:`, error);
      toast({
        title: "Error",
        description: `Failed to mark ${type} as read`,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { data, markAsRead };
}
