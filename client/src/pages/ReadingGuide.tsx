import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, Save, Printer } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface Part {
  title: string;
  subtitle: string;
  questions: string[];
  color: string;
}

const parts: Part[] = [
  {
    title: "Part 1: Childhood and Trauma",
    subtitle: "Shaun's story begins with childhood trauma that shaped his nervous system and set the stage for addiction. These questions explore the connection between early experiences and later behaviors.",
    questions: [
      "How did Shaun's childhood experiences shape his view of himself and the world?",
      "What role did shame play in Shaun's early life? How did it manifest later?",
      "Shaun describes his nervous system as \"wired for survival, not connection.\" What does this mean?",
      "How did you react to the descriptions of Shaun's childhood trauma? What emotions came up?",
      "Can you identify ways your own childhood experiences shaped your coping mechanisms?"
    ],
    color: "blue"
  },
  {
    title: "Part 2: Addiction and Rock Bottom",
    subtitle: "Shaun's descent into addiction wasn't a moral failure—it was a nervous system response to unhealed trauma. These questions explore the nature of addiction and what it takes to hit bottom.",
    questions: [
      "Shaun describes multiple \"rock bottoms.\" Why do you think one wasn't enough?",
      "How does Shaun's understanding of addiction differ from the traditional \"moral failure\" model?",
      "What role did shame and secrecy play in keeping Shaun stuck in addiction?",
      "Shaun struggled with process addictions (compulsive behaviors, affairs, bodybuilding) in addition to substances. How are these similar? How are they different?",
      "What was the turning point for Shaun? What finally made him willing to change?",
      "Have you ever felt stuck in a pattern you couldn't break? What was that like?"
    ],
    color: "amber"
  },
  {
    title: "Part 3: Recovery and Healing",
    subtitle: "Recovery is more than just stopping a behavior—it's about healing the nervous system, processing trauma, and building a life you don't want to escape from.",
    questions: [
      "How did Shaun's understanding of recovery evolve over his 13-year journey?",
      "What role did therapy, 12-step programs, and community play in Shaun's healing?",
      "Shaun talks about \"nervous system regulation\" as central to recovery. What does this mean?",
      "How did Shaun rebuild trust with his family after years of broken promises?",
      "What surprised you most about Shaun's approach to recovery?",
      "What does \"bent, not broken\" mean to you?"
    ],
    color: "green"
  },
  {
    title: "Part 4: Redemption and Hope",
    subtitle: "Shaun's story doesn't end with sobriety—it continues with a life of purpose, connection, and service. These questions explore what redemption looks like.",
    questions: [
      "How has Shaun's past informed his present work and purpose?",
      "What does redemption mean in the context of Shaun's story?",
      "Shaun is open about his struggles, even the ugly parts. Why is this important?",
      "How has reading this book changed your understanding of addiction and recovery?",
      "What's one thing you'll take away from Shaun's story?",
      "If you could ask Shaun one question, what would it be?"
    ],
    color: "purple"
  }
];

