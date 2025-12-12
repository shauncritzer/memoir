import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Award, Heart, Users, Briefcase } from "lucide-react";
import { Link } from "wouter";

export default function About() {
  return (
    <div className="min-h-screen">
      {/* Navigation - Same as Home */}
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-background to-accent/20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold">
              From Champion to Crisis to{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Comeback
              </span>
            </h1>
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>
                I'm Shaun Critzer—husband to Shannon, father to Landon, Cameron, and Brody, entrepreneur, author, and 13 years into the greatest transformation of my life.
              </p>
              <p>
                At 17, I was crowned Mr. Teen USA, standing on stage as the top teenage bodybuilder in the country with 2 Olympic Gold Medals around my neck. I had discipline. I had drive. I had the world convinced I had it all together.
              </p>
              <p>
                What no one knew was that beneath the muscle and the medals, I was already running—running from childhood trauma I'd buried so deep I convinced myself it didn't exist.
              </p>
              <p>
                The next 15 years were a descent I never saw coming. Alcohol. Drugs. A marriage that crumbled. Two kids I was losing. Jails. Psych wards. Rock bottoms I didn't know existed.
              </p>
              <p>
                By 2012, the champion had become someone I didn't recognize. And I had a choice: keep pretending and die a tragic death, or finally deal with what I'd been running from my entire life.
              </p>
              <p>
                On January 1, 2013, I chose recovery. Not just sobriety—actual healing.
              </p>
              <p className="font-semibold text-foreground">
                Today, I help others do the same.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* My Story Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold">My Story</h2>
              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>
                  I grew up in Charlottesville, Virginia, in what looked like a normal middle-class family. But behind closed doors, I experienced childhood trauma that I buried for decades. I built armor through bodybuilding, achievement, and performance—anything to avoid feeling the pain underneath.
                </p>
                <p>
                  By my late teens, I discovered alcohol and drugs. They worked—until they didn't. What started as magic turned into self-medication, which then spiraled into misery and full-blown addiction. I got married, had two beautiful children—my son Landon and my daughter Cameron, built a successful career, and maintained the illusion of control. But inside, I was dying.
                </p>
                <p>
                  The decade from 2002 to 2012 was my "decade of darkness." DUIs, protective orders, supervised visits with my kids, psychiatric hospitalizations, and suicide attempts. I lost my marriage, my relationship with my children, my self-respect. I hit bottoms I didn't know existed.
                </p>
                <p>
                  On January 1, 2013, I got sober for real. Not just white-knuckling—actual recovery. I went to treatment at The Ranch in Tennessee, did EMDR therapy to process my childhood trauma, worked the 12 steps with rigorous honesty, and learned to bring my full, broken self to the table instead of hiding behind armor.
                </p>
                <p>
                  Today, I'm 13 years sober. I'm remarried to Shannon, who saw me at my worst and chose me anyway. I have a blended family with Landon, Cameron, and Brody. I peacefully co-parent with Jennie, my children's mother—something I never thought possible. I run companies helping people build legitimate online businesses. And I wrote a memoir to show others that broken things can heal.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-2xl overflow-hidden">
                <img 
                  src="/shaun-shannon-bw.jpg" 
                  alt="Shaun and Shannon Critzer" 
                  className="w-full h-auto"
                />
              </div>
              <Card className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10">
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Husband & Father</h3>
                      <p className="text-sm text-muted-foreground">Married to Shannon, father to Landon, Cameron & Brody</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">13 Years Sober</h3>
                      <p className="text-sm text-muted-foreground">January 1, 2013 - Present</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Entrepreneur</h3>
                      <p className="text-sm text-muted-foreground">Co-founder of Digital Gravity</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Recovery Advocate</h3>
                      <p className="text-sm text-muted-foreground">Speaker, author, and mentor</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Family Photo Section */}
      <section className="py-12">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="/bahamas-family.jpg" 
                alt="Shaun Critzer and family in the Bahamas" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What I Believe Section */}
      <section className="py-20 bg-accent/30">
        <div className="container">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">What I Believe</h2>
              <p className="text-xl text-muted-foreground">
                These principles guide my life, my work, and my mission.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6 space-y-3">
                <h3 className="text-xl font-bold">Recovery is possible for everyone</h3>
                <p className="text-muted-foreground">
                  No one is too far gone. No bottom is too deep. If I can find recovery after everything I've been through, so can you.
                </p>
              </Card>
              <Card className="p-6 space-y-3">
                <h3 className="text-xl font-bold">Trauma must be processed, not buried</h3>
                <p className="text-muted-foreground">
                  Sobriety without trauma work is just white-knuckling. Real recovery requires facing the pain underneath the addiction.
                </p>
              </Card>
              <Card className="p-6 space-y-3">
                <h3 className="text-xl font-bold">Vulnerability is strength</h3>
                <p className="text-muted-foreground">
                  The armor we build to protect ourselves becomes our prison. True freedom comes from showing up as our whole, broken selves.
                </p>
              </Card>
              <Card className="p-6 space-y-3">
                <h3 className="text-xl font-bold">God writes straight with crooked lines</h3>
                <p className="text-muted-foreground">
                  Every mistake, every detour, every moment we thought was wasted—it all becomes part of the story. Nothing is wasted in recovery.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* My Mission Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">My Mission</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              I wrote <em>Crooked Lines</em> because I needed someone to tell me thirteen years ago that healing was possible. That you could hit bottoms you didn't think you'd survive and still build a life beyond your wildest dreams. That trauma can be processed. That broken things can heal.
            </p>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Now I'm being that person for you. Through my memoir, courses, community, and content, I'm showing others that recovery isn't just about not drinking—it's about becoming whole. It's about processing trauma, building authentic relationships, and creating a life worth staying sober for.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8">
                Read My Story <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Work With Me
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Same as Home */}
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
                <li><Link href="/memoir/excerpt" className="hover:text-primary transition-colors">Read an Excerpt</Link></li>
                <li><Link href="/memoir/reviews" className="hover:text-primary transition-colors">Reviews</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/resources" className="hover:text-primary transition-colors">Free Downloads</Link></li>
                <li><Link href="/products" className="hover:text-primary transition-colors">Products</Link></li>
                <li><Link href="/ai-coach" className="hover:text-primary transition-colors">AI Coach</Link></li>
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
