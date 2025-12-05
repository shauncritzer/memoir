import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Sparkles, Lock, Brain } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";

export default function Coach() {
  const [messagesRemaining, setMessagesRemaining] = useState<number | null>(null);

  useEffect(() => {
    // Get message count from localStorage
    const count = localStorage.getItem('coach_message_count');
    const remaining = count ? 10 - parseInt(count) : 10;
    setMessagesRemaining(remaining);
  }, []);

  const hasMessagesLeft = messagesRemaining === null || messagesRemaining > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Shaun Critzer
            </span>
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
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
            <Link href="/coach" className="text-sm font-medium text-primary">
              AI Coach
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 px-4 bg-gradient-to-b from-background to-primary/5">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center space-y-6 mb-8">
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <Sparkles className="mr-2 h-3 w-3" />
              Beta - Free Trial
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold">
              AI Recovery Coach
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get instant support, guidance, and accountability—24/7. Trained specifically on addiction recovery, trauma healing, and sobriety support.
            </p>

            {/* Usage Counter */}
            {messagesRemaining !== null && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {hasMessagesLeft
                    ? `${messagesRemaining} free messages remaining`
                    : "Free messages used"}
                </span>
              </div>
            )}
          </div>

          {/* What Makes It Different */}
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              What Makes This Different?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-primary">Recovery-Specific Training</h3>
                <p className="text-sm text-muted-foreground">
                  Unlike generic AI, this coach is trained on addiction recovery, 12-step principles, trauma healing, and sobriety support.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-primary">Lived Experience</h3>
                <p className="text-sm text-muted-foreground">
                  Built by someone 13 years sober who understands rock bottom, recovery, and everything in between.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-primary">Always Available</h3>
                <p className="text-sm text-muted-foreground">
                  3am craving? Feeling triggered? Get instant support when you need it most—no appointment required.
                </p>
              </div>
            </div>
          </Card>

          {/* Upgrade CTA */}
          {messagesRemaining !== null && messagesRemaining <= 3 && (
            <Card className="p-6 mb-8 border-primary/50 bg-primary/5">
              <div className="flex items-start gap-4">
                <Lock className="h-6 w-6 text-primary shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    {hasMessagesLeft
                      ? "Almost out of free messages!"
                      : "Want unlimited AI coaching?"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Get unlimited access to the AI Recovery Coach with the Bent Not Broken Circle membership.
                  </p>
                  <Button asChild>
                    <Link href="/products">
                      Upgrade to Membership - $29/month
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* Coach Iframe */}
      {hasMessagesLeft ? (
        <section className="pb-12 px-4">
          <div className="container max-w-6xl mx-auto">
            <Card className="overflow-hidden">
              <iframe
                src="https://coach-kohl-chi.vercel.app"
                className="w-full h-[600px] border-0"
                title="AI Recovery Coach"
                allow="clipboard-write"
              />
            </Card>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Note: This AI coach is for support and guidance only. In crisis, please call 988 (Suicide & Crisis Lifeline) or 911.
            </p>
          </div>
        </section>
      ) : (
        <section className="pb-12 px-4">
          <div className="container max-w-2xl mx-auto">
            <Card className="p-12 text-center space-y-6">
              <Lock className="h-16 w-16 text-muted-foreground mx-auto" />
              <h2 className="text-3xl font-bold">Free Messages Used</h2>
              <p className="text-xl text-muted-foreground">
                You've used your 10 free messages. Upgrade to get unlimited access to the AI Recovery Coach.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/products">
                    View Membership Plans
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/resources">
                    Get Free Resources Instead
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">How It Helps</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 text-left">
              <h3 className="font-semibold text-lg mb-2">Cravings & Triggers</h3>
              <p className="text-sm text-muted-foreground">
                Get real-time support when you're triggered or experiencing cravings. Talk through what you're feeling and get evidence-based coping strategies.
              </p>
            </Card>
            <Card className="p-6 text-left">
              <h3 className="font-semibold text-lg mb-2">Accountability Check-ins</h3>
              <p className="text-sm text-muted-foreground">
                Daily or weekly check-ins to stay on track. Share wins, struggles, and get encouragement to keep going.
              </p>
            </Card>
            <Card className="p-6 text-left">
              <h3 className="font-semibold text-lg mb-2">Trauma Processing</h3>
              <p className="text-sm text-muted-foreground">
                Explore childhood wounds, shame, and emotional pain in a safe space. Get guidance on healing techniques like inner child work.
              </p>
            </Card>
            <Card className="p-6 text-left">
              <h3 className="font-semibold text-lg mb-2">Recovery Education</h3>
              <p className="text-sm text-muted-foreground">
                Learn about the 12 steps, EMDR, somatic healing, and other recovery tools. Get answers to your questions about the journey.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>&copy; {new Date().getFullYear()} Shaun Critzer. All rights reserved.</p>
            <p className="text-xs">
              This AI coach provides information and support but is not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
