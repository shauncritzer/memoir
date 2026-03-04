import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Star, ArrowRight, Check, ShieldCheck, Heart, Brain, Users, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function BookLaunch() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const subscribeMutation = trpc.email.subscribe.useMutation();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      await subscribeMutation.mutateAsync({
        email,
        source: "book-launch",
      });
      toast.success("Check your inbox!", {
        description: "Your free chapter is on its way. Welcome to the journey.",
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
    <div className="min-h-screen pt-16">
      <Navigation />

      {/* ===== HERO SECTION ===== */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black py-16 md:py-24 overflow-hidden">
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,191,0,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(45,212,191,0.1),transparent_50%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* LEFT: Book Cover */}
            <div className="flex justify-center lg:justify-center order-1">
              <div className="relative w-full max-w-sm">
                <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(255,191,0,0.15)]">
                  <img
                    src="/memoir-cover-final-v6.png"
                    alt="Crooked Lines: Bent, Not Broken — Book Cover"
                    className="w-full h-full object-contain bg-white"
                  />
                </div>
                {/* Decorative glow */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl" />
              </div>
            </div>

            {/* RIGHT: Copy */}
            <div className="space-y-6 order-2 text-center lg:text-left">
              <div>
                <p className="text-amber-400 font-semibold tracking-wide uppercase text-sm mb-3">
                  A Memoir by Shaun Critzer
                </p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Crooked Lines:{" "}
                  <span className="bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-transparent">
                    Bent,
                  </span>{" "}
                  <span className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
                    Not Broken
                  </span>
                </h1>
              </div>

              <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
                A raw, unflinching memoir about childhood trauma, addiction, losing everything, and the crooked road back to a life worth living. 13 years sober. This is that story.
              </p>

              {/* Social Proof */}
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="flex text-amber-400">
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <span className="text-gray-400 text-sm">"The most honest recovery memoir I've ever read."</span>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                <a
                  href="https://www.amazon.com/dp/placeholder"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-lg px-8 py-6 w-full sm:w-auto"
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    Buy Now — $19.99
                  </Button>
                </a>
                <a href="#free-chapter">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-teal-400 text-teal-400 hover:bg-teal-400/10 font-semibold text-lg px-8 py-6 w-full sm:w-auto"
                  >
                    Get a Free Chapter
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== QUOTE / HOOK ===== */}
      <section className="py-16 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <blockquote className="text-2xl md:text-3xl font-serif italic text-gray-300 leading-relaxed">
            "Deus escreve direito por linhas tortas"
          </blockquote>
          <p className="text-amber-400 mt-4 text-lg">
            God writes straight with crooked lines
          </p>
          <div className="w-16 h-px bg-amber-500/50 mx-auto mt-6" />
        </div>
      </section>

      {/* ===== BOOK SYNOPSIS ===== */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              What This Book Is About
            </h2>
            <div className="w-16 h-1 bg-teal-400 mx-auto" />
          </div>

          <div className="prose prose-lg prose-invert max-w-none space-y-6 text-gray-300">
            <p className="text-xl leading-relaxed">
              I didn't come from the kind of chaos people imagine when they hear a story like mine. No abusive father, no absent mother. No poverty. I grew up in Charlottesville, Virginia, in a middle-class home with parents who loved me.
            </p>
            <p className="text-xl leading-relaxed">
              And that's the most dangerous lie of all — that addiction only happens to people from broken homes. That it's reserved for the obviously damaged.
            </p>
            <p className="text-xl leading-relaxed">
              The truth is simpler and more terrifying: <strong className="text-white">addiction doesn't care about your ZIP code.</strong> It finds the cracks in your foundation — the wounds you've buried, the pain you've never spoken aloud, the secrets you've carried since childhood. And it promises relief.
            </p>

            {showFullSynopsis && (
              <>
                <p className="text-xl leading-relaxed">
                  At six years old, I was violated by a swim coach. I didn't tell anyone for decades. Instead, I built armor — first with bodybuilding (I won Mr. Teen USA at seventeen), then with alcohol, cocaine, affairs, and every compulsive behavior I could find to numb what I couldn't face.
                </p>
                <p className="text-xl leading-relaxed">
                  By my early thirties, I'd lost everything. My marriage. My kids. My home. My self-respect. I was sitting in a liquor store parking lot, two years sober but still dying inside, trying to decide whether to buy the bottle or go to the meeting.
                </p>
                <p className="text-xl leading-relaxed">
                  I chose the meeting. And that choice changed everything.
                </p>
                <p className="text-xl leading-relaxed">
                  <em>Crooked Lines</em> is the story of what happened before that parking lot — and everything that happened after. The childhood trauma I buried for thirty years. The bodybuilding championships that were really just armor. The decade of addiction that nearly killed me. The DUIs, the psych wards, the protective orders. And then: the recovery. The EMDR therapy that cracked me open. The AA meetings that taught me honesty. The ex-wife who became my co-parenting partner. The woman I met in a Thursday night meeting who became my wife. The blended family we built from the wreckage.
                </p>
                <p className="text-xl leading-relaxed">
                  This book is my fourth step on paper — a searching and fearless moral inventory shared with you. It's not a redemption story where I emerged perfect. I'm still a work in progress. But I'm no longer running from myself.
                </p>
                <p className="text-xl leading-relaxed font-semibold text-white">
                  If you're struggling — with addiction, with trauma, with the weight of secrets you've carried too long — this book is for you. You are not uniquely broken. You are not beyond hope. And you are not alone.
                </p>
              </>
            )}

            <div className="text-center pt-4">
              <Button
                variant="ghost"
                onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                className="text-teal-400 hover:text-teal-300 hover:bg-teal-400/10"
              >
                {showFullSynopsis ? "Show Less" : "Read the Full Synopsis"}
                <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFullSynopsis ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHAT YOU'LL FIND INSIDE ===== */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              What You'll Find Inside
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              37 chapters of raw truth. No sugarcoating. No redemption arc that wraps up in a neat bow. Just the real story of what it takes to lose everything and rebuild.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: "The Armor We Build",
                desc: "How childhood trauma led to bodybuilding championships, compulsive achievement, and decades of hiding behind muscle and discipline.",
              },
              {
                icon: Brain,
                title: "The Nervous System Truth",
                desc: "Why addiction isn't a moral failing — it's a dysregulated nervous system desperately seeking relief. The science behind the compulsion.",
              },
              {
                icon: Heart,
                title: "Rock Bottom(s)",
                desc: "DUIs, psych wards, protective orders, losing custody. Not one rock bottom — several. And the moment in a parking lot that changed everything.",
              },
              {
                icon: Users,
                title: "Co-Parenting After Destruction",
                desc: "How my ex-wife and I went from protective orders to co-parenting at Disney World. Proof that broken relationships can heal.",
              },
              {
                icon: Star,
                title: "The Three Indispensables",
                desc: "Honesty, open-mindedness, and willingness — the AA principles that finally made recovery stick after years of white-knuckling.",
              },
              {
                icon: BookOpen,
                title: "Finding Purpose in the Mess",
                desc: "The serpent vision during EMDR. Meeting Shannon. Building a blended family. Discovering that every crooked line had a purpose.",
              },
            ].map((item, i) => (
              <Card key={i} className="p-6 bg-gray-800/50 border-gray-700/50 hover:border-teal-500/30 transition-colors">
                <item.icon className="h-8 w-8 text-teal-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ABOUT THE AUTHOR ===== */}
      <section className="py-20 bg-black">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Author Photo */}
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src="/shaun-columns-khakis.jpg"
                  alt="Shaun Critzer"
                  className="rounded-2xl shadow-2xl max-w-md w-full object-cover"
                />
                <div className="absolute -bottom-4 -right-4 bg-amber-500 text-black font-bold px-4 py-2 rounded-lg text-sm">
                  13 Years Sober
                </div>
              </div>
            </div>

            {/* Author Bio */}
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                About the Author
              </h2>
              <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                <p>
                  <strong className="text-white">Shaun Critzer</strong> is a recovered alcoholic, trauma survivor, entrepreneur, and father living in Charlottesville, Virginia.
                </p>
                <p>
                  After losing everything to addiction — his marriage, his home, custody of his children, and nearly his life — Shaun got sober on January 1, 2013. In the thirteen years since, he's rebuilt his life from the ground up: remarried to his wife Shannon, co-parenting three children, and building businesses that help others find purpose and healing.
                </p>
                <p>
                  A former Virginia state champion bodybuilder and Mr. Teen USA, Shaun knows what it's like to build armor to hide pain. Today, he's committed to helping others take off their armor and show up as their authentic selves.
                </p>
                <p>
                  Shaun is a member of Alcoholics Anonymous, an active sponsor to men in recovery, and a passionate advocate for childhood trauma survivors and families raising children with special needs. His son Landon has Chromosome 4P deletion syndrome, a rare genetic condition that has taught Shaun more about patience, gratitude, and unconditional love than any other experience in his life.
                </p>
                <p className="italic text-amber-400">
                  "Crooked Lines: Bent, Not Broken" is his first book.
                </p>
              </div>
              <div className="flex gap-4 pt-2">
                <Link href="/about">
                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                    Full Bio
                  </Button>
                </Link>
                <Link href="/memoir">
                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                    See the Animated Cover
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== EARLY PRAISE ===== */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Early Praise
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                quote: "Shaun's story is raw, real, and ultimately redemptive. This book will save lives.",
                author: "Early Reader",
              },
              {
                quote: "Finally, a recovery memoir that doesn't sugarcoat the darkness or oversell the light. This is the real deal.",
                author: "Early Reader",
              },
              {
                quote: "I couldn't put it down. The parking lot scene had me in tears. If you've ever loved an addict, read this book.",
                author: "Early Reader",
              },
              {
                quote: "This isn't just a recovery story. It's a manual for anyone who's ever felt broken beyond repair.",
                author: "Early Reader",
              },
            ].map((item, i) => (
              <Card key={i} className="p-8 bg-gray-800/30 border-gray-700/50">
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-lg italic text-gray-300 mb-4">"{item.quote}"</p>
                <p className="text-sm font-semibold text-gray-500">— {item.author}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FREE CHAPTER EMAIL CAPTURE ===== */}
      <section id="free-chapter" className="py-20 bg-gradient-to-br from-teal-900/30 to-gray-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Read the First Chapter Free
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Enter your email and I'll send you the Prologue — "The Liquor Store Parking Lot." The moment that changed everything. No spam. Just the chapter and occasional updates on the book.
            </p>
            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto pt-4">
              <Input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                className="bg-teal-500 hover:bg-teal-600 text-white font-bold h-12 px-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Get the Free Chapter"}
              </Button>
            </form>
            <p className="text-sm text-gray-500">
              No spam. Unsubscribe anytime. Your email is safe with me.
            </p>
          </div>
        </div>
      </section>

      {/* ===== UPSELLS / PROGRAMS ===== */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Go Deeper: Programs Built From the Book
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              The book tells the story. These programs give you the tools to write your own.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* 7-Day Reset */}
            <Card className="p-8 bg-gradient-to-br from-gray-800 to-gray-800/50 border-teal-500/20 hover:border-teal-500/40 transition-colors">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-teal-400 font-semibold text-sm uppercase tracking-wide">Quick Start</span>
                  <span className="text-3xl font-bold text-white">$47</span>
                </div>
                <h3 className="text-2xl font-bold text-white">7-Day Rewired Reset</h3>
                <p className="text-gray-400 leading-relaxed">
                  A structured 7-day program to jumpstart your recovery journey. Daily exercises, reflections, and practical tools drawn from the same principles that saved my life.
                </p>
                <ul className="space-y-2 text-gray-300">
                  {[
                    "7 days of structured exercises",
                    "Nervous system regulation tools",
                    "Daily themes: honesty, triggers, shame, resilience",
                    "Emergency resources & crisis contacts",
                    "Immediate access after purchase",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-teal-400 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/7-day-reset">
                  <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold mt-4">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>

            {/* 30-Day Course */}
            <Card className="p-8 bg-gradient-to-br from-gray-800 to-gray-800/50 border-amber-500/20 hover:border-amber-500/40 transition-colors">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-semibold text-sm uppercase tracking-wide">Deep Dive</span>
                  <span className="text-3xl font-bold text-white">$97</span>
                </div>
                <h3 className="text-2xl font-bold text-white">From Broken to Whole</h3>
                <p className="text-gray-400 leading-relaxed">
                  A comprehensive 30-day transformation course. Trauma healing, inner child work, nervous system regulation, and building a life worth staying sober for.
                </p>
                <ul className="space-y-2 text-gray-300">
                  {[
                    "8 comprehensive modules over 30 days",
                    "Trauma-addiction connection deep dive",
                    "Somatic healing & EMDR-informed exercises",
                    "Inner child healing & shame processing",
                    "Relationship rebuilding strategies",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/products">
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold mt-4">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== WHO THIS BOOK IS FOR ===== */}
      <section className="py-20 bg-black">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              This Book Is For You If...
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              "You're struggling with addiction and need to know you're not alone",
              "You love someone who's struggling and want to understand what they're going through",
              "You've experienced childhood trauma and it's still running your life",
              "You're sober but not happy — and you know there's more to recovery than just not drinking",
              "You've hit rock bottom and need proof that rebuilding is possible",
              "You're a therapist, counselor, or sponsor looking for a resource to share with clients",
              "You believe in second chances and want to see what one looks like",
              "You're tired of recovery memoirs that sugarcoat the darkness",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4">
                <Check className="h-5 w-5 text-teal-400 mt-1 shrink-0" />
                <p className="text-gray-300 text-lg">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            Your Story Isn't Over
          </h2>
          <p className="text-xl text-gray-300 leading-relaxed">
            I lost my marriage, my kids, my home, and nearly my life. Today, I'm 13 years sober with a blended family, a thriving business, and a life beyond my wildest dreams. If it's possible for me, it's possible for you.
          </p>
          <p className="text-lg text-gray-400">
            One decision can change everything. Let this book be that decision.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a
              href="https://www.amazon.com/dp/placeholder"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-lg px-10 py-6"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Buy the Book — $19.99
              </Button>
            </a>
            <a href="#free-chapter">
              <Button
                size="lg"
                variant="outline"
                className="border-teal-400 text-teal-400 hover:bg-teal-400/10 font-semibold text-lg px-10 py-6"
              >
                Get a Free Chapter First
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
