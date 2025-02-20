
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
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      );
    }

    if (userRole === "landlord" && !selectedTenantId) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 text-center bg-[#F1F0FB] dark:bg-slate-900">
          <div className="max-w-md glass-card p-8 rounded-xl">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageList className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Select a Tenant</h3>
            <p className="text-gray-600">
              Choose a tenant from the dropdown above to start a conversation.
            </p>
          </div>
        </div>
      );
    }

    if (!conversationId) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 text-center bg-[#F1F0FB] dark:bg-slate-900">
          <div className="max-w-md glass-card p-8 rounded-xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageList className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">No Conversation Found</h3>
            <p className="text-gray-600">
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
        <div className="flex-1 flex">
          {/* Main Chat Container */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg shadow-lg m-4">
            <ChatHeader 
              onTenantSelect={handleTenantSelect}
              selectedTenantId={selectedTenantId}
              onVideoCall={handleStartVideoCall}
            />
            <div className="flex-1 flex flex-col min-h-0 bg-[#F1F0FB] bg-[url('/chat-background.png')] bg-repeat">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
      {isVideoCallActive && conversationId && currentUserId && selectedTenantId && (
        <VideoCall
          isOpen={isVideoCallActive}
          onClose={handleEndVideoCall}
          recipientId={selectedTenantId}
          isInitiator={true}
        />
      )}
    </div>
  );
};

export default Chat;
