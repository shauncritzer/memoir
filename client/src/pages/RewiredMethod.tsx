import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { toast } from "sonner";

interface RewiredStep {
  letter: string;
  title: string;
  lie: string;
  truth: string;
  content: string;
  prompt: string;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    textLight: string;
    badge: string;
    badgeDark: string;
  };
}

const rewiredSteps: RewiredStep[] = [
  {
    letter: "R",
    title: "Recognize Your State",
    lie: "I just need to be stronger.",
    truth: "I need to know where I am before I can get where I'm going.",
    content: "Recovery starts with awareness. Before you can change your state, you have to be able to recognize it. This first step is about learning the language of your nervous system. You'll learn to identify the subtle cues of hyperarousal (anxiety, racing thoughts, agitation) and hypoarousal (numbness, disconnection, shutdown) in your body. This isn't about judgment; it's about compassionate observation.",
    prompt: "Think about the last time you felt overwhelmed. Did you feel revved up and anxious (hyperarousal) or shut down and numb (hypoarousal)? Describe what that felt like in your body.",
    colorScheme: {
      bg: "bg-blue-50",
      border: "border-blue-500",
      text: "text-blue-900",
      textLight: "text-blue-800",
      badge: "bg-blue-500",
      badgeDark: "bg-blue-600"
    }
  },
  {
    letter: "E",
    title: "Establish Safety",
    lie: "I'm not safe until this feeling goes away.",
    truth: "I can create safety for myself, right here, right now.",
    content: "Your nervous system is constantly scanning for threats. For those of us with a history of trauma or chronic stress, that alarm system is often faulty. This step is about learning to consciously create a sense of safety in your own body, even when your mind is telling you you're in danger. You'll learn grounding techniques, orienting exercises, and how to use your senses to anchor yourself in the present moment.",
    prompt: "Look around you right now and find one object that brings you a sense of calm or stability. It could be a plant, a photo, or the feeling of your feet on the floor. What is it, and why does it make you feel grounded?",
    colorScheme: {
      bg: "bg-green-50",
      border: "border-green-500",
      text: "text-green-900",
      textLight: "text-green-800",
      badge: "bg-green-500",
      badgeDark: "bg-green-600"
    }
  },
  {
    letter: "W",
    title: "Work with the Body",
    lie: "I can think my way out of this.",
    truth: "My body holds the key to regulation.",
    content: "Compulsive behaviors are often a misguided attempt to regulate a dysregulated nervous system. This step is about learning healthier, more effective ways to work directly with your body's energy. You'll learn the science behind breathwork and how to use specific breathing patterns to calm anxiety or gently bring yourself out of a shutdown state. This is where you stop fighting your body and start listening to it.",
    prompt: "Try this simple exercise: Breathe in for a count of 4, and breathe out for a count of 6. Do this three times. What do you notice in your body after just three breaths?",
    colorScheme: {
      bg: "bg-purple-50",
      border: "border-purple-500",
      text: "text-purple-900",
      textLight: "text-purple-800",
      badge: "bg-purple-500",
      badgeDark: "bg-purple-600"
    }
  },
  {
    letter: "I",
    title: "Integrate the Past",
    lie: "I should just get over it.",
    truth: "My past is a part of my story, but it doesn't have to be my prison.",
    content: "Unprocessed trauma and buried emotions are the fuel for addiction. This step is about gently and safely beginning to process what you've been avoiding. It's not about reliving the trauma; it's about allowing the stored energy to be released from your body. This is done through practices like somatic experiencing, journaling, and learning to tolerate difficult sensations without becoming overwhelmed.",
    prompt: "Think of a past failure or mistake that you still carry with you. Without going into detail, what is one lesson or strength you gained from that experience, even if it was painful?",
    colorScheme: {
      bg: "bg-amber-50",
      border: "border-amber-500",
      text: "text-amber-900",
      textLight: "text-amber-800",
      badge: "bg-amber-500",
      badgeDark: "bg-amber-600"
    }
  },
  {
    letter: "R",
    title: "Rebuild Connection",
    lie: "I have to do this alone.",
    truth: "Connection is the antidote to addiction.",
    content: "Addiction thrives in isolation. Connection is a biological imperative for nervous system regulation. This step is about rebuilding healthy, authentic connections with yourself, with others, and with something greater than yourself. You'll learn about co-regulation and how safe relationships can literally help heal your nervous system. This is where you learn that vulnerability is a superpower, not a weakness.",
    prompt: "Who is one person in your life (or a pet) that makes you feel safe and accepted? What is it about them that creates that feeling?",
    colorScheme: {
      bg: "bg-teal-50",
      border: "border-teal-500",
      text: "text-teal-900",
      textLight: "text-teal-800",
      badge: "bg-teal-500",
      badgeDark: "bg-teal-600"
    }
  },
  {
    letter: "E",
    title: "Embrace Imperfection",
    lie: "I need to be perfect to be worthy.",
    truth: "I am worthy of love and belonging, exactly as I am.",
    content: "Perfectionism is a trauma response. It's the belief that if we can just be perfect, we'll finally be safe and loved. This step is about dismantling that belief and embracing the messy, beautiful reality of being human. It's about practicing self-compassion, celebrating small wins, and understanding that recovery is not a straight line. This is where you internalize the message that failure is a part of success.",
    prompt: "What is one small thing you've done today that you can be proud of, no matter how insignificant it seems? (e.g., 'I made my bed,' 'I drank a glass of water.')",
    colorScheme: {
      bg: "bg-pink-50",
      border: "border-pink-500",
      text: "text-pink-900",
      textLight: "text-pink-800",
      badge: "bg-pink-500",
      badgeDark: "bg-pink-600"
    }
  },
  {
    letter: "D",
    title: "Develop a New Narrative",
    lie: "I am an addict. I am broken.",
    truth: "I am a resilient human being who is healing.",
    content: "Your story is not set in stone. The final step is about consciously crafting a new narrative for your life—one that is based on your strengths, your values, and your vision for the future. It's about moving from a story of shame and failure to one of resilience, growth, and hope. This is where you stop being defined by your past and start living into your potential.",
    prompt: "If you were to describe yourself without mentioning your past struggles, what would you say? Who are you at your core? (e.g., 'I am a creative and compassionate person who is learning to live authentically.')",
    colorScheme: {
      bg: "bg-orange-50",
      border: "border-orange-500",
      text: "text-orange-900",
      textLight: "text-orange-800",
      badge: "bg-orange-500",
      badgeDark: "bg-orange-600"
    }
  }
];

