import { useState, useEffect, useRef } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Send, Sparkles, Heart, Brain, Wind, ExternalLink } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AICoach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const MAX_FREE_MESSAGES = 10;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load message count from localStorage
    const stored = localStorage.getItem("aiCoachMessageCount");
    if (stored) {
      const count = parseInt(stored, 10);
      setMessageCount(count);
      if (count >= MAX_FREE_MESSAGES) {
        setShowPaywall(true);
      }
    }
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Check if user has exceeded free messages
    if (messageCount >= MAX_FREE_MESSAGES) {
      setShowPaywall(true);
      toast.error("Free message limit reached", {
        description: "Upgrade to From Broken to Whole course for unlimited access.",
      });
      return;
    }

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call the coach API endpoint from the separate Vercel deployment
      const response = await fetch("https://coach-shauncritzers-projects.vercel.app/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI Coach");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));
              if (data.type === "text") {
                assistantMessage += data.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  if (newMessages[newMessages.length - 1]?.role === "assistant") {
                    newMessages[newMessages.length - 1].content = assistantMessage;
                  } else {
                    newMessages.push({ role: "assistant", content: assistantMessage });
                  }
                  return newMessages;
                });
              }
            }
          }
        }
      }

      // Increment message count
      const newCount = messageCount + 1;
      setMessageCount(newCount);
      localStorage.setItem("aiCoachMessageCount", newCount.toString());

      if (newCount >= MAX_FREE_MESSAGES) {
        setShowPaywall(true);
      }
    } catch (error) {
      console.error("Error calling AI Coach:", error);
      toast.error("Failed to connect to AI Coach", {
        description: "Please try again in a moment.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const remainingMessages = MAX_FREE_MESSAGES - messageCount;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center space-x-6">
            <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/memoir" className="text-sm font-medium hover:text-primary transition-colors">
              The Memoir
            </Link>
            <Link href="/blog" className="text-sm font-medium hover:text-primary transition-colors">
              Blog
            </Link>
            <Link href="/resources" className="text-sm font-medium hover:text-primary transition-colors">
              Resources
            </Link>
            <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors">
              Products
            </Link>
            <Link href="/products">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-accent/20 py-12 border-b">
        <div className="container max-w-4xl">
          <div className="text-center space-y-6">
            <div className="inline-block">
              <Badge variant="default" className="text-sm px-4 py-1.5">
                <Sparkles className="mr-2 h-4 w-4" />
                AI-Powered Recovery Support
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              REWIRED Recovery Coach
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Not just another chatbot. An AI trained in trauma-informed, nervous system-centered recovery—built on 13 years of lived experience and the REWIRED methodology.
            </p>
            {!showPaywall && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {remainingMessages} free messages remaining
                </span>
                {remainingMessages <= 3 && (
                  <Badge variant="secondary">
                    Upgrade for unlimited access
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-12 bg-accent/10">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-8">What Makes REWIRED Different</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Brain className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Nervous System First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Standard LLMs give generic advice. REWIRED understands addiction as nervous system dysregulation—not moral failure.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Trauma-Informed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We don't just manage symptoms. We help you understand how childhood trauma shaped your nervous system and compulsive behaviors.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Wind className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Process Addictions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Porn, affairs, work, fitness, bodybuilding—we address ALL compulsive behaviors, not just substances.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Chat Interface */}
      <section className="flex-1 flex flex-col">
        <div className="container max-w-4xl flex-1 flex flex-col py-8">
          {showPaywall ? (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent className="text-center space-y-6 py-12">
                <div className="inline-block p-4 rounded-full bg-primary/10">
                  <Sparkles className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">You've used your 10 free messages</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Unlock unlimited AI Coach access by enrolling in the From Broken to Whole course—a 30-day journey to heal the root causes of addiction.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/products">
                    <Button size="lg" className="bg-primary hover:bg-primary/90">
                      Unlock Unlimited Access ($97)
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      setMessageCount(0);
                      setShowPaywall(false);
                      localStorage.setItem("aiCoachMessageCount", "0");
                      toast.success("Message count reset for demo purposes");
                    }}
                  >
                    Reset Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center space-y-4">
                      <div className="inline-block p-4 rounded-full bg-primary/10">
                        <Heart className="h-8 w-8 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">Welcome to REWIRED Recovery Coach</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Share what's on your mind. I'm here to help you understand your nervous system, process trauma, and find hope in recovery.
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        You have {remainingMessages} free messages to explore.
                      </div>
                    </CardContent>
                  </Card>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Share what's on your mind..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Logo />
              <p className="text-sm text-muted-foreground">
                13 years sober. Helping others find hope, healing, and wholeness in recovery.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Navigation</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="text-muted-foreground hover:text-primary transition-colors">
                    Resources
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="text-muted-foreground hover:text-primary transition-colors">
                    Products
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Products</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/products" className="text-muted-foreground hover:text-primary transition-colors">
                    7-Day Reset
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="text-muted-foreground hover:text-primary transition-colors">
                    From Broken to Whole
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="text-muted-foreground hover:text-primary transition-colors">
                    Bent Not Broken Circle
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li className="text-muted-foreground">
                  <strong>Crisis Hotline:</strong> 988
                </li>
                <li className="text-muted-foreground">
                  <strong>SAMHSA:</strong> 1-800-662-4357
                </li>
                <li>
                  <a
                    href="https://www.aa.org/find-aa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    Find AA Meetings <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2025 Shaun Critzer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
