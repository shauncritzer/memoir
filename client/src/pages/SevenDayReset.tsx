import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Circle, Download, Lock, PlayCircle } from "lucide-react";
import { Link } from "wouter";

export default function SevenDayReset() {
  const { data: hasAccess, isLoading: checkingAccess } = trpc.members.getCourseAccess.useQuery({
    productId: "7-day-reset",
  });

  const { data: courseData, isLoading: loadingCourse } = trpc.members.getCourseContent.useQuery(
    { productId: "7-day-reset" },
    { enabled: hasAccess === true }
  );

  const { data: progress } = trpc.members.getCourseProgress.useQuery(
    { productId: "7-day-reset" },
    { enabled: hasAccess === true }
  );

  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);

  const markCompleteMutation = trpc.members.markLessonComplete.useMutation({
    onSuccess: () => {
      // Invalidate progress query to refresh UI
      trpc.useUtils().members.getCourseProgress.invalidate();
    },
  });

  if (checkingAccess || loadingCourse) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container py-20">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6 text-center space-y-4">
              <Lock className="w-16 h-16 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-bold">Course Access Required</h2>
              <p className="text-muted-foreground">
                Purchase the REWIRED 7-Day Reset to access this course.
              </p>
              <Link href="/products">
                <Button size="lg">View Products</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const lessons = courseData?.lessons || [];
  const currentLesson = selectedLesson !== null 
    ? lessons.find(l => l.id === selectedLesson)
    : lessons[0];

  const isLessonComplete = (lessonId: number) => {
    if (!progress || !progress.modules) return false;
    for (const module of progress.modules) {
      const lesson = module.lessons.find((l: any) => l.id === lessonId);
      if (lesson?.completed) return true;
    }
    return false;
  };

  const completedCount = progress?.completedLessons || 0;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <div className="border-b bg-gradient-to-r from-teal-500/10 to-amber-500/10">
        <div className="container py-8">
          <h1 className="text-4xl font-bold mb-2">REWIRED 7-Day Reset</h1>
          <p className="text-muted-foreground mb-4">
            A Journey to Reclaim Your Nervous System and Your Life
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-secondary rounded-full h-2">
              <div
                className="bg-teal-500 h-2 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {completedCount} / {lessons.length} Complete
            </span>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-[1fr_350px] gap-8">
          {/* Main Video Area */}
          <div className="space-y-6">
            {currentLesson ? (
              <>
                {/* Video Player */}
                <Card>
                  <CardContent className="p-0">
                    <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                      <video
                        key={currentLesson.id}
                        controls
                        className="w-full h-full"
                        src={currentLesson.videoUrl || undefined}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold mb-2">{currentLesson.title}</h2>
                          <p className="text-muted-foreground">{currentLesson.description}</p>
                        </div>
                        {!isLessonComplete(currentLesson.id) && (
                          <Button
                            onClick={() =>
                              markCompleteMutation.mutate({
                                lessonId: currentLesson.id,
                                productId: "7-day-reset",
                              })
                            }
                            disabled={markCompleteMutation.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Mark Complete
                          </Button>
                        )}
                      </div>

                      {/* Downloadable Resources */}
                      <div className="pt-4 border-t">
                        <h3 className="font-semibold mb-3">Resources</h3>
                        <div className="space-y-2">
                          {currentLesson.workbookPdfUrl && (
                            <a
                              href={currentLesson.workbookPdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
                            >
                              <Download className="w-4 h-4 text-teal-500" />
                              <span className="font-medium">Download Slide Deck (PDF)</span>
                            </a>
                          )}
                          <a
                            href={`/workbooks/Day_${currentLesson.lessonNumber}_${currentLesson.title.split(':')[1]?.trim().split(' ')[0]}_Workbook.pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
                          >
                            <Download className="w-4 h-4 text-amber-500" />
                            <span className="font-medium">Download Workbook (PDF)</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-20 text-center">
                  <PlayCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Select a lesson to begin</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Lesson Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Course Lessons</h3>
                <div className="space-y-2">
                  {lessons.map((lesson, index) => {
                    const isComplete = isLessonComplete(lesson.id);
                    const isActive = currentLesson?.id === lesson.id;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          isActive
                            ? "border-teal-500 bg-teal-500/10"
                            : "hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {isComplete ? (
                            <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm leading-tight">
                              {lesson.title}
                            </div>
                            {lesson.videoDuration && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {Math.floor(lesson.videoDuration / 60)} min
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Bonus Content */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Bonus Content</h3>
                <Link href="/thriving-sober">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Thriving Sober: 50 Suggestions
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
