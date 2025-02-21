import { useEffect, useState, useRef } from 'react';
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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    let mounted = true;
    let reconnectTimeout: NodeJS.Timeout;

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

    const setupRealtimeSubscription = () => {
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.log('Max reconnection attempts reached, stopping reconnection attempts');
        return;
      }

      // If we already have a channel, don't create a new one
      if (channelRef.current) {
        console.log('Channel already exists, skipping creation');
        return;
      }

      console.log(`Setting up realtime subscription (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);

      channelRef.current = supabase.channel('db-changes')
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
          
          if (status === 'SUBSCRIBED') {
            // Reset reconnect attempts on successful connection
            reconnectAttempts.current = 0;
          } else if (status === 'CLOSED' && mounted) {
            // Increment reconnect attempts only if we're not already in the process
            reconnectAttempts.current += 1;
            const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);

            console.log(`Channel closed (attempt ${reconnectAttempts.current}/${maxReconnectAttempts}), reconnecting in ${backoffTime}ms...`);
            
            // Clear any existing timeout
            if (reconnectTimeout) {
              clearTimeout(reconnectTimeout);
            }

            // Clean up channel reference before attempting to reconnect
            channelRef.current = null;

            // Set up new reconnection attempt with exponential backoff
            reconnectTimeout = setTimeout(() => {
              if (mounted && !channelRef.current) {
                setupRealtimeSubscription();
              }
            }, backoffTime);
          }
        });

      // Initial fetch when subscription is set up
      fetchNotifications();
    };

    // Initial subscription setup
    setupRealtimeSubscription();

    // Cleanup function
    return () => {
      mounted = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (channelRef.current) {
        console.log('Cleaning up realtime subscription...');
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
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
