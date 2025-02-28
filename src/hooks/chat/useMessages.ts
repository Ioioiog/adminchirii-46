
import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMessageSubscription } from "./useMessageSubscription";
import { useMessageOperations } from "./useMessageOperations";
import { Message } from "./types";

// Create a global cache to store messages across component instances
const messageCache: Record<string, Message[]> = {};

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const { sendMessage: sendMessageOperation } = useMessageOperations();
  const loadedFromCache = useRef(false);

  // First try to load from in-memory cache, much faster than IndexedDB
  useEffect(() => {
    if (!conversationId) return;
    
    if (messageCache[conversationId] && !loadedFromCache.current) {
      console.log("Loading messages from memory cache");
      setMessages(messageCache[conversationId]);
      loadedFromCache.current = true;
    }
  }, [conversationId]);

  // Load cached messages from IndexedDB if available
  useEffect(() => {
    if (!conversationId || loadedFromCache.current) return;

    const loadCachedMessages = async () => {
      try {
        // Add a smaller limit to reduce data transfer - adjust based on your needs
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
          .order("created_at", { ascending: true })
          .limit(50); // Limiting to most recent messages

        if (cachedMessages && cachedMessages.length > 0) {
          console.log("Loaded cached messages:", cachedMessages.length);
          setMessages(cachedMessages as Message[]);
          
          // Store in memory cache for faster future access
          messageCache[conversationId] = cachedMessages as Message[];
          loadedFromCache.current = true;
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
      let updatedMessages;
      
      if (messageIndex !== -1) {
        updatedMessages = [...prev];
        updatedMessages[messageIndex] = newMessage;
      } else {
        updatedMessages = [...prev, newMessage];
      }
      
      // Update memory cache
      if (conversationId) {
        messageCache[conversationId] = updatedMessages;
      }
      
      return updatedMessages;
    });
  }, [conversationId]);

  const handleMessageDelete = useCallback((messageId: string) => {
    setMessages(prev => {
      const filteredMessages = prev.filter(msg => msg.id !== messageId);
      
      // Update memory cache
      if (conversationId) {
        messageCache[conversationId] = filteredMessages;
      }
      
      return filteredMessages;
    });
  }, [conversationId]);

  // Use a more efficient subscription strategy
  useMessageSubscription(conversationId, handleMessageUpdate, handleMessageDelete);

  const sendMessage = async (content: string, currentUserId: string | null) => {
    await sendMessageOperation(content, currentUserId, conversationId);
  };

  return { messages, sendMessage };
}
