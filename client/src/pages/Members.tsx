import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BookOpen, CheckCircle2, Clock, Lock, PlayCircle } from "lucide-react";
import { Link } from "wouter";

export default function Members() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: purchases, isLoading: purchasesLoading } = trpc.members.getPurchases.useQuery(undefined, {
    enabled: !!user,
  });

  // Show loading state
  if (authLoading || purchasesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-accent/20">
        <Card className="max-w-md w-full p-8 space-y-6">
          <div className="text-center space-y-4">
            <Lock className="h-16 w-16 text-primary mx-auto" />
            <h1 className="text-3xl font-bold">Member Access Required</h1>
            <p className="text-muted-foreground">
              Please log in to access your purchased courses and products.
            </p>
          </div>
          <Link href="/login">
            <Button
              size="lg"
              className="w-full bg-primary hover:bg-primary/90"
            >
              Log In to Continue
            </Button>
          </Link>
          <div className="text-center">
            <Link href="/products">
              <Button variant="link" className="text-sm">
                Don't have an account? View Products →
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Show empty state if no purchases
  if (!purchases || purchases.length === 0) {
    return (
      <div className="min-h-screen">
        <Navigation />

        {/* Empty State */}
        <div className="container pt-28 pb-20">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <BookOpen className="h-24 w-24 text-muted-foreground/50 mx-auto" />
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">Welcome, {user.name}!</h1>
              <p className="text-xl text-muted-foreground">
                You haven't purchased any courses yet. Check out our transformative recovery programs to get started.
              </p>
            </div>
            <Link href="/products">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show member dashboard with purchased products
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/10">
      <Navigation />

      {/* Dashboard Content */}
      <div className="container pt-28 pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Welcome Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Welcome back, {user.name}!</h1>
            <p className="text-xl text-muted-foreground">
              Continue your recovery journey with your purchased courses.
            </p>
          </div>

          {/* Purchased Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Deduplicate purchases by productId - show each known product once */}
            {Array.from(new Map(purchases.map(p => [p.productId, p])).values())
              .filter((purchase) => getProductInfo(purchase.productId) !== null)
              .map((purchase) => {
              const productInfo = getProductInfo(purchase.productId)!;

              return (
                <Card key={purchase.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative overflow-hidden">
                    {productInfo.image ? (
                      <img
                        src={productInfo.image}
                        alt={productInfo.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : null}
                    <PlayCircle className="h-16 w-16 text-primary relative z-10 drop-shadow-lg" />
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">{productInfo.title}</h3>
                      <p className="text-sm text-muted-foreground">{productInfo.description}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{purchase.progress || 0}%</span>
                      </div>
                      <div className="h-2 bg-accent rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${purchase.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats */}
                    {productInfo.moduleCount > 0 && (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{productInfo.moduleCount} modules</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{productInfo.duration}</span>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Link href={productInfo.href}>
                      <Button className="w-full bg-primary hover:bg-primary/90">
                        {purchase.progress && purchase.progress > 0 ? "Continue Learning" : "Start Course"}
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Upgrade CTA for non-Circle members */}
          {!purchases.some(p => p.productId === "bent-not-broken-circle") && (
            <Card className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 space-y-4">
                  <h3 className="text-2xl font-bold">Join the Bent Not Broken Circle</h3>
                  <p className="text-muted-foreground">
                    Get unlimited access to all courses, monthly live coaching calls, private community, and exclusive content for just $29/month.
                  </p>
                </div>
                <Link href="/products">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 whitespace-nowrap">
                    Learn More →
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Helper function to get product info
function getProductInfo(productId: string) {
  const products: Record<string, { title: string; description: string; moduleCount: number; duration: string; image?: string; href: string }> = {
    "7-day-reset": {
      title: "7-Day Reset",
      description: "Build your foundation for lasting recovery in just one week.",
      moduleCount: 7,
      duration: "7 days",
      image: "/images/7-day-reset-hero.jpg",
      href: "/7-day-reset",
    },
    "from-broken-to-whole": {
      title: "From Broken to Whole",
      description: "30-day deep healing journey addressing trauma and addiction.",
      moduleCount: 8,
      duration: "30 days",
      image: "/images/from-broken-to-whole-hero.jpg",
      href: "/from-broken-to-whole",
    },
    "thriving-sober": {
      title: "Thriving Sober",
      description: "Build a fulfilling life beyond recovery with purpose and connection.",
      moduleCount: 6,
      duration: "6 weeks",
      image: "/images/thriving-sober-hero.jpg",
      href: "/products",
    },
    "bent-not-broken-circle": {
      title: "Bent Not Broken Circle",
      description: "Monthly membership with unlimited course access and live coaching.",
      moduleCount: 0,
      duration: "Ongoing",
      href: "/products",
    },
    "crooked-lines-memoir": {
      title: "Crooked Lines: Bent, Not Broken",
      description: "The complete memoir + bonus materials.",
      moduleCount: 0,
      duration: "Book",
      href: "/memoir",
    },
  };

  return products[productId] || null;
}
