import { useState, useEffect, useRef } from "react";
import { Navigation } from "@/components/Navigation";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Send, Sparkles, Heart, Brain, Wind, ExternalLink, Mail } from "lucide-react";
import RewiredRelief from "@/components/RewiredRelief";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AICoach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [localMessageCount, setLocalMessageCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const MAX_ANONYMOUS_MESSAGES = 3;
  const MAX_REGISTERED_MESSAGES = 10;

  // tRPC queries and mutations
  const { data: userData, refetch: refetchUserData } = trpc.aiCoach.getMessageCount.useQuery(
    { email: userEmail! },
    { enabled: !!userEmail }
  );
  const registerEmailMutation = trpc.aiCoach.registerEmail.useMutation();
  const incrementMessageMutation = trpc.aiCoach.incrementMessageCount.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Only scroll when there are messages (prevents auto-scroll on page load)
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    // Check for reset query parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
      localStorage.removeItem("aiCoachMessageCount");
      localStorage.removeItem("aiCoachEmail");
      toast.success("AI Coach reset successfully", {
        description: "You have 3 fresh messages to try!",
      });
      // Remove the query parameter from URL without reload
      window.history.replaceState({}, '', '/ai-coach');
    }

    // Check if user has registered email
    const storedEmail = localStorage.getItem("aiCoachEmail");
    if (storedEmail) {
      setUserEmail(storedEmail);
    } else {
      // Load local message count for anonymous users
      const stored = localStorage.getItem("aiCoachMessageCount");
      if (stored) {
        setLocalMessageCount(parseInt(stored, 10));
      }
    }
  }, []);

  const handleEmailSubmit = async () => {
    if (!emailInput.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      toast.error("Invalid email", {
        description: "Please enter a valid email address.",
      });
      return;
    }

    try {
      const result = await registerEmailMutation.mutateAsync({
        email: emailInput,
        initialMessageCount: localMessageCount,
      });

      if (result.success) {
        localStorage.setItem("aiCoachEmail", emailInput);
        localStorage.removeItem("aiCoachMessageCount"); // Clear old local count
        setUserEmail(emailInput);
        setShowEmailModal(false);
        toast.success("Email registered!", {
          description: `You now have ${MAX_REGISTERED_MESSAGES - localMessageCount} more messages. Your chat history is saved.`,
        });
        refetchUserData();
      }
    } catch (error) {
      console.error("Error registering email:", error);
      toast.error("Registration failed", {
        description: "Please try again.",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // TIER 1: Anonymous users (first 3 messages)
    if (!userEmail) {
      if (localMessageCount >= MAX_ANONYMOUS_MESSAGES) {
        setShowEmailModal(true);
        return;
      }
    } else {
      // TIER 2: Registered users (10 messages total)
      if (userData) {
        if (userData.hasUnlimitedAccess) {
          // TIER 3: Unlimited access (has purchased course)
          // Continue to send message
        } else if (userData.messageCount >= MAX_REGISTERED_MESSAGES) {
          setShowPaywall(true);
          toast.error("Free message limit reached", {
            description: "Upgrade to From Broken to Whole course for unlimited access.",
          });
          return;
        }
      }
    }

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call the coach API endpoint from the separate Vercel deployment
      const response = await fetch("https://coach-kohl-chi.vercel.app/api/chat", {
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
      if (!userEmail) {
        // Anonymous user - increment local count
        const newCount = localMessageCount + 1;
        setLocalMessageCount(newCount);
        localStorage.setItem("aiCoachMessageCount", newCount.toString());

        if (newCount >= MAX_ANONYMOUS_MESSAGES) {
          // Show email modal after this response completes
          setTimeout(() => setShowEmailModal(true), 1000);
        }
      } else {
        // Registered user - increment server-side count
        if (userData && !userData.hasUnlimitedAccess) {
          await incrementMessageMutation.mutateAsync({ email: userEmail });
          refetchUserData();

          if (userData.messageCount + 1 >= MAX_REGISTERED_MESSAGES) {
            // Show paywall after this response completes
            setTimeout(() => setShowPaywall(true), 1000);
          }
        }
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

  // Calculate remaining messages based on user tier
  const remainingMessages = userEmail
    ? (userData?.hasUnlimitedAccess
        ? Infinity
        : MAX_REGISTERED_MESSAGES - (userData?.messageCount || 0))
    : MAX_ANONYMOUS_MESSAGES - localMessageCount;

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Email Capture Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="bg-gradient-to-br from-gray-900 to-black border-yellow-600/50 text-white">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-yellow-600/20">
                <Mail className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <DialogTitle className="text-2xl text-center text-yellow-500">
              Unlock 7 More Messages & Save Your History
            </DialogTitle>
            <DialogDescription className="text-center text-gray-300">
              Enter your email to unlock 7 additional free messages and save your chat history so you can pick up where you left off, on any device.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleEmailSubmit();
                }
              }}
              className="bg-gray-900 border-yellow-600/50 text-white placeholder:text-gray-500 focus:border-yellow-600"
            />
            <p className="text-xs text-gray-400 text-center">
              We respect your privacy. No spam, ever. Unsubscribe anytime.
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEmailModal(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleEmailSubmit}
              disabled={!emailInput.trim()}
              className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
            >
              Unlock 7 More Messages
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-black to-yellow-900/10 py-12 border-b border-yellow-600/20">
        <div className="container max-w-4xl">
          <div className="text-center space-y-6">
            <div className="inline-block">
              <Badge className="text-sm px-4 py-1.5 bg-yellow-600 text-black border-yellow-500">
                <Sparkles className="mr-2 h-4 w-4" />
                AI-Powered Recovery Support
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-yellow-500">
              REWIRED Recovery Coach
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Not just another chatbot. An AI trained in trauma-informed, nervous system-centered recovery—built on 13 years of lived experience and the REWIRED methodology.
            </p>
            {!showPaywall && (
              <div className="flex items-center justify-center gap-2 text-sm">
                {userData?.hasUnlimitedAccess ? (
                  <Badge className="bg-yellow-600 text-black border-yellow-500 font-bold">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Unlimited Access
                  </Badge>
                ) : (
                  <>
                    <span className="text-gray-400">
                      {remainingMessages} free message{remainingMessages !== 1 ? 's' : ''} remaining
                    </span>
                    {remainingMessages <= 3 && remainingMessages > 0 && (
                      <Badge className="bg-yellow-600/20 text-yellow-500 border-yellow-600">
                        {userEmail ? 'Upgrade for unlimited' : 'Enter email for 7 more'}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-12 bg-gradient-to-b from-yellow-900/10 to-black">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-8 text-yellow-500">What Makes REWIRED Different</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-yellow-900/20 to-black border-yellow-600/30 text-white">
              <CardHeader>
                <Brain className="h-8 w-8 text-yellow-500 mb-2" />
                <CardTitle className="text-lg">Nervous System First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">
                  Standard LLMs give generic advice. REWIRED understands addiction as nervous system dysregulation—not moral failure.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/20 to-black border-yellow-600/30 text-white">
              <CardHeader>
                <Heart className="h-8 w-8 text-yellow-500 mb-2" />
                <CardTitle className="text-lg">Trauma-Informed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">
                  We don't just manage symptoms. We help you understand how childhood trauma shaped your nervous system and compulsive behaviors.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/20 to-black border-yellow-600/30 text-white">
              <CardHeader>
                <Wind className="h-8 w-8 text-yellow-500 mb-2" />
                <CardTitle className="text-lg">Process Addictions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">
                  Compulsive behaviors like affairs, work, fitness, bodybuilding—we address ALL process addictions, not just substances.
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
            <Card className="flex-1 flex items-center justify-center bg-gradient-to-br from-yellow-900/20 to-black border-yellow-600/30">
              <CardContent className="text-center space-y-6 py-12">
                <div className="inline-block p-4 rounded-full bg-yellow-600/20">
                  <Sparkles className="h-12 w-12 text-yellow-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-yellow-500">You've used your 10 free messages</h3>
                  <p className="text-gray-300 max-w-md mx-auto">
                    Unlock unlimited AI Coach access by enrolling in the From Broken to Whole course—a 30-day journey to heal the root causes of addiction.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/products">
                    <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold">
                      Unlock Unlimited Access ($97)
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    variant="outline" className="border-yellow-600 text-yellow-500 hover:bg-yellow-600/10"
                    onClick={() => {
                      setLocalMessageCount(0);
                      setShowPaywall(false);
                      setUserEmail(null);
                      localStorage.removeItem("aiCoachMessageCount");
                      localStorage.removeItem("aiCoachEmail");
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
                  <Card className="border-dashed bg-gradient-to-br from-yellow-900/10 to-black border-yellow-600/30">
                    <CardContent className="py-12 text-center space-y-4">
                      <div className="inline-block p-4 rounded-full bg-yellow-600/20">
                        <Heart className="h-8 w-8 text-yellow-500" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-yellow-500">Welcome to REWIRED Recovery Coach</h3>
                        <p className="text-gray-300 max-w-md mx-auto">
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
                          ? "bg-yellow-600 text-black font-medium"
                          : "bg-gray-900 border border-yellow-600/30 text-white"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-900 border border-yellow-600/30">
                      <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="space-y-3 mb-8">
                <label htmlFor="chat-input" className="block text-sm font-medium text-gray-400">
                  Ask me anything about recovery, nervous system regulation, or trauma healing...
                </label>
                <div className="flex gap-3">
                  <textarea
                    id="chat-input"
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
                    rows={3}
                    className="flex-1 p-6 bg-gray-900 border-2 border-yellow-600/50 rounded-xl text-lg text-white placeholder:text-gray-500 focus:ring-4 focus:ring-yellow-600/20 focus:border-yellow-600 transition-all resize-none shadow-xl min-h-[80px]"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !input.trim()}
                    className="bg-yellow-600 hover:bg-yellow-700 text-black px-8 py-4 h-auto text-lg font-bold shadow-xl"
                  >
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-6 w-6 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-yellow-600/20 bg-black py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Logo />
              <p className="text-sm text-gray-400">
                13 years sober. Helping others find hope, healing, and wholeness in recovery.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-yellow-500">Navigation</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-yellow-500 transition-colors">
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

      {/* REWIRED Relief Floating Button & Modal */}
      <RewiredRelief />
    </div>
  );
}
