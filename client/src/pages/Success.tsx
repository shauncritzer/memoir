import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Mail, Loader2, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Success() {
  const [sessionId] = useState(() => new URLSearchParams(window.location.search).get("session_id"));
  const loginMutation = trpc.auth.loginFromStripeSession.useMutation();

  useEffect(() => {
    if (sessionId) {
      loginMutation.mutate({ sessionId });
    }
  }, [sessionId]);

  // Show spinner while the server verifies payment and sets up the session
  if (sessionId && loginMutation.isPending) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-16 max-w-3xl">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Setting up your course access...</p>
          </div>
        </div>
      </div>
    );
  }

  // Auth failed — payment went through but session setup hit an error.
  // Show a retry button; user can also email support.
  if (sessionId && loginMutation.isError) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-16 max-w-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 mb-6">
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Your payment was successful!</h1>
            <p className="text-muted-foreground">
              We had a small issue setting up your session automatically. You can retry below or sign in manually to access your course.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 text-center">
              <Button
                size="lg"
                className="bg-[#D4AF37] hover:bg-[#B8941F] text-black font-bold"
                onClick={() => loginMutation.mutate({ sessionId })}
              >
                Retry
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Still having trouble? Email us at{" "}
            <a href="mailto:support@shauncritzer.com" className="text-[#D4AF37] hover:underline">
              support@shauncritzer.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Success (or no session_id in URL) — render the full success page.
  // Session cookie is already set; "Access Your Course" links work immediately.
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container py-16 max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to REWIRED!
          </h1>
          <p className="text-2xl text-muted-foreground">
            Your payment was successful
          </p>
        </div>

        <Card className="mb-8 bg-gradient-to-br from-[#1E3A5F] to-gray-900 text-white">
          <CardContent className="pt-8 pb-8 text-center">
            <h2 className="text-2xl font-bold mb-4">You're All Set!</h2>
            <p className="text-lg mb-6 text-gray-300">
              Your 7-Day REWIRED Reset course is now ready to access. Start your transformation today.
            </p>
            <Button
              size="lg"
              className="bg-[#D4AF37] hover:bg-[#B8941F] text-black font-bold text-lg px-8"
              asChild
            >
              <Link href="/7-day-reset">
                Access Your Course
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 text-[#D4AF37] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Check Your Email</h3>
                  <p className="text-muted-foreground">
                    We've sent you a receipt and course access details to your email address.
                    If you don't see it in a few minutes, check your spam folder.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">What Happens Next?</h3>
              <ol className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  <span>
                    <strong className="text-foreground">Access your course:</strong> Click the button above to start Day 1 immediately
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  <span>
                    <strong className="text-foreground">Watch the video:</strong> Each day includes a 5-10 minute video lesson
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  <span>
                    <strong className="text-foreground">Complete the workbook:</strong> Download and fill out the daily exercises (15-20 minutes)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-sm font-bold">
                    4
                  </span>
                  <span>
                    <strong className="text-foreground">Track your progress:</strong> Mark lessons complete as you go
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-sm font-bold">
                    5
                  </span>
                  <span>
                    <strong className="text-foreground">Access bonus content:</strong> After Day 7, unlock "50 Ways to Thrive"
                  </span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-3">A Note from Shaun</h3>
              <p className="text-muted-foreground italic mb-4">
                "Thank you for trusting me with your recovery journey. This course is everything I wish
                someone had taught me on Day 1 of my own path to healing. Remember: this isn't about
                perfection. It's about progress. It's about showing up for yourself, even on the hard days.
              </p>
              <p className="text-muted-foreground italic mb-4">
                You've already taken the hardest step—deciding to change. Now let's rewire your nervous
                system together. I'm honored to walk this path with you."
              </p>
              <p className="text-muted-foreground font-semibold">
                — Shaun Critzer
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-3">Need Help?</h3>
              <p className="text-muted-foreground mb-4">
                If you have any questions or need support, we're here for you.
              </p>
              <p className="text-muted-foreground">
                Email us at: <a href="mailto:support@shauncritzer.com" className="text-[#D4AF37] hover:underline font-semibold">support@shauncritzer.com</a>
              </p>
            </CardContent>
          </Card>

          <div className="text-center pt-8">
            <Button
              size="lg"
              className="bg-[#1E3A5F] hover:bg-[#152D47] text-white font-bold"
              asChild
            >
              <Link href="/7-day-reset">
                Start Day 1 Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
