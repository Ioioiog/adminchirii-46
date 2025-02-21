import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMessageSubscription } from "./useMessageSubscription";
import { useMessageOperations } from "./useMessageOperations";
import { Message } from "./types";

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const { sendMessage: sendMessageOperation } = useMessageOperations();

  // Load cached messages from IndexedDB if available
  useEffect(() => {
    if (!conversationId) return;

    const loadCachedMessages = async () => {
      try {
        const { data: cachedMessages } = await supabase
          .from("messages")
          .select(`
            id,
            sender_id,
            content,
            created_at,
            status,
            read,
            profile_id,
            conversation_id,
            sender:profiles!messages_profile_id_fkey(
              first_name,
              last_name
            )
          `)
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (cachedMessages) {
          console.log("Loaded cached messages:", cachedMessages.length);
          setMessages(cachedMessages as Message[]);
        }
      } catch (error) {
        console.error("Error loading cached messages:", error);
      }
    };

    loadCachedMessages();
  }, [conversationId]);

  const handleMessageUpdate = useCallback((newMessage: Message) => {
    setMessages(prev => {
      const messageIndex = prev.findIndex(msg => msg.id === newMessage.id);
      if (messageIndex !== -1) {
        const updatedMessages = [...prev];
        updatedMessages[messageIndex] = newMessage;
        return updatedMessages;
      }
      return [...prev, newMessage];
    });
  }, []);

  const handleMessageDelete = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  useMessageSubscription(conversationId, handleMessageUpdate, handleMessageDelete);

  const sendMessage = async (content: string, currentUserId: string | null) => {
    await sendMessageOperation(content, currentUserId, conversationId);
  };

  return { messages, sendMessage };
}