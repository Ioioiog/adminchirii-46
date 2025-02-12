
import React, { useRef, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { useConversation } from "@/hooks/chat/useConversation";
import { useMessages } from "@/hooks/chat/useMessages";
import { useAuthState } from "@/hooks/useAuthState";
import { Loader2 } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { VideoCall } from "@/components/chat/VideoCall";

const Chat = () => {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { currentUserId } = useAuthState();
  const { conversationId, isLoading: isConversationLoading } = useConversation(currentUserId, selectedTenantId);
  const { messages, sendMessage } = useMessages(conversationId);
  const { userRole } = useUserRole();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      await sendMessage(newMessage, currentUserId);
      setNewMessage("");
    }
  };

  const handleTenantSelect = (tenantId: string) => {
    console.log("Selected tenant:", tenantId);
    setSelectedTenantId(tenantId);
  };

  const handleStartVideoCall = () => {
    setIsVideoCallActive(true);
  };

  const handleEndVideoCall = () => {
    setIsVideoCallActive(false);
  };

  const renderContent = () => {
    if (isConversationLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      );
    }

    if (userRole === "landlord" && !selectedTenantId) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 text-center bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-sm">
          <div className="max-w-md">
            <h3 className="text-lg font-semibold mb-2">Select a Tenant</h3>
            <p className="text-muted-foreground">
              Choose a tenant from the dropdown above to start a conversation.
            </p>
          </div>
        </div>
      );
    }

    if (!conversationId) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 text-center bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-sm">
          <div className="max-w-md">
            <h3 className="text-lg font-semibold mb-2">No Conversation Found</h3>
            <p className="text-muted-foreground">
              {userRole === "landlord" 
                ? "There seems to be an issue with the conversation. Please try selecting a different tenant."
                : "There seems to be an issue with your conversation. Please contact support if this persists."}
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          messagesEndRef={messagesEndRef}
        />
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleSendMessage={handleSendMessage}
        />
      </>
    );
  };

  return (
    <div className="flex h-screen bg-[#F1F0FB] dark:bg-slate-900">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <div className="container mx-auto px-4 py-6 flex-1 flex">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
            <ChatHeader 
              onTenantSelect={handleTenantSelect}
              selectedTenantId={selectedTenantId}
              onVideoCall={handleStartVideoCall}
            />
            <div className="flex-1 flex flex-col min-h-0 bg-[url('/chat-background.png')] bg-repeat">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
      {isVideoCallActive && conversationId && currentUserId && (
        <VideoCall
          conversationId={conversationId}
          currentUserId={currentUserId}
          onClose={handleEndVideoCall}
        />
      )}
    </div>
  );
};

export default Chat;
