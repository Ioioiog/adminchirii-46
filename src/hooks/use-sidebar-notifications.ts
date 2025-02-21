
import { useEffect, useState, useCallback } from 'react';
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
  receiver_id: string;
  sender_id: string;
  conversation_id: string | null;
  profile_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

export function useSidebarNotifications() {
  const [data, setData] = useState<Notification[]>([]);
  const { userRole, userId } = useUserRole();

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    console.log("Fetching notifications for user:", userId);

    try {
      // Query for unread messages with extended fields and proper profile join
      const { data: rawMessages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id, 
          content, 
          created_at, 
          read,
          receiver_id,
          sender_id,
          conversation_id,
          profile_id,
          profiles!messages_sender_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('receiver_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return;
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

      // First convert to unknown, then to our expected type
      const messages = ((rawMessages || []) as unknown[]).map(msg => {
        const rawMsg = msg as any;
        return {
          id: rawMsg.id,
          content: rawMsg.content,
          created_at: rawMsg.created_at,
          read: rawMsg.read,
          receiver_id: rawMsg.receiver_id,
          sender_id: rawMsg.sender_id,
          conversation_id: rawMsg.conversation_id,
          profile_id: rawMsg.profile_id,
          profiles: rawMsg.profiles
        } as MessageWithProfile;
      });

      // Filter unread messages where user is receiver
      const unreadMessages = messages.filter(message => 
        message.receiver_id === userId && !message.read
      );

      const newNotifications = [
        { 
          type: 'messages', 
          count: unreadMessages.length,
          items: unreadMessages.map(m => ({
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

      setData(newNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [userId, userRole]);

  useEffect(() => {
    if (!userId) return;

    let retryCount = 0;
    const maxRetries = 3;
    let channel: any = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const setupChannel = () => {
      // Clear any existing retry timeout
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }

      // Remove existing channel if any
      if (channel) {
        console.log('Removing existing channel before setup');
        supabase.removeChannel(channel);
      }

      const channelName = `notifications:${userId}`;
      console.log(`Setting up channel: ${channelName}`);

      // Create new channel with all subscriptions
      channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: true },
          presence: { key: userId },
        }
      })
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${userId}`
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
        .subscribe(async (status: string) => {
          console.log(`Channel ${channelName} status:`, status);
          
          if (status === 'SUBSCRIBED') {
            console.log(`Successfully connected to channel: ${channelName}`);
            retryCount = 0;
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.log(`Channel ${channelName} closed or error occurred`);
            
            // Only attempt reconnect if we haven't exceeded retry limit
            if (retryCount < maxRetries) {
              retryCount++;
              const delay = 1000 * Math.pow(2, retryCount);
              console.log(`Scheduling retry ${retryCount}/${maxRetries} in ${delay}ms`);
              
              // Clear any existing retry timeout
              if (retryTimeout) {
                clearTimeout(retryTimeout);
              }
              
              // Schedule new retry
              retryTimeout = setTimeout(() => {
                console.log(`Attempting retry ${retryCount}`);
                setupChannel();
              }, delay);
            } else {
              console.log('Max retries exceeded, giving up');
            }
          }
        });

      return channel;
    };

    console.log('Initial channel setup');
    // Initial fetch
    fetchNotifications();

    // Setup initial channel
    channel = setupChannel();

    // Cleanup function
    return () => {
      console.log('Running cleanup');
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (channel) {
        console.log('Removing channel during cleanup');
        supabase.removeChannel(channel);
      }
    };
  }, [fetchNotifications, userId]);

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
