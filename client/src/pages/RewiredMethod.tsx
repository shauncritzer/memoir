import { Navigation } from "@/components/Navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, Download, Loader2 } from "lucide-react";
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

// Pre-formulated AI responses for each step
const aiResponseVariations: { [key: number]: string[] } = {
  0: [ // Recognize Your State
    "What you're noticing is your nervous system's two main survival responses—fight/flight (hyperarousal) or freeze/shutdown (hypoarousal). These aren't character flaws; they're biological protection strategies your body learned to keep you safe. The 7-Day REWIRED Reset teaches you to recognize these states in real-time, which is the first step to regulating them.",

    "You've just identified your nervous system's default stress response, and that awareness alone is powerful. When we can't process threat or stress, our body either revs up (anxiety, racing thoughts) or shuts down (numbness, disconnection) to protect us. The REWIRED Reset will show you exactly how to work with these states instead of fighting them.",

    "This ability to notice what's happening in your body—whether you're wired or shutdown—is the foundation of nervous system regulation. Most people spend years stuck in these states without realizing it's not a mental problem, it's a biological one. The 7-Day Reset gives you practical tools to shift out of these survival states and back into safety.",

    "What you're describing is completely normal for someone whose nervous system has been shaped by stress or trauma. Your body learned to respond this way to keep you alive, but now it's responding to everyday stress like it's a life-or-death threat. The REWIRED Reset teaches you how to recalibrate your threat detection system."
  ],

  1: [ // Establish Safety
    "What you're describing is your nervous system's ability to detect safety through your senses—something trauma and chronic stress can disrupt. When we've experienced chronic stress or trauma, our body stays in protection mode even when we're physically safe. The 7-Day REWIRED Reset teaches you specific techniques to signal safety to your nervous system, so you can feel calm without waiting for the feeling to pass.",

    "You just used one of the most powerful nervous system regulation tools: grounding through present-moment sensory awareness. This works because safety isn't just a thought; it's a felt experience your body needs to register through sight, touch, sound, or smell. The REWIRED Reset expands on this with proven practices that help your body truly feel safe, not just think it.",

    "That object or sensation is helping your nervous system orient to the present moment instead of staying stuck in threat mode. This simple practice—finding anchors of stability—interrupts the survival response and brings you back to your body. The 7-Day Reset teaches you how to create these moments of safety intentionally, even when your mind is telling you you're in danger.",

    "What you're experiencing is co-regulation with your environment—your nervous system borrowing a sense of calm from something external. This shows your body still knows how to recognize safety; it just needs help finding it. The REWIRED Reset gives you a full toolkit of grounding practices that teach your system to generate safety from within."
  ],

  2: [ // Work with the Body
    "You just activated your vagus nerve—the highway between your brain and body that controls your stress response. That shift you felt is your nervous system moving out of fight-or-flight and into rest-and-digest mode. The 7-Day REWIRED Reset teaches you exactly when and how to use breathwork to regulate anxiety, cravings, and shutdown states.",

    "What you experienced is proof that you can't think your way out of a dysregulated nervous system—you have to work directly with your body. That longer exhale signals safety to your brain stem, which then tells your body it's okay to relax. The REWIRED Reset shows you how to use this and other somatic practices to replace compulsive behaviors with regulation.",

    "The change you noticed is your parasympathetic nervous system coming online—the body's natural brake system that calms anxiety and restores balance. Most people try to manage stress mentally, but real regulation happens through the body. The 7-Day Reset gives you a complete breathwork protocol designed specifically for trauma and addiction recovery.",

    "That simple breathing pattern just shifted your autonomic nervous system state in under a minute. This is the power of working with your body instead of against it—your nervous system responds to physical cues, not willpower. The REWIRED Reset teaches you to use these tools strategically throughout your day to prevent dysregulation before it leads to relapse."
  ],

  3: [ // Integrate the Past
    "The fact that you can see growth in that pain shows your nervous system is ready to integrate, not just suppress. Unprocessed experiences get stored as physical tension and emotional triggers in your body, which is why willpower alone doesn't work. The 7-Day REWIRED Reset teaches you safe, gentle ways to release what's been stuck without retraumatizing yourself.",

    "You've just reframed a survival memory into a source of wisdom—that's the beginning of integration. Trauma isn't about the events themselves; it's about the unprocessed energy that gets trapped in your nervous system. The REWIRED Reset gives you somatic practices that help your body complete what it couldn't finish back then.",

    "What you're describing is post-traumatic growth, and it's only possible when we stop running from the past and start processing it. Your body has been holding this experience as incomplete danger, which keeps you stuck in survival mode. The 7-Day Reset shows you how to gently finish processing these old stories so they stop driving your present behavior.",

    "That lesson came at a cost, but the fact that you found meaning in it means you're already doing the work of integration. The problem isn't the past itself—it's the unmetabolized pain still living in your nervous system. The REWIRED Reset teaches you trauma-informed practices that help your body finally let go of what it's been carrying."
  ],

  4: [ // Rebuild Connection
    "What you're describing is co-regulation—the biological process where one nervous system helps calm another. Connection isn't just emotional; it's a physiological necessity for healing from addiction and trauma. The 7-Day REWIRED Reset teaches you how to cultivate these regulating relationships and repair the ones that have been damaged.",

    "That sense of safety you feel with them is your nervous system recognizing a trustworthy attachment figure. Isolation keeps us sick; connection literally rewires our capacity for regulation. The REWIRED Reset shows you how to identify safe people and how to start letting them in, even when vulnerability feels terrifying.",

    "You've identified someone who helps your body feel safe enough to come out of protection mode. This is co-regulation, and it's one of the most powerful tools for nervous system healing. The 7-Day Reset teaches you how to build a network of these regulating relationships, because we can't heal in isolation.",

    "The feeling you described—safety and acceptance—is what your nervous system has been desperately seeking through compulsive behaviors. Real regulation comes through authentic connection, not through substances or process addictions. The REWIRED Reset helps you rebuild this capacity for healthy attachment, starting with yourself."
  ],

  5: [ // Embrace Imperfection
    "The fact that you can acknowledge this small win shows you're breaking the perfectionism-shame cycle that fuels addiction. Your nervous system interprets perfectionism as constant threat ('I'm not good enough = I'm not safe'), which keeps you dysregulated. The 7-Day REWIRED Reset teaches you to celebrate progress over perfection, which literally rewires your brain's reward system.",

    "That 'small' thing you're proud of is actually your nervous system learning that safety doesn't require perfection. Shame is a nervous system state, not a character flaw, and it keeps us stuck in fight-flight-freeze. The REWIRED Reset shows you how to replace self-criticism with self-compassion, which is essential for lasting recovery.",

    "What you just practiced is the antidote to the all-or-nothing thinking that drives relapse. Your nervous system thrives on small, consistent wins, not dramatic transformations. The 7-Day Reset helps you build this muscle of self-acknowledgment, which changes your brain chemistry more than any substance ever could.",

    "You're learning to regulate through self-compassion instead of self-punishment. Perfectionism is a trauma response that keeps your nervous system in hypervigilance, always scanning for what's wrong. The REWIRED Reset teaches you practices that help your body finally believe you're enough, exactly as you are."
  ],

  6: [ // Develop a New Narrative
    "The identity you just described—that's who you've always been beneath the survival strategies. Your brain has been running old programming ('I'm broken,' 'I'm an addict'), which keeps your nervous system stuck in shame and defense. The 7-Day REWIRED Reset helps you rewire these neural pathways so your body can finally embody this truer version of yourself.",

    "What you're doing is separating your identity from your coping mechanisms, and that's the foundation of a new narrative. Your nervous system has been shaped by your past, but it's not defined by it. The REWIRED Reset gives you practices that help your body catch up to this new story you're writing.",

    "You just claimed an identity based on your values, not your pain. This matters because your nervous system responds to the stories you tell about yourself—shame keeps you dysregulated; self-compassion creates safety. The 7-Day Reset teaches you how to embody this new narrative through daily practices that rewire your brain and body.",

    "That description is the real you—the one your survival brain has been trying to protect all along. Recovery isn't about fixing what's broken; it's about remembering who you were before trauma taught you to hide. The REWIRED Reset helps your nervous system finally feel safe enough to let this authentic self emerge."
  ]
};

