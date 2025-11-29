import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Download, Home, Loader2, Mail } from "lucide-react";

export default function Success() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const sessionId = searchParams.get('session_id');

  const [showConfetti, setShowConfetti] = useState(false);

  // Fetch order details
  const { data: orderData, isLoading } = trpc.orders.getBySessionId.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  useEffect(() => {
    if (orderData?.order) {
      setShowConfetti(true);
      // Optionally show confetti animation
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [orderData]);

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid Session</CardTitle>
            <CardDescription>No session ID found</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/">
              <Button>
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Processing your order...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const order = orderData?.order;
  const product = orderData?.product;

  if (!order || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Order Not Found</CardTitle>
            <CardDescription>We couldn't find your order details</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/">
              <Button>
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: order.currency.toUpperCase(),
  }).format(order.amount / 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl">Payment Successful! 🎉</CardTitle>
          <CardDescription className="text-lg">
            Thank you for your purchase
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Order Details */}
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Order Number:</span>
              <span className="font-mono font-semibold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Product:</span>
              <span className="font-semibold">{product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Amount Paid:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {formattedAmount}
              </span>
            </div>
            {order.email && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="font-semibold">{order.email}</span>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">What happens next?</h3>

            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium">Check your email</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We've sent a confirmation email to <strong>{order.email}</strong> with your receipt and access details.
                </p>
              </div>
            </div>

            {product.type === "one_time" && (
              <div className="flex items-start space-x-3">
                <Download className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium">Access your content</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your purchase includes immediate access. Check your email for download links and instructions.
                  </p>
                </div>
              </div>
            )}

            {product.type === "recurring" && (
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium">Membership activated</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your monthly membership is now active. Check your email for login details and member benefits.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Need help?</strong> If you don't receive your email within a few minutes, check your spam folder or contact support.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center">
          <Link href="/">
            <Button size="lg">
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
