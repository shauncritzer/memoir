import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export default function AdminVideos() {
  const { user, isLoading: authLoading } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState("");

  // Fetch all course lessons
  const { data: lessons, isLoading, refetch } = trpc.courseAdmin.getAllLessons.useQuery();

  // Update lesson mutation
  const updateLesson = trpc.courseAdmin.updateLessonVideo.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
      setVideoUrl("");
      setVideoDuration("");
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You need admin privileges to access this page.
          </p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleEdit = (lesson: any) => {
    setEditingId(lesson.id);
    setVideoUrl(lesson.videoUrl || "");
    setVideoDuration(lesson.videoDuration?.toString() || "");
  };

  const handleSave = (lessonId: number) => {
    updateLesson.mutate({
      lessonId,
      videoUrl: videoUrl || null,
      videoDuration: videoDuration ? parseInt(videoDuration) : null,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setVideoUrl("");
    setVideoDuration("");
  };

  // Group lessons by product
  const lessonsByProduct = lessons?.reduce((acc: any, lesson: any) => {
    const productName = lesson.module.product.name;
    if (!acc[productName]) {
      acc[productName] = [];
    }
    acc[productName].push(lesson);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold text-teal-600 cursor-pointer">
              Shaun Critzer
            </h1>
          </Link>
          <nav className="flex gap-6">
            <Link href="/">
              <span className="text-gray-700 hover:text-teal-600 cursor-pointer">
                Home
              </span>
            </Link>
            <Link href="/member">
              <span className="text-gray-700 hover:text-teal-600 cursor-pointer">
                Member Portal
              </span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Admin: Video Management</h1>
          <p className="text-gray-600 mb-8">
            Upload Vimeo URLs for each course lesson after generating videos in HeyGen
          </p>

          {!lessonsByProduct || Object.keys(lessonsByProduct).length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No course lessons found.</p>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(lessonsByProduct).map(([productName, productLessons]: [string, any]) => (
                <div key={productName}>
                  <h2 className="text-2xl font-bold mb-4 text-teal-600">{productName}</h2>
                  <div className="space-y-4">
                    {productLessons.map((lesson: any) => (
                      <Card key={lesson.id} className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-500">
                                {lesson.module.title} • Lesson {lesson.lessonNumber}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{lesson.title}</h3>
                            
                            {editingId === lesson.id ? (
                              <div className="space-y-3 mt-4">
                                <div>
                                  <label className="text-sm font-medium mb-1 block">
                                    Video URL (Vimeo)
                                  </label>
                                  <Input
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://vimeo.com/..."
                                    className="w-full"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1 block">
                                    Duration (seconds)
                                  </label>
                                  <Input
                                    type="number"
                                    value={videoDuration}
                                    onChange={(e) => setVideoDuration(e.target.value)}
                                    placeholder="720"
                                    className="w-full"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleSave(lesson.id)}
                                    disabled={updateLesson.isPending}
                                  >
                                    {updateLesson.isPending ? "Saving..." : "Save"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={updateLesson.isPending}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">Video URL:</span>
                                  {lesson.videoUrl ? (
                                    <a
                                      href={lesson.videoUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-teal-600 hover:underline truncate max-w-md"
                                    >
                                      {lesson.videoUrl}
                                    </a>
                                  ) : (
                                    <span className="text-sm text-gray-400 italic">Not set</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">Duration:</span>
                                  <span className="text-sm">
                                    {lesson.videoDuration
                                      ? `${Math.floor(lesson.videoDuration / 60)}:${(lesson.videoDuration % 60).toString().padStart(2, "0")}`
                                      : "Not set"}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {editingId !== lesson.id && (
                            <Button
                              variant="outline"
                              onClick={() => handleEdit(lesson)}
                            >
                              {lesson.videoUrl ? "Edit" : "Add Video"}
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
