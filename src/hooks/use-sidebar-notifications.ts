
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
  const { userRole, userId } = useUserRole();

  useEffect(() => {
    let mounted = true;

    const fetchNotifications = async () => {
      if (!userId) return;

      console.log("Fetching notifications for user:", userId);

      try {
        // Fetch last 5 unread messages using proper query parameters
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`receiver_id.eq.${userId},profile_id.eq.${userId}`)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
        }

        // Fetch last 5 maintenance requests with proper filters
        const { data: maintenance, error: maintenanceError } = await supabase
          .from('maintenance_requests')
          .select('*')
          .eq(userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (maintenanceError) {
          console.error('Error fetching maintenance requests:', maintenanceError);
        }

        // Fetch last 5 payments with proper filters
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq(userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
        }

        console.log('Fetched messages:', messages);
        console.log('Fetched maintenance:', maintenance);
        console.log('Fetched payments:', payments);

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
        (payload) => {
          console.log('Message change detected:', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    const maintenanceChannel = supabase.channel('maintenance_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_requests' },
        (payload) => {
          console.log('Maintenance change detected:', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    const paymentsChannel = supabase.channel('payments_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          console.log('Payment change detected:', payload);
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(maintenanceChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, [userRole, userId]);

  const markAsRead = async (type: string) => {
    if (!userId) return;

    console.log(`Marking ${type} as read for user:`, userId);

    try {
      if (type === 'messages') {
        const { error } = await supabase
          .from('messages')
          .update({ read: true })
          .or(`receiver_id.eq.${userId},profile_id.eq.${userId}`)
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
