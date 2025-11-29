import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft, Home } from "lucide-react";

export default function Cancel() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-gray-600 dark:text-gray-400" />
          </div>
          <CardTitle className="text-2xl">Checkout Cancelled</CardTitle>
          <CardDescription className="text-base">
            Your payment was not processed
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-center text-gray-600 dark:text-gray-400">
            No charges have been made to your account. You can return to the product page to try again,
            or continue browsing our site.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Changed your mind?</strong> Feel free to come back anytime. Your cart and preferences are saved.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Product
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
