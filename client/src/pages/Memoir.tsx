import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Download, Star } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function Memoir() {
  const [videoEnded, setVideoEnded] = useState(false);

  return (
    <div className="min-h-screen pt-16">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section with Book Cover - Properly Centered */}
      <section className="py-20 bg-gradient-to-b from-background to-accent/20">
        <div className="max-w-7xl mx-auto px-4">

          {/* Book Cover Animation - Centered */}
          <div className="flex justify-center mb-12">
            <div className="w-full max-w-xl relative">
              <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl bg-white">
                {!videoEnded ? (
                  <video
                    src="/memoir-animated.mp4"
                    poster="/memoir-cover-final-v6.png"
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    className="w-full h-full object-contain"
                    onLoadedMetadata={(e) => {
                      const video = e.currentTarget;
                      video.currentTime = 0;
                    }}
                    onEnded={() => {
                      setVideoEnded(true);
                    }}
                  />
                ) : (
                  <img
                    src="/memoir-cover-final-v6.png"
                    alt="Crooked Lines: Bent, Not Broken - Book Cover"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-secondary/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/20 rounded-full blur-2xl"></div>
            </div>
          </div>

          {/* Book Info - Properly Centered */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Crooked Lines:{" "}
              <span className="text-teal-400">Bent,</span>{" "}
              <span className="text-amber-500">Not Broken</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              A raw, unflinching memoir about childhood trauma, addiction, rock bottom,
              and the redemption that comes from choosing recovery one day at a time.
            </p>

            {/* Stars + Coming 2025 */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="flex text-amber-500 text-2xl">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
              </div>
              <span className="text-gray-500">(Coming 2025)</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
              <Card className="p-8 space-y-4 bg-gradient-to-br from-primary/5 to-secondary/5">
                <h3 className="text-2xl font-bold">The Darkness</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Childhood sexual abuse and decades of buried trauma</span>
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

              <Card className="p-8 space-y-4 bg-gradient-to-br from-secondary/5 to-primary/5">
                <h3 className="text-2xl font-bold">The Light</h3>
                <ul className="space-y-3 text-muted-foreground">
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
                    <span>Rebuilding relationships with my sons</span>
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
    </div>
  );
}
