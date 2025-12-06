import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { getLoginUrl } from "@/lib/auth";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ChevronDown, ChevronRight, Download, Lock, PlayCircle } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";

export default function Course() {
  const { productId } = useParams<{ productId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  
  const { data: hasAccess, isLoading: accessLoading } = trpc.members.getCourseAccess.useQuery(
    { productId: productId || "" },
    { enabled: !!user && !!productId }
  );
  
  const { data: courseData, isLoading: courseLoading } = trpc.members.getCourseProgress.useQuery(
    { productId: productId || "" },
    { enabled: !!user && !!productId && hasAccess }
  );
  
  const markComplete = trpc.members.markLessonComplete.useMutation({
    onSuccess: () => {
      // Invalidate course progress to refresh
      trpc.useUtils().members.getCourseProgress.invalidate();
      trpc.useUtils().members.getPurchases.invalidate();
    },
  });
  
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  
  // Show loading state
  if (authLoading || accessLoading || courseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }
  
  // Show login prompt if not authenticated
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
            onClick={() => window.location.href = getLoginUrl()}
          >
            Log In to Continue
          </Button>
        </Card>
      </div>
    );
  }
  
  // Show access denied if user doesn't have access
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-accent/20">
        <Card className="max-w-md w-full p-8 space-y-6">
          <div className="text-center space-y-4">
            <Lock className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-3xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have access to this course. Please purchase it to continue.
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
  
  // Toggle module expansion
  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };
  
  // Handle lesson completion
  const handleMarkComplete = async (lessonId: number) => {
    if (!productId) return;
    await markComplete.mutateAsync({ lessonId, productId });
  };
  
  const productInfo = getProductInfo(productId || "");
  
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center space-x-6">
            <Link href="/members" className="text-sm font-medium hover:text-primary transition-colors">
              ← Back to Dashboard
            </Link>
            <span className="text-sm text-muted-foreground">{user.name}</span>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 space-y-6 sticky top-24">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{productInfo.title}</h2>
                <p className="text-sm text-muted-foreground">{productInfo.description}</p>
              </div>
              
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium">{courseData?.progress || 0}%</span>
                </div>
                <div className="h-2 bg-accent rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${courseData?.progress || 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {courseData?.completedLessons || 0} of {courseData?.totalLessons || 0} lessons completed
                </p>
              </div>
              
              {/* Module List */}
              <div className="space-y-2">
                <h3 className="font-semibold">Course Content</h3>
                <div className="space-y-1">
                  {courseData?.modules.map((module: any) => {
                    const isExpanded = expandedModules.includes(module.id);
                    const completedLessons = module.lessons.filter((l: any) => l.completed).length;
                    const totalLessons = module.lessons.length;
                    
                    return (
                      <div key={module.id} className="space-y-1">
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium text-sm">{module.title}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {completedLessons}/{totalLessons}
                          </span>
                        </button>
                        
                        {isExpanded && (
                          <div className="ml-6 space-y-1">
                            {module.lessons.map((lesson: any) => (
                              <button
                                key={lesson.id}
                                onClick={() => setSelectedLesson(lesson)}
                                className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${
                                  selectedLesson?.id === lesson.id
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-accent"
                                }`}
                              >
                                {lesson.completed ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  <PlayCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                )}
                                <span className="flex-1">{lesson.title}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
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
                      ></iframe>
                    ) : (
                      <div className="text-center space-y-4 p-8">
                        <PlayCircle className="h-16 w-16 text-muted-foreground mx-auto" />
                        <p className="text-muted-foreground">
                          Video coming soon! Check back later.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Lesson Info */}
                <Card className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <h1 className="text-3xl font-bold">{selectedLesson.title}</h1>
                        {selectedLesson.description && (
                          <p className="text-muted-foreground">{selectedLesson.description}</p>
                        )}
                      </div>
                      {!selectedLesson.completed && (
                        <Button
                          onClick={() => handleMarkComplete(selectedLesson.id)}
                          disabled={markComplete.isPending}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark Complete
                        </Button>
                      )}
                      {selectedLesson.completed && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-medium">Completed</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Download Workbook */}
                    {selectedLesson.workbookPdfUrl && (
                      <Button variant="outline" className="w-full" asChild>
                        <a href={selectedLesson.workbookPdfUrl} download>
                          <Download className="mr-2 h-4 w-4" />
                          Download Lesson Workbook (PDF)
                        </a>
                      </Button>
                    )}
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-12">
                <div className="text-center space-y-4">
                  <PlayCircle className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Welcome to {productInfo.title}</h2>
                    <p className="text-muted-foreground">
                      Select a lesson from the sidebar to begin your journey.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get product info
function getProductInfo(productId: string) {
  const products: Record<string, { title: string; description: string }> = {
    "7-day-reset": {
      title: "7-Day Reset",
      description: "Build your foundation for lasting recovery in just one week.",
    },
    "from-broken-to-whole": {
      title: "From Broken to Whole",
      description: "30-day deep healing journey addressing trauma and addiction.",
    },
    "bent-not-broken-circle": {
      title: "Bent Not Broken Circle",
      description: "Monthly membership with unlimited course access.",
    },
  };

  return products[productId] || {
    title: productId,
    description: "Recovery course",
  };
}
