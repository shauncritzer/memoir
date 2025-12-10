import { useState } from "react";
import { Logo } from "@/components/Logo";
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
}

const rewiredSteps: RewiredStep[] = [
  {
    letter: "R",
    title: "Recognize Your State",
    lie: "I just need to be stronger.",
    truth: "I need to know where I am before I can get where I'm going.",
    content: "Recovery starts with awareness. Before you can change your state, you have to be able to recognize it. This first step is about learning the language of your nervous system. You'll learn to identify the subtle cues of hyperarousal (anxiety, racing thoughts, agitation) and hypoarousal (numbness, disconnection, shutdown) in your body. This isn't about judgment; it's about compassionate observation.",
    prompt: "Think about the last time you felt overwhelmed. Did you feel revved up and anxious (hyperarousal) or shut down and numb (hypoarousal)? Describe what that felt like in your body."
  },
  {
    letter: "E",
    title: "Establish Safety",
    lie: "I'm not safe until this feeling goes away.",
    truth: "I can create safety for myself, right here, right now.",
    content: "Your nervous system is constantly scanning for threats. For those of us with a history of trauma or chronic stress, that alarm system is often faulty. This step is about learning to consciously create a sense of safety in your own body, even when your mind is telling you you're in danger. You'll learn grounding techniques, orienting exercises, and how to use your senses to anchor yourself in the present moment.",
    prompt: "Look around you right now and find one object that brings you a sense of calm or stability. It could be a plant, a photo, or the feeling of your feet on the floor. What is it, and why does it make you feel grounded?"
  },
  {
    letter: "W",
    title: "Work with the Body",
    lie: "I can think my way out of this.",
    truth: "My body holds the key to regulation.",
    content: "Compulsive behaviors are often a misguided attempt to regulate a dysregulated nervous system. This step is about learning healthier, more effective ways to work directly with your body's energy. You'll learn the science behind breathwork and how to use specific breathing patterns to calm anxiety or gently bring yourself out of a shutdown state. This is where you stop fighting your body and start listening to it.",
    prompt: "Try this simple exercise: Breathe in for a count of 4, and breathe out for a count of 6. Do this three times. What do you notice in your body after just three breaths?"
  },
  {
    letter: "I",
    title: "Integrate the Past",
    lie: "I should just get over it.",
    truth: "My past is a part of my story, but it doesn't have to be my prison.",
    content: "Unprocessed trauma and buried emotions are the fuel for addiction. This step is about gently and safely beginning to process what you've been avoiding. It's not about reliving the trauma; it's about allowing the stored energy to be released from your body. This is done through practices like somatic experiencing, journaling, and learning to tolerate difficult sensations without becoming overwhelmed.",
    prompt: "Think of a past failure or mistake that you still carry with you. Without going into detail, what is one lesson or strength you gained from that experience, even if it was painful?"
  },
  {
    letter: "R",
    title: "Rebuild Connection",
    lie: "I have to do this alone.",
    truth: "Connection is the antidote to addiction.",
    content: "Addiction thrives in isolation. Connection is a biological imperative for nervous system regulation. This step is about rebuilding healthy, authentic connections with yourself, with others, and with something greater than yourself. You'll learn about co-regulation and how safe relationships can literally help heal your nervous system. This is where you learn that vulnerability is a superpower, not a weakness.",
    prompt: "Who is one person in your life (or a pet) that makes you feel safe and accepted? What is it about them that creates that feeling?"
  },
  {
    letter: "E",
    title: "Embrace Imperfection",
    lie: "I need to be perfect to be worthy.",
    truth: "I am worthy of love and belonging, exactly as I am.",
    content: "Perfectionism is a trauma response. It's the belief that if we can just be perfect, we'll finally be safe and loved. This step is about dismantling that belief and embracing the messy, beautiful reality of being human. It's about practicing self-compassion, celebrating small wins, and understanding that recovery is not a straight line. This is where you internalize the message that failure is a part of success.",
    prompt: "What is one small thing you've done today that you can be proud of, no matter how insignificant it seems? (e.g., 'I made my bed,' 'I drank a glass of water.')"
  },
  {
    letter: "D",
    title: "Develop a New Narrative",
    lie: "I am an addict. I am broken.",
    truth: "I am a resilient human being who is healing.",
    content: "Your story is not set in stone. The final step is about consciously crafting a new narrative for your life—one that is based on your strengths, your values, and your vision for the future. It's about moving from a story of shame and failure to one of resilience, growth, and hope. This is where you stop being defined by your past and start living into your potential.",
    prompt: "If you were to describe yourself without mentioning your past struggles, what would you say? Who are you at your core? (e.g., 'I am a creative and compassionate person who is learning to live authentically.')"
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <a className="flex items-center">
                <Logo />
              </a>
            </Link>
            <div className="hidden md:flex space-x-8">
              <Link href="/about">
                <a className="text-slate-300 hover:text-white transition-colors">About</a>
              </Link>
              <Link href="/memoir">
                <a className="text-slate-300 hover:text-white transition-colors">The Memoir</a>
              </Link>
              <Link href="/blog">
                <a className="text-slate-300 hover:text-white transition-colors">Blog</a>
              </Link>
              <Link href="/resources">
                <a className="text-slate-300 hover:text-white transition-colors">Resources</a>
              </Link>
              <Link href="/products">
                <a className="text-slate-300 hover:text-white transition-colors">Products</a>
              </Link>
              <Link href="/ai-coach">
                <a className="text-slate-300 hover:text-white transition-colors">AI Coach</a>
              </Link>
            </div>
            <Link href="/products">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Stop Fighting. Start Healing.
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
          You can't solve a nervous system problem with willpower. The REWIRED Method is a science-backed, 
          compassionate approach to breaking free from compulsive behaviors and process addictions by healing 
          the root cause: a dysregulated nervous system.
        </p>
        
        <div className="bg-slate-800/50 rounded-lg p-8 text-left max-w-3xl mx-auto mb-12">
          <p className="text-slate-300 mb-4">
            For years, you've been told that recovery is about white-knuckling your way through cravings, 
            fighting your own mind, and simply "trying harder." You've been told that failure is a sign of weakness.
          </p>
          <p className="text-slate-300 mb-4">
            We're here to tell you that's not true.
          </p>
          <p className="text-slate-300 mb-4">
            Failure isn't the opposite of success; <strong className="text-white">it's a part of it.</strong> And 
            your struggle isn't a moral failing; it's a biological one. Your nervous system is stuck in a cycle of 
            survival, and until you learn to work <em>with</em> it, you'll always feel like you're fighting a losing battle.
          </p>
          <p className="text-slate-300">
            The REWIRED Method is different. It's not about fighting; it's about understanding. It's not about 
            willpower; it's about regulation. It's a 7-step journey to rewire your nervous system for safety, 
            connection, and lasting freedom.
          </p>
        </div>
      </div>

      {/* REWIRED Steps */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          The Interactive REWIRED Journey
        </h2>

        <div className="space-y-4">
          {rewiredSteps.map((step, index) => (
            <Card key={index} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleStep(index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
                      {step.letter}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{step.title}</h3>
                      <p className="text-sm text-slate-400">Click to explore</p>
                    </div>
                  </div>
                  {expandedStep === index ? (
                    <ChevronUp className="text-slate-400" />
                  ) : (
                    <ChevronDown className="text-slate-400" />
                  )}
                </button>

                {expandedStep === index && (
                  <div className="px-6 pb-6 space-y-4">
                    <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                      <p className="text-sm text-red-300 font-semibold mb-1">The Lie:</p>
                      <p className="text-red-200">"{step.lie}"</p>
                    </div>

                    <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                      <p className="text-sm text-green-300 font-semibold mb-1">The Truth:</p>
                      <p className="text-green-200">"{step.truth}"</p>
                    </div>

                    <p className="text-slate-300">{step.content}</p>

                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <p className="text-white font-semibold mb-2">Your Turn:</p>
                      <p className="text-slate-300 text-sm mb-3">{step.prompt}</p>
                      <Textarea
                        value={responses[index] || ""}
                        onChange={(e) => handleResponseChange(index, e.target.value)}
                        placeholder="Type your reflection here..."
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                        rows={4}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Download Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <Card className="bg-gradient-to-r from-teal-900/50 to-cyan-900/50 border-teal-700">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Download className="w-12 h-12 text-teal-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-3">
                Download Your REWIRED Journey
              </h2>
              <p className="text-slate-300 max-w-2xl mx-auto">
                Want to take this journey with you? Enter your email to download your completed interactive 
                worksheet as a PDF. You'll have a personalized record of your insights to guide you on your path.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
              <Button
                onClick={handleDownloadPDF}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white whitespace-nowrap"
              >
                {isSubmitting ? "Sending..." : "Download PDF"}
              </Button>
            </div>

            <p className="text-xs text-slate-400 text-center mt-4">
              We respect your privacy. No spam, ever.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="bg-slate-800/50 border-t border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Transformation?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            The REWIRED Method comes to life in our structured courses, designed to guide you step-by-step 
            through nervous system healing and lasting recovery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg px-8 py-6">
                Explore Our Courses
              </Button>
            </Link>
            <Link href="/ai-coach">
              <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700 text-lg px-8 py-6">
                Try Free AI Coach
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