export default function ReadingGuide() {
  const [hasAccess, setHasAccess] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedPart, setExpandedPart] = useState<number | null>(null);
  const [reflections, setReflections] = useState<{ [key: string]: string }>({});

  const downloadMutation = trpc.leadMagnets.download.useMutation();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      await downloadMutation.mutateAsync({
        slug: "reading-guide",
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

  const togglePart = (index: number) => {
    setExpandedPart(expandedPart === index ? null : index);
  };

  const saveReflections = () => {
    localStorage.setItem('readingGuideReflections', JSON.stringify(reflections));
    toast.success("Reflections saved!");
  };

  const printGuide = () => {
    window.print();
    toast.success("Print dialog opened!");
  };

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: { bg: string; border: string; text: string } } = {
      blue: { bg: "bg-blue-50", border: "border-blue-500", text: "text-blue-900" },
      amber: { bg: "bg-amber-50", border: "border-amber-500", text: "text-amber-900" },
      green: { bg: "bg-green-50", border: "border-green-500", text: "text-green-900" },
      purple: { bg: "bg-purple-50", border: "border-purple-500", text: "text-purple-900" }
    };
    return colors[color] || colors.blue;
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <section className="py-20 bg-gradient-to-b from-background to-accent/20">
          <div className="container max-w-2xl">
            <div className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold">
                Crooked Lines Reading Guide
              </h1>
              <p className="text-xl text-muted-foreground">
                Deeper Discussion Questions for Individual Reflection or Group Study
              </p>
              <p className="text-muted-foreground">
                This reading guide is designed for individual reflection or group discussion. Whether you're reading alone or with a book club, recovery group, or therapy group, these questions will help you go deeper with the themes of trauma, addiction, and redemption.
              </p>

              <Card className="p-8 mt-8">
                <h2 className="text-2xl font-bold mb-4">Access Required</h2>
                <p className="text-muted-foreground mb-6">
                  Enter your email to access the interactive reading guide with space for personal reflections. You'll also receive weekly insights on recovery, trauma healing, and building a life worth staying sober for.
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
                    {isSubmitting ? "Processing..." : "Get Access"}
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
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-background to-accent/20">
        <div className="container max-w-5xl">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold">
              Crooked Lines Reading Guide
            </h1>
            <p className="text-xl text-muted-foreground">
              Deeper Discussion Questions for Individual Reflection or Group Study
            </p>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              This reading guide is designed for individual reflection or group discussion. Whether you're reading alone or with a book club, recovery group, or therapy group, these questions will help you go deeper with the themes of trauma, addiction, and redemption.
            </p>

            <div className="flex gap-4 justify-center">
              <Button onClick={saveReflections} className="bg-primary hover:bg-primary/90">
                <Save className="mr-2 h-4 w-4" />
                Save My Reflections
              </Button>
              <Button onClick={printGuide} variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Print Discussion Guide
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Discussion Parts */}
      <section className="py-20">
        <div className="container max-w-4xl">
          <div className="space-y-4">
            {parts.map((part, partIdx) => {
              const colorClasses = getColorClasses(part.color);
              return (
                <Card key={partIdx} className={`border-2 ${colorClasses.border}`}>
                  <CardContent className="p-0">
                    <button
                      onClick={() => togglePart(partIdx)}
                      className={`w-full flex items-center justify-between p-6 text-left hover:opacity-90 transition-opacity ${colorClasses.bg}`}
                    >
                      <div>
                        <h3 className={`text-xl font-bold ${colorClasses.text}`}>{part.title}</h3>
                        <p className={`text-sm mt-1 ${colorClasses.text} opacity-80`}>
                          {part.questions.length} discussion questions
                        </p>
                      </div>
                      {expandedPart === partIdx ? <ChevronUp className={colorClasses.text} /> : <ChevronDown className={colorClasses.text} />}
                    </button>

                    {expandedPart === partIdx && (
                      <div className="px-6 pb-6 space-y-6">
                        <p className="text-muted-foreground italic">
                          {part.subtitle}
                        </p>

                        <div className="space-y-6">
                          {part.questions.map((question, qIdx) => {
                            const key = `${partIdx}-${qIdx}`;
                            return (
                              <div key={qIdx} className="space-y-3">
                                <div className="flex gap-3">
                                  <span className={`font-bold ${colorClasses.text} flex-shrink-0`}>
                                    {qIdx + 1}.
                                  </span>
                                  <p className="font-semibold">{question}</p>
                                </div>
                                <Textarea
                                  value={reflections[key] || ""}
                                  onChange={(e) => setReflections({...reflections, [key]: e.target.value})}
                                  placeholder="My reflection: (optional, saves to your browser)"
                                  className="min-h-[100px] ml-8"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tips for Group Discussion */}
      <section className="py-20 bg-accent/30">
        <div className="container max-w-4xl">
          <Card className="p-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
            <h2 className="text-3xl font-bold mb-6">Tips for Group Discussion</h2>
            <p className="mb-6">
              If you're using this guide with a group, keep these principles in mind:
            </p>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="text-primary font-bold flex-shrink-0">•</span>
                <span><strong>Create a safe, confidential space.</strong> What's shared in the group stays in the group.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold flex-shrink-0">•</span>
                <span><strong>Listen without judgment.</strong> Everyone's story and recovery journey is different.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold flex-shrink-0">•</span>
                <span><strong>You don't have to share if you're not ready.</strong> It's okay to pass.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold flex-shrink-0">•</span>
                <span><strong>Avoid giving advice unless asked.</strong> Sometimes people just need to be heard.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold flex-shrink-0">•</span>
                <span><strong>Honor the courage it takes to be vulnerable.</strong></span>
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Closing Message */}
      <section className="py-20">
        <div className="container max-w-3xl">
          <div className="text-center space-y-6">
            <p className="text-lg">
              Thank you for reading <em>Crooked Lines</em>. Whether you're in recovery yourself, supporting someone who is, or simply seeking to understand the human experience of trauma and healing—you're not alone.
            </p>
            <p className="text-2xl font-bold text-primary">
              Recovery is possible. Healing is possible. You're worth it.
            </p>
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
          </div>
        </div>
      </footer>
    </div>
  );
}
