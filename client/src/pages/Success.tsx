import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Download, Mail, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function Success() {
  const [location] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Extract session_id from URL query params
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session_id");
    setSessionId(id);
  }, [location]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-serif text-2xl font-bold text-primary">Shaun Critzer</span>
          </Link>
          <nav className="flex items-center gap-6">
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
            <Link href="/ai-coach" className="text-sm font-medium hover:text-primary transition-colors">
              AI Coach
            </Link>
          </nav>
        </div>
      </header>

      {/* Success Content */}
      <section className="py-20 px-4">
        <div className="container max-w-3xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <CardTitle className="text-4xl font-serif">
                Thank You for Your Purchase!
              </CardTitle>
              <CardDescription className="text-lg">
                Your payment was successful. You're one step closer to transformation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* What's Next */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold">What Happens Next?</h3>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Check Your Email</h4>
                      <p className="text-muted-foreground text-sm">
                        You'll receive a confirmation email with your receipt and next steps within the next few minutes.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Download className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Access Your Product</h4>
                      <p className="text-muted-foreground text-sm">
                        Your purchase includes instant access to all materials. Check your email for download links and login instructions.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Start Your Journey</h4>
                      <p className="text-muted-foreground text-sm">
                        Begin working through your materials today. Take your time, be gentle with yourself, and remember—recovery is a journey, not a destination.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Info */}
              <div className="bg-muted/50 rounded-lg p-6 space-y-2">
                <h4 className="font-semibold">Need Help?</h4>
                <p className="text-sm text-muted-foreground">
                  If you don't receive your confirmation email within 10 minutes, check your spam folder.
                  If you still need assistance, please contact support at <a href="mailto:support@shauncritzer.com" className="text-primary hover:underline">support@shauncritzer.com</a>
                </p>
              </div>

              {/* Transaction Details */}
              {sessionId && (
                <div className="text-sm text-muted-foreground text-center pt-4 border-t">
                  <p>Transaction ID: {sessionId}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="flex-1">
                  <Link href="/members">
                    Access Members Area
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="flex-1">
                  <Link href="/resources">
                    Browse Free Resources
                  </Link>
                </Button>
              </div>

              <div className="text-center pt-4">
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Return to Homepage
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Encouragement Section */}
          <div className="mt-12 text-center space-y-4">
            <h3 className="text-2xl font-serif font-bold">
              You've Made a Powerful Choice
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Investing in your recovery is one of the most courageous things you can do. I'm honored to walk this journey with you. Remember: you're not broken—you're bent. And bent things can heal.
            </p>
            <p className="text-lg font-medium text-primary">
              — Shaun Critzer
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-muted/30 mt-20">
        <div className="container max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-serif text-xl font-bold mb-4">Shaun Critzer</h3>
              <p className="text-sm text-muted-foreground">
                13 years sober. Helping others find hope, healing, and wholeness in recovery.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Navigation</h4>
              <nav className="flex flex-col gap-2 text-sm">
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
                <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
                <Link href="/resources" className="text-muted-foreground hover:text-primary transition-colors">
                  Resources
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Products</h4>
              <nav className="flex flex-col gap-2 text-sm">
                <Link href="/products" className="text-muted-foreground hover:text-primary transition-colors">
                  All Products
                </Link>
                <Link href="/members" className="text-muted-foreground hover:text-primary transition-colors">
                  Members Area
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <p>Crisis Hotline: 988</p>
                <p>SAMHSA: 1-800-662-4357</p>
                <a href="https://www.aa.org" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Find AA Meetings
                </a>
              </div>
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
