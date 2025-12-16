import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function First3Chapters() {
  const [email, setEmail] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subscribeForLeadMagnet = trpc.leadMagnets.subscribeForLeadMagnet.useMutation({
    onSuccess: () => {
      setHasAccess(true);
      toast.success("Access granted! You've been added to our email list for weekly insights.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to grant access. Please try again.");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    
    setIsSubmitting(true);
    subscribeForLeadMagnet.mutate({
      email,
      leadMagnetType: "first_3_chapters",
    });
  };

  // Full content with all intro sections
  const fullContent = `# CROOKED LINES: BENT, NOT BROKEN
## A Memoir by Shaun Critzer

---

**Deus escreve direito por linhas tortas —**  
*God writes straight with crooked lines*

---

## The Meaning Behind the Title

The Portuguese saying "Deus escreve direito por linhas tortas"—translated as "God writes straight with crooked lines"—carries a quiet kind of hope. It suggests that what feels like chaos or failure may, in time, reveal a larger design.

For years, I thought my story was too broken to matter. But every misstep and detour turned out to be part of the same sentence—God's handwriting on my life. The crooked lines weren't mistakes; they were directions.

This is what Crooked Lines means to me: grace inside imperfection, purpose hiding in the mess, and proof that redemption doesn't need a straight road.

---

## Content Warnings

This memoir contains frank discussions of:
* Childhood sexual abuse
* Substance abuse and addiction
* Suicidal ideation and mental health crises
* Domestic conflict and protective orders
* Trauma and PTSD

Reader discretion is advised. If you need support, please see the Resources section at the end of this document.

---

## AUTHOR'S NOTE

This book is my fourth step on paper.

For those unfamiliar with Alcoholics Anonymous, the fourth step requires a "searching and fearless moral inventory" of yourself—a comprehensive, honest accounting of your life, your mistakes, your character defects, and the people you've hurt. It's meant to be shared with your higher power, self, and another human being. Today, you are that other human being.

**Here's why I'm sharing:**

I wrote this book because I needed someone to tell me thirteen years ago that healing and growth were possible. That you could hit bottoms you didn't think you'd survive and still build a life beyond your wildest dreams. That loss and addiction doesn't have to be a death sentence. That trauma can be processed. That broken things can heal.

I needed someone to be vulnerable about the really dark stuff—the childhood violations, the protective orders, the psych wards, the handcuffs, the homicidal ideation, the absolute rock bottoms that no one talks about because they're too ashamed. I needed to know I wasn't uniquely broken, that others had walked this path before me and made it out alive.

So I'm being that person for you.

This book is not a redemption story where I emerged perfect and enlightened. I'm still a work in progress. Still learning. Still making mistakes. Still showing up to meetings and calling my sponsor and mentor and doing the daily work of recovery. The difference is I'm no longer running from myself. I'm no longer hiding behind armor. I'm learning to bring my full, whole self to the table—flaws and all.

I've changed names and identifying details to protect people's privacy, but every story in this book is true. Some of it is difficult to read. Some of it was difficult to write. But recovery taught me that secrets keep us sick, and truth sets us free. So I'm choosing truth.

If you're struggling with loss, failure, addiction, trauma, mental health issues, or just the overwhelming weight of being human in a complicated world—please know: you are not alone. You are not too far gone. You are not beyond help. One decision can change everything. One phone call. One meeting. One moment of honesty when dishonesty has been your default for years.

It won't be easy. Recovery is the hardest thing I've ever done. But it's also given me everything that matters: my family, my peace, my purpose, my life.

This book is my way of saying: if it's possible for me—someone who lost everything, destroyed everyone, hit bottoms I didn't think existed—it's possible for you too.

You just have to be willing. Willing to be honest. Willing to be open minded to new ideas. Willing to keep showing up even when you can't see the path yet.

The path will reveal itself. I promise.

One day at a time.

— Shaun Critzer  
Charlottesville, Virginia  
October 2025  
13 years sober

---

## Introduction: Not What You'd Expect

I didn't come from the kind of chaos people imagine when they hear a story like mine. No abusive father, no absent mother. No poverty, no violence in the home, no obvious warning signs that addiction would one day bring me to my knees in a liquor store parking lot, crying over a bottle of Jim Beam I was too terrified to buy.

I grew up in Charlottesville, Virginia, in a middle-class home with parents who loved me. My father started a cabinet business when I was five years old, putting our house up as collateral to get the loan. It was a gamble that paid off. We had family dinners. Summer vacations. A backyard pool where I spent entire afternoons doing cannonballs with neighborhood kids.

From the outside, everything looked normal. Fine. Safe.

And maybe that's the most dangerous lie of all—that addiction only happens to people from broken homes. That it's reserved for the obviously damaged, the visibly traumatized, the statistically disadvantaged.

The truth is simpler and more terrifying: addiction doesn't care about your ZIP code. It doesn't check your family tree or your bank account or whether your parents stayed married. It finds the cracks in your foundation—the wounds you've buried, the pain you've never spoken aloud, the secrets you've carried since childhood. And it promises relief.

For years, I believed I was different. Special. Uniquely broken in a way that set me apart from everyone else. I built layer upon layer of protection out of muscle and discipline, thinking if I could just get strong enough, big enough, impressive enough, I could outrun my own shadow.

I was wrong.

This isn't a story about how I came from nothing. It's about how I became nothing—how I lost everything I loved, everyone who mattered, every version of myself I'd tried so hard to build. How I stood in a parking lot at thirty-four years old, eighteen months sober, and realized I was still looking for God in all the wrong places.

But it's also about what happened next. About the crooked lines that somehow led me home. About grace hiding in ordinary moments. About learning that failure isn't the end of the story—it's just data. Information. Another chance to choose differently.

My journey took me from bodybuilding stages to courtrooms. From winning championships to losing custody of my children. From the hood to rehab. From protective orders to co-parenting at Disney World. From wanting to die to teaching my children how to live.

It wasn't a straight path. Nothing about recovery ever is.

But if you're reading this because you're struggling—with addiction, with trauma, with the weight of secrets you've carried too long—I want you to know something: You're not uniquely broken. You're not beyond hope. And you're not alone.

The liquor store where I almost relapsed? It's still there on Route 29. I drive past it sometimes, and I remember the man I was that day in early 2015—desperate, terrified, convinced one drink would either save me or kill me.

He was right about the second part. But he was wrong about something else.

He thought he was alone. He thought he was the only one who'd ever felt that broken. He thought there was no way out except through the bottom of a bottle.

He didn't know yet that the hardest moment of his sobriety would become the turning point. That choosing the meeting over the bottle that day would change everything. That the crooked lines he'd been walking his entire life were leading him exactly where he needed to go.

He didn't know yet that God writes straight with crooked lines.

But he was about to find out.

This is that story.

---

*[Note: Full prologue and chapters content would continue here from the manuscript]*
`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6" />
            <span className="font-bold">Shaun Critzer</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-amber-500 mb-4">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">First 3 Chapters</h1>
          <p className="text-xl text-muted-foreground">
            Free Excerpt from Crooked Lines: Bent, Not Broken
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Thank you for your interest in reading the first three chapters of <em>Crooked Lines: Bent, Not Broken</em>. 
            This memoir chronicles my journey through childhood trauma, addiction, rock bottom, and the redemption that comes 
            from choosing recovery one day at a time.
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            What you're about to read is raw, unflinching, and honest. If you're struggling with addiction, trauma, or the 
            crushing weight of being human—this book is for you.
          </p>
          <p className="text-lg font-semibold">You are not alone, and you are not too far gone.</p>
        </div>
      </div>

      {/* Access Gate or Content */}
      {!hasAccess ? (
        <div className="container pb-16">
          <Card className="mx-auto max-w-md p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Access Required</h2>
              <p className="text-muted-foreground">
                Enter your email to read the first three chapters online. You'll also receive updates about the full book 
                release and exclusive recovery resources.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Read the Excerpt"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                No spam. Unsubscribe anytime. Your email is safe with me.
              </p>
            </form>
          </Card>
        </div>
      ) : (
        <div className="container pb-16">
          <article className="mx-auto max-w-3xl prose prose-lg dark:prose-invert">
            <Streamdown>{fullContent}</Streamdown>
          </article>
        </div>
      )}
    </div>
  );
}
