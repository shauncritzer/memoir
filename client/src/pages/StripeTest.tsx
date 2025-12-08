import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function StripeTest() {
  const [results, setResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const products = [
    {
      name: "Crooked Lines Memoir",
      priceId: "price_1SbOUTC2dOpPzSOOdxient8",
      expectedMode: "payment"
    },
    {
      name: "7-Day Reset",
      priceId: "price_1SYt2tC2dOpPzSOOpg5PW7eU",
      expectedMode: "payment"
    },
    {
      name: "From Broken to Whole",
      priceId: "price_1SYt3KC2dOpPzSOOpAokf1UQ",
      expectedMode: "payment"
    },
    {
      name: "Monthly Membership",
      priceId: "price_1SYt3jC2dOpPzSOOR7dDuGtY",
      expectedMode: "subscription"
    }
  ];

  const createCheckoutMutation = trpc.stripe.createCheckoutSession.useMutation();

  const testAllProducts = async () => {
    setTesting(true);
    setResults([]);

    for (const product of products) {
      try {
        const result = await createCheckoutMutation.mutateAsync({
          priceId: product.priceId
        });

        setResults(prev => [...prev, {
          product: product.name,
          priceId: product.priceId,
          expectedMode: product.expectedMode,
          success: true,
          url: result.url,
          message: "✅ Checkout session created successfully"
        }]);
      } catch (error: any) {
        setResults(prev => [...prev, {
          product: product.name,
          priceId: product.priceId,
          expectedMode: product.expectedMode,
          success: false,
          error: error.message,
          details: error.data?.zodError || error.data || "No additional details"
        }]);
      }
    }

    setTesting(false);
  };

  return (
    <div className="container max-w-4xl py-12 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Stripe Checkout Diagnostic</h1>
        <p className="text-muted-foreground">
          Test all 4 products to see which ones work and get exact error messages
        </p>
      </div>

      <Card className="p-6">
        <Button
          onClick={testAllProducts}
          disabled={testing}
          size="lg"
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Testing All Products...
            </>
          ) : (
            "Test All 4 Products"
          )}
        </Button>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Test Results:</h2>

          {results.map((result, index) => (
            <Card key={index} className={`p-6 ${result.success ? 'border-green-500' : 'border-red-500'} border-2`}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                      {result.product}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Price ID: <code className="bg-muted px-2 py-1 rounded">{result.priceId}</code>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expected Mode: <code className="bg-muted px-2 py-1 rounded">{result.expectedMode}</code>
                    </p>
                  </div>
                </div>

                {result.success ? (
                  <div className="space-y-2">
                    <p className="text-green-600 font-medium">{result.message}</p>
                    <p className="text-sm text-muted-foreground">
                      Checkout URL: <code className="bg-muted px-2 py-1 rounded text-xs break-all">{result.url}</code>
                    </p>
                    <Button
                      onClick={() => window.open(result.url, '_blank')}
                      variant="outline"
                      size="sm"
                    >
                      Open Checkout Page
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="font-semibold text-red-900 mb-2">❌ Error Message:</p>
                      <code className="text-sm text-red-700 block whitespace-pre-wrap">
                        {result.error}
                      </code>
                    </div>

                    {result.details && result.details !== "No additional details" && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <p className="font-semibold text-orange-900 mb-2">📋 Additional Details:</p>
                        <pre className="text-xs text-orange-700 overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}

          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">🔍 What to look for:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li><strong>"No such price"</strong> = Price ID doesn't exist in Stripe OR wrong mode (test vs live)</li>
              <li><strong>"payment mode but passed recurring price"</strong> = Mode detection wrong in code</li>
              <li><strong>"subscription mode but passed one-time price"</strong> = Mode detection wrong in code</li>
              <li><strong>Price ID format issues</strong> = Typo in Products.tsx</li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
