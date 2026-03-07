import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { getLoginUrl } from "@/lib/auth";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Lock,
  PenLine,
  PlayCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";

type Tab = "lesson" | "workbook";

/** Render plain-text content with paragraph breaks and basic formatting */
function ContentRenderer({ text }: { text: string }) {
  // Split on double newlines for paragraphs, single newlines for line breaks
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="prose prose-stone dark:prose-invert max-w-none space-y-4">
      {paragraphs.map((para, i) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Check if this is an affirmation (starts with *)
        if (trimmed.startsWith("*") && trimmed.endsWith("*")) {
          return (
            <blockquote
              key={i}
              className="border-l-4 border-primary pl-4 italic text-primary/90 my-6"
            >
              {trimmed.replace(/^\*+|\*+$/g, "").trim()}
            </blockquote>
          );
        }

        // Check if this is a heading-like line (starts with Exercise, Reflection, Affirmation, etc.)
        if (
          /^(Exercise|Reflection|Affirmation|Important|DAILY|WEEKLY|MONTHLY|Step \d):/i.test(
            trimmed
          )
        ) {
          const [label, ...rest] = trimmed.split(":");
          return (
            <div key={i} className="my-4">
              <span className="font-bold text-primary">{label}:</span>
              <span>{rest.join(":")}</span>
            </div>
          );
        }

        // Check if this is a numbered list
        if (/^\(\d+\)\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
          const items = trimmed.split(/\n/).filter(Boolean);
          return (
            <ol key={i} className="list-decimal list-inside space-y-1 ml-2">
              {items.map((item, j) => (
                <li key={j} className="text-foreground/90">
                  {item.replace(/^\(\d+\)\s*|^\d+\.\s*/, "")}
                </li>
              ))}
            </ol>
          );
        }

        // Regular paragraph with line break support
        const lines = trimmed.split("\n");
        return (
          <p key={i} className="text-foreground/90 leading-relaxed">
            {lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {/* Bold text between ** */}
                {line.split(/(\*\*[^*]+\*\*)/).map((segment, k) => {
                  if (segment.startsWith("**") && segment.endsWith("**")) {
                    return (
                      <strong key={k}>
                        {segment.replace(/^\*\*|\*\*$/g, "")}
                      </strong>
                    );
                  }
                  return <span key={k}>{segment}</span>;
                })}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export default function Course() {
  const { productId } = useParams<{ productId: string }>();
  const { user, isLoading: authLoading } = useAuth();

  const {
    data: hasAccess,
    isLoading: accessLoading,
  } = trpc.members.checkCourseAccess.useQuery(
    { productId: productId || "" },
    { enabled: !!user && !!productId }
  );

  const {
    data: courseData,
    isLoading: courseLoading,
  } = trpc.members.getCourseProgress.useQuery(
    { productId: productId || "" },
    { enabled: !!user && !!productId && hasAccess }
  );

  const markComplete = trpc.members.markLessonComplete.useMutation({
    onSuccess: () => {
      trpc.useUtils().members.getCourseProgress.invalidate();
      trpc.useUtils().members.getPurchases.invalidate();
    },
  });

  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("lesson");

  // Auto-expand the first module with incomplete lessons
  useEffect(() => {
    if (courseData?.modules && expandedModules.length === 0) {
      const firstIncomplete = courseData.modules.find((m: any) =>
        m.lessons.some((l: any) => !l.completed)
      );
      if (firstIncomplete) {
        setExpandedModules([firstIncomplete.id]);
      } else if (courseData.modules.length > 0) {
        setExpandedModules([courseData.modules[0].id]);
      }
    }
  }, [courseData]);

  // Compute next lesson to continue
  const nextLesson = useMemo(() => {
    if (!courseData?.modules) return null;
    for (const mod of courseData.modules) {
      for (const lesson of (mod as any).lessons) {
        if (!lesson.completed) return lesson;
      }
    }
    return null;
  }, [courseData]);

  // Loading
  if (authLoading || accessLoading || courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  // Login required
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-accent/20">
        <Card className="max-w-md w-full p-8 space-y-6">
          <div className="text-center space-y-4">
            <Lock className="h-16 w-16 text-primary mx-auto" />
            <h1 className="text-3xl font-bold">Login Required</h1>
            <p className="text-muted-foreground">
              Please log in to access this course.
            </p>
          </div>
          <Button
            size="lg"
            className="w-full bg-primary hover:bg-primary/90"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Log In to Continue
          </Button>
        </Card>
      </div>
    );
  }

  // No access
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-accent/20">
        <Card className="max-w-md w-full p-8 space-y-6">
          <div className="text-center space-y-4">
            <Lock className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-3xl font-bold">Access Required</h1>
            <p className="text-muted-foreground">
              You need to purchase this course to access the content.
            </p>
          </div>
          <Link href="/products">
            <Button size="lg" className="w-full bg-primary hover:bg-primary/90">
              View Products
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleMarkComplete = async (lessonId: number) => {
    if (!productId) return;
    await markComplete.mutateAsync({ lessonId, productId });
  };

  const selectLesson = (lesson: any) => {
    setSelectedLesson(lesson);
    setActiveTab("lesson");
    // Scroll to top of content on mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Find next/prev lessons for navigation
  const allLessons = courseData?.modules?.flatMap((m: any) => m.lessons) || [];
  const currentIndex = selectedLesson
    ? allLessons.findIndex((l: any) => l.id === selectedLesson.id)
    : -1;
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLessonNav =
    currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null;

  const productInfo = getProductInfo(productId || "");
  const progressPct = courseData?.progress || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container pt-24 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="p-6 space-y-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="space-y-2">
                <h2 className="text-xl font-bold">{productInfo.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {productInfo.description}
                </p>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-primary">
                    {progressPct}%
                  </span>
                </div>
                <div className="h-3 bg-accent rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 rounded-full"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {courseData?.completedLessons || 0} of{" "}
                  {courseData?.totalLessons || 0} lessons completed
                </p>
              </div>

              {/* Module List */}
              <div className="space-y-1">
                {courseData?.modules.map((module: any) => {
                  const isExpanded = expandedModules.includes(module.id);
                  const completedCount = module.lessons.filter(
                    (l: any) => l.completed
                  ).length;
                  const totalCount = module.lessons.length;
                  const allComplete = completedCount === totalCount;

                  return (
                    <div key={module.id}>
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left group"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span
                            className={`font-medium text-sm truncate ${
                              allComplete ? "text-green-600" : ""
                            }`}
                          >
                            {module.title}
                          </span>
                        </div>
                        <span
                          className={`text-xs flex-shrink-0 ml-2 ${
                            allComplete
                              ? "text-green-600 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {completedCount}/{totalCount}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="ml-4 space-y-0.5 pb-2">
                          {module.lessons.map((lesson: any) => {
                            const isSelected =
                              selectedLesson?.id === lesson.id;
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => selectLesson(lesson)}
                                className={`w-full flex items-center gap-2 p-2 pl-3 rounded-lg text-left text-sm transition-colors ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-accent"
                                }`}
                              >
                                {lesson.completed ? (
                                  <CheckCircle2
                                    className={`h-4 w-4 flex-shrink-0 ${
                                      isSelected
                                        ? "text-primary-foreground"
                                        : "text-green-500"
                                    }`}
                                  />
                                ) : (
                                  <PlayCircle
                                    className={`h-4 w-4 flex-shrink-0 ${
                                      isSelected
                                        ? "text-primary-foreground"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                )}
                                <span className="flex-1 truncate">
                                  {lesson.title}
                                </span>
                                {lesson.estimatedMinutes && (
                                  <span
                                    className={`text-xs flex-shrink-0 ${
                                      isSelected
                                        ? "text-primary-foreground/70"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {lesson.estimatedMinutes}m
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
            {selectedLesson ? (
              <>
                {/* Video Player */}
                <Card className="overflow-hidden">
                  <div className="aspect-video bg-black flex items-center justify-center">
                    {selectedLesson.videoUrl ? (
                      <iframe
                        src={selectedLesson.videoUrl}
                        className="w-full h-full"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="text-center space-y-3 p-8">
                        <PlayCircle className="h-16 w-16 text-white/30 mx-auto" />
                        <p className="text-white/50 text-sm">
                          Video lesson coming soon
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Lesson Header + Actions */}
                <Card className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="space-y-1 flex-1">
                      <h1 className="text-2xl font-bold">
                        {selectedLesson.title}
                      </h1>
                      {selectedLesson.estimatedMinutes && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            ~{selectedLesson.estimatedMinutes} min read
                          </span>
                        </div>
                      )}
                    </div>
                    {!selectedLesson.completed ? (
                      <Button
                        onClick={() => handleMarkComplete(selectedLesson.id)}
                        disabled={markComplete.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {markComplete.isPending
                          ? "Saving..."
                          : "Mark Complete"}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600 flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium text-sm">Completed</span>
                      </div>
                    )}
                  </div>

                  {/* Download Workbook PDF */}
                  {selectedLesson.workbookPdfUrl && (
                    <Button variant="outline" className="w-full mb-4" asChild>
                      <a href={selectedLesson.workbookPdfUrl} download>
                        <Download className="mr-2 h-4 w-4" />
                        Download Lesson Workbook (PDF)
                      </a>
                    </Button>
                  )}

                  {/* Tabs */}
                  <div className="border-b mb-6">
                    <div className="flex gap-0">
                      <button
                        onClick={() => setActiveTab("lesson")}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === "lesson"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <BookOpen className="h-4 w-4" />
                        Lesson
                      </button>
                      {selectedLesson.workbookContent && (
                        <button
                          onClick={() => setActiveTab("workbook")}
                          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === "workbook"
                              ? "border-primary text-primary"
                              : "border-transparent text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <PenLine className="h-4 w-4" />
                          Exercises
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tab Content */}
                  {activeTab === "lesson" && selectedLesson.content && (
                    <ContentRenderer text={selectedLesson.content} />
                  )}
                  {activeTab === "lesson" &&
                    !selectedLesson.content &&
                    selectedLesson.description && (
                      <ContentRenderer text={selectedLesson.description} />
                    )}

                  {activeTab === "workbook" &&
                    selectedLesson.workbookContent && (
                      <div className="space-y-4">
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                          <p className="text-sm text-primary font-medium">
                            Grab a journal or open a document. Take your time
                            with these exercises — there are no wrong answers.
                          </p>
                        </div>
                        <ContentRenderer
                          text={selectedLesson.workbookContent}
                        />
                      </div>
                    )}
                </Card>

                {/* Lesson Navigation */}
                <div className="flex items-center justify-between gap-4">
                  {prevLesson ? (
                    <Button
                      variant="outline"
                      onClick={() => selectLesson(prevLesson)}
                      className="flex-1 max-w-[50%]"
                    >
                      <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                      <span className="truncate">{prevLesson.title}</span>
                    </Button>
                  ) : (
                    <div />
                  )}
                  {nextLessonNav ? (
                    <Button
                      onClick={() => selectLesson(nextLessonNav)}
                      className="flex-1 max-w-[50%] bg-primary hover:bg-primary/90"
                    >
                      <span className="truncate">{nextLessonNav.title}</span>
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    progressPct === 100 && (
                      <Card className="flex-1 p-4 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                          <div>
                            <p className="font-semibold text-green-800 dark:text-green-300">
                              Course Complete!
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              You did it. This is not the end — this is the
                              beginning.
                            </p>
                          </div>
                        </div>
                      </Card>
                    )
                  )}
                </div>
              </>
            ) : (
              /* Welcome State */
              <Card className="p-12">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <BookOpen className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold">
                      Welcome to {productInfo.title}
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {productInfo.welcomeMessage}
                    </p>
                  </div>
                  {nextLesson && (
                    <Button
                      size="lg"
                      onClick={() => selectLesson(nextLesson)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <PlayCircle className="mr-2 h-5 w-5" />
                      {courseData?.completedLessons
                        ? "Continue Learning"
                        : "Start Your Journey"}
                    </Button>
                  )}
                  {progressPct > 0 && progressPct < 100 && (
                    <p className="text-sm text-muted-foreground">
                      You&apos;re {progressPct}% through the course. Keep
                      going!
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function getProductInfo(productId: string) {
  const products: Record<
    string,
    { title: string; description: string; welcomeMessage: string }
  > = {
    "7-day-reset": {
      title: "7-Day REWIRED Reset",
      description:
        "Build your foundation for lasting recovery in just one week.",
      welcomeMessage:
        "Over the next 7 days, you'll learn to recognize patterns, establish safety, work with triggers, and build a vision for your future. Select a day from the sidebar to begin.",
    },
    "from-broken-to-whole": {
      title: "From Broken to Whole",
      description:
        "A 30-day deep healing journey through trauma, recovery, and redemption.",
      welcomeMessage:
        "This is a deep dive into the trauma that fuels addiction, the healing that makes recovery possible, and the transformation that leads to a life beyond your wildest dreams. 8 modules, 30 days, one day at a time.",
    },
    "bent-not-broken-circle": {
      title: "Bent Not Broken Circle",
      description: "Monthly membership with ongoing support and community.",
      welcomeMessage:
        "Welcome to the Circle. You have access to all resources, community, and ongoing support.",
    },
  };

  return (
    products[productId] || {
      title: productId,
      description: "Recovery course",
      welcomeMessage: "Select a lesson from the sidebar to begin.",
    }
  );
}
