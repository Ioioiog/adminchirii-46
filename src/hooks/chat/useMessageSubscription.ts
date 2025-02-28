
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "./types";

// Track active subscriptions to prevent duplicates
const activeSubscriptions = new Set<string>();

export function useMessageSubscription(
  conversationId: string | null,
  onMessageUpdate: (message: Message) => void,
  onMessageDelete: (messageId: string) => void
) {
  useEffect(() => {
    if (!conversationId) return;
    
    // Don't create duplicate subscriptions
    const subscriptionKey = `messages:${conversationId}`;
    if (activeSubscriptions.has(subscriptionKey)) {
      console.log("Subscription already exists for:", subscriptionKey);
      return;
    }
    
    console.log("Setting up subscription for conversation:", conversationId);
    activeSubscriptions.add(subscriptionKey);

    // One optimized channel for all message operations
    const channel = supabase
      .channel(subscriptionKey)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log("New message received:", payload.new.id);
          onMessageUpdate(payload.new as Message);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log("Message updated:", payload.new.id);
          onMessageUpdate(payload.new as Message);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log("Message deleted:", payload.old.id);
          onMessageDelete(payload.old.id);
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for ${subscriptionKey}:`, status);
      });

    // Clean up subscription
    return () => {
      console.log("Cleaning up subscription for:", subscriptionKey);
      supabase.removeChannel(channel);
      activeSubscriptions.delete(subscriptionKey);
    };
  }, [conversationId, onMessageUpdate, onMessageDelete]);
}
