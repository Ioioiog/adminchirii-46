import React from "react";
import { Send, Smile, PaperclipIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";
interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
}
export function MessageInput({
  newMessage,
  setNewMessage,
  handleSendMessage
}: MessageInputProps) {
  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(newMessage + emojiData.emoji);
  };
  return <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
      <div className="flex items-center gap-2 rounded-full p-2 border bg-blue-300 hover:bg-blue-200">
        <Popover className="bg-blue-200 hover:bg-blue-100">
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-gray-100">
              <Smile className="h-5 w-5 text-gray-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start" side="top">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </PopoverContent>
        </Popover>

        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-gray-100">
          <PaperclipIcon className="h-5 w-5 text-gray-500" />
        </Button>

        <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message" className="flex-1 bg-transparent border-0 focus:ring-0 text-base text-gray-900 placeholder:text-gray-500" />

        <Button type="submit" size="icon" className="h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-600" disabled={!newMessage.trim()}>
          <Send className="h-5 w-5 text-white" />
        </Button>
      </div>
    </form>;
}