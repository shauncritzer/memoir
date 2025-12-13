import { Navigation } from "@/components/Navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, Save, BookOpen, Printer } from "lucide-react";
import { toast } from "sonner";

const discussionQuestions = [
  {
    part: "Part 1: Childhood and Trauma",
    questions: [
      "What childhood experiences shaped who you became? How did you cope with pain or fear as a child?",
      "Shaun built 'armor' through bodybuilding and achievement. What armor did you build to protect yourself?",
      "How did buried trauma show up in your adult life before you started processing it?",
      "What emotions did you learn to suppress as a child? How did that suppression affect your addiction?",
      "If you could go back and tell your younger self one thing, what would it be?"
    ]
  },
  {
    part: "Part 2: Addiction and Rock Bottom",
    questions: [
      "When did your coping mechanism (substance, behavior, etc.) cross the line into addiction?",
      "Shaun describes his 'decade of darkness.' What was your darkest period? What kept you going?",
      "What did you lose during your active addiction? Who did you hurt?",
      "What was your rock bottom? Or are you still looking for it?",
      "How did shame fuel your addiction? How did addiction fuel your shame?",
      "What lie did you tell yourself to justify continuing?"
    ]
  },
  {
    part: "Part 3: Recovery and Healing",
    questions: [
      "What finally made you choose recovery? Was it a moment or a process?",
      "Shaun talks about EMDR therapy for trauma processing. What healing modality has worked for you?",
      "How did working the 12 steps (or another recovery framework) change your understanding of yourself?",
      "What does 'bringing your full, broken self to the table' mean to you?",
      "Who has been your greatest support in recovery? How have they helped you heal?",
      "What surprised you most about early recovery?"
    ]
  },
  {
    part: "Part 4: Redemption and Hope",
    questions: [
      "Shaun rebuilt relationships with his children and ex-wife. What relationships are you working to repair?",
      "How has your understanding of yourself changed through recovery?",
      "What does 'God writes straight with crooked lines' mean in your story?",
      "What part of your past are you still trying to integrate or make peace with?",
      "What hope do you have for your future that you didn't have before?",
      "How are you using your pain to help others?"
    ]
  }
];

