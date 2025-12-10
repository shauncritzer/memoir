import { Logo } from "@/components/Logo";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Products() {
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);

  const createCheckoutSession = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data: { url: string; sessionId: string }) => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    },
    onError: (error: { message: string }) => {
      toast.error("Failed to start checkout", {
        description: error.message,
      });
      setLoadingProduct(null);
    },
  });

  const handlePurchase = (priceId: string, productName: string) => {
    setLoadingProduct(productName);
    createCheckoutSession.mutate({ priceId });
  };

  const products = [
    {
      id: "crooked-lines-memoir",
      name: "Crooked Lines: Bent, Not Broken",
      tagline: "The Memoir",
      price: "$19.99",
      priceId: import.meta.env.VITE_STRIPE_PRICE_MEMOIR || "price_1SbOUTC2dOpPzSOOOdxient8",
      description: "A raw, unflinching memoir about childhood trauma, addiction, rock bottom, and the redemption that comes from choosing recovery one day at a time.",
      features: [
        "13-year recovery journey from rock bottom to redemption",
        "Childhood trauma and its impact on addiction",
        "Process addictions: compulsive behaviors, affairs, bodybuilding",
        "Nervous system dysregulation explained",
        "Honest account of relapse and resilience",
        "Hope for those who feel broken beyond repair",
      ],
      ideal: "Perfect for: Anyone seeking hope, understanding addiction's roots, or supporting a loved one",
      badge: "The Foundation",
      badgeVariant: "secondary" as const,
    },
    {
      id: "7-day-reset",
      name: "7-Day Reset",
      tagline: "Recovery Jumpstart",
      price: "$27",
      priceId: import.meta.env.VITE_STRIPE_PRICE_RESET_CHALLENGE || "price_1SYt2tC2dOpPzSOOpg5PW7eU",
      description: "A comprehensive 7-day workbook designed to give you momentum, clarity, and hope in early recovery.",
      features: [
        "7 days of structured exercises and reflections",
        "Daily themes: honesty, support, triggers, routines, shame, resilience, celebration",
        "Practical worksheets and tools",
        "Emergency resources and crisis contacts",
        "Lifetime access to PDF workbook",
        "Immediate download after purchase",
      ],
      ideal: "Perfect for: Early recovery, thinking about getting sober, or supporting someone who is",
      badge: "Most Popular",
      badgeVariant: "default" as const,
    },
    {
      id: "from-broken-to-whole",
      name: "From Broken to Whole",
      tagline: "30-Day Transformation",
      price: "$97",
      priceId: import.meta.env.VITE_STRIPE_PRICE_RECOVERY_ROADMAP || "price_1SYt3KC2dOpPzSOOpAokfJUQ",
      description: "A deep dive into trauma healing, inner child work, and building a life worth staying sober for.",
      features: [
        "8 comprehensive modules over 30 days",
        "Trauma-addiction connection explained",
        "Somatic healing and nervous system regulation",
        "Inner child healing exercises",
        "Shame processing and self-forgiveness",
        "Relationship rebuilding strategies",
        "Purpose and meaning discovery",
        "Spiritual awakening practices",
        "Lifetime access to all materials",
      ],
      ideal: "Perfect for: Those with sobriety who want to heal the root causes of addiction",
      badge: "Best Value",
      badgeVariant: "secondary" as const,
    },
    {
      id: "bent-not-broken-circle",
      name: "Bent Not Broken Circle",
      tagline: "Monthly Membership",
      price: "$29/month",
      priceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY_MEMBERSHIP || "price_1SYt3jC2dOpPzSOOR7dDuGtY",
      description: "Ongoing community, support, and accountability for long-term recovery.",
      features: [
        "Monthly live group coaching calls",
        "Private community forum",
        "Weekly accountability check-ins",
        "Exclusive content and resources",
        "Guest expert sessions",
        "Peer support and connection",
        "Cancel anytime",
      ],
      ideal: "Perfect for: Those committed to long-term recovery and community",
      badge: "Community",
      badgeVariant: "outline" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
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
            <Link href="/products" className="text-sm font-medium text-primary">
              Products
            </Link>
            <Link href="/ai-coach" className="text-sm font-medium hover:text-primary transition-colors">
              AI Coach
            </Link>
            <Link href="/">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Transform Your Recovery
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            From early sobriety to deep healing to thriving in long-term recovery—choose the path that's right for you.
          </p>
          <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>13 years of recovery experience</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Trauma-informed approach</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Lifetime access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 px-4 pb-20">
        <div className="container max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={product.badgeVariant}>{product.badge}</Badge>
                    <span className="text-3xl font-bold text-primary">{product.price}</span>
                  </div>
                  <CardTitle className="text-2xl font-serif">{product.name}</CardTitle>
                  <CardDescription className="text-base">{product.tagline}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-muted-foreground mb-6">{product.description}</p>
                  
                  <div className="space-y-3 mb-6">
                    {product.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm font-medium">{product.ideal}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => handlePurchase(product.priceId, product.id)}
                    disabled={loadingProduct === product.id}
                  >
                    {loadingProduct === product.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      product.id === "crooked-lines-memoir" ? "Get the Book Now" : `Get ${product.name}`
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl font-bold mb-6">Why These Products Work</h2>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div>
              <h3 className="font-semibold text-lg mb-2">Lived Experience</h3>
              <p className="text-muted-foreground text-sm">
                Created by someone with 13 years of recovery, not just theory from a textbook.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Trauma-Informed</h3>
              <p className="text-muted-foreground text-sm">
                Addresses the root causes of addiction—childhood trauma, shame, and nervous system dysregulation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Practical Tools</h3>
              <p className="text-muted-foreground text-sm">
                Not just inspiration—actual exercises, worksheets, and strategies you can use today.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-4xl font-bold mb-6">
            Ready to Start Your Transformation?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Choose the product that's right for where you are in your recovery journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="#products" onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}>
                View Products
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/resources">
                Get Free Resources
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8">
            <div>
              <h3 className="font-serif text-xl font-bold mb-4">Shaun Critzer</h3>
              <p className="text-sm text-muted-foreground">
                13 years sober. Helping others find hope, healing, and wholeness in recovery.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Navigation</h4>
              <nav className="flex flex-col gap-2 text-sm">
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
                <Link href="/memoir" className="text-muted-foreground hover:text-primary transition-colors">
                  Memoir
                </Link>
                <Link href="/products" className="text-muted-foreground hover:text-primary transition-colors">
                  Products
                </Link>
                <Link href="/ai-coach" className="text-muted-foreground hover:text-primary transition-colors">
                  AI Coach
                </Link>
                <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </nav>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Products</h4>
              <nav className="flex flex-col gap-2 text-sm">
                <a href="#7-day-reset" className="text-muted-foreground hover:text-primary transition-colors">
                  7-Day Reset
                </a>
                <a href="#from-broken-to-whole" className="text-muted-foreground hover:text-primary transition-colors">
                  From Broken to Whole
                </a>
                <a href="#bent-not-broken-circle" className="text-muted-foreground hover:text-primary transition-colors">
                  Bent Not Broken Circle
                </a>
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
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <nav className="flex flex-col gap-2 text-sm">
                <Link href="/terms-of-use" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Use
                </Link>
                <Link href="/refund-policy" className="text-muted-foreground hover:text-primary transition-colors">
                  Refund Policy
                </Link>
                <Link href="/faqs" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQs
                </Link>
              </nav>
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
