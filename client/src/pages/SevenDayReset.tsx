import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Download, Lock, Play } from "lucide-react";
import { Link } from "wouter";

export default function SevenDayReset() {
  const { user } = useAuth();
  const [currentLesson, setCurrentLesson] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if user has access
  const { data: accessData, isLoading: accessLoading } = trpc.members.getCourseAccess.useQuery(
    { productId: "7-day-reset" },
    { enabled: !!user }
  );

  // Get course content and progress
  const { data: courseData, isLoading: courseLoading } = trpc.members.getCourseProgress.useQuery(
    { productId: "7-day-reset" },
    { enabled: !!user && !!accessData }
  );

  const markCompleteMutation = trpc.members.markLessonComplete.useMutation({
    onSuccess: () => {
      // Invalidate course progress to refresh
      trpc.useUtils().members.getCourseProgress.invalidate();
    }
  });

  const hasAccess = accessData || false;
  const modules = courseData?.modules || [];
  const progressPercent = courseData?.progress || 0;

  // Auto-select first incomplete lesson
  useEffect(() => {
    if (modules.length > 0 && currentLesson === null) {
      const firstIncomplete = modules[0]?.lessons?.find((l: any) => !l.completed);
      if (firstIncomplete) {
        setCurrentLesson(firstIncomplete.id);
      } else {
        // All complete, show first lesson
        setCurrentLesson(modules[0]?.lessons?.[0]?.id || null);
      }
    }
  }, [modules, currentLesson]);

  // Track video progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentLesson) return;

    const handleTimeUpdate = () => {
      const watchedSeconds = Math.floor(video.currentTime);
      const duration = Math.floor(video.duration);
      
      // Mark complete when 90% watched
      if (duration > 0 && watchedSeconds / duration >= 0.9) {
        const lesson = modules[0]?.lessons?.find(l => l.id === currentLesson);
        if (lesson && !lesson.completed) {
          markCompleteMutation.mutate({
            lessonId: currentLesson,
            productId: "7-day-reset"
          });
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [currentLesson, modules, markCompleteMutation]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to access the 7-Day REWIRED Reset</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/products">View Products</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accessLoading || courseLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your course...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Access Required
            </CardTitle>
            <CardDescription>
              Purchase the 7-Day REWIRED Reset to unlock this transformative journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/products">Purchase Now - $27</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentLessonData = modules[0]?.lessons?.find((l: any) => l.id === currentLesson);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-xl">Shaun Critzer</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Progress: {progressPercent}%
            </div>
            <Link href="/products">
              <Button variant="ghost" size="sm">My Courses</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Progress Bar */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>The REWIRED 7-Day Reset</CardTitle>
            <CardDescription>
              Your journey to breaking free from addiction and stepping into your new identity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{progressPercent}% Complete</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Video Player */}
          <div className="space-y-4">
            {currentLessonData ? (
              <>
                <Card>
                  <CardContent className="p-0">
                    <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        controls
                        className="w-full h-full"
                        src={currentLessonData.videoUrl || undefined}
                        poster="/placeholder-video.jpg"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <div className="p-6">
                      <h2 className="text-2xl font-bold mb-2">{currentLessonData.title}</h2>
                      <p className="text-muted-foreground mb-4">{currentLessonData.description}</p>
                      
                      {currentLessonData.completed && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-4">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-medium">Completed</span>
                        </div>
                      )}

                      {currentLessonData.workbookPdfUrl && (
                        <Button asChild variant="outline" className="w-full">
                          <a href={currentLessonData.workbookPdfUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download Slide Deck PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Resources */}
                <Card>
                  <CardHeader>
                    <CardTitle>Course Resources</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button asChild variant="outline" className="w-full justify-start">
                      <a href="https://d2xsxph8kpxj0f.cloudfront.net/96788853/TkLS7ZKMcJdwidVi9JjC4w/7day-reset/pdfs/thriving-sober.pdf" target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Thriving Sober Guide (50+ Tips)
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Select a lesson to begin</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Lesson List Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Course Lessons</CardTitle>
                <CardDescription>7 days to transform your life</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {modules[0]?.lessons?.map((lesson: any, index: number) => (
                    <button
                      key={lesson.id}
                      onClick={() => setCurrentLesson(lesson.id)}
                      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-start gap-3 ${
                        currentLesson === lesson.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="mt-1">
                        {lesson.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : currentLesson === lesson.id ? (
                          <Play className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm mb-1">
                          Day {index + 1}
                        </div>
                        <div className="text-sm line-clamp-2">
                          {lesson.title}
                        </div>
                        {lesson.videoDuration && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {Math.floor(lesson.videoDuration / 60)}:{String(lesson.videoDuration % 60).padStart(2, '0')}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
