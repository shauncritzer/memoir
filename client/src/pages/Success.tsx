import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Success() {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Get session_id from URL
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session_id");
    setSessionId(sid);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container py-16">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-teal-500" />
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
            <p className="text-xl text-muted-foreground">
              Thank you for your purchase. Your order has been confirmed.
            </p>
          </div>

          {sessionId && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">Order Reference:</p>
                <p className="font-mono text-sm break-all">{sessionId}</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4 pt-6">
            <p className="text-muted-foreground">
              You should receive a confirmation email shortly with details about accessing your purchase.
            </p>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => setLocation("/members")} size="lg">
                Go to Members Area
              </Button>
              <Button onClick={() => setLocation("/products")} variant="outline" size="lg">
                View Products
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
