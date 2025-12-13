import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Download, BookOpen, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function First3Chapters() {
  const [hasAccess, setHasAccess] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const downloadMutation = trpc.leadMagnets.download.useMutation();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      await downloadMutation.mutateAsync({
        slug: "first-3-chapters",
        email: email,
      });

      setHasAccess(true);
      toast.success("Access granted!", {
        description: "You've been added to our email list for weekly insights.",
      });
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <section className="py-20 bg-gradient-to-b from-background to-accent/20">
          <div className="container max-w-2xl">
            <div className="text-center space-y-6">
              <div className="w-32 h-32 mx-auto rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">
                First 3 Chapters
              </h1>
              <p className="text-xl text-muted-foreground">
                Free Excerpt from Crooked Lines: Bent, Not Broken
              </p>
              <p className="text-muted-foreground">
                Thank you for your interest in reading the first three chapters of <em>Crooked Lines: Bent, Not Broken</em>. This memoir chronicles my journey through childhood trauma, addiction, rock bottom, and the redemption that comes from choosing recovery one day at a time.
              </p>
              <p className="text-muted-foreground">
                What you're about to read is raw, unflinching, and honest. If you're struggling with addiction, trauma, or the crushing weight of being human—this book is for you.
              </p>
              <p className="font-bold text-lg">
                You are not alone, and you are not too far gone.
              </p>

              <Card className="p-8 mt-8">
                <h2 className="text-2xl font-bold mb-4">Access Required</h2>
                <p className="text-muted-foreground mb-6">
                  Enter your email to read the first three chapters online. You'll also receive updates about the full book release and exclusive recovery resources.
                </p>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Processing..." : "Read the Excerpt"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    No spam. Unsubscribe anytime. Your email is safe with me.
                  </p>
                </form>
              </Card>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-b from-background to-accent/20 border-b">
        <div className="container max-w-4xl">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              Crooked Lines
            </h1>
            <p className="text-2xl text-muted-foreground font-serif italic">
              Bent, Not Broken
            </p>
            <p className="text-lg">
              A Memoir by Shaun Critzer
            </p>
          </div>
        </div>
      </section>

      {/* Content Warning */}
      <section className="py-8 bg-red-50 border-y border-red-200">
        <div className="container max-w-3xl">
          <div className="flex gap-4 items-start">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-red-900 mb-2">Content Warning</h2>
              <p className="text-red-800">
                This excerpt contains frank discussions of childhood sexual abuse, substance abuse, and mental health crises. If you need support, please see the resources at the end of this document.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <article className="py-16">
        <div className="container max-w-3xl">
          <div className="prose prose-lg max-w-none space-y-8">

            {/* Prologue */}
            <section className="space-y-6">
              <h2 className="text-3xl font-bold border-b pb-4">PROLOGUE: The Liquor Store Parking Lot</h2>

              <p>
                The ABC store sits less than a mile from the Thursday night meeting, its neon sign flickering like a bad conscience in the twilight. I'm parked outside, engine off, hands gripping the steering wheel, keeping me tethered to earth.
              </p>

              <p>
                Eighteen months sober. Eighteen months of white-knuckling through meetings, forcing myself to say the words, showing up when every cell in my body screamed to run. Eighteen months of people telling me it gets better, that I just need to work the program, that God has a plan.
              </p>

              <p>
                But I'm not better. I'm worse.
              </p>

              <p>
                The protective order has been in place for over a year now. I can't go home—the home my parents sold to me and Jennie, the home where my kids sleep, the home I destroyed with my own hands. I'm living in Landon's room at my parents' house like I'm fifteen again, except I'm thirty-four and I've lost everything that ever mattered.
              </p>

              <p>
                Jennie won't look at me during custody exchanges. My mom has to play mediator, passing messages like we're children, because the court says I can't be within two hundred feet of my own wife. When the kids come to visit, I have to leave my parents' house and drive around the neighborhood, wait at the cul-de-sac like a criminal until Jennie's car disappears down the street.
              </p>

              <p>
                The meeting starts in twenty minutes. Shannon will be there—the gorgeous woman I've been building up courage to talk to for months, the one whose laugh lights up the entire room, the one I dream about even though I know I'm in no shape to deserve anyone's attention. She gave me a hug last week after I shared about how hard things were. It was the first time in months anyone had touched me with kindness.
              </p>

              <p>
                But I can't seem to make my feet move toward the meeting.
              </p>

              <p>
                Instead, I'm here. At the ABC store. Where I used to come every single day of the week when I was drinking. Where I'd buy my fifths and half-gallons of Jim Beam the way other people buy milk. Where the employees knew my name and probably took bets on how long until I'd kill myself or someone else.
              </p>

              <p>
                I don't remember deciding to come here. One minute I was driving toward the meeting, the next minute I was sitting in this parking lot, and I couldn't tell you how I got from Point A to Point B. My feet just... brought me here. Without permission. Without conscious thought.
              </p>

              <p>
                The bodybuilder and alcoholic in me knows what this is. Muscle memory. Autopilot. The obsession takes you to the places your disease wants you to go. And once you're there, your body knows exactly what to do. No conscious thought required. Just practiced repetition. Just the invisible hand of addiction steering the wheel while muscle memory executes the plan.
              </p>

              <p className="italic">
                Walk through those doors. Find the bourbon aisle. Reach for the Jim Beam. Take it to the register. I've done this a thousand times before. My body remembers every step.
              </p>

              <p>
                I turn off the ignition.
              </p>

              <p>
                My hands are shaking—not from withdrawal this time, but from anticipation. From desire. From the thing that lives in my chest that whispers <em>just one drink, just one drink, just one drink</em> like a mantra, like a prayer, like a promise that this time will be different.
              </p>

              <p>
                I get out of the car.
              </p>

              <p>
                [... The prologue continues through Shaun's powerful moment of choice in the liquor store, eventually choosing the meeting over the bottle...]
              </p>

              <div className="p-6 bg-accent/20 rounded-lg border-l-4 border-primary my-8">
                <p className="font-semibold">
                  That was my bottom in sobriety. Not the psych wards. Not the protective order. Not even losing access to my kids. It was standing in that ABC store, crying, finally understanding that no amount of discipline, no amount of white-knuckling, no amount of showing up to meetings would save me if I didn't actually surrender.
                </p>
                <p className="mt-4">
                  I didn't know it then, but that night—in early 2015—that was the night I finally put both feet in.
                </p>
                <p className="mt-2">
                  That was the night I chose the meeting instead of the bottle.
                </p>
                <p className="mt-2 font-bold">
                  That was the night everything started to change.
                </p>
              </div>
            </section>

            <div className="border-t border-b py-8 my-12">
              <h2 className="text-2xl font-bold text-center">PART I: FOUNDATIONS & FRACTURES</h2>
              <p className="text-center text-muted-foreground italic mt-2">The wounds beneath the armor</p>
            </div>

            {/* Chapter 1 */}
            <section className="space-y-6">
              <h2 className="text-3xl font-bold border-b pb-4">Chapter 1: The Oxygen Tent</h2>

              <p>
                I remember the rain—JCPenney parking lot, my parents' voices blending with windshield wipers, and words I didn't understand: pneumonia, whooping cough, admission.
              </p>

              <p>
                I was four years old, and the world was about to shrink to the size of a clear dome.
              </p>

              <p>
                Martha Jefferson Hospital. The same hospital where I was born. My mom gripped my hand as we walked through automatic doors that hissed open like they were exhaling. Everything smelled like antiseptic and fear. There were other kids crying somewhere down the hall, and the sound made my stomach hurt.
              </p>

              <p>
                The nurses were nice—too nice, the way adults get when something bad is happening and they're trying to make it seem okay. They led us to a room, and that's when I saw it through the doorway: the oxygen tent.
              </p>

              <p>
                It looked like something from a science fiction movie. A clear plastic dome that would go over the hospital bed, sealing you inside. I'd seen something like it before—in E.T., when Elliott and E.T. both got sick and the government put them in those plastic tents to study them. In the movie, it meant you were very, very sick. It meant you were separate from everyone else. It meant they didn't know if you'd make it.
              </p>

              <p>
                "It's going to help you breathe better, honey," Mom said, but her voice was doing that thing where it went up at the end, like she was asking a question instead of making a statement.
              </p>

              <p>
                I didn't want to get in the tent.
              </p>

              <p>
                But when you're four, you don't get to choose...
              </p>

              <p className="text-muted-foreground italic">
                [Chapter 1 continues with Shaun's powerful story of the oxygen tent and the two pairs of slippers his father brought him—Cookie Monster and G.I. Joe—representing the two personas he would learn to embody: the fun-loving kid and the armored soldier...]
              </p>

              <div className="p-6 bg-accent/20 rounded-lg border-l-4 border-primary my-8">
                <p className="font-semibold">
                  The oxygen tent was my first real memory of feeling different. Separate. Like I existed slightly outside of normal reality, watching through plastic while everyone else lived in the real world.
                </p>
                <p className="mt-4">
                  It wouldn't be my last.
                </p>
                <p className="mt-2">
                  But it was the beginning of understanding that I could adapt. That I could be whatever I needed to be in any given moment—fun Shaun, tough Shaun, sweet Shaun, soldier Shaun. All I had to do was figure out which version the situation required, and I could slip into that role as easily as putting on a pair of slippers.
                </p>
              </div>
            </section>

            {/* Chapter 2 */}
            <section className="space-y-6">
              <h2 className="text-3xl font-bold border-b pb-4">Chapter 2: The Caged Animal In Me</h2>

              <p>
                The Cage—that's what they called it. The aquatic center in the basement of U Hall, where Ralph Sampson once played basketball for UVA. Back then it was just a name, but years later, I'd understand what it meant to live like an animal trapped inside one—raging, restless, trying to break free.
              </p>

              <p>
                I was somewhere between six and eight years old. Old enough to remember, too young to understand.
              </p>

              <p>
                The swim coach was a family friend. Sort of. The kind of person your parents know casually, wave to at community events, trust because everyone else seems to trust him. He ran the youth swim program at the university pool, and my parents thought it would be good for me—exercise, discipline, learning a skill.
              </p>

              <p>
                They didn't know what happened in the locker room.
              </p>

              <p>
                Nobody did.
              </p>

              <p className="font-semibold">
                I need to be careful here. Not because I'm ashamed—though I carried that shame for three decades like a stone in my chest. But because this isn't a story I'm telling for shock value. This isn't about graphic details or explicit descriptions. This is about what happens to a child's mind when trust gets violated in ways that create confusion instead of clarity.
              </p>

              <p>
                What happened wasn't violent. It wasn't terrifying in the way you might imagine. There were no threats, no pain, no overt force. That's what made it so confusing. It felt... wrong. But also not wrong. My body responded in ways that made me think maybe this was normal. Maybe this was something that happened to all kids and nobody talked about it. Maybe I was supposed to like it.
              </p>

              <p className="text-muted-foreground italic">
                [Chapter 2 continues with Shaun's careful, trauma-informed account of childhood sexual abuse and its profound impact on his developing nervous system, his understanding of himself, and the compulsive behaviors that would follow him for decades...]
              </p>

              <div className="p-6 bg-accent/20 rounded-lg border-l-4 border-primary my-8">
                <p className="font-semibold">
                  The Cage closed years ago. U Hall itself is gone now too—demolished just a few years back. The night before they tore it down, I took a long walk through Grounds. Stood outside the stadium in the darkness, took one last picture of the building where it all happened.
                </p>
                <p className="mt-4">
                  You can demolish the building. But the memory? That stays.
                </p>
                <p className="mt-4">
                  And I think about six-year-old Shaun, walking into that locker room, not knowing what was about to happen, not having the words to explain it when it did. I wish I could go back and tell him:
                </p>
                <p className="mt-4 italic">
                  It's not your fault. You didn't do anything wrong. Your body responding doesn't mean you wanted it. And one day—I promise—you'll tell this story out loud and it won't destroy you.
                </p>
              </div>
            </section>

            {/* Continue Reading Section */}
            <section className="my-16 p-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border-2 border-primary/20">
              <h2 className="text-3xl font-bold mb-6 text-center">Continue Reading</h2>
              <p className="text-lg mb-4 text-center">
                Want to read the rest of Shaun's story?
              </p>
              <p className="mb-6 text-center">
                <em>Crooked Lines: Bent, Not Broken</em> follows the complete journey from childhood trauma through active addiction, rock bottom, and the hard-won redemption of recovery. It's a story of resilience, hope, and the crooked lines that lead us home.
              </p>
              <div className="flex justify-center gap-4">
                <Button className="bg-primary hover:bg-primary/90" size="lg">
                  Get Updates on Book Release
                </Button>
                <Link href="/memoir">
                  <Button variant="outline" size="lg">
                    Learn More About the Book
                  </Button>
                </Link>
              </div>
            </section>

            {/* Recovery Resources */}
            <section className="my-16">
              <h2 className="text-3xl font-bold mb-6 text-center">Recovery Resources</h2>
              <p className="mb-6 text-center">
                If you or someone you love is struggling with addiction, please reach out:
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-2">SAMHSA National Helpline</h3>
                  <p className="text-2xl font-bold text-primary mb-2">1-800-662-HELP (4357)</p>
                  <p className="text-sm text-muted-foreground">Free, confidential, 24/7 support in English and Spanish</p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-2">National Suicide Prevention Lifeline</h3>
                  <p className="text-2xl font-bold text-primary mb-2">988</p>
                  <p className="text-sm text-muted-foreground">Free, confidential crisis support 24/7</p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-2">Alcoholics Anonymous</h3>
                  <p className="text-sm text-muted-foreground mb-2">Find local meetings and support</p>
                  <a href="https://www.aa.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    www.aa.org
                  </a>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-2">Narcotics Anonymous</h3>
                  <p className="text-sm text-muted-foreground mb-2">Find local meetings and support</p>
                  <a href="https://www.na.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    www.na.org
                  </a>
                </Card>
              </div>

              <p className="text-center mt-8 text-xl font-bold">
                You are not alone. Recovery is possible.
              </p>
            </section>

          </div>
        </div>
      </article>

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
                <li><a href="/memoir" className="hover:text-primary transition-colors">About the Book</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/resources" className="hover:text-primary transition-colors">Free Downloads</a></li>
                <li><a href="/products" className="hover:text-primary transition-colors">Products</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/about" className="hover:text-primary transition-colors">About</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/terms-of-use" className="hover:text-primary transition-colors">Terms of Use</a></li>
                <li><a href="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Shaun Critzer. All rights reserved.</p>
            <p className="mt-2">This is an excerpt from <em>Crooked Lines: Bent, Not Broken</em>. No part of this excerpt may be reproduced without permission.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
