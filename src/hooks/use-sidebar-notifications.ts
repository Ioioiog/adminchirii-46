import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/use-user-role';

export type Notification = {
  type: string;
  count: number;
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
        // Fetch unread messages count
        const { count: messagesCount, error: messagesError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('read', false);

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
        }
        console.log('Unread messages count:', messagesCount);

        // Fetch maintenance requests count
        const { count: maintenanceCount, error: maintenanceError } = await supabase
          .from('maintenance_requests')
          .select('*', { count: 'exact', head: true })
          .eq(userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant', false);

        if (maintenanceError) {
          console.error('Error fetching maintenance requests:', maintenanceError);
        }
        console.log('Unread maintenance requests count:', maintenanceCount);

        // Fetch payments count
        const { count: paymentsCount, error: paymentsError } = await supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq(userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant', false);

        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
        }
        console.log('Unread payments count:', paymentsCount);

        const newNotifications = [
          { type: 'messages', count: messagesCount || 0 },
          { type: 'maintenance', count: maintenanceCount || 0 },
          { type: 'payments', count: paymentsCount || 0 }
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
          console.log('Messages change detected:', payload);
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
          console.log('Payments change detected:', payload);
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

      // Update local state
      setData(prevData => 
        prevData.map(item => 
          item.type === type ? { ...item, count: 0 } : item
        )
      );
    } catch (error) {
      console.error(`Error marking ${type} as read:`, error);
    }
  };

  return { data, markAsRead };
}