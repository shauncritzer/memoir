import { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProductPage() {
  const [, params] = useRoute("/products/:slug");
  const slug = params?.slug || "";

  const [email, setEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch product data
  const { data: product, isLoading } = trpc.products.getBySlug.useQuery({ slug });

  const createCheckoutMutation = trpc.products.createCheckoutSession.useMutation({
    onSuccess: (data: { sessionId: string; url: string }) => {
      // Redirect to Stripe checkout
      window.location.href = data.url;
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to start checkout");
      setIsProcessing(false);
    },
  });

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsProcessing(true);
    createCheckoutMutation.mutate({
      productSlug: slug,
      email,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Product Not Found</CardTitle>
            <CardDescription>The product you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Parse features from JSON
  const features = product.features ? JSON.parse(product.features) : [];

  // Format price
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: product.currency.toUpperCase(),
  }).format(product.price / 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Back button */}
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Left Column - Product Details */}
          <div>
            {product.type === "recurring" && (
              <Badge className="mb-4" variant="secondary">
                Monthly Membership
              </Badge>
            )}

            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {product.name}
            </h1>

            <div className="mb-6">
              <span className="text-5xl font-bold text-primary">{formattedPrice}</span>
              {product.type === "recurring" && (
                <span className="text-xl text-gray-600 dark:text-gray-400">
                  /{product.billingInterval}
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Features */}
            {features.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  What's Included:
                </h3>
                <ul className="space-y-3">
                  {features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column - Checkout Form */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Get Started Today</CardTitle>
                <CardDescription>
                  Enter your email to proceed to secure checkout
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleCheckout}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>Secure Checkout:</strong> You'll be redirected to Stripe's secure payment page
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Continue to Checkout`
                    )}
                  </Button>

                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    By continuing, you agree to our terms of service and privacy policy.
                    Payments are securely processed by Stripe.
                  </p>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
