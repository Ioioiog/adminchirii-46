
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

type SubscriptionConfig = {
  userId: string | null;
  onDataChange: () => void;
};

export function useRealtimeSubscription({ userId, onDataChange }: SubscriptionConfig) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    let mounted = true;
    let reconnectTimeout: NodeJS.Timeout;

    const setupRealtimeSubscription = () => {
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.log('Max reconnection attempts reached');
        return;
      }

      if (channelRef.current) {
        console.log('Channel already exists');
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
          () => onDataChange()
        )
        .on('postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'maintenance_requests' 
          },
          () => onDataChange()
        )
        .on('postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'payments'
          },
          () => onDataChange()
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            reconnectAttempts.current = 0;
          } else if (status === 'CLOSED' && mounted) {
            reconnectAttempts.current += 1;
            const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            
            if (reconnectTimeout) {
              clearTimeout(reconnectTimeout);
            }

            channelRef.current = null;

            reconnectTimeout = setTimeout(() => {
              if (mounted && !channelRef.current) {
                setupRealtimeSubscription();
              }
            }, backoffTime);
          }
        });
    };

    setupRealtimeSubscription();

    return () => {
      mounted = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [userId, onDataChange]);
}
