"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { DefaultChatTransport } from "ai";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { X, MessageCircle, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export default function ChatWidget() {
  const { token } = useAuth();

  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      headers: () => ({
        Authorization: `Bearer ${token}`,
      }),
      credentials: () => "include",
    }),
  });
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      {isOpen && (
        <Card className="mb-4 w-[350px] h-[500px] flex flex-col shadow-xl pointer-events-auto border-border bg-card">
          <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between space-y-0 rounded-t-xl">
            <CardTitle className="text-base">AI Assistant</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
            {messages.length === 0 && (
              <p className="text-muted-foreground text-sm text-center mt-4">
                How can I help you today?
              </p>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none",
                  )}
                >
                  {m.parts ? (
                    m.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <div
                              key={`${m.id}-${i}`}
                              className="prose-sm dark:prose-invert break-words leading-normal"
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({ children }) => (
                                    <p className="mb-1 last:mb-0">{children}</p>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="list-disc ml-4 mb-1 space-y-0.5">
                                      {children}
                                    </ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="list-decimal ml-4 mb-1 space-y-0.5">
                                      {children}
                                    </ol>
                                  ),
                                  li: ({ children }) => <li>{children}</li>,
                                  a: ({ children, href }) => (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline underline-offset-2 hover:opacity-80 font-medium"
                                    >
                                      {children}
                                    </a>
                                  ),
                                  code: ({ children }) => (
                                    <code className="bg-background/20 px-1 py-0.5 rounded font-mono text-xs">
                                      {children}
                                    </code>
                                  ),
                                  pre: ({ children }) => (
                                    <pre className="bg-background/20 p-2 rounded mb-2 overflow-x-auto text-xs font-mono">
                                      {children}
                                    </pre>
                                  ),
                                }}
                              >
                                {part.text}
                              </ReactMarkdown>
                            </div>
                          );
                        case "tool-invocation":
                          const invocation =
                            "toolInvocation" in part
                              ? part.toolInvocation
                              : part;
                          return (
                            <div
                              key={`${m.id}-${i}`}
                              className="text-xs bg-muted/50 p-2 rounded italic text-muted-foreground mb-1"
                            >
                              Calling tool:{" "}
                              {JSON.stringify(invocation, null, 2)}
                            </div>
                          );
                        default:
                          return null;
                      }
                    })
                  ) : (
                    <span>No content</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>

          <CardFooter className="p-4 border-t bg-card">
            <form
              onSubmit={handleSend}
              className="flex w-full gap-2 items-center"
            >
              <Input
                className="flex-1 rounded-full bg-background"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
              />
              <Button
                type="submit"
                size="icon"
                className="rounded-full shrink-0"
                disabled={!input.trim()}
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}

      {/* Floating Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform pointer-events-auto"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
