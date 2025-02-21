import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/use-user-role';

export type Notification = {
  type: string;
  count: number;
  items?: Array<{
    id: string;
    message: string;
    created_at: string;
    read: boolean;
  }>;
};

export function useSidebarNotifications() {
  const [data, setData] = useState<Notification[]>([]);
  const { userRole } = useUserRole();

  useEffect(() => {
    let mounted = true;

    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log("Fetching notifications for user:", user.id);

      try {
        // Fetch last 5 unread messages
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('id, content, created_at, read')
          .eq('receiver_id', user.id)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
        }

        // Fetch last 5 maintenance requests
        const { data: maintenance, error: maintenanceError } = await supabase
          .from('maintenance_requests')
          .select('id, title, created_at, read_by_landlord, read_by_tenant')
          .eq(userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (maintenanceError) {
          console.error('Error fetching maintenance requests:', maintenanceError);
        }

        // Fetch last 5 payments
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('id, amount, created_at, read_by_landlord, read_by_tenant')
          .eq(userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
        }

        const newNotifications = [
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
              read: userRole === 'landlord' ? m.read_by_landlord : m.read_by_tenant
            }))
          },
          { 
            type: 'payments', 
            count: payments?.length || 0,
            items: payments?.map(p => ({
              id: p.id,
              message: `New payment: $${p.amount}`,
              created_at: p.created_at,
              read: userRole === 'landlord' ? p.read_by_landlord : p.read_by_tenant
            }))
          }
        ];

        if (mounted) {
          console.log('Setting new notifications:', newNotifications);
          setData(newNotifications);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    // Initial fetch
    fetchNotifications();

    // Set up real-time subscriptions
    const messagesChannel = supabase.channel('messages_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        () => fetchNotifications()
      )
      .subscribe();

    const maintenanceChannel = supabase.channel('maintenance_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_requests' },
        () => fetchNotifications()
      )
      .subscribe();

    const paymentsChannel = supabase.channel('payments_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(maintenanceChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, [userRole]);

  const markAsRead = async (type: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    console.log(`Marking ${type} as read for user:`, user.id);

    try {
      if (type === 'messages') {
        const { error } = await supabase
          .from('messages')
          .update({ read: true })
          .eq('receiver_id', user.id)
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
