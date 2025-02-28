import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from './types';
import { useToast } from '@/hooks/use-toast';

export function useMessageSubscription(
  conversationId: string | null,
  onMessageUpdate: (message: Message) => void,
  onMessageDelete: (messageId: string) => void
) {
  const { toast } = useToast();

  const handleNewMessage = useCallback(async (payload: any) => {
    console.log('New message received:', payload);
    
    if (!payload.new) {
      console.log('No new message data in payload');
      return;
    }

    const newMessage = payload.new;

    try {
      // Fetch the complete message with sender information
      const { data: messageWithSender, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          content,
          created_at,
          status,
          read,
          profile_id,
          conversation_id,
          profiles!messages_profile_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('id', newMessage.id)
        .single();

      if (error) {
        console.error('Error fetching message details:', error);
        throw error;
      }

      if (!messageWithSender) {
        console.log('No message found with id:', newMessage.id);
        return;
      }

      console.log('Fetched message with sender:', messageWithSender);

      // Transform the message for frontend use
      const typedMessage: Message = {
        id: messageWithSender.id,
        sender_id: messageWithSender.sender_id,
        content: messageWithSender.content,
        created_at: messageWithSender.created_at,
        sender: messageWithSender.profiles || null,
        status: (messageWithSender.status || 'sent') as 'sent' | 'delivered' | 'read',
        read: messageWithSender.read || false,
        conversation_id: messageWithSender.conversation_id
      };

      // Cache the message in IndexedDB - prepare data for upsert
      const messageForUpsert = {
        id: typedMessage.id,
        sender_id: typedMessage.sender_id,
        content: typedMessage.content,
        created_at: typedMessage.created_at,
        status: typedMessage.status,
        read: typedMessage.read,
        profile_id: messageWithSender.profile_id,
        conversation_id: messageWithSender.conversation_id
      };

      try {
        const { error: upsertError } = await supabase
          .from('messages')
          .upsert(messageForUpsert);

        if (upsertError) {
          console.error('Error upserting message:', upsertError);
          throw upsertError;
        }

        // Notify the parent component about the new/updated message
        onMessageUpdate(typedMessage);
      } catch (error) {
        console.error('Error caching message:', error);
        toast({
          title: "Error",
          description: "Failed to cache message. Please refresh the page.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing new message:', error);
      toast({
        title: "Error",
        description: "Failed to process new message. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [onMessageUpdate, toast]);

  const handleDeletedMessage = useCallback((payload: any) => {
    console.log('Message deleted:', payload);
    
    if (payload.old?.id) {
      onMessageDelete(payload.old.id);
    }
  }, [onMessageDelete]);

  useEffect(() => {
    if (!conversationId) {
      console.log('No conversation ID provided');
      return;
    }

    console.log('Setting up message subscription for conversation:', conversationId);

    // Subscribe to messages for this conversation
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        handleNewMessage
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        handleDeletedMessage
      )
      .subscribe();

    return () => {
      console.log('Cleaning up message subscription');
      subscription.unsubscribe();
    };
  }, [conversationId, handleNewMessage, handleDeletedMessage]);
}