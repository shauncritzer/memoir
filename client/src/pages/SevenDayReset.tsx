import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, Lock, PlayCircle, Check, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

// Sales Page Component (for non-purchasers)
function SalesPage({ isLoggedIn }: { isLoggedIn: boolean }) {
  const stripeCheckoutUrl = "https://buy.stripe.com/test_28E3cugPn5ll9sF5V91ZS00";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1E3A5F] via-gray-900 to-black py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
            Your Nervous System Is Running the Show.{" "}
            <span className="bg-gradient-to-r from-[#D4AF37] to-amber-300 bg-clip-text text-transparent">
              It's Time to Take Control.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Stop relying on willpower. Start rewiring your biology. Break free from compulsive 
            patterns in 7 days through nervous system regulation—not moral failure lectures.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-[#D4AF37] hover:bg-[#B8941F] text-black font-bold text-lg px-8 py-6"
              asChild
            >
              <a href={stripeCheckoutUrl}>
                Enroll Now - $47 (Early Bird)
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <p className="text-gray-400 text-sm">Regular price: $67</p>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white text-center">
            Sound Familiar?
          </h2>
          <div className="space-y-6 text-lg text-gray-300 leading-relaxed">
            <p>
              You've tried willpower. You've tried "just saying no." You've beaten yourself up 
              and promised "never again."
            </p>
            <p>
              And it worked... for a day. Maybe a week.
            </p>
            <p>
              Then the stress hit. The loneliness crept in. The trigger showed up.
            </p>
            <p>
              And you were back to square one.
            </p>
            <p className="text-xl font-semibold text-[#D4AF37] mt-8">
              Here's the truth they don't tell you:
            </p>
            <p>
              It's not about willpower. It's not about being "strong enough."
            </p>
            <p>
              Your nervous system is dysregulated. Your body is stuck in survival mode. And no 
              amount of self-discipline can override a nervous system that's trying to keep you alive.
            </p>
            <p className="text-xl font-semibold text-white">
              This isn't a you problem. It's a biology problem.
            </p>
            <p className="text-xl font-semibold text-[#D4AF37]">
              And biology can be rewired.
            </p>
          </div>
        </div>
      </section>

      {/* Who's Teaching Section */}
      <section className="py-16 bg-black">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white text-center">
            Who's Teaching This?
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
                I'm <span className="text-[#D4AF37] font-semibold">Shaun Critzer</span>. 
                Former Mr. Teen USA (1998). 13 years into recovery. Father of three. Co-CEO of Digital Gravity.
              </p>
              <p>
                I'm not a guru who read a book about addiction. I spent 13 years in active addiction 
                and another 13 years learning how to actually heal—not just white-knuckle my way through sobriety.
              </p>
              <p>
                Most recovery programs focus on willpower and moral failure. I focus on nervous system 
                regulation—the actual biological mechanism that drives compulsive behavior.
              </p>
              <p className="text-white font-semibold">
                This course is everything I wish someone had taught me on Day 1.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-16 bg-gradient-to-br from-[#1E3A5F] to-gray-900">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-white text-center">
            The 7-Day REWIRED Reset
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="bg-gray-800 border-[#D4AF37]">
              <CardHeader>
                <CardTitle className="text-[#D4AF37] flex items-center gap-2">
                  <PlayCircle className="h-6 w-6" />
                  7 Video Lessons
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-2">
                <p>→ Watch Shaun guide you through each step of the REWIRED framework</p>
                <p>→ Real talk from someone who's walked this path</p>
                <p>→ Nervous system science made simple and actionable</p>
                <p className="text-sm text-gray-400">(5-10 minutes each)</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-[#D4AF37]">
              <CardHeader>
                <CardTitle className="text-[#D4AF37] flex items-center gap-2">
                  <Download className="h-6 w-6" />
                  7 Interactive Workbooks
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-2">
                <p>→ Daily exercises to integrate what you're learning</p>
                <p>→ Reflection prompts that create real breakthroughs</p>
                <p>→ 15-20 lines of writing space per exercise</p>
                <p>→ Progress tracking to see how far you've come</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-[#D4AF37]">
              <CardHeader>
                <CardTitle className="text-[#D4AF37] flex items-center gap-2">
                  <Download className="h-6 w-6" />
                  7 PDF Slide Decks
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-2">
                <p>→ Follow along with key concepts</p>
                <p>→ Visual learning for better retention</p>
                <p>→ Reference material you can revisit anytime</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-[#D4AF37]">
              <CardHeader>
                <CardTitle className="text-[#D4AF37] flex items-center gap-2">
                  <Check className="h-6 w-6" />
                  BONUS: 50 Ways to Thrive
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-2">
                <p>→ Proven strategies for staying strong in recovery</p>
                <p>→ Practical tools for the hard days</p>
                <p>→ Lifetime access to support resources</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-2xl text-gray-400 mb-2">Total Value: <span className="line-through">$297</span></p>
            <p className="text-4xl font-bold text-[#D4AF37] mb-8">
              Your Investment Today: $47 <span className="text-xl text-gray-400">(Early Bird)</span>
            </p>
            <Button 
              size="lg" 
              className="bg-[#D4AF37] hover:bg-[#B8941F] text-black font-bold text-lg px-12 py-6"
              asChild
            >
              <a href={stripeCheckoutUrl}>
                Enroll in the 7-Day REWIRED Reset
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Framework Breakdown */}
      <section className="py-16 bg-black">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-white text-center">
            What You'll Learn
          </h2>
          
          <div className="space-y-8">
            {[
              {
                day: 1,
                title: "RECOGNIZE - Understanding Your Patterns",
                description: "Learn to identify triggers without judgment. See the programming that's been running your life. Create space between stimulus and response."
              },
              {
                day: 2,
                title: "ESTABLISH - Safety & Connection",
                description: "Build your sanctuary. Identify safe people and unsafe people. Learn why isolation feeds addiction and connection heals it."
              },
              {
                day: 3,
                title: "WORK - Turning Toward Your Triggers",
                description: "Stop fighting feelings. Learn the RAIN practice for working with difficult emotions. Discover what your triggers are trying to teach you."
              },
              {
                day: 4,
                title: "INTEGRATE - Building Sustainable Routines",
                description: "Create structure that supports your nervous system. Learn the 1% Rule. Design morning and evening routines that ground you."
              },
              {
                day: 5,
                title: "RELEASE - Letting Go of Shame",
                description: "Fire the inner drill sergeant. Practice self-compassion. Release the toxic stories you've been carrying for years."
              },
              {
                day: 6,
                title: "EMBRACE - Your New Identity",
                description: "Become who you're meant to be. Write your \"I am\" statements. Choose courage over comfort."
              },
              {
                day: 7,
                title: "DISCOVER - Your Purpose & Path Forward",
                description: "Define what you're staying sober FOR. Build a vision worth fighting for. Create your path to a life of meaning and purpose."
              }
            ].map((lesson) => (
              <div key={lesson.day} className="border-l-4 border-[#D4AF37] pl-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  Day {lesson.day}: {lesson.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">{lesson.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-white text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-[#D4AF37] mb-3">
                Is this a 12-step program?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                No. This is a nervous system regulation program based on neuroscience and 
                trauma-informed recovery. You don't need to believe in a higher power. You just need to show up.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#D4AF37] mb-3">
                Will this work for my specific compulsive behavior?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Yes. Whether it's substances, pornography, gambling, food, work, or relationships—the 
                underlying mechanism is the same: a dysregulated nervous system seeking relief. This program 
                addresses the root cause.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#D4AF37] mb-3">
                What if I relapse during the 7 days?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                That's why there's a workbook. Recovery isn't linear. This program teaches you how to work 
                with setbacks, not beat yourself up over them.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#D4AF37] mb-3">
                How much time does this take per day?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                15-20 minutes. One video (5-10 min) + workbook exercises (10-15 min). You can do it during 
                your morning coffee or before bed.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#D4AF37] mb-3">
                Is this just for people with addiction?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                No. This is for anyone with compulsive patterns they want to change. Stress eating. Doom 
                scrolling. Overworking. Codependency. If you're repeating behaviors you don't want to repeat, 
                this is for you.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#D4AF37] mb-3">
                What if I need more support after 7 days?
              </h3>
              <p className="text-gray-300 leading-relaxed">
                This program is the foundation. After you complete it, you can join the Bent, Not Broken 
                Circle (monthly community) or enroll in the full 30-Day "From Broken to Whole" course for 
                deeper transformation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-16 bg-[#1E3A5F]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            30-Day Money-Back Guarantee
          </h2>
          <p className="text-xl text-gray-300 leading-relaxed mb-8">
            If you complete all 7 days and don't feel a shift in how you relate to your patterns, 
            email us. Full refund, no questions asked.
          </p>
          <p className="text-2xl font-semibold text-[#D4AF37]">
            We're confident in this program because it works.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-black via-gray-900 to-[#1E3A5F]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Ready to Stop the Cycle?
          </h2>
          <p className="text-xl text-gray-300 mb-4">
            Your nervous system has been running the show for too long.
          </p>
          <p className="text-2xl font-semibold text-[#D4AF37] mb-8">
            It's time to take control. It's time to rewire.
          </p>
          <Button 
            size="lg" 
            className="bg-[#D4AF37] hover:bg-[#B8941F] text-black font-bold text-xl px-16 py-8 mb-6"
            asChild
          >
            <a href={stripeCheckoutUrl}>
              Enroll in the 7-Day REWIRED Reset - $47
            </a>
          </Button>
          <p className="text-gray-400 mb-2">Lifetime access. 30-day guarantee. Zero shame.</p>
          <p className="text-xl text-white italic">
            See you on Day 1.<br />
            — Shaun
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-8 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-400">
          <p className="mb-2">
            Questions? Email: <a href="mailto:support@shauncritzer.com" className="text-[#D4AF37] hover:underline">support@shauncritzer.com</a>
          </p>
          {isLoggedIn && (
            <p className="mb-2">
              Already purchased? <Link href="/7-day-reset" className="text-[#D4AF37] hover:underline">Access your course here →</Link>
            </p>
          )}
          <p className="text-sm">© 2026 Shaun Critzer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// Course Member Area Component (for purchasers)
function CourseMemberArea() {
  const { user } = useAuth();
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);

  // Get course content
  const { data: courseData, isLoading: courseLoading, error: courseError } = trpc.members.getCourseContent.useQuery(
    { moduleId: 30001 },
    { enabled: true }
  );

  // Debug logging
  console.log('CourseMemberArea render:', { courseLoading, courseData, courseError, lessonsCount: courseData?.lessons?.length });

  // Get user's progress
  const { data: progressData } = trpc.members.getCourseProgress.useQuery(
    { moduleId: 30001 },
    { enabled: !!user }
  );

  // Mark lesson complete mutation
  const markComplete = trpc.members.markLessonComplete.useMutation({
    onSuccess: () => {
      // Invalidate progress query to refetch
      trpc.useUtils().members.getCourseProgress.invalidate();
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

  const lessons = courseData?.lessons || [];
  const completedLessons = progressData?.filter(p => p.completed === 1).length || 0;
  const currentLesson = currentLessonId 
    ? lessons.find(l => l.id === currentLessonId)
    : lessons[0];

  const isLessonComplete = (lessonId: number) => {
    return progressData?.some(p => p.lessonId === lessonId && p.completed === 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">7-Day REWIRED Reset</h1>
          <p className="text-muted-foreground">
            Progress: {completedLessons} of {lessons.length} lessons complete
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-[#D4AF37] h-2 rounded-full transition-all"
              style={{ width: `${(completedLessons / lessons.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Lesson List Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Course Lessons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => setCurrentLessonId(lesson.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentLesson?.id === lesson.id
                        ? 'bg-[#1E3A5F] text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">Day {lesson.lessonNumber}</div>
                        <div className="text-sm opacity-90">{lesson.title}</div>
                      </div>
                      {isLessonComplete(lesson.id) && (
                        <CheckCircle2 className="h-5 w-5 text-[#D4AF37] flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {currentLesson && (
              <>
                {/* Lesson Header */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      Day {currentLesson.lessonNumber}: {currentLesson.title}
                    </CardTitle>
                    {currentLesson.description && (
                      <p className="text-muted-foreground">{currentLesson.description}</p>
                    )}
                  </CardHeader>
                </Card>

                {/* Video Player */}
                {currentLesson.videoUrl && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PlayCircle className="h-5 w-5" />
                        Video Lesson
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <video 
                          src={currentLesson.videoUrl} 
                          controls 
                          className="w-full h-full"
                          controlsList="nodownload"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Downloadable Resources */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Downloadable Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentLesson.slideshowUrl && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        asChild
                      >
                        <a href={currentLesson.slideshowUrl} download target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Download Slideshow (PDF)
                        </a>
                      </Button>
                    )}
                    {currentLesson.workbookUrl && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        asChild
                      >
                        <a href={currentLesson.workbookUrl} download target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Download Workbook (PDF)
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Mark Complete */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold mb-1">Completed this lesson?</h3>
                        <p className="text-sm text-muted-foreground">
                          Mark it complete to track your progress
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          if (currentLesson) {
                            markComplete.mutate({
                              lessonId: currentLesson.id,
                              productId: "7day-rewired-reset",
                            });
                          }
                        }}
                        disabled={isLessonComplete(currentLesson.id)}
                        className={isLessonComplete(currentLesson.id) ? "bg-[#D4AF37]" : ""}
                      >
                        {isLessonComplete(currentLesson.id) ? (
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

                {/* Bonus Content Link */}
                {currentLesson.lessonNumber === 7 && (
                  <Card className="bg-gradient-to-br from-[#1E3A5F] to-gray-900 text-white">
                    <CardHeader>
                      <CardTitle>🎉 Congratulations on Completing the Course!</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">
                        You've finished all 7 days. Don't forget to access your bonus content:
                      </p>
                      <Button 
                        variant="secondary" 
                        className="bg-[#D4AF37] hover:bg-[#B8941F] text-black"
                        asChild
                      >
                        <Link href="/thriving-sober">
                          Access Bonus: 50 Ways to Thrive →
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Component with Conditional Rendering
export default function SevenDayReset() {
  const { user } = useAuth();

  // Check if user has access to the course
  const { data: hasAccess, isLoading: accessLoading } = trpc.members.checkCourseAccess.useQuery(
    { moduleId: 30001 },
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

  // TEMPORARY: Always show member area for testing (bypass auth)
  // TODO: Re-enable authentication after OAuth is configured
  return <CourseMemberArea />;
  
  // Original code (commented out for testing):
  // if (!user || !hasAccess) {
  //   return <SalesPage isLoggedIn={!!user} />;
  // }
  // return <CourseMemberArea />;
}
