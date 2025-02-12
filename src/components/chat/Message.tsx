
import React from "react";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MessageActions } from "./MessageActions";

interface MessageProps {
  id: string;
  content: string;
  senderName: string;
  createdAt: string;
  isCurrentUser: boolean;
  status: 'sent' | 'delivered' | 'read';
  isEditing: boolean;
  editedContent: string;
  onEditStart: (messageId: string, content: string) => void;
  onEditSave: (messageId: string) => void;
  onEditCancel: () => void;
  onEditChange: (content: string) => void;
  onDelete: (messageId: string) => void;
}

export function Message({
  id,
  content,
  senderName,
  createdAt,
  isCurrentUser,
  status,
  isEditing,
  editedContent,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditChange,
  onDelete,
}: MessageProps) {
  const messageTime = format(new Date(createdAt), 'HH:mm');

  return (
    <div className={cn(
      "flex mb-4 px-4 animate-fade-in",
      isCurrentUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[70%] group relative",
        isCurrentUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-2 shadow-sm transition-all",
          isCurrentUser 
            ? "bg-[#DCF8C6] dark:bg-emerald-800 rounded-br-sm" 
            : "bg-white dark:bg-slate-700 rounded-bl-sm",
          "hover:shadow-md transition-shadow duration-200"
        )}>
          <div className="flex justify-between items-center mb-1">
            <p className={cn(
              "text-xs font-medium",
              isCurrentUser 
                ? "text-emerald-800 dark:text-emerald-200" 
                : "text-blue-600 dark:text-blue-200"
            )}>
              {senderName}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-2">
              {messageTime}
            </span>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                value={editedContent}
                onChange={(e) => onEditChange(e.target.value)}
                className="flex-1 h-8 text-sm bg-white/90 dark:bg-slate-900/90"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEditSave(id)}
                className="h-8 w-8 p-0"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onEditCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="break-words whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
              {content}
            </p>
          )}
        </div>
        {isCurrentUser && !isEditing && (
          <MessageActions
            status={status}
            onEdit={() => onEditStart(id, content)}
            onDelete={() => onDelete(id)}
          />
        )}
      </div>
    </div>
  );
}
