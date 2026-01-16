import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, Lock, PlayCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";

export default function SevenDayReset() {
  const { user } = useAuth();
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);

  // Check if user has access to the course
  const { data: hasAccess, isLoading: accessLoading } = trpc.members.checkCourseAccess.useQuery(
    { moduleId: 30001 },
    { enabled: !!user }
  );

  // Get course content
  const { data: courseData, isLoading: courseLoading } = trpc.members.getCourseContent.useQuery(
    { moduleId: 30001 },
    { enabled: !!user && hasAccess === true }
  );

  // Get user's progress
  const { data: progressData } = trpc.members.getCourseProgress.useQuery(
    { moduleId: 30001 },
    { enabled: !!user && hasAccess === true }
  );

  // Mark lesson complete mutation
  const markComplete = trpc.members.markLessonComplete.useMutation({
    onSuccess: () => {
      // Invalidate progress query to refetch
      trpc.useUtils().members.getCourseProgress.invalidate();
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">7-Day Reset Course</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Please log in to access your course.
          </p>
        </div>
      </div>
    );
  }

  if (accessLoading || courseLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-16 text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-16 text-center max-w-2xl mx-auto">
          <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-4xl font-bold mb-4">Course Access Required</h1>
          <p className="text-xl text-muted-foreground mb-8">
            You need to purchase the 7-Day Reset course to access this content.
          </p>
          <Button asChild size="lg">
            <a href="/products">View Products</a>
          </Button>
        </div>
      </div>
    );
  }

  const lessons = courseData?.lessons || [];
  const currentLesson = currentLessonId
    ? lessons.find((l) => l.id === currentLessonId)
    : lessons[0];

  const isLessonComplete = (lessonId: number) => {
    return progressData?.some((p) => p.lessonId === lessonId && p.completed);
  };

  const handleMarkComplete = () => {
    if (currentLesson) {
      markComplete.mutate({ lessonId: currentLesson.id });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">7-Day Reset Course</h1>
          <p className="text-muted-foreground">
            Your journey to rewiring your nervous system and breaking free from compulsive behaviors
          </p>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          {/* Lesson Sidebar */}
          <div className="space-y-2">
            <h2 className="font-semibold mb-4">Course Lessons</h2>
            {lessons.map((lesson, index) => (
              <button
                key={lesson.id}
                onClick={() => setCurrentLessonId(lesson.id)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  currentLesson?.id === lesson.id
                    ? "bg-accent border-teal-500"
                    : "hover:bg-accent/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isLessonComplete(lesson.id) ? (
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">Day {index + 1}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {lesson.title}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {currentLesson && (
              <>
                {/* Video Player */}
                <Card>
                  <CardContent className="p-0">
                    <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                      {currentLesson.videoUrl ? (
                        <video
                          key={currentLesson.id}
                          controls
                          className="w-full h-full"
                          src={currentLesson.videoUrl}
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          <PlayCircle className="w-16 h-16" />
                        </div>
                      )}
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">{currentLesson.title}</h2>
                        <p className="text-muted-foreground">{currentLesson.description}</p>
                      </div>

                      {/* Mark Complete Button */}
                      <div className="flex justify-between items-center pt-4 border-t">
                        {!isLessonComplete(currentLesson.id) && (
                          <Button
                            onClick={handleMarkComplete}
                            disabled={markComplete.isPending}
                            className="gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Mark as Complete
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
