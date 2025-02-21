
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/use-user-role';
import { Notification, NotificationType } from '@/types/notifications';

export function useSidebarNotifications() {
  const [data, setData] = useState<Notification[]>([]);
  const { userRole, userId } = useUserRole();

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    console.log("Fetching notifications for user:", userId);

    try {
      // Fetch unread messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, content, created_at, read')
        .eq('receiver_id', userId)
        .eq('read', false);

      if (messagesError) throw messagesError;

      // Fetch maintenance requests
      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('id, title, created_at')
        .eq(userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant', false);

      if (maintenanceError) throw maintenanceError;

      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('id, amount, created_at')
        .eq(userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant', false);

      if (paymentsError) throw paymentsError;

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

      setData(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [userId, userRole]);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase.channel('db-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: userId ? `receiver_id=eq.${userId}` : undefined
        },
        () => fetchNotifications()
      )
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'maintenance_requests' 
        },
        () => fetchNotifications()
      )
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'payments'
        },
        () => fetchNotifications()
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
      throw error;
    }
  };

  return { data, markAsRead };
}
