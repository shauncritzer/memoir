import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpen, Heart, Users, Sparkles, Brain, Wind, Shield, Hammer, Wrench, DollarSign, MessageCircle, CalendarDays } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Home() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subscribeMutation = trpc.email.subscribe.useMutation();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setIsSubmitting(true);

    try {
      await subscribeMutation.mutateAsync({
        email,
        source: "homepage",
      });

      toast.success("Success!", {
        description: "Check your email for the first 3 chapters and Recovery Toolkit!",
      });

      setEmail("");
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center space-x-6">
            <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/memoir" className="text-sm font-medium hover:text-primary transition-colors">
              Memoir
            </Link>
            <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors">
              Programs
            </Link>
            <Link href="/ai-coach" className="text-sm font-medium hover:text-primary transition-colors">
              AI Coach
            </Link>
            <Link href="/blog" className="text-sm font-medium hover:text-primary transition-colors">
              Blog
            </Link>
            <Link href="/products">
              <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* SECTION 1: HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-900 to-black py-20 md:py-32 text-white">
        <div className="container">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            {/* Left Side - 60% width (3 columns) */}
            <div className="lg:col-span-3 space-y-8">
              <Badge className="bg-amber-500 text-black px-4 py-1.5 text-sm font-bold">
                13 YEARS SOBER
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Transform Your Nervous System,{" "}
                <span className="bg-gradient-to-r from-amber-500 to-teal-500 bg-clip-text text-transparent">
                  Reclaim Your Life
                </span>
              </h1>

              <p className="text-xl text-gray-300 leading-relaxed">
                Evidence-based recovery for men struggling with compulsive behaviors—powered by the REWIRED methodology
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/ai-coach">
                  <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white text-lg px-8">
                    Try Free AI Coach <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/products">
                  <Button size="lg" variant="outline" className="text-lg px-8 border-amber-500 text-amber-500 hover:bg-amber-500/10">
                    Explore Courses
                  </Button>
                </Link>
              </div>

              <div className="pt-4">
                <p className="text-sm text-gray-400 mb-3">Trusted by men recovering from:</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                  <div>• Porn & sex addiction</div>
                  <div>• Work obsession</div>
                  <div>• Affairs & betrayal</div>
                  <div>• Compulsive fitness</div>
                  <div>• Substance abuse</div>
                  <div>• Gaming addiction</div>
                </div>
              </div>
            </div>

            {/* Right Side - 40% width (2 columns) */}
            <div className="lg:col-span-2 relative max-w-md mx-auto lg:mx-0">
              <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-amber-500/20 to-teal-500/20 p-1 overflow-hidden border-2 border-amber-500">
                <img
                  src="/shaun-stage-speaking-angle2.png"
                  alt="Shaun Critzer - Speaker, Author, Recovery Coach"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm p-4 rounded-lg border border-amber-500/30">
                <p className="text-sm font-semibold text-white">Shaun Critzer</p>
                <p className="text-xs text-gray-300">Speaker, Author, Recovery Coach</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE PROBLEM */}
      <section className="py-20 bg-white">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center space-y-6 mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Why Willpower Doesn't Work
            </h2>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p className="text-xl leading-relaxed">
              For years, you've tried to quit. You white-knuckled through cravings.
              You promised yourself "never again." And then you relapsed.
            </p>

            <p className="text-2xl font-bold text-gray-900 text-center my-8">
              It's not your fault.
            </p>

            <p className="text-xl leading-relaxed">
              Addiction isn't a character defect—it's your nervous system trying to survive.
            </p>

            <p className="text-lg leading-relaxed">
              When you grow up with trauma, neglect, or chaos, your nervous system gets stuck.
              It swings between anxiety (hyperarousal) and numbness (shutdown).
              And compulsive behaviors? They work. Temporarily.
            </p>

            <p className="text-lg leading-relaxed">
              But they don't heal what's broken. They just mask it.
            </p>

            <div className="bg-gray-100 border-l-4 border-amber-500 p-6 my-8">
              <p className="text-lg font-semibold text-gray-900">
                This is why 12-step programs have a 5-10% success rate.<br/>
                This is why therapy alone isn't enough.<br/>
                This is why you keep going back.
              </p>
            </div>

            <p className="text-xl leading-relaxed text-center font-semibold text-gray-900">
              Because you're trying to solve a nervous system problem with willpower.
            </p>

            <p className="text-xl leading-relaxed text-center font-bold text-teal-600">
              And that never works.
            </p>
          </div>

          <div className="text-center mt-12">
            <Link href="/products">
              <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white">
                Learn the REWIRED Approach →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 3: THE REWIRED METHOD */}
      <section className="py-20 bg-gradient-to-b from-gray-800 to-gray-900 text-white">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              The REWIRED Method
            </h2>
            <p className="text-xl text-gray-300">
              A nervous system-first approach to lasting recovery
            </p>
          </div>

          <div className="grid md:grid-cols-7 gap-6">
            {/* R - RECOGNIZE */}
            <Card className="bg-blue-500/20 border-blue-500 text-white">
              <CardHeader>
                <div className="text-4xl mb-2">👁️</div>
                <CardTitle className="text-2xl font-bold">R</CardTitle>
                <div className="text-sm font-semibold">RECOGNIZE</div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Recognize nervous system dysregulation before you act. Learn to spot hyperarousal and shutdown states.
                </p>
              </CardContent>
            </Card>

            {/* E - ESTABLISH */}
            <Card className="bg-green-500/20 border-green-500 text-white">
              <CardHeader>
                <div className="text-4xl mb-2">🛡️</div>
                <CardTitle className="text-2xl font-bold">E</CardTitle>
                <div className="text-sm font-semibold">ESTABLISH</div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Establish safety and grounding in your body. Build a foundation your nervous system trusts.
                </p>
              </CardContent>
            </Card>

            {/* W - WORK */}
            <Card className="bg-purple-500/20 border-purple-500 text-white">
              <CardHeader>
                <div className="text-4xl mb-2">🔨</div>
                <CardTitle className="text-2xl font-bold">W</CardTitle>
                <div className="text-sm font-semibold">WORK</div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Work through trauma with compassion, not judgment. Process what you've been avoiding.
                </p>
              </CardContent>
            </Card>

            {/* I - INTEGRATE */}
            <Card className="bg-amber-500/20 border-amber-500 text-white">
              <CardHeader>
                <div className="text-4xl mb-2">🧩</div>
                <CardTitle className="text-2xl font-bold">I</CardTitle>
                <div className="text-sm font-semibold">INTEGRATE</div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Integrate new patterns and beliefs into daily life. Build sustainable habits, not white-knuckle discipline.
                </p>
              </CardContent>
            </Card>

            {/* R - REBUILD */}
            <Card className="bg-teal-500/20 border-teal-500 text-white">
              <CardHeader>
                <div className="text-4xl mb-2">🔧</div>
                <CardTitle className="text-2xl font-bold">R</CardTitle>
                <div className="text-sm font-semibold">REBUILD</div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Rebuild your regulation toolkit with evidence-based practices. Breathwork, movement, connection, mindfulness.
                </p>
              </CardContent>
            </Card>

            {/* E - EMBRACE */}
            <Card className="bg-pink-500/20 border-pink-500 text-white">
              <CardHeader>
                <div className="text-4xl mb-2">🌱</div>
                <CardTitle className="text-2xl font-bold">E</CardTitle>
                <div className="text-sm font-semibold">EMBRACE</div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Embrace ongoing growth and imperfection. Recovery is a journey, not a destination.
                </p>
              </CardContent>
            </Card>

            {/* D - DEVELOP */}
            <Card className="bg-orange-500/20 border-orange-500 text-white">
              <CardHeader>
                <div className="text-4xl mb-2">🏗️</div>
                <CardTitle className="text-2xl font-bold">D</CardTitle>
                <div className="text-sm font-semibold">DEVELOP</div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Develop sustainable recovery practices that last. Build a life you don't need to escape from.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/products">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                Start Your 7-Day Reset →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4: YOUR PATHS TO TRANSFORMATION */}
      <section className="py-20 bg-gray-50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Choose Your Path
            </h2>
            <p className="text-xl text-gray-600">
              Whether you're just starting or ready to go deep, there's a path for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* PATH 1: Start Free */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
              <CardHeader>
                <div className="text-5xl mb-4">🤖</div>
                <CardTitle className="text-2xl font-bold text-gray-900">Start Free</CardTitle>
                <p className="text-lg font-semibold text-blue-700">AI Recovery Coach</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">Not sure where to begin? Start here.</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• 10 free messages with REWIRED AI Coach</li>
                  <li>• 24/7 availability, no judgment</li>
                  <li>• Trained on nervous system recovery</li>
                  <li>• Crisis resources when you need them</li>
                </ul>
                <p className="text-xs text-gray-600 italic">
                  Perfect for: First-timers, late-night cravings, immediate support
                </p>
                <div className="pt-4">
                  <p className="text-2xl font-bold text-gray-900">FREE</p>
                  <Link href="/ai-coach">
                    <Button className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white">
                      Try AI Coach Now
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* PATH 2: Go Deeper (HIGHLIGHTED) */}
            <Card className="bg-gradient-to-br from-amber-50 to-amber-200 border-4 border-amber-500 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500 text-black px-4 py-1 font-bold">
                MOST POPULAR
              </Badge>
              <CardHeader>
                <div className="text-5xl mb-4">📚</div>
                <CardTitle className="text-2xl font-bold text-gray-900">Go Deeper</CardTitle>
                <p className="text-lg font-semibold text-amber-700">Structured Courses</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 font-semibold">Ready to do the work? Start here.</p>

                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="font-bold text-gray-900">7-Day REWIRED Reset ($27)</p>
                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                      <li>• Learn nervous system basics</li>
                      <li>• Daily video lessons + worksheets</li>
                      <li>• Breathwork & grounding tools</li>
                      <li>• Start seeing results in one week</li>
                    </ul>
                  </div>

                  <div className="bg-white p-3 rounded-lg">
                    <p className="font-bold text-gray-900">From Broken to Whole ($97)</p>
                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                      <li>• 30-day deep dive into recovery</li>
                      <li>• 8 modules, 30 video lessons</li>
                      <li>• Trauma processing techniques</li>
                      <li>• Lifetime access + unlimited AI Coach</li>
                    </ul>
                  </div>
                </div>

                <p className="text-xs text-gray-600 italic">
                  Perfect for: Committed to change, want structure, ready to invest in yourself
                </p>

                <div className="pt-4">
                  <p className="text-2xl font-bold text-gray-900">$27 - $97</p>
                  <Link href="/products">
                    <Button className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-black font-bold">
                      Explore Courses
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* PATH 3: Join the Community */}
            <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-300">
              <CardHeader>
                <div className="text-5xl mb-4">👥</div>
                <CardTitle className="text-2xl font-bold text-gray-900">Join the Community</CardTitle>
                <p className="text-lg font-semibold text-teal-700">Bent Not Broken Circle</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">Don't do this alone. Join us.</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Monthly live Q&A with Shaun</li>
                  <li>• Private Discord community</li>
                  <li>• Weekly accountability check-ins</li>
                  <li>• Exclusive content & resources</li>
                  <li>• Connection with men who get it</li>
                </ul>
                <p className="text-xs text-gray-600 italic">
                  Perfect for: Need accountability, want community, value connection over isolation
                </p>
                <div className="pt-4">
                  <p className="text-2xl font-bold text-gray-900">$29/month</p>
                  <Link href="/products">
                    <Button className="w-full mt-4 bg-teal-500 hover:bg-teal-600 text-white">
                      Join the Circle
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SECTION 5: CREDIBILITY (About Shaun) */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="container max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            {/* Left Side - Image */}
            <div className="lg:col-span-2">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-500">
                <img
                  src="/shaun-stage-speaking-angle2.png"
                  alt="Shaun Critzer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right Side - Story */}
            <div className="lg:col-span-3 space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold">
                Bent, Not Broken
              </h2>

              <div className="prose prose-lg prose-invert max-w-none space-y-4 text-gray-300">
                <p>
                  I'm Shaun Critzer. 13 years sober.
                </p>

                <p>
                  Former Mr. Teen USA (1998). Former alcoholic. Former porn addict.
                  Former serial cheater. Former obsessive bodybuilder.
                </p>

                <p>
                  I spent years thinking I was broken. That I just needed more willpower.
                  More discipline. More strength.
                </p>

                <p className="text-xl font-semibold text-white">
                  I was wrong.
                </p>

                <p>
                  What I needed was to understand my nervous system.
                  To learn that addiction isn't a character defect—it's dysregulation.
                </p>

                <p>
                  I wrote a memoir (Crooked Lines) about my journey from chaos to wholeness.
                  I built REWIRED to help men like you do the same.
                </p>

                <div className="bg-teal-500/20 border-l-4 border-teal-500 p-4">
                  <p className="text-lg">
                    This isn't about perfection. It's about progress.<br/>
                    This isn't about willpower. It's about nervous system regulation.<br/>
                    This isn't about being "fixed." It's about being free.
                  </p>
                </div>

                <p className="text-xl font-bold text-amber-500">
                  You're not broken. You're dysregulated.<br/>
                  And that can change.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/about">
                  <Button size="lg" variant="outline" className="border-amber-500 text-amber-500 hover:bg-amber-500/10">
                    Read My Story
                  </Button>
                </Link>
                <Link href="/resources">
                  <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white">
                    Download First 3 Chapters
                  </Button>
                </Link>
              </div>

              {/* Stats/Badges */}
              <div className="grid grid-cols-2 gap-3 pt-6 text-sm text-gray-400">
                <div>📖 Author of "Crooked Lines: Bent, Not Broken"</div>
                <div>🏆 Former Mr. Teen USA (1998)</div>
                <div>💼 CEO, Digital Gravity</div>
                <div>👨‍👩‍👧‍👦 Husband & Father</div>
                <div className="col-span-2">🎤 Speaker on Recovery & Transformation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: START YOUR JOURNEY (Lead Magnet) */}
      <section className="py-20 bg-gray-100">
        <div className="container max-w-3xl mx-auto">
          <Card className="p-8 md:p-12 shadow-2xl">
            <div className="text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Start Your Transformation Today
              </h2>
              <p className="text-xl text-gray-600">
                Get the first 3 chapters of "Crooked Lines" free + nervous system recovery toolkit
              </p>

              <div className="flex flex-col md:flex-row gap-6 items-center bg-white p-6 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-32 h-40 bg-gradient-to-br from-amber-500 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold">
                    BOOK COVER
                  </div>
                </div>

                <div className="flex-1 text-left space-y-3">
                  <p className="font-semibold text-gray-900">What you'll get:</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>✓ First 3 chapters of Crooked Lines (PDF)</li>
                    <li>✓ Nervous System Recovery Toolkit (10-page guide)</li>
                    <li>✓ 5-day email series on REWIRED basics</li>
                    <li>✓ Access to free AI Recovery Coach</li>
                  </ul>
                </div>
              </div>

              <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  required
                  disabled={isSubmitting}
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="bg-teal-500 hover:bg-teal-600 text-white font-bold"
                >
                  {isSubmitting ? "Sending..." : "Get Free Resources"}
                </Button>
              </form>

              <p className="text-sm text-gray-500">
                No spam. Unsubscribe anytime. Your email is safe with us.
              </p>

              <div className="pt-6 flex items-center justify-center space-x-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Private • No account required • Always free</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-gray-900 text-white">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Logo />
              <p className="text-sm text-gray-400">
                13 years sober. Helping others find hope, healing, and wholeness in recovery.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-amber-500">Navigation</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/" className="hover:text-teal-500 transition-colors">Home</Link></li>
                <li><Link href="/about" className="hover:text-teal-500 transition-colors">About</Link></li>
                <li><Link href="/memoir" className="hover:text-teal-500 transition-colors">Memoir</Link></li>
                <li><Link href="/products" className="hover:text-teal-500 transition-colors">Products</Link></li>
                <li><Link href="/ai-coach" className="hover:text-teal-500 transition-colors">AI Coach</Link></li>
                <li><Link href="/blog" className="hover:text-teal-500 transition-colors">Blog</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-amber-500">Programs</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/products" className="hover:text-teal-500 transition-colors">7-Day Reset</Link></li>
                <li><Link href="/products" className="hover:text-teal-500 transition-colors">From Broken to Whole</Link></li>
                <li><Link href="/products" className="hover:text-teal-500 transition-colors">Bent Not Broken Circle</Link></li>
                <li><Link href="/resources" className="hover:text-teal-500 transition-colors">Free Resources</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-amber-500">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <strong>Crisis Hotline:</strong> 988
                </li>
                <li>
                  <strong>SAMHSA:</strong> 1-800-662-4357
                </li>
                <li>
                  <a
                    href="https://www.aa.org/find-aa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-teal-500 transition-colors inline-flex items-center gap-1"
                  >
                    Find AA Meetings
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} Shaun Critzer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
