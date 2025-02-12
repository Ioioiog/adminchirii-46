
import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "./Message";
import { TypingIndicator } from "./TypingIndicator";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  status: 'sent' | 'delivered' | 'read';
  read: boolean;
  sender: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  typingUsers?: string[];
}

export function MessageList({ 
  messages, 
  currentUserId, 
  messagesEndRef, 
  typingUsers = [] 
}: MessageListProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, messagesEndRef]);

  useEffect(() => {
    if (!currentUserId) return;

    const updateMessageStatus = async () => {
      try {
        const unreadMessages = messages.filter(
          msg => msg.sender_id !== currentUserId && !msg.read
        );

        if (unreadMessages.length === 0) return;

        const batchSize = 10;
        for (let i = 0; i < unreadMessages.length; i += batchSize) {
          const batch = unreadMessages.slice(i, i + batchSize);
          
          const { error } = await supabase
            .from('messages')
            .update({ 
              status: 'read', 
              read: true,
              updated_at: new Date().toISOString()
            })
            .in('id', batch.map(msg => msg.id));

          if (error) {
            throw error;
          }
        }
      } catch (error) {
        console.error('Error updating message status:', error);
        toast({
          title: "Error",
          description: "Failed to update message status",
          variant: "destructive",
        });
      }
    };

    updateMessageStatus();
  }, [messages, currentUserId, toast]);

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditedContent(content);
  };

  const handleSaveEdit = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: editedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      setEditingMessageId(null);
      toast({
        title: "Message updated",
        description: "Your message has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Error",
        description: "Failed to update message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Message deleted",
        description: "Your message has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1 h-full">
        <div className="space-y-4 p-4">
          {messages.map((message) => {
            const senderName = message.sender
              ? `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim() || 'Unknown User'
              : 'Unknown User';
            const isCurrentUser = message.sender_id === currentUserId;

            return (
              <Message
                key={message.id}
                id={message.id}
                content={message.content}
                senderName={senderName}
                createdAt={message.created_at}
                isCurrentUser={isCurrentUser}
                status={message.status}
                isEditing={editingMessageId === message.id}
                editedContent={editedContent}
                onEditStart={handleEditMessage}
                onEditSave={handleSaveEdit}
                onEditCancel={() => setEditingMessageId(null)}
                onEditChange={setEditedContent}
                onDelete={handleDeleteMessage}
              />
            );
          })}
          
          <TypingIndicator typingUsers={typingUsers} />
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
