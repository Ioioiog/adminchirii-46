
import { useState, useCallback } from 'react';
import { useUserRole } from '@/hooks/use-user-role';
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription';
import { fetchMessages, fetchMaintenanceRequests, fetchPayments, markNotificationsAsRead } from '@/services/notificationService';
import { Notification, NotificationType, MessageWithProfile } from '@/types/notifications';

export function useSidebarNotifications() {
  const [data, setData] = useState<Notification[]>([]);
  const { userRole, userId } = useUserRole();

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    console.log("Fetching notifications for user:", userId);

    try {
      const [messages, maintenance, payments] = await Promise.all([
        fetchMessages(userId),
        fetchMaintenanceRequests(userId, userRole || ''),
        fetchPayments(userId, userRole || '')
      ]);

      const typedMessages = messages as MessageWithProfile[];
      
      const newNotifications = [
        { 
          type: 'messages' as NotificationType, 
          count: typedMessages.length,
          items: typedMessages.map(m => ({
            id: m.id,
            message: `${m.profiles?.first_name || 'Someone'} sent: ${m.content}`,
            created_at: m.created_at,
            read: m.read
          }))
        },
        { 
          type: 'maintenance' as NotificationType, 
          count: maintenance.length,
          items: maintenance.map(m => ({
            id: m.id,
            message: m.title,
            created_at: m.created_at,
            read: userRole === 'landlord' ? m.read_by_landlord : m.read_by_tenant
          }))
        },
        { 
          type: 'payments' as NotificationType, 
          count: payments.length,
          items: payments.map(p => ({
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

  useRealtimeSubscription({
    userId,
    onDataChange: fetchNotifications
  });

  const markAsRead = async (type: NotificationType) => {
    if (!userId || !userRole) return;

    try {
      await markNotificationsAsRead(type, userId, userRole);
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