export default function RewiredMethod() {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [responses, setResponses] = useState<{ [key: number]: string }>({});
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleStep = (index: number) => {
    setExpandedStep(expandedStep === index ? null : index);
  };

  const handleResponseChange = (index: number, value: string) => {
    setResponses({ ...responses, [index]: value });
  };

  const handleDownloadPDF = async () => {
    if (!email) {
      toast.error("Please enter your email to download your personalized PDF");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement backend endpoint to generate PDF with user responses
      // and send email
      toast.success("Your personalized REWIRED journey PDF has been sent to your email!");
      
      // Clear form
      setEmail("");
      setResponses({});
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation - Matching Home Page */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black py-20">
        <div className="container max-w-5xl">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Stop Fighting. Start Healing.
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              You can't solve a nervous system problem with willpower. The REWIRED Method is a science-backed, 
              compassionate approach to breaking free from compulsive behaviors and process addictions by healing 
              the root cause: a dysregulated nervous system.
            </p>
            
            <div className="bg-gray-800/50 rounded-lg p-8 text-left max-w-3xl mx-auto mt-8">
              <p className="text-gray-300 mb-4">
                For years, you've been told that recovery is about white-knuckling your way through cravings, 
                fighting your own mind, and simply "trying harder." You've been told that failure is a sign of weakness.
              </p>
              <p className="text-gray-300 mb-4">
                We're here to tell you that's not true.
              </p>
              <p className="text-gray-300 mb-4">
                Failure isn't the opposite of success; <strong className="text-white">it's a part of it.</strong> And 
                your struggle isn't a moral failing; it's a biological one. Your nervous system is stuck in a cycle of 
                survival, and until you learn to work <em>with</em> it, you'll always feel like you're fighting a losing battle.
              </p>
              <p className="text-gray-300">
                The REWIRED Method is different. It's not about fighting; it's about understanding. It's not about 
                willpower; it's about regulation. It's a 7-step journey to rewire your nervous system for safety, 
                connection, and lasting freedom.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* REWIRED Steps */}
      <section className="py-20 bg-white">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            The Interactive REWIRED Journey
          </h2>

          <div className="space-y-4">
            {rewiredSteps.map((step, index) => (
              <Card key={index} className={`${step.colorScheme.bg} border-2 ${step.colorScheme.border}`}>
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleStep(index)}
                    className="w-full flex items-center justify-between p-6 text-left hover:opacity-90 transition-opacity"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full ${step.colorScheme.badgeDark} flex items-center justify-center text-white font-bold text-xl`}>
                        {step.letter}
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${step.colorScheme.text}`}>{step.title}</h3>
                        <p className={`text-sm ${step.colorScheme.textLight}`}>Click to explore</p>
                      </div>
                    </div>
                    {expandedStep === index ? (
                      <ChevronUp className={step.colorScheme.textLight} />
                    ) : (
                      <ChevronDown className={step.colorScheme.textLight} />
                    )}
                  </button>

                  {expandedStep === index && (
                    <div className="px-6 pb-6 space-y-4">
                      <div className={`p-4 bg-white/50 rounded-lg border ${step.colorScheme.border}`}>
                        <p className={`text-sm font-semibold ${step.colorScheme.text} mb-2`}>The Lie:</p>
                        <p className={`italic ${step.colorScheme.textLight}`}>"{step.lie}"</p>
                      </div>

                      <div className={`p-4 bg-white/80 rounded-lg border-2 ${step.colorScheme.border}`}>
                        <p className={`text-sm font-semibold ${step.colorScheme.text} mb-2`}>The Truth:</p>
                        <p className={`font-semibold ${step.colorScheme.text}`}>"{step.truth}"</p>
                      </div>

                      <p className={step.colorScheme.textLight}>{step.content}</p>

                      <div className="pt-4">
                        <p className={`font-semibold ${step.colorScheme.text} mb-2`}>Reflection Prompt:</p>
                        <p className={`text-sm ${step.colorScheme.textLight} mb-3`}>{step.prompt}</p>
                        <Textarea
                          placeholder="Type your response here..."
                          value={responses[index] || ""}
                          onChange={(e) => handleResponseChange(index, e.target.value)}
                          className={`min-h-[100px] ${step.colorScheme.border} focus:${step.colorScheme.border}`}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Download Section */}
          <div className="mt-12 p-8 bg-gradient-to-r from-teal-500 to-amber-500 rounded-lg text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Get Your Personalized REWIRED Journey PDF</h3>
            <p className="mb-6">
              Complete the reflection prompts above, then enter your email to receive a personalized PDF 
              with your responses and additional resources.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white text-gray-900"
              />
              <Button
                onClick={handleDownloadPDF}
                disabled={isSubmitting}
                className="bg-white text-teal-600 hover:bg-gray-100"
              >
                <Download className="mr-2 h-4 w-4" />
                {isSubmitting ? "Sending..." : "Download PDF"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Matching Home Page */}
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
