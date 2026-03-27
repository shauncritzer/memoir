import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, PlayCircle, Check, ArrowRight, Loader2, BookOpen, Heart, Brain, Users, Shield, Sparkles, Star, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

// Sales Page Component (for non-purchasers)
function SalesPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [isLoading, setIsLoading] = useState(false);

  const createCheckoutSession = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data: { url: string; sessionId: string }) => {
      window.location.href = data.url;
    },
    onError: (error: { message: string }) => {
      console.error("Checkout error:", error);
      setIsLoading(false);
    },
  });

  const handleEnroll = () => {
    setIsLoading(true);
    const priceId = import.meta.env.VITE_STRIPE_PRICE_RECOVERY_ROADMAP || "price_1T83EwC2dOpPzSOOockMjc5R";
    createCheckoutSession.mutate({ priceId });
  };

  const enrollButton = (text: string, size: "lg" | "default" = "lg") => (
    <Button
      size={size}
      className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg px-8 py-6"
      onClick={handleEnroll}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          {text}
          <ArrowRight className="ml-2 h-5 w-5" />
        </>
      )}
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-900 via-gray-900 to-black py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-teal-400 font-semibold mb-4 tracking-wide uppercase">30-Day Deep Healing Journey</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
            Sobriety Got You Here.{" "}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent">
              Healing Will Take You Further.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
            A 30-day trauma healing journey with daily lessons, guided practices, and neuroscience-backed
            tools for lasting recovery. Go beyond sobriety — heal the wounds that made you need to escape.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {enrollButton("Enroll Now — $97")}
            <p className="text-gray-400 text-sm">Lifetime access. 30-day guarantee.</p>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white text-center">
            You Got Sober. So Why Do You Still Feel Broken?
          </h2>
          <div className="space-y-6 text-lg text-gray-300 leading-relaxed">
            <p>
              You did the hardest thing. You put down the bottle, the pills, the behavior.
              You showed up to meetings. You counted the days.
            </p>
            <p>
              But the anxiety is still there. The shame. The rage that comes out of nowhere.
              The relationships that still feel impossible.
            </p>
            <p>
              You're sober — but you don't feel <em>healed</em>.
            </p>
            <p className="text-xl font-semibold text-teal-400 mt-8">
              That's because sobriety and recovery are not the same thing.
            </p>
            <p>
              Sobriety removes the substance. Recovery heals the wound underneath it.
            </p>
            <p>
              The childhood trauma. The shame you've carried since you were eight. The inner child
              who still believes they're unlovable.
            </p>
            <p className="text-xl font-semibold text-white">
              This course goes to the root.
            </p>
          </div>
        </div>
      </section>

      {/* Who's Teaching Section */}
      <section className="py-16 bg-black">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white text-center">
            Created by Someone Who's Done the Work
          </h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <img
                src="/pro-creator-portrait (29).png"
                alt="Shaun Critzer"
                className="rounded-lg shadow-2xl w-full"
              />
            </div>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                I'm <span className="text-teal-400 font-semibold">Shaun Critzer</span>.
                13 years in active addiction. 13 years in recovery. Author of
                <em> Crooked Lines: Bent, Not Broken</em>.
              </p>
              <p>
                I didn't just get sober — I did the deep work. Inner child healing.
                Trauma processing. Shame work. Nervous system regulation. Rebuilding
                every relationship I destroyed.
              </p>
              <p>
                This course is everything I learned in 13 years of recovery, distilled
                into 30 days of guided healing. Not theory from a textbook — lived experience
                backed by neuroscience.
              </p>
              <p className="text-white font-semibold">
                I built this for the person who's sober but still hurting. That was me.
                Maybe that's you too.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-16 bg-gradient-to-br from-teal-900/50 to-gray-900">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white text-center">
            What's Inside the 30-Day Journey
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            8 deep modules delivered over 30 days — teachings, exercises, reflections, and
            practices designed to heal from the inside out.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="bg-gray-800 border-teal-600/30">
              <CardHeader>
                <CardTitle className="text-teal-400 flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  30 Daily Lessons
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-2">
                <p>Deep teachings on trauma, the nervous system, shame, inner child work, relationships, meaning, and more</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-teal-600/30">
              <CardHeader>
                <CardTitle className="text-teal-400 flex items-center gap-2">
                  <PlayCircle className="h-6 w-6" />
                  Video Teachings
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-2">
                <p>Shaun walks you through each module with personal stories, science, and practical guidance</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-teal-600/30">
              <CardHeader>
                <CardTitle className="text-teal-400 flex items-center gap-2">
                  <Download className="h-6 w-6" />
                  Guided Exercises & Workbooks
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-2">
                <p>Hands-on exercises for each module: trauma timeline, inner child letters, shame inventory, forgiveness work, and more</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-teal-600/30">
              <CardHeader>
                <CardTitle className="text-teal-400 flex items-center gap-2">
                  <Brain className="h-6 w-6" />
                  Neuroscience Deep Dives
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-2">
                <p>Understand WHY each practice works — nervous system states, somatic healing, EMDR-inspired techniques, polyvagal theory</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-teal-600/30">
              <CardHeader>
                <CardTitle className="text-teal-400 flex items-center gap-2">
                  <Heart className="h-6 w-6" />
                  Inner Child & Somatic Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-2">
                <p>Guided visualizations, breathwork, bilateral stimulation, reparenting exercises, and body-based healing</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-teal-600/30">
              <CardHeader>
                <CardTitle className="text-teal-400 flex items-center gap-2">
                  <Star className="h-6 w-6" />
                  Lifetime Access
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-2">
                <p>Go at your own pace. Revisit any module. This isn't a one-time thing — it's a resource you'll come back to</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-2xl text-gray-400 mb-2">Total Value: <span className="line-through">$497</span></p>
            <p className="text-4xl font-bold text-teal-400 mb-8">
              Your Investment: $97 <span className="text-xl text-gray-400">(One-Time Payment)</span>
            </p>
            {enrollButton("Start Your 30-Day Healing Journey — $97")}
          </div>
        </div>
      </section>

      {/* Module Breakdown */}
      <section className="py-16 bg-black">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-white text-center">
            The 8-Module Journey
          </h2>

          <div className="space-y-8">
            {[
              {
                module: 1,
                days: "Days 1-4",
                title: "The Foundation — Understanding Your Story",
                icon: BookOpen,
                description: "Map your addiction timeline. Understand the trauma-addiction connection. Identify your core wound. Begin to see how your past created your patterns.",
              },
              {
                module: 2,
                days: "Days 5-8",
                title: "The Body Keeps the Score — Somatic Healing",
                icon: Brain,
                description: "Learn your nervous system's three states. Practice grounding techniques: 5-4-3-2-1, box breathing, bilateral stimulation. Build your somatic toolkit.",
              },
              {
                module: 3,
                days: "Days 9-12",
                title: "The Inner Child — Healing Childhood Wounds",
                icon: Heart,
                description: "Meet your inner child through guided visualization. Write a letter to your younger self. Learn reparenting — giving yourself what you didn't receive.",
              },
              {
                module: 4,
                days: "Days 13-16",
                title: "Shame and Self-Forgiveness",
                icon: Shield,
                description: "Distinguish shame from guilt. Complete your shame inventory. Practice self-compassion reframing. Write a forgiveness letter to yourself.",
              },
              {
                module: 5,
                days: "Days 17-20",
                title: "Rebuilding Relationships and Trust",
                icon: Users,
                description: "Take a relationship inventory. Plan meaningful amends. Learn to build new, healthy relationships. Understand that trust is earned through consistent behavior.",
              },
              {
                module: 6,
                days: "Days 21-24",
                title: "Finding Meaning and Purpose",
                icon: Sparkles,
                description: "Clarify your values. Discover your strengths. Write your purpose statement. Build a life so good you don't want to escape from it.",
              },
              {
                module: 7,
                days: "Days 25-28",
                title: "Spiritual Awakening and Connection",
                icon: Star,
                description: "Explore spirituality without dogma. Practice surrender and trust. Find connection to something greater than yourself — whatever that means to you.",
              },
              {
                module: 8,
                days: "Days 29-30",
                title: "Thriving in Long-Term Recovery",
                icon: CheckCircle2,
                description: "Build your recovery maintenance plan. Create your relapse prevention strategy. Write your vision for the future. Step into the life you deserve.",
              },
            ].map((mod) => (
              <div key={mod.module} className="border-l-4 border-teal-500 pl-6">
                <div className="flex items-center gap-3 mb-2">
                  <mod.icon className="h-5 w-5 text-teal-400" />
                  <span className="text-sm text-teal-400 font-semibold">{mod.days}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Module {mod.module}: {mod.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">{mod.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white text-center">
            This Course Is For You If...
          </h2>
          <div className="space-y-4">
            {[
              "You've achieved sobriety but still feel broken inside",
              "You're tired of white-knuckling through recovery",
              "You want to understand WHY you became addicted — not just stop the behavior",
              "You're ready to do the deep work of healing childhood trauma",
              "You want practical tools, not just inspirational platitudes",
              "You want to build a life worth staying sober for",
              "You've done the 7-Day Reset and you're ready to go deeper",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="h-6 w-6 text-teal-400 flex-shrink-0 mt-0.5" />
                <p className="text-lg text-gray-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-black">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-white text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-teal-400 mb-3">
                How is this different from the 7-Day Reset?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                The 7-Day Reset is a foundation — it teaches nervous system regulation and gets you started.
                "From Broken to Whole" goes much deeper: childhood trauma, inner child healing, shame processing,
                relationship repair, finding purpose. It's the difference between first aid and deep surgery.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-teal-400 mb-3">
                Do I need to be sober to take this course?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                This course is designed for people in recovery, but you don't need a specific amount of sobriety time.
                If you're committed to healing, you're ready. The work we do here will actually strengthen your sobriety.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-teal-400 mb-3">
                How much time does this take per day?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Plan for 20-30 minutes per day. Some modules have deeper exercises that may take longer,
                but you can always spread the work across multiple sessions. Go at your own pace —
                there's no timer.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-teal-400 mb-3">
                Will this replace therapy?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                No — and it's not meant to. This course complements therapy beautifully. Many people
                use it alongside their therapeutic work. If you're dealing with severe trauma, we
                encourage professional support. This course gives you tools and framework; a therapist
                gives you personalized guidance.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-teal-400 mb-3">
                What if I need help during the course?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                You can use our <a href="/ai-coach" className="text-teal-400 hover:underline">AI Recovery Coach</a> for
                24/7 support, and Shaun is accessible through the community. You're not doing this alone.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-teal-400 mb-3">
                What if it doesn't work for me?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                We offer a full 30-day money-back guarantee. If you complete the course and don't feel
                a meaningful shift, email us for a full refund. No questions asked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-16 bg-teal-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            30-Day Money-Back Guarantee
          </h2>
          <p className="text-xl text-gray-300 leading-relaxed mb-8">
            Complete the course. Do the exercises. If you don't experience a meaningful
            shift in how you relate to your trauma and your recovery, email us for a full
            refund. We believe in this work — and we believe in you.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-black via-gray-900 to-teal-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Ready to Go From Broken to Whole?
          </h2>
          <p className="text-xl text-gray-300 mb-4">
            You got sober. That was the hardest part.
          </p>
          <p className="text-2xl font-semibold text-teal-400 mb-8">
            Now it's time to heal.
          </p>
          <Button
            size="lg"
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xl px-16 py-8 mb-6"
            onClick={handleEnroll}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading...
              </>
            ) : (
              "Enroll Now — $97"
            )}
          </Button>
          <p className="text-gray-400 mb-2">Lifetime access. 30-day guarantee. Your pace.</p>
          <p className="text-xl text-white italic">
            From broken to whole. One day at a time.<br />
            — Shaun
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Course Member Area Component (for purchasers)
function CourseMemberArea() {
  const { user } = useAuth();
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

  // Get course progress (modules + lessons + completion)
  const { data: courseData, isLoading: courseLoading } = trpc.members.getCourseProgress.useQuery(
    { productId: "from-broken-to-whole" },
    { enabled: !!user }
  );

  // Mark lesson complete mutation
  const trpcUtils = trpc.useUtils();
  const markComplete = trpc.members.markLessonComplete.useMutation({
    onSuccess: () => {
      trpcUtils.members.getCourseProgress.invalidate();
    },
  });

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-16 text-center">
          <p>Loading your course...</p>
        </div>
      </div>
    );
  }

  const modules = courseData?.modules || [];
  const overallProgress = courseData?.progress || 0;
  const totalLessons = courseData?.totalLessons || 0;
  const completedLessons = courseData?.completedLessons || 0;

  // Auto-select first module and first lesson
  const activeModule = selectedModuleId
    ? modules.find(m => m.id === selectedModuleId)
    : modules[0];
  const activeLesson = selectedLessonId
    ? activeModule?.lessons.find(l => l.id === selectedLessonId)
    : activeModule?.lessons[0];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container pt-20 pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">From Broken to Whole</h1>
          <p className="text-muted-foreground">
            Progress: {completedLessons} of {totalLessons} lessons complete ({overallProgress}%)
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-teal-600 h-2 rounded-full transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Modules & Lessons sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {modules.map((mod) => {
              const modCompleted = mod.lessons.filter(l => l.completed).length;
              const isActive = activeModule?.id === mod.id;
              return (
                <Card key={mod.id} className={isActive ? "border-teal-500" : ""}>
                  <button
                    onClick={() => {
                      setSelectedModuleId(mod.id);
                      setSelectedLessonId(mod.lessons[0]?.id || null);
                    }}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-teal-600 font-semibold">Module {mod.moduleNumber}</span>
                      <span className="text-xs text-muted-foreground">{modCompleted}/{mod.lessons.length}</span>
                    </div>
                    <h3 className="font-semibold text-sm">{mod.title}</h3>
                  </button>
                  {isActive && (
                    <div className="px-4 pb-4 space-y-1">
                      {mod.lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedLessonId(lesson.id)}
                          className={`w-full text-left p-2 rounded text-sm flex items-center gap-2 ${
                            activeLesson?.id === lesson.id ? "bg-teal-50 text-teal-800" : "hover:bg-gray-50"
                          }`}
                        >
                          {lesson.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
                          ) : (
                            <div className="h-4 w-4 border border-gray-300 rounded-full flex-shrink-0" />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Main Content Area (Right Column) */}
          <div className="lg:col-span-2 space-y-6">
            {activeLesson && (
              <>
                {/* Lesson Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-teal-600 mb-2">
                      <Clock className="h-4 w-4" />
                      Module {activeModule?.moduleNumber} — {activeModule?.title}
                    </div>
                    <CardTitle className="text-2xl">{activeLesson.title}</CardTitle>
                    {activeLesson.description && (
                      <p className="text-muted-foreground">{activeLesson.description}</p>
                    )}
                  </CardHeader>
                </Card>

                {/* Video Player */}
                {activeLesson.videoUrl && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PlayCircle className="h-5 w-5" />
                        Video Lesson
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        {activeLesson.videoUrl.includes("vimeo.com") ? (
                          <iframe
                            src={activeLesson.videoUrl.replace("vimeo.com/", "player.vimeo.com/video/")}
                            className="w-full h-full"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            src={activeLesson.videoUrl}
                            poster={activeLesson.posterUrl || undefined}
                            controls
                            className="w-full h-full"
                            controlsList="nodownload"
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Downloadable Resources */}
                {(activeLesson.workbookPdfUrl || activeLesson.slidePdfUrl) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-teal-700">
                        <Download className="h-5 w-5" />
                        Downloadable Resources
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {activeLesson.slidePdfUrl && (
                        <Button variant="outline" className="w-full justify-start" asChild>
                          <a href={activeLesson.slidePdfUrl} download target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            Download Slideshow (PDF)
                          </a>
                        </Button>
                      )}
                      {activeLesson.workbookPdfUrl && (
                        <Button variant="outline" className="w-full justify-start" asChild>
                          <a href={activeLesson.workbookPdfUrl} download target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            Download Workbook (PDF)
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Mark Complete */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                      <div>
                        <h3 className="font-semibold mb-1">Completed this lesson?</h3>
                        <p className="text-sm text-muted-foreground">
                          Mark it complete to track your progress
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          if (activeLesson) {
                            markComplete.mutate({
                              lessonId: activeLesson.id,
                              productId: "from-broken-to-whole",
                            });
                          }
                        }}
                        disabled={activeLesson.completed}
                        className={activeLesson.completed ? "bg-teal-600" : ""}
                      >
                        {activeLesson.completed ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Completed
                          </>
                        ) : (
                          "Mark Complete"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Component with Conditional Rendering
export default function FromBrokenToWhole() {
  const { user } = useAuth();

  // Check if user has access to the course
  const { data: hasAccess, isLoading: accessLoading } = trpc.members.checkCourseAccess.useQuery(
    { productId: "from-broken-to-whole" },
    { enabled: !!user }
  );

  // Show loading state
  if (user && accessLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-16 text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show sales page if not logged in or no access
  if (!user || !hasAccess) {
    return <SalesPage isLoggedIn={!!user} />;
  }

  // Show course content if user has purchased
  return <CourseMemberArea />;
}
