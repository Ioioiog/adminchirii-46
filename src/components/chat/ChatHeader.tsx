import React from "react";
import { useUserRole } from "@/hooks/use-user-role";
import { MessageSquare, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
interface ChatHeaderProps {
  selectedTenantId: string | null;
  onVideoCall?: () => void;
}
export function ChatHeader({
  selectedTenantId,
  onVideoCall
}: ChatHeaderProps) {
  const {
    userRole
  } = useUserRole();
  console.log("ChatHeader - selectedTenantId:", selectedTenantId); // Debug log

  return <div className="p-4 border-b rounded-t-xl backdrop-blur-sm bg-primary-800 hover:bg-primary-700">
      <div className={cn("flex items-center justify-between gap-3 mb-2", "animate-fade-in")}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <MessageSquare className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          </div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            {userRole === "landlord" ? "Chat with Tenants" : "Chat with Landlord"}
          </h1>
        </div>
        {selectedTenantId && <Button variant="secondary" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onVideoCall}>
            <Video className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </Button>}
      </div>
    </div>;
}