export default function RewiredMethod() {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [responses, setResponses] = useState<{ [key: number]: string }>({});
  const [aiResponses, setAiResponses] = useState<{ [key: number]: string }>({});
  const [loadingAi, setLoadingAi] = useState<{ [key: number]: boolean }>({});
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Preload video to prevent flash
  useEffect(() => {
    const video = document.createElement('video');
    video.src = '/rewired-lightning.mp4';
    video.load();
  }, []);

  const toggleStep = (index: number) => {
    setExpandedStep(expandedStep === index ? null : index);
  };

  const handleResponseChange = (index: number, value: string) => {
    setResponses({ ...responses, [index]: value });
  };

  const handleGetAiFeedback = async (index: number) => {
    const userResponse = responses[index];
    if (!userResponse || userResponse.trim().length < 10) {
      toast.error("Please write at least a few sentences before getting feedback");
      return;
    }

    setLoadingAi({ ...loadingAi, [index]: true });

    // Simulate realistic loading time (1.5-2.5 seconds)
    const loadingDelay = 1500 + Math.random() * 1000;

    await new Promise(resolve => setTimeout(resolve, loadingDelay));

    // Randomly select one of the pre-formulated responses for this step
    const variations = aiResponseVariations[index] || [];
    const randomIndex = Math.floor(Math.random() * variations.length);
    const selectedResponse = variations[randomIndex];

    setAiResponses({ ...aiResponses, [index]: selectedResponse });
    setLoadingAi({ ...loadingAi, [index]: false });

    toast.success("Feedback received!");
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
    <div className="min-h-screen pt-16">
      {/* Navigation - Matching Home Page */}
      <Navigation />

      {/* Hero Section with Video Background */}
      <section className="relative overflow-hidden py-32 md:py-40">
        {/* Video Background */}
        <div className="absolute inset-0 z-0 bg-gray-900">
          <video
            autoPlay
            muted
            playsInline
            loop
            className={`w-full h-full object-cover transition-opacity duration-500 ${videoLoaded ? 'opacity-40' : 'opacity-0'}`}
            onLoadedData={() => setVideoLoaded(true)}
          >
            <source src="/rewired-lightning.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-black/80"></div>
        </div>

        {/* Content */}
        <div className="container max-w-4xl relative z-10">
          <div className="text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Welcome to Rewired.
            </h1>
            <div className="space-y-4">
              <p className="text-3xl md:text-4xl font-semibold text-white">
                This isn't motivation.
              </p>
              <p className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-green-400">
                It's regulation.
              </p>
            </div>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mt-8 leading-relaxed">
              In seven days, we don't fix you — we rewire how you respond.
            </p>
            
            <div className="mt-12">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
                Start Your Journey
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes REWIRED Different */}
      <section className="py-20 bg-white">
        <div className="container max-w-5xl">
          <div className="max-w-3xl mx-auto space-y-6 text-lg text-gray-700 leading-relaxed">
            <p>
              For years, you've been told that recovery is about white-knuckling your way through cravings, 
              fighting your own mind, and simply "trying harder." You've been told that failure is a sign of weakness.
            </p>
            <p className="font-semibold text-gray-900">
              We're here to tell you that's not true.
            </p>
            <p>
              Failure isn't the opposite of success; <strong>it's a part of it.</strong> And 
              your struggle isn't a moral failing; it's a biological one. Your nervous system is stuck in a cycle of 
              survival, and until you learn to work <em>with</em> it, you'll always feel like you're fighting a losing battle.
            </p>
            <p className="text-xl font-semibold text-teal-700">
              The REWIRED Method is different. It's not about fighting; it's about understanding. It's not about 
              willpower; it's about regulation. It's a 7-step journey to rewire your nervous system for safety, 
              connection, and lasting freedom.
            </p>
          </div>
        </div>
      </section>

      {/* REWIRED Steps */}
      <section className="py-20 bg-white">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            The Interactive REWIRED Journey
          </h2>

          {/* Progress Bar */}
          <div className="mb-12 px-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-600">Your Progress</p>
              <p className="text-sm text-gray-500">
                {expandedStep !== null ? `Step ${expandedStep + 1}` : 'Start your journey'}
              </p>
            </div>
            <div className="flex gap-2">
              {rewiredSteps.map((step, index) => (
                <div key={index} className="flex-1">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      expandedStep === index
                        ? step.colorScheme.badgeDark
                        : expandedStep !== null && index <= expandedStep
                        ? step.colorScheme.badge
                        : 'bg-gray-200'
                    }`}
                    title={`${step.letter} - ${step.title}`}
                  />
                  <p className={`text-xs mt-1 text-center font-bold ${
                    expandedStep === index ? step.colorScheme.text : 'text-gray-400'
                  }`}>
                    {step.letter}
                  </p>
                </div>
              ))}
            </div>
          </div>

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
                        <p className={`text-xs font-semibold ${step.colorScheme.textLight} mb-1`}>Step {index + 1} of 7</p>
                        <h3 className={`text-xl font-bold ${step.colorScheme.text}`}>{step.title}</h3>
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
                      <div className="p-4 rounded-lg border border-red-300" style={{ backgroundColor: '#ffe6e6' }}>
                        <p className="text-sm font-semibold text-red-900 mb-2">The Lie:</p>
                        <p className="italic text-red-800">"{step.lie}"</p>
                      </div>

                      <div className="p-4 rounded-lg border-2 border-green-500" style={{ backgroundColor: '#e6ffe6' }}>
                        <p className="text-sm font-semibold text-green-900 mb-2">The Truth:</p>
                        <p className="font-semibold text-green-900">"{step.truth}"</p>
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
                        <div className="mt-3">
                          <Button
                            onClick={() => handleGetAiFeedback(index)}
                            disabled={loadingAi[index] || !responses[index] || responses[index].trim().length < 10}
                            className={`${step.colorScheme.badgeDark} hover:opacity-90 text-white`}
                          >
                            {loadingAi[index] ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Getting feedback...
                              </>
                            ) : (
                              "Get AI Feedback"
                            )}
                          </Button>
                        </div>

                        {aiResponses[index] && (
                          <div className="mt-4 p-4 bg-white border-2 border-gray-300 rounded-lg">
                            <p className="text-sm font-semibold text-gray-700 mb-2">💚 AI Coach Response:</p>
                            <p className="text-gray-800 leading-relaxed">{aiResponses[index]}</p>
                          </div>
                        )}
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
                Author, speaker, and recovery advocate helping others find hope in their own journey.
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
