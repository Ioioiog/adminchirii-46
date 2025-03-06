
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Send, Bot, User, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Add structure to organize topics and their related keywords
interface TopicMapping {
  topic: string;
  keywords: string[];
  responseKey: string;
}

export function AiGuide() {
  const { t } = useTranslation('learn');
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: t('aiGuide.welcomeMessage') }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Define keyword mappings for more sophisticated matching
  const topicMappings: TopicMapping[] = [
    {
      topic: "properties",
      keywords: ["property", "properties", "apartment", "house", "rental", "real estate", "listing"],
      responseKey: 'aiGuide.responses.properties'
    },
    {
      topic: "maintenance",
      keywords: ["maintenance", "repair", "fix", "broken", "issue", "problem", "service request"],
      responseKey: 'aiGuide.responses.maintenance'
    },
    {
      topic: "payments",
      keywords: ["payment", "rent", "invoice", "bill", "pay", "money", "fee", "transaction", "deposit"],
      responseKey: 'aiGuide.responses.payments'
    },
    {
      topic: "tenants",
      keywords: ["tenant", "renter", "occupant", "resident", "lease holder"],
      responseKey: 'aiGuide.responses.tenants'
    },
    {
      topic: "landlords",
      keywords: ["landlord", "owner", "property manager", "lessor", "host"],
      responseKey: 'aiGuide.responses.landlords'
    },
    {
      topic: "documents",
      keywords: ["document", "contract", "lease", "agreement", "form", "paper", "file", "pdf"],
      responseKey: 'aiGuide.responses.documents'
    },
    {
      topic: "service_providers",
      keywords: ["service", "provider", "contractor", "vendor", "plumber", "electrician", "handyman"],
      responseKey: 'aiGuide.responses.serviceProviders'
    },
    {
      topic: "settings",
      keywords: ["setting", "profile", "account", "preference", "configuration", "setup"],
      responseKey: 'aiGuide.responses.settings'
    },
    {
      topic: "platform",
      keywords: ["app", "platform", "website", "system", "software", "interface", "dashboard"],
      responseKey: 'aiGuide.responses.platform'
    },
    {
      topic: "help",
      keywords: ["help", "support", "assistance", "contact", "guide", "faq", "question"],
      responseKey: 'aiGuide.responses.help'
    }
  ];

  // Function to get response based on context analysis
  const generateResponse = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    // 1. Check for exact phrases that might override topic detection
    if (lowerQuery.includes("how to use")) {
      if (lowerQuery.includes("payment") || lowerQuery.includes("pay"))
        return t('aiGuide.responses.paymentHowTo');
      if (lowerQuery.includes("maintenance"))
        return t('aiGuide.responses.maintenanceHowTo');
    }
    
    // 2. Score-based topic matching
    const topicScores = topicMappings.map(mapping => {
      // Calculate how many keywords match
      const matchCount = mapping.keywords.filter(keyword => 
        lowerQuery.includes(keyword)
      ).length;
      
      return {
        topic: mapping.topic,
        score: matchCount,
        responseKey: mapping.responseKey
      };
    });
    
    // 3. Get the topic with the highest score
    const bestMatch = topicScores.reduce((best, current) => 
      current.score > best.score ? current : best, 
      { topic: "", score: 0, responseKey: "" }
    );
    
    // 4. If we have a match, return the appropriate response
    if (bestMatch.score > 0) {
      return t(bestMatch.responseKey);
    }
    
    // 5. Context-aware default responses
    if (lowerQuery.includes("hello") || lowerQuery.includes("hi") || lowerQuery.includes("hey")) {
      return t('aiGuide.responses.greeting');
    }
    
    if (lowerQuery.includes("thank")) {
      return t('aiGuide.responses.thanks');
    }
    
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
    
    // 6. Fallback to default response
    return t('aiGuide.responses.default');
  };

  const handleSend = async () => {
    if (input.trim() === "") return;
    
    const userMessage = input.trim();
    setInput("");
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    
    try {
      // Simulate AI response delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate response based on user query
      let response = generateResponse(userMessage);
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      console.error("Error in AI response:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: t('aiGuide.errorMessage') 
      }]);
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
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
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
                <Send className="h-4 w-4" />
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
