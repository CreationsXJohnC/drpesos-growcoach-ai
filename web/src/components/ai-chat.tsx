"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChatStore } from "@/stores/chat-store";
import { WELCOME_MESSAGE, CONVERSATION_STARTERS } from "@/lib/ai/system-prompt";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  MessageCircle,
  X,
  Send,
  Paperclip,
  Maximize2,
  Minimize2,
  Loader2,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AiChat() {
  const {
    messages,
    isLoading,
    isOpen,
    growContext,
    addMessage,
    updateMessage,
    setLoading,
    setOpen,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ url: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() && !uploadedImage) return;

      setHasStarted(true);
      const userContent = content.trim();
      const attachments = uploadedImage
        ? [{ type: "image" as const, url: uploadedImage.url, name: uploadedImage.name }]
        : undefined;

      addMessage("user", userContent, attachments);
      setInput("");
      setUploadedImage(null);
      setLoading(true);

      const assistantId = addMessage("assistant", "");

      try {
        // Build messages array for API (include full conversation history)
        const currentMessages = useChatStore.getState().messages.slice(0, -1); // exclude just-added assistant placeholder
        const apiMessages = currentMessages.map((m) => ({
          role: m.role,
          content: m.role === "user" && m.attachments?.length
            ? [
                ...m.attachments.map((a) => ({
                  type: "image",
                  source: { type: "url", url: a.url },
                })),
                { type: "text", text: m.content || "What's wrong with this plant?" },
              ]
            : m.content,
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            growContext,
          }),
        });

        if (!response.ok) throw new Error("Chat request failed");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  accumulated += parsed.text;
                  updateMessage(assistantId, accumulated);
                }
              } catch {
                // skip malformed lines
              }
            }
          }
        }
      } catch (err) {
        console.error("Chat error:", err);
        updateMessage(
          assistantId,
          "I'm having trouble connecting right now. Please try again in a moment."
        );
      } finally {
        setLoading(false);
      }
    },
    [addMessage, updateMessage, setLoading, growContext, uploadedImage]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedImage({ url, name: file.name });
  };

  const chatWidth = isExpanded ? "w-[700px]" : "w-[380px]";
  const chatHeight = isExpanded ? "h-[600px]" : "h-[500px]";

  if (!isOpen) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg glow-green hover:scale-105 transition-all duration-200"
        aria-label="Open Dr. Pesos Grow Coach AI"
      >
        <Leaf className="h-5 w-5" />
        <span className="text-sm font-semibold hidden sm:block">Ask Dr. Pesos</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300",
        chatWidth,
        chatHeight,
        "sm:bottom-6 sm:right-6",
        // Mobile: full screen
        "max-sm:!w-full max-sm:!h-full max-sm:!bottom-0 max-sm:!right-0 max-sm:!rounded-none"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card rounded-t-2xl max-sm:rounded-none">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 glow-green">
            <Leaf className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Dr. Pesos Grow Coach AI</p>
            <p className="text-xs text-muted-foreground">Powered by Ori Company · We Grow Life</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hidden sm:flex"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Minimize" : "Expand"}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {/* Welcome message / starters */}
        {!hasStarted && messages.length === 0 && (
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {WELCOME_MESSAGE}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Conversation starters:</p>
              <div className="flex flex-wrap gap-2">
                {CONVERSATION_STARTERS.map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(starter)}
                    className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs text-primary hover:bg-primary/10 transition-colors text-left"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat messages */}
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2 message-fade-in",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {message.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-1">
                  <Leaf className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                )}
              >
                {message.attachments?.map((att) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={att.url}
                    src={att.url}
                    alt={att.name}
                    className="mb-2 max-h-40 rounded-lg object-cover"
                  />
                ))}
                {message.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content || (isLoading ? "▋" : "")}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                <Leaf className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl bg-muted px-3 py-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs">Dr. Pesos is thinking...</span>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Image preview */}
      {uploadedImage && (
        <div className="flex items-center gap-2 border-t border-border px-4 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={uploadedImage.url} alt={uploadedImage.name} className="h-10 w-10 rounded object-cover" />
          <span className="text-xs text-muted-foreground truncate flex-1">{uploadedImage.name}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setUploadedImage(null)}>
            <X className="h-3 w-3" />
          </Button>
          <Badge variant="secondary" className="text-xs">Ready to diagnose</Badge>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border px-3 py-3">
        {growContext?.stage && (
          <div className="mb-2">
            <Badge variant="outline" className="text-xs text-primary border-primary/30">
              <Leaf className="h-2.5 w-2.5 mr-1" />
              {growContext.stage} · Week {growContext.week}
            </Badge>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload plant photo"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Dr. Pesos anything about your grow..."
            className="min-h-[40px] max-h-[120px] resize-none text-sm py-2"
            rows={1}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => sendMessage(input)}
            disabled={isLoading || (!input.trim() && !uploadedImage)}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Check local laws before growing. For cultivation guidance only.
        </p>
      </div>
    </div>
  );
}

// Floating trigger button (export for use in layouts)
export function ChatTrigger() {
  const { setOpen } = useChatStore();
  return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-primary-foreground shadow-lg glow-green hover:scale-105 transition-all duration-200"
    >
      <MessageCircle className="h-4 w-4" />
      <span className="text-sm font-semibold">Ask Dr. Pesos</span>
    </button>
  );
}