export default function ReadingGuide() {
  const [expandedPart, setExpandedPart] = useState<number | null>(null);
  const [reflections, setReflections] = useState<{[key: string]: string}>({});
  const [email, setEmail] = useState("");
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem("readingGuideEmail");
    if (storedEmail) {
      setHasAccess(true);
      setEmail(storedEmail);

      // Load saved reflections
      const saved = localStorage.getItem("readingGuideReflections");
      if (saved) {
        setReflections(JSON.parse(saved));
      }
    }
  }, []);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    localStorage.setItem("readingGuideEmail", email);
    setHasAccess(true);
    toast.success("Access granted! Your reading guide is ready.");
  };

  const saveReflections = () => {
    localStorage.setItem("readingGuideReflections", JSON.stringify(reflections));
    toast.success("Reflections saved!");
  };

  const handleReflectionChange = (partIndex: number, questionIndex: number, value: string) => {
    const key = `${partIndex}-${questionIndex}`;
    setReflections({ ...reflections, [key]: value });
  };

  const printGuide = () => {
    window.print();
    toast.success("Opening print dialog...");
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <Card className="max-w-md w-full mx-4 bg-gray-900 border-yellow-600/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <BookOpen className="h-16 w-16 text-yellow-500 mx-auto" />
                <h2 className="text-2xl font-bold text-white">Access Crooked Lines Reading Guide</h2>
                <p className="text-gray-300">
                  Enter your email to unlock discussion questions and reflection prompts for your book club or personal study.
                </p>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-800 border-yellow-600/50 text-white"
                  />
                  <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold">
                    Get Free Access
                  </Button>
                </form>
                <p className="text-xs text-gray-400">
                  Your email is safe with us. No spam, ever.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black py-20">
        <div className="container max-w-4xl text-center space-y-6">
          <BookOpen className="h-16 w-16 text-yellow-500 mx-auto" />
          <h1 className="text-5xl font-bold text-white">Crooked Lines Reading Guide</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discussion questions and reflection prompts for book clubs, recovery groups, or personal study.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={saveReflections} className="bg-yellow-600 hover:bg-yellow-700 text-black">
              <Save className="mr-2 h-4 w-4" />
              Save My Reflections
            </Button>
            <Button onClick={printGuide} variant="outline" className="text-white border-white hover:bg-white hover:text-black">
              <Printer className="mr-2 h-4 w-4" />
              Print Guide
            </Button>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-12 bg-yellow-50">
        <div className="container max-w-4xl">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold">How to Use This Guide</h2>
              <p className="text-gray-700 leading-relaxed">
                <em>Crooked Lines: Bent, Not Broken</em> is more than a memoir—it's an invitation to examine your own story
                with compassion and honesty. These questions are designed to help you reflect on your own experiences with
                trauma, addiction, and recovery.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You can use this guide alone, with a therapist, sponsor, or in a book club or recovery group. Your reflections
                are saved privately in your browser—no one else can see them unless you choose to share.
              </p>
              <p className="text-sm text-gray-600 italic">
                Note: Some questions may bring up difficult emotions. Please practice self-care and reach out to your support
                system if needed.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Discussion Questions */}
      <section className="py-12">
        <div className="container max-w-4xl space-y-4">
          {discussionQuestions.map((section, partIndex) => (
            <Card key={partIndex} className="border-2 border-yellow-600/30">
              <button
                onClick={() => setExpandedPart(expandedPart === partIndex ? null : partIndex)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <h3 className="text-2xl font-bold">{section.part}</h3>
                {expandedPart === partIndex ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedPart === partIndex && (
                <CardContent className="space-y-6 border-t">
                  {section.questions.map((question, qIndex) => (
                    <div key={qIndex} className="space-y-3 pb-6 border-b last:border-b-0 last:pb-0">
                      <p className="font-medium text-gray-900">
                        {qIndex + 1}. {question}
                      </p>
                      <div>
                        <label className="text-sm text-gray-600 block mb-1">My reflection:</label>
                        <Textarea
                          value={reflections[`${partIndex}-${qIndex}`] || ""}
                          onChange={(e) => handleReflectionChange(partIndex, qIndex, e.target.value)}
                          placeholder="Type your thoughts here... (optional, saves automatically to your browser)"
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Tips for Group Discussion */}
      <section className="py-12 bg-yellow-50">
        <div className="container max-w-4xl">
          <Card className="border-2 border-yellow-600">
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-bold text-yellow-900">Tips for Group Discussion</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex gap-2">
                  <span className="text-yellow-600 font-bold">•</span>
                  <span><strong>Create safety first:</strong> Establish ground rules (confidentiality, no crosstalk, no advice-giving)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-600 font-bold">•</span>
                  <span><strong>Honor the pass:</strong> No one has to share if they're not ready</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-600 font-bold">•</span>
                  <span><strong>Focus on identification, not comparison:</strong> Look for how you relate, not how you differ</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-600 font-bold">•</span>
                  <span><strong>Use "I" statements:</strong> Share your own experience, not advice</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-600 font-bold">•</span>
                  <span><strong>Hold space for emotion:</strong> It's okay to cry, to pause, to feel</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-600 font-bold">•</span>
                  <span><strong>End with hope:</strong> Close each meeting by sharing one thing you're grateful for or one thing that gives you hope</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="container max-w-3xl text-center space-y-6 text-white">
          <h2 className="text-3xl font-bold">Ready for the Full Story?</h2>
          <p className="text-xl text-gray-300">
            Get the complete memoir and discover the path from broken to whole.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/memoir">
              <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold">
                Learn About the Book
              </Button>
            </Link>
            <Link href="/first-3-chapters">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-black">
                Read First 3 Chapters Free
              </Button>
            </Link>
          </div>
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
              <h4 className="font-semibold text-white">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/resources" className="hover:text-yellow-500 transition-colors">All Resources</Link></li>
                <li><Link href="/recovery-toolkit" className="hover:text-yellow-500 transition-colors">Recovery Toolkit</Link></li>
                <li><Link href="/first-3-chapters" className="hover:text-yellow-500 transition-colors">First 3 Chapters</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Programs</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/products" className="hover:text-yellow-500 transition-colors">Courses</Link></li>
                <li><Link href="/ai-coach" className="hover:text-yellow-500 transition-colors">AI Coach</Link></li>
                <li><Link href="/memoir" className="hover:text-yellow-500 transition-colors">The Memoir</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-yellow-500 transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-yellow-500 transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-yellow-500 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms-of-use" className="hover:text-yellow-500 transition-colors">Terms of Use</Link></li>
                <li><Link href="/refund-policy" className="hover:text-yellow-500 transition-colors">Refund Policy</Link></li>
                <li><Link href="/faqs" className="hover:text-yellow-500 transition-colors">FAQs</Link></li>
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
