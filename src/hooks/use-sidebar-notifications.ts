
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
  receiver_id: string | null;
  sender_id: string;
  profile_id: string;
};

// Helper function to safely process receiver ID
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

// Type guard to check if a value is a Message
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
      // Fetch unread messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
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
          event: 'INSERT',
          schema: 'public', 
          table: 'messages'
        },
        async (payload: RealtimePostgresChangesPayload<Message>) => {
          console.log('Raw message payload:', payload);
          
          const newMessage = payload.new;
          console.log('New message detected:', {
            event: payload.eventType,
            messageData: newMessage,
            userId,
            userRole
          });

          // First validate the message
          if (!isMessage(newMessage)) {
            console.log('Message validation failed:', {
              message: newMessage
            });
            return;
          }

          // Process receiver ID safely
          const receiverId = getReceiverId(newMessage);
          
          // Log the attempt
          console.log('Processing message:', {
            messageData: newMessage,
            processedReceiverId: receiverId,
            currentUserId: userId,
            userRole,
            senderRole: newMessage.sender_id
          });

          // First check if this is a tenant message when user is landlord
          if (userRole === 'landlord') {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', newMessage.sender_id)
              .single();

            if (senderProfile?.role === 'tenant') {
              console.log('Message from tenant detected, fetching notifications for landlord');
              fetchNotifications();
              return;
            }
          }

          // Then handle direct messages (with specific receiver_id)
          if (receiverId === userId) {
            console.log('Direct message matches current user, fetching notifications');
            fetchNotifications();
            return;
          }

          // Skip other messages with null receiver_id
          if (receiverId === null) {
            console.log('Message has null receiver_id and is not from tenant to landlord, skipping');
            return;
          }

          console.log('Message not for current user:', {
            messageReceiverId: receiverId,
            currentUserId: userId
          });
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
  }, [userId, userRole, fetchNotifications]);

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
