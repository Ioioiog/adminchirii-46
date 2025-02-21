
import { supabase } from '@/integrations/supabase/client';
import { MessageWithProfile, Notification, NotificationType } from '@/types/notifications';

export const fetchMessages = async (userId: string) => {
  const { data, error } = await supabase
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

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data as MessageWithProfile[];
};

export const fetchMaintenanceRequests = async (userId: string, userRole: string) => {
  const { data, error } = await supabase
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

  if (error) {
    console.error('Error fetching maintenance requests:', error);
    return [];
  }

  return data;
};

export const fetchPayments = async (userId: string, userRole: string) => {
  const { data, error } = await supabase
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

  if (error) {
    console.error('Error fetching payments:', error);
    return [];
  }

  return data;
};

export const markNotificationsAsRead = async (
  type: NotificationType,
  userId: string,
  userRole: string
) => {
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
  } catch (error) {
    console.error(`Error marking ${type} as read:`, error);
    throw error;
  }
};
