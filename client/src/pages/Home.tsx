import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
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
        description: "Check your email for the first 3 chapters and your nervous system recovery toolkit!",
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
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="hidden lg:flex items-center space-x-6">
            <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/memoir" className="text-sm font-medium hover:text-primary transition-colors">
              The Memoir
            </Link>
            <Link href="/rewired-method" className="text-sm font-medium hover:text-primary transition-colors">
              REWIRED Method
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
            <Link href="/ai-coach" className="text-sm font-medium hover:text-primary transition-colors">
              AI Coach
            </Link>
            <Link href="/products">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
          </div>
          {/* Mobile menu button */}
          <Link href="/products" className="lg:hidden">
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* SECTION 1: HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black py-20 md:py-32">
        <div className="container">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            {/* Left Side - 60% */}
            <div className="lg:col-span-3 space-y-8 text-white">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Transform Your{" "}
                <span className="bg-gradient-to-r from-teal-400 to-amber-400 bg-clip-text text-transparent">
                  Nervous System
                </span>
                , Break Free From Compulsive Behaviors
              </h1>

              <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
                Evidence-based recovery for men struggling with compulsive behaviors and process addictions—powered by the REWIRED methodology
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/ai-coach">
                  <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-lg px-8">
                    Try Free AI Coach <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/products">
                  <Button size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white hover:text-black">
                    Explore Courses
                  </Button>
                </Link>
              </div>

              <div className="pt-4 space-y-2">
                <p className="text-sm text-gray-400 font-semibold">Trusted by men recovering from:</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                  <div>• Process addictions</div>
                  <div>• Substance abuse</div>
                  <div>• Compulsive behaviors</div>
                  <div>• Work obsession</div>
                  <div>• Compulsive fitness</div>
                  <div>• Gaming addiction</div>
                  <div>• Betrayal trauma recovery</div>
                </div>
              </div>
            </div>

            {/* Right Side - 40% */}
            <div className="lg:col-span-2 relative">
              <div className="relative max-w-md mx-auto lg:mx-0">
                <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-teal-500/20 to-amber-500/20 p-1 overflow-hidden border-4 border-amber-500">
                  <img
                    src="/shaun-stage-speaking-angle2.png"
                    alt="Shaun Critzer - Speaker, Author, Recovery Coach"
                    className="w-full h-full object-cover object-center rounded-xl"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-2xl">
                  <p className="text-white font-semibold text-center">Shaun Critzer</p>
                  <p className="text-gray-300 text-sm text-center">Speaker, Author, Entrepreneur</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE PROBLEM */}
      <section className="py-20 bg-white">
        <div className="container max-w-4xl">
          <div className="text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Why Willpower Doesn't Work
            </h2>

            <div className="prose prose-lg mx-auto text-left space-y-6 text-gray-700">
              <p>
                For years, you've tried to quit. You white-knuckled through cravings.
                You promised yourself "never again." And then you relapsed.
              </p>

              <p className="text-2xl font-bold text-center text-gray-900 py-4">
                It's not your fault.
              </p>

              <p>
                Addiction isn't a character defect—<strong>it's your nervous system trying to survive.</strong>
              </p>

              <p>
                When you grow up with trauma, neglect, or chaos, your nervous system gets stuck.
                It swings between anxiety (hyperarousal) and numbness (shutdown).
                And compulsive behaviors? They work. Temporarily.
              </p>

              <p>
                But they don't heal what's broken. They just mask it.
              </p>

              <div className="bg-gray-100 border-l-4 border-amber-500 p-6 my-8">
                <p className="font-semibold text-gray-900 mb-4">This is why:</p>
                <ul className="space-y-2">
                  <li>• 12-step programs have a 5-10% success rate</li>
                  <li>• Therapy alone isn't enough</li>
                  <li>• You keep going back</li>
                </ul>
              </div>

              <p className="text-xl font-bold text-center text-gray-900">
                Because you're trying to solve a nervous system problem with willpower.
              </p>

              <p className="text-xl font-bold text-center text-gray-900">
                And that never works.
              </p>
            </div>

            <Link href="/rewired-method">
              <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-lg px-8">
                Learn the REWIRED Approach →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 3: THE SOLUTION - REWIRED FRAMEWORK */}
      <section id="rewired" className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              The REWIRED Method
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              A nervous system-first approach to lasting recovery
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* R - RECOGNIZE */}
            <Card className="p-6 space-y-4 bg-blue-50 border-2 border-blue-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-lg bg-blue-500 flex items-center justify-center text-3xl">
                  👁️
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">R</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-blue-900">RECOGNIZE</h3>
              <p className="text-blue-800 text-sm">
                Recognize nervous system dysregulation before you act. Learn to spot hyperarousal and shutdown states.
              </p>
            </Card>

            {/* E - ESTABLISH */}
            <Card className="p-6 space-y-4 bg-green-50 border-2 border-green-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-lg bg-green-500 flex items-center justify-center text-3xl">
                  🛡️
                </div>
                <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">E</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-green-900">ESTABLISH</h3>
              <p className="text-green-800 text-sm">
                Establish safety and grounding in your body. Build a foundation your nervous system trusts.
              </p>
            </Card>

            {/* W - WORK */}
            <Card className="p-6 space-y-4 bg-purple-50 border-2 border-purple-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-lg bg-purple-500 flex items-center justify-center text-3xl">
                  🔨
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">W</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-purple-900">WORK</h3>
              <p className="text-purple-800 text-sm">
                Work through trauma with compassion, not judgment. Process what you've been avoiding.
              </p>
            </Card>

            {/* I - INTEGRATE */}
            <Card className="p-6 space-y-4 bg-amber-50 border-2 border-amber-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-lg bg-amber-500 flex items-center justify-center text-3xl">
                  🧩
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-600 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">I</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-amber-900">INTEGRATE</h3>
              <p className="text-amber-800 text-sm">
                Integrate new patterns and beliefs into daily life. Build sustainable habits, not white-knuckle discipline.
              </p>
            </Card>

            {/* R - REBUILD */}
            <Card className="p-6 space-y-4 bg-teal-50 border-2 border-teal-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-lg bg-teal-500 flex items-center justify-center text-3xl">
                  🔧
                </div>
                <div className="h-10 w-10 rounded-full bg-teal-600 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">R</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-teal-900">REBUILD</h3>
              <p className="text-teal-800 text-sm">
                Rebuild your regulation toolkit with evidence-based practices. Breathwork, movement, connection, mindfulness.
              </p>
            </Card>

            {/* E - EMBRACE */}
            <Card className="p-6 space-y-4 bg-pink-50 border-2 border-pink-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-lg bg-pink-500 flex items-center justify-center text-3xl">
                  🌱
                </div>
                <div className="h-10 w-10 rounded-full bg-pink-600 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">E</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-pink-900">EMBRACE</h3>
              <p className="text-pink-800 text-sm">
                Embrace ongoing growth and imperfection. Recovery is a journey, not a destination.
              </p>
            </Card>

            {/* D - DEVELOP */}
            <Card className="p-6 space-y-4 bg-orange-50 border-2 border-orange-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-lg bg-orange-500 flex items-center justify-center text-3xl">
                  🏗️
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-600 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">D</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-orange-900">DEVELOP</h3>
              <p className="text-orange-800 text-sm">
                Develop sustainable recovery practices that last. Build a life you don't need to escape from.
              </p>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/products">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-lg px-8">
                Start Your 7-Day Reset →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4: YOUR PATHS TO TRANSFORMATION */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Choose Your Path
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're just starting or ready to go deep, there's a path for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* PATH 1: Start Free */}
            <Card className="p-8 space-y-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-500 hover:shadow-2xl transition-all">
              <div className="text-center">
                <div className="text-5xl mb-4">🤖</div>
                <h3 className="text-2xl font-bold text-blue-900">Start Free</h3>
                <p className="text-lg font-semibold text-blue-700">AI Recovery Coach</p>
              </div>

              <div className="space-y-4 text-gray-700">
                <p className="font-semibold">Not sure where to begin? Start here.</p>
                <ul className="space-y-2 text-sm">
                  <li>• 10 free messages with REWIRED AI Coach</li>
                  <li>• 24/7 availability, no judgment</li>
                  <li>• Trained on nervous system recovery</li>
                  <li>• Crisis resources when you need them</li>
                </ul>
                <p className="text-sm italic text-gray-600">
                  Perfect for: First-timers, late-night cravings, immediate support
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-3xl font-bold text-blue-900 text-center">FREE</p>
                <Link href="/ai-coach">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-lg py-6">
                    Try AI Coach Now
                  </Button>
                </Link>
              </div>
            </Card>

            {/* PATH 2: Go Deeper - HIGHLIGHTED */}
            <Card className="p-8 space-y-6 bg-gradient-to-br from-amber-50 to-amber-100 border-4 border-amber-500 hover:shadow-2xl transition-all transform md:scale-105 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-amber-500 text-white px-6 py-2 rounded-full text-sm font-bold uppercase">
                  Most Popular
                </span>
              </div>

              <div className="text-center">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-2xl font-bold text-amber-900">Go Deeper</h3>
                <p className="text-lg font-semibold text-amber-700">Structured Courses</p>
              </div>

              <div className="space-y-4 text-gray-700">
                <p className="font-semibold">Ready to do the work? Start here.</p>

                <div className="bg-white/80 p-4 rounded-lg border border-amber-300">
                  <p className="font-bold text-amber-900">7-Day REWIRED Reset ($27)</p>
                  <ul className="space-y-1 text-sm mt-2">
                    <li>• Learn nervous system basics</li>
                    <li>• Daily video lessons + worksheets</li>
                    <li>• Breathwork & grounding tools</li>
                    <li>• Start seeing results in one week</li>
                  </ul>
                </div>

                <div className="bg-white/80 p-4 rounded-lg border border-amber-300">
                  <p className="font-bold text-amber-900">From Broken to Whole ($97)</p>
                  <ul className="space-y-1 text-sm mt-2">
                    <li>• 30-day deep dive into recovery</li>
                    <li>• 8 modules, 30 video lessons</li>
                    <li>• Trauma processing techniques</li>
                    <li>• Lifetime access + unlimited AI Coach</li>
                  </ul>
                </div>

                <p className="text-sm italic text-gray-600">
                  Perfect for: Committed to change, want structure, ready to invest in yourself
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-3xl font-bold text-amber-900 text-center">$27 - $97</p>
                <Link href="/products">
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-lg py-6">
                    Explore Courses
                  </Button>
                </Link>
              </div>
            </Card>

            {/* PATH 3: Join the Community */}
            <Card className="p-8 space-y-6 bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-500 hover:shadow-2xl transition-all">
              <div className="text-center">
                <div className="text-5xl mb-4">👥</div>
                <h3 className="text-2xl font-bold text-teal-900">Join the Community</h3>
                <p className="text-lg font-semibold text-teal-700">Bent Not Broken Circle</p>
              </div>

              <div className="space-y-4 text-gray-700">
                <p className="font-semibold">Don't do this alone. Join us.</p>
                <ul className="space-y-2 text-sm">
                  <li>• Monthly live Q&A with Shaun</li>
                  <li>• Private Discord community</li>
                  <li>• Weekly accountability check-ins</li>
                  <li>• Exclusive content & resources</li>
                  <li>• Connection with men who get it</li>
                </ul>
                <p className="text-sm italic text-gray-600">
                  Perfect for: Need accountability, want community, value connection over isolation
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-3xl font-bold text-teal-900 text-center">$29/month</p>
                <Link href="/products">
                  <Button className="w-full bg-teal-500 hover:bg-teal-600 text-lg py-6">
                    Join the Circle
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* SECTION 5: CREDIBILITY - About Shaun */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Left Side - Image */}
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden border-4 border-amber-500">
                <img
                  src="/shaun-stage-speaking-angle3.png"
                  alt="Shaun Critzer - Author, Speaker, Recovery Coach"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>

            {/* Right Side - Story */}
            <div className="space-y-6 text-white">
              <h2 className="text-4xl md:text-5xl font-bold">
                Bent, Not Broken
              </h2>

              <div className="prose prose-lg prose-invert space-y-4">
                <p>
                  I'm Shaun Critzer. <strong className="text-teal-400">13 years in recovery.</strong>
                </p>

                <p>
                  Former Mr. Teen USA (1998). Co-CEO of Digital Gravity. Author, Speaker, and Recovery Coach specializing in nervous system-based addiction recovery.
                </p>

                <p>
                  I spent years thinking I was broken. That I just needed more willpower.
                  More discipline. More strength.
                </p>

                <p className="text-xl font-bold text-amber-400">
                  I was wrong.
                </p>

                <p>
                  What I needed was to understand my nervous system.
                  To learn that addiction isn't a character defect—it's dysregulation.
                </p>

                <p>
                  I wrote a memoir (<em>Crooked Lines</em>) about my journey from chaos to wholeness.
                  I built REWIRED to help men like you do the same.
                </p>

                <div className="bg-gray-800 border-l-4 border-teal-500 p-6 my-6">
                  <p className="font-semibold text-teal-400 mb-3">This isn't about:</p>
                  <ul className="space-y-2">
                    <li>• Perfection → It's about <strong>progress</strong></li>
                    <li>• Willpower → It's about <strong>nervous system regulation</strong></li>
                    <li>• Being "fixed" → It's about being <strong>free</strong></li>
                  </ul>
                </div>

                <p className="text-xl font-bold text-white">
                  You're not broken. You're dysregulated.
                </p>

                <p className="text-xl font-bold text-teal-400">
                  And that can change.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6">
                <Link href="/about">
                  <Button size="lg" variant="outline" className="w-full border-white text-white hover:bg-white hover:text-black">
                    Read My Story
                  </Button>
                </Link>
                <Link href="/memoir">
                  <Button size="lg" className="w-full bg-amber-500 hover:bg-amber-600">
                    Get the Book
                  </Button>
                </Link>
              </div>

              <div className="flex flex-col gap-3 text-sm text-gray-300 pt-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📖</span>
                  <span>Author of "Crooked Lines"</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🏆</span>
                  <span>1998 Mr. Teen USA</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💼</span>
                  <span>Co-Founder of Digital Gravity</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">👨‍👩‍👧‍👦</span>
                  <span>Married to Shannon, father to Landon, Cameron, and Brody</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🎤</span>
                  <span>Recovery Advocate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🧩</span>
                  <span>Special Needs Parent/Advocate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💪</span>
                  <span>Health and Fitness Expert</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: START YOUR JOURNEY - Lead Magnet */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-100">
        <div className="container max-w-3xl">
          <Card className="p-8 md:p-12 shadow-2xl border-2 border-teal-500">
            <div className="text-center space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Start Your Transformation Today
              </h2>
              <p className="text-xl text-gray-700">
                Get the first 3 chapters of "Crooked Lines" free + nervous system recovery toolkit
              </p>

              <div className="flex flex-col md:flex-row gap-6 items-center bg-gray-50 p-6 rounded-lg">
                <div className="md:w-1/3">
                  <img
                    src="/shaun-beach-headshot.jpg"
                    alt="Crooked Lines Book"
                    className="rounded-lg shadow-lg w-full"
                  />
                </div>
                <div className="md:w-2/3 text-left space-y-3">
                  <p className="font-bold text-lg text-gray-900">What you'll get:</p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-teal-500 mr-2 text-xl">✓</span>
                      <span>First 3 chapters of Crooked Lines (PDF)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-teal-500 mr-2 text-xl">✓</span>
                      <span>Nervous System Recovery Toolkit (10-page guide)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-teal-500 mr-2 text-xl">✓</span>
                      <span>5-day email series on REWIRED basics</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-teal-500 mr-2 text-xl">✓</span>
                      <span>Access to free AI Recovery Coach</span>
                    </li>
                  </ul>
                </div>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-lg py-6"
                  required
                />
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-teal-500 hover:bg-teal-600 text-lg py-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Get Free Resources"}
                </Button>
              </form>

              <p className="text-sm text-gray-500">
                No spam. Unsubscribe anytime. Your email is safe with us.
              </p>

              <div className="pt-6 border-t border-gray-200">
                <blockquote className="italic text-gray-700">
                  "Shaun's approach changed my life. I finally understand why I kept relapsing—and what to do about it."
                </blockquote>
                <p className="text-sm text-gray-500 mt-2">— Jason K., 6 months sober</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-gray-900 text-gray-300">
        <div className="container">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-white">Shaun Critzer</h3>
              <p className="text-sm">
                Author, speaker, and recovery advocate. 13 years sober and helping others find hope in their own journey.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Programs</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/products" className="hover:text-teal-400 transition-colors">Courses</Link></li>
                <li><Link href="/ai-coach" className="hover:text-teal-400 transition-colors">AI Coach</Link></li>
                <li><Link href="/memoir" className="hover:text-teal-400 transition-colors">The Memoir</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/resources" className="hover:text-teal-400 transition-colors">Free Downloads</Link></li>
                <li><Link href="/blog" className="hover:text-teal-400 transition-colors">Blog</Link></li>
                <li><Link href="/about" className="hover:text-teal-400 transition-colors">About</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">YouTube</a></li>
                <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">Instagram</a></li>
                <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors">Facebook</a></li>
                <li><Link href="/contact" className="hover:text-teal-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms-of-use" className="hover:text-teal-400 transition-colors">Terms of Use</Link></li>
                <li><Link href="/refund-policy" className="hover:text-teal-400 transition-colors">Refund Policy</Link></li>
                <li><Link href="/faqs" className="hover:text-teal-400 transition-colors">FAQs</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Shaun Critzer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
