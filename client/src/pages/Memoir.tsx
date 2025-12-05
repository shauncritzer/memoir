import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Heart, Star, ShoppingCart } from "lucide-react";
import { Link } from "wouter";

export default function Memoir() {
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
            <Link href="/memoir" className="text-sm font-medium text-primary">
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
            <Link href="/coach" className="text-sm font-medium hover:text-primary transition-colors">
              AI Coach
            </Link>
            <Link href="/products">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-background to-accent/20">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Book Cover Placeholder */}
              <div className="flex justify-center">
                <Card className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
                  <div className="aspect-[2/3] w-full max-w-[300px] bg-gradient-to-br from-primary to-secondary rounded-lg shadow-2xl flex items-center justify-center">
                    <div className="text-center text-white p-8">
                      <BookOpen className="h-16 w-16 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold mb-2">Crooked Lines</h3>
                      <p className="text-sm opacity-90">by Shaun Critzer</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Book Info */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h1 className="text-5xl md:text-6xl font-bold">
                    Crooked{" "}
                    <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Lines
                    </span>
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    A raw, unflinching memoir of addiction, trauma, and the crooked path to redemption
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">(Coming Soon)</span>
                </div>

                <p className="text-lg leading-relaxed">
                  From childhood sexual abuse to a decade-long spiral through addiction, DUIs, psychiatric wards, and rock bottoms—this is the story of how I lost everything and found myself. Written with brutal honesty and hard-won hope, <em>Crooked Lines</em> is for anyone who's ever felt broken beyond repair.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-primary hover:bg-primary/90" disabled>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Pre-Order on Amazon
                  </Button>
                  <Link href="/resources">
                    <Button size="lg" variant="outline">
                      <BookOpen className="mr-2 h-5 w-5" />
                      Read First 3 Chapters Free
                    </Button>
                  </Link>
                </div>

                <p className="text-sm text-muted-foreground">
                  <strong>Coming 2025</strong> — Amazon link will be available soon. Sign up for updates to be notified when the book launches.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Inside Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">What's Inside</h2>
              <p className="text-xl text-muted-foreground">
                A journey through darkness into light—told with raw honesty
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6 space-y-4">
                <Heart className="h-10 w-10 text-primary" />
                <h3 className="text-2xl font-semibold">The Darkness</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Childhood sexual abuse and buried trauma</li>
                  <li>• The slow descent into addiction (alcohol, pills, cocaine)</li>
                  <li>• DUIs, protective orders, supervised visits with my kids</li>
                  <li>• Psychiatric hospitalizations and suicide attempts</li>
                  <li>• The decade I call "the lost years" (2002-2012)</li>
                </ul>
              </Card>

              <Card className="p-6 space-y-4">
                <Star className="h-10 w-10 text-primary" />
                <h3 className="text-2xl font-semibold">The Light</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Getting sober on January 1, 2013</li>
                  <li>• EMDR therapy and processing childhood trauma</li>
                  <li>• Working the 12 steps with rigorous honesty</li>
                  <li>• Rebuilding relationships with my sons</li>
                  <li>• Finding love, purpose, and a life worth living</li>
                </ul>
              </Card>
            </div>

            <Card className="p-8 bg-accent/50 border-primary/20">
              <blockquote className="text-xl italic text-center space-y-4">
                <p>
                  "This book is for anyone who's ever felt broken beyond repair. It's for the person sitting in a dark room wondering if there's any hope left. It's for the parent who's lost custody of their kids. It's for the addict who can't imagine a day without using. It's for anyone who needs to know that redemption is possible—even when the path is crooked."
                </p>
                <footer className="text-base not-italic font-semibold text-primary">
                  — Shaun Critzer
                </footer>
              </blockquote>
            </Card>
          </div>
        </div>
      </section>

      {/* Praise Section (Placeholder for future reviews) */}
      <section className="py-20 bg-accent/20">
        <div className="container">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">Early Praise</h2>
              <p className="text-xl text-muted-foreground">
                What readers are saying about <em>Crooked Lines</em>
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground italic">
                  "Raw, honest, and deeply moving. Shaun's story gave me hope when I needed it most."
                </p>
                <p className="text-sm font-semibold">— Early Reader</p>
              </Card>

              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground italic">
                  "This isn't just another recovery memoir. It's a roadmap for anyone trying to put their life back together."
                </p>
                <p className="text-sm font-semibold">— Early Reader</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="max-w-3xl mx-auto p-12 text-center space-y-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <h2 className="text-4xl font-bold">Get Notified When the Book Launches</h2>
            <p className="text-xl text-muted-foreground">
              Be the first to know when <em>Crooked Lines</em> is available on Amazon. Plus, get exclusive bonus content and early access to new resources.
            </p>
            <Link href="/resources">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <BookOpen className="mr-2 h-5 w-5" />
                Download First 3 Chapters Free
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-accent/20">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">Shaun Critzer</h3>
              <p className="text-sm text-muted-foreground">
                Author, speaker, and recovery advocate. Helping others find hope and healing through honest storytelling.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
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
                <Link href="/products" className="text-muted-foreground hover:text-primary transition-colors">
                  Products
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
            <p>&copy; {new Date().getFullYear()} Shaun Critzer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
