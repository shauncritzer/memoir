import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Download, Star } from "lucide-react";
import { Link } from "wouter";
import { useState, useRef, useEffect } from "react";

export default function Memoir() {
  const [showVideo, setShowVideo] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Play video once, then show static image
      video.play();
      video.addEventListener('ended', () => {
        setShowVideo(false);
      });
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section with Book Cover */}
      <section className="py-20 bg-gradient-to-b from-background to-accent/20 overflow-hidden">
        <div className="container max-w-full px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Book Cover */}
            <div className="relative">
              <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl relative">
                {/* Animated video */}
                {showVideo && (
                  <video
                    ref={videoRef}
                    src="/memoir-animated.mp4"
                    className="w-full h-full object-contain absolute inset-0 z-10"
                    muted
                    playsInline
                  />
                )}
                {/* Static image (shows after video ends) */}
                <img
                  src="/memoir-cover-final-v6.png"
                  alt="Crooked Lines: Bent, Not Broken - Book Cover"
                  className={`w-full h-full object-contain transition-opacity duration-1000 ${
                    showVideo ? 'opacity-0' : 'opacity-100'
                  }`}
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-secondary/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/20 rounded-full blur-2xl"></div>
            </div>

            {/* Book Info */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Crooked Lines:{" "}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Bent, Not Broken
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  A raw, unflinching memoir about childhood trauma, addiction, rock bottom, and the redemption that comes from choosing recovery one day at a time.
                </p>
              </div>

              <div className="flex items-center gap-2 text-amber-500">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <span className="text-muted-foreground ml-2">(Coming 2025)</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/resources">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8">
                    <Download className="mr-2 h-5 w-5" />
                    Download First 3 Chapters Free
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8"
                  disabled
                >
                  Pre-Order on Amazon (Coming 2025)
                </Button>
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
                A journey from darkness to light, told with brutal honesty and hard-won hope.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 space-y-4 bg-gradient-to-br from-primary/5 to-secondary/5 flex flex-col">
                <h3 className="text-2xl font-bold">The Darkness</h3>
                <ul className="space-y-4 text-muted-foreground flex-1">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Childhood trauma and decades of buried shame</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Building armor through bodybuilding and achievement</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Descent into alcohol and prescription pill addiction</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>DUIs, protective orders, and psychiatric hospitalizations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Losing everything: marriage, kids, self-respect</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Rock bottoms that seemed impossible to survive</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-8 space-y-4 bg-gradient-to-br from-secondary/5 to-primary/5 flex flex-col">
                <h3 className="text-2xl font-bold">The Light</h3>
                <ul className="space-y-4 text-muted-foreground flex-1">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Getting sober for real on January 1, 2013</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>EMDR therapy to process childhood trauma</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Working the 12 steps with rigorous honesty</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Rebuilding relationships with my kids</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Finding love again with Shannon</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>13 years sober and helping others find hope</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Early Praise Section */}
      <section className="py-20 bg-accent/30">
        <div className="container">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">Early Praise</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 space-y-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <p className="text-lg italic text-muted-foreground">
                  "Shaun's story is raw, real, and ultimately redemptive. This book will save lives."
                </p>
                <p className="font-semibold">— Early Reader</p>
              </Card>

              <Card className="p-8 space-y-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <p className="text-lg italic text-muted-foreground">
                  "Finally, a recovery memoir that doesn't sugarcoat the darkness or oversell the light. This is the real deal."
                </p>
                <p className="font-semibold">— Early Reader</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Start Reading Today
            </h2>
            <p className="text-xl text-muted-foreground">
              Download the first 3 chapters free and see why readers are calling this "the most honest recovery memoir they've ever read."
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/resources">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8">
                  <Download className="mr-2 h-5 w-5" />
                  Get First 3 Chapters Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container">
          <div className="grid md:grid-cols-5 gap-8">
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
                <li><Link href="/resources" className="hover:text-primary transition-colors">First 3 Chapters Free</Link></li>
                <li><Link href="/products" className="hover:text-primary transition-colors">Buy Now</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/resources" className="hover:text-primary transition-colors">Free Downloads</Link></li>
                <li><Link href="/products" className="hover:text-primary transition-colors">Products</Link></li>
                <li><Link href="/ai-coach" className="hover:text-primary transition-colors">AI Coach</Link></li>
                <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="text-sm">Crisis Hotline: 988</li>
                <li className="text-sm">SAMHSA: 1-800-662-4357</li>
                <li><a href="https://www.aa.org" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Find AA Meetings</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms-of-use" className="hover:text-primary transition-colors">Terms of Use</Link></li>
                <li><Link href="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link></li>
                <li><Link href="/faqs" className="hover:text-primary transition-colors">FAQs</Link></li>
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
