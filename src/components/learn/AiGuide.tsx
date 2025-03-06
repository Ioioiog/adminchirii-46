
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Send, Bot, User, ArrowDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiGuide() {
  const { t, i18n } = useTranslation('learn');
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: t('aiGuide.welcomeMessage') }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Define fallback responses for when the AI API is unavailable
  const getFallbackResponse = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    // Check common greetings
    if (lowerQuery.includes("hello") || lowerQuery.includes("hi") || lowerQuery.includes("hey")) {
      return t('aiGuide.responses.greeting');
    }
    
    // Check for thanks
    if (lowerQuery.includes("thank")) {
      return t('aiGuide.responses.thanks');
    }
    
    // Check for question format
    if (
      lowerQuery.includes("?") || 
      lowerQuery.startsWith("what") || 
      lowerQuery.startsWith("how") || 
      lowerQuery.startsWith("where") || 
      lowerQuery.startsWith("when") || 
      lowerQuery.startsWith("why") || 
      lowerQuery.startsWith("can")
    ) {
      return t('aiGuide.responses.question');
    }
    
    // Default fallback
    return t('aiGuide.responses.default');
  };

  const callAiAssistant = async (userMessage: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-guide-assistant', {
        body: { 
          message: userMessage,
          language: i18n.language
        }
      });

      if (error) {
        console.error("Error calling AI assistant:", error);
        throw new Error(`Failed to get AI response: ${error.message}`);
      }

      return data.response;
    } catch (error) {
      console.error("Error in AI assistant call:", error);
      throw error;
    }
  };

  const handleSend = async () => {
    if (input.trim() === "") return;
    
    const userMessage = input.trim();
    setInput("");
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    
    try {
      // Call the AI assistant function
      const aiResponse = await callAiAssistant(userMessage);
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: "assistant", content: aiResponse }]);
    } catch (error) {
      console.error("Error in AI response:", error);
      
      // Use fallback response mechanism
      const fallbackResponse = getFallbackResponse(userMessage);
      
      // Add fallback response to chat
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: fallbackResponse
      }]);
      
      // Show error toast
      toast({
        title: t('aiGuide.errorTitle'),
        description: t('aiGuide.errorMessage'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-8">
      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">{t('aiGuide.title')}</h2>
        <p className="text-gray-600 mb-6">
          {t('aiGuide.introduction')}
        </p>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-md shadow-sm">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-lg">{t('aiGuide.chatTitle')}</CardTitle>
          </div>
          <CardDescription className="text-gray-600">
            {t('aiGuide.chatDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[400px] flex flex-col">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex items-start gap-2 max-w-[80%] ${
                      message.role === "user" 
                        ? "flex-row-reverse" 
                        : "flex-row"
                    }`}>
                      <div className={`flex-shrink-0 rounded-full p-2 ${
                        message.role === "user" 
                          ? "bg-blue-100" 
                          : "bg-gray-100"
                      }`}>
                        {message.role === "user" 
                          ? <User className="h-4 w-4 text-blue-600" /> 
                          : <Bot className="h-4 w-4 text-gray-600" />
                        }
                      </div>
                      <div className={`rounded-lg px-4 py-2 ${
                        message.role === "user" 
                          ? "bg-blue-500 text-white" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2 max-w-[80%]">
                      <div className="flex-shrink-0 rounded-full p-2 bg-gray-100">
                        <Bot className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="rounded-lg px-4 py-2 bg-gray-100 text-gray-800">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                          <span>{t('aiGuide.thinkingMessage')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <div className="border-t p-4 flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('aiGuide.inputPlaceholder')}
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSend} 
                disabled={input.trim() === "" || isLoading}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mt-8">
        <h3 className="flex items-center text-lg font-medium text-blue-800 mb-3">
          <ArrowDown className="mr-2 h-5 w-5" />
          {t('aiGuide.suggestedQuestions.title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {(t('aiGuide.suggestedQuestions.questions', { returnObjects: true }) as string[]).map((question, index) => (
            <Button 
              key={index} 
              variant="outline" 
              className="justify-start text-left text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
              onClick={() => {
                setInput(question);
                inputRef.current?.focus();
              }}
            >
              {question}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
