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

type MessageWithProfile = {
  id: string;
  content: string;
  created_at: string;
  read: boolean;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  };
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
        // Fetch unread messages
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            read,
            profiles!messages_profile_id_fkey (
              first_name,
              last_name
            )
          `)
          .eq('receiver_id', userId)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
        }

        // Fetch maintenance requests
        const { data: maintenance, error: maintenanceError } = await supabase
          .from('maintenance_requests')
          .select(`
            id,
            title,
            created_at,
            read_by_landlord,
            read_by_tenant
          `)
          .eq(userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (maintenanceError) {
          console.error('Error fetching maintenance requests:', maintenanceError);
        }

        // Fetch payments
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select(`
            id,
            amount,
            created_at,
            read_by_landlord,
            read_by_tenant
          `)
          .eq(userRole === 'landlord' ? 'read_by_landlord' : 'read_by_tenant', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
        }

        // Type assertion with proper structure
        const typedMessages = (messages || []).map(msg => ({
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
          read: msg.read,
          profiles: msg.profiles
        })) as MessageWithProfile[];
        
        const newNotifications = [
          { 
            type: 'messages', 
            count: typedMessages.length,
            items: typedMessages.map(m => ({
              id: m.id,
              message: `${m.profiles?.first_name || 'Someone'} sent: ${m.content}`,
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
          setData(newNotifications);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    // Initial fetch
    fetchNotifications();

    // Set up realtime subscriptions for all three tables in a single channel
    const channel = supabase.channel('db-changes')
      // Messages subscription
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: userId ? `receiver_id=eq.${userId}` : undefined
        },
        (payload) => {
          console.log('Messages change received:', payload);
          fetchNotifications();
        }
      )
      // Maintenance requests subscription
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'maintenance_requests' 
        },
        (payload) => {
          console.log('Maintenance change received:', payload);
          fetchNotifications();
        }
      )
      // Payments subscription
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'payments'
        },
        (payload) => {
          console.log('Payment change received:', payload);
          fetchNotifications();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId, userRole]);

  const markAsRead = async (type: string) => {
    if (!userId) return;

    console.log(`Marking ${type} as read for user:`, userId);

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
