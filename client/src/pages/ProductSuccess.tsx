import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Link, useSearch } from "wouter";

export default function ProductSuccess() {
  const searchParams = new URLSearchParams(useSearch());
  const productSlug = searchParams.get("product");

  const productMessages: Record<string, { title: string; message: string; nextSteps: string[] }> = {
    "7-day-reset": {
      title: "Welcome to the 7-Day Reset Challenge!",
      message: "You've taken the first step toward real recovery. Check your email for access details and your day 1 materials.",
      nextSteps: [
        "Check your email for your welcome message and login credentials",
        "Join our private community group for daily support",
        "Download the challenge workbook to track your progress",
        "Set a reminder for tomorrow's lesson"
      ]
    },
    "recovery-roadmap": {
      title: "Welcome to the Recovery Roadmap Course!",
      message: "You now have lifetime access to the complete course. Check your email for your login details.",
      nextSteps: [
        "Check your email for your course access link",
        "Watch the welcome video to get started",
        "Download the course workbook and resources",
        "Join the private student community",
        "Start with Module 1: Understanding Your Story"
      ]
    },
    "monthly-membership": {
      title: "Welcome to the Monthly Membership!",
      message: "You're now part of an exclusive community of people committed to recovery. Your first month starts today.",
      nextSteps: [
        "Check your email for community access details",
        "Join our private member forum",
        "Attend this week's live group coaching call",
        "Access the members-only resource library",
        "Introduce yourself in the welcome thread"
      ]
    }
  };

  const content = productSlug && productMessages[productSlug]
    ? productMessages[productSlug]
    : {
        title: "Thank You for Your Purchase!",
        message: "Your order has been confirmed. Check your email for details.",
        nextSteps: [
          "Check your email for access details",
          "Save our emails to your contacts to ensure delivery",
          "Reach out to support if you have any questions"
        ]
      };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Shaun Critzer
            </span>
          </Link>
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
          </div>
        </div>
      </nav>

      {/* Success Content */}
      <section className="py-20">
        <div className="container max-w-3xl">
          <Card className="p-12">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-6">
                  <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold">
                {content.title}
              </h1>

              <p className="text-xl text-muted-foreground">
                {content.message}
              </p>

              <div className="pt-8">
                <h2 className="text-2xl font-bold mb-4">Next Steps:</h2>
                <div className="text-left space-y-3 max-w-xl mx-auto">
                  {content.nextSteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-1 mt-1">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-lg">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 space-y-4">
                <p className="text-muted-foreground">
                  Questions? Email us at{" "}
                  <a href="mailto:support@shauncritzer.com" className="text-primary hover:underline">
                    support@shauncritzer.com
                  </a>
                </p>

                <div className="flex gap-4 justify-center pt-4">
                  <Link href="/">
                    <Button variant="outline" size="lg">
                      Back to Home
                    </Button>
                  </Link>
                  <Link href="/blog">
                    <Button variant="outline" size="lg">
                      Read the Blog
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Shaun Critzer</h3>
              <p className="text-sm text-muted-foreground">
                Author, speaker, and recovery advocate. 13 years sober and helping others find hope in their own journey.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">The Memoir</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/memoir" className="hover:text-primary transition-colors">About the Book</Link></li>
                <li><Link href="/memoir/excerpt" className="hover:text-primary transition-colors">Read an Excerpt</Link></li>
                <li><Link href="/memoir/reviews" className="hover:text-primary transition-colors">Reviews</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/resources" className="hover:text-primary transition-colors">Free Downloads</Link></li>
                <li><Link href="/courses" className="hover:text-primary transition-colors">Courses</Link></li>
                <li><Link href="/community" className="hover:text-primary transition-colors">Community</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">YouTube</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Facebook</a></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Shaun Critzer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
