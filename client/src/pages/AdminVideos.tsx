import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import AdminNav from "@/components/AdminNav";
import { toast } from "sonner";
import {
  Video,
  Play,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Film,
  Mic,
  Settings,
} from "lucide-react";

export default function AdminVideos() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("generate");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState("");

  // Batch generation options
  const [skipExisting, setSkipExisting] = useState(true);
  const [testMode, setTestMode] = useState(true);
  const [maxVideos, setMaxVideos] = useState("2");
  const [selectedModules, setSelectedModules] = useState<number[]>([]);

  // Fetch data
  const { data: lessons, isLoading, refetch } = trpc.courseAdmin.getAllLessons.useQuery();
  const videoStatus = trpc.admin.videoProducerStatus.useQuery(undefined, {
    retry: false,
  });

  // Mutations
  const updateLesson = trpc.courseAdmin.updateLessonVideo.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
      setVideoUrl("");
      setVideoDuration("");
      toast.success("Lesson video updated");
    },
  });

  const generateVideos = trpc.admin.generateCourseVideos.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Video generation started: ${data.generated || 0} videos queued`);
      refetch();
    },
    onError: (err: any) => toast.error(`Generation failed: ${err.message}`),
  });

  const generateAudio = trpc.admin.generateLessonAudio.useMutation({
    onSuccess: () => {
      toast.success("Audio generated successfully");
      refetch();
    },
    onError: (err: any) => toast.error(`Audio generation failed: ${err.message}`),
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Admin privileges required.</p>
          <Link href="/"><Button>Go Home</Button></Link>
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

  const handleBatchGenerate = () => {
    generateVideos.mutate({
      moduleFilter: selectedModules.length > 0 ? selectedModules : undefined,
      skipExisting,
      test: testMode,
      maxVideos: maxVideos ? parseInt(maxVideos) : undefined,
    });
  };

  const toggleModule = (moduleNum: number) => {
    setSelectedModules(prev =>
      prev.includes(moduleNum)
        ? prev.filter(m => m !== moduleNum)
        : [...prev, moduleNum]
    );
  };

  // Group lessons by product
  const lessonsByProduct = lessons?.reduce((acc: any, lesson: any) => {
    const productName = lesson.module.product.name;
    if (!acc[productName]) acc[productName] = [];
    acc[productName].push(lesson);
    return acc;
  }, {});

  // Count lessons with/without videos
  const totalLessons = lessons?.length || 0;
  const lessonsWithVideo = lessons?.filter((l: any) => l.videoUrl)?.length || 0;

  const status = videoStatus.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold text-teal-600 cursor-pointer">Shaun Critzer</h1>
          </Link>
          <nav className="flex gap-6">
            <Link href="/"><span className="text-gray-700 hover:text-teal-600 cursor-pointer">Home</span></Link>
            <Link href="/member"><span className="text-gray-700 hover:text-teal-600 cursor-pointer">Member Portal</span></Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <AdminNav />

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Video className="h-8 w-8 text-teal-600" />
                Video Management
              </h1>
              <p className="text-gray-600 mt-1">
                Generate AI avatar videos, manage audio, and assign URLs to lessons
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm py-1 px-3">
                {lessonsWithVideo}/{totalLessons} lessons have video
              </Badge>
            </div>
          </div>

          {/* Video Producer Status */}
          <Card className="mb-6 border-teal-200 bg-teal-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">HeyGen:</span>
                    {status?.heygenConfigured ? (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Not configured
                      </Badge>
                    )}
                  </div>
                  {status?.heygenCredits && (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Credits: <strong>{status.heygenCredits.remaining}</strong></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">ElevenLabs:</span>
                    {status?.elevenlabsConfigured ? (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Not configured
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => videoStatus.refetch()}
                  disabled={videoStatus.isFetching}
                >
                  {videoStatus.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh Status"}
                </Button>
              </div>
              {status?.avatarId && (
                <p className="text-xs text-gray-500 mt-2">Avatar: {status.avatarId}</p>
              )}
              {videoStatus.error && (
                <p className="text-xs text-red-500 mt-2">Status check error: {videoStatus.error.message}</p>
              )}
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="generate">
                <Film className="h-4 w-4 mr-1.5" /> AI Video Generation
              </TabsTrigger>
              <TabsTrigger value="lessons">
                <Video className="h-4 w-4 mr-1.5" /> Lesson Videos ({lessonsWithVideo}/{totalLessons})
              </TabsTrigger>
            </TabsList>

            {/* AI VIDEO GENERATION TAB */}
            <TabsContent value="generate">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Batch Generation Controls */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5 text-teal-600" />
                      Batch Video Generation
                    </CardTitle>
                    <CardDescription>
                      Generate HeyGen avatar videos for course lessons. Scripts are auto-extracted from course content.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Module Filter */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Filter by Module (optional)</label>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                          <Button
                            key={num}
                            size="sm"
                            variant={selectedModules.includes(num) ? "default" : "outline"}
                            onClick={() => toggleModule(num)}
                            className="w-10 h-10"
                          >
                            {num}
                          </Button>
                        ))}
                        {selectedModules.length > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedModules([])}
                            className="text-xs"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedModules.length === 0
                          ? "All modules selected"
                          : `Modules: ${selectedModules.sort().join(", ")}`}
                      </p>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Max Videos</label>
                        <Input
                          type="number"
                          value={maxVideos}
                          onChange={(e) => setMaxVideos(e.target.value)}
                          placeholder="e.g., 5"
                          min={1}
                          max={50}
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty for all</p>
                      </div>
                      <div className="space-y-3 pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={skipExisting}
                            onChange={(e) => setSkipExisting(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Skip lessons with existing video</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={testMode}
                            onChange={(e) => setTestMode(e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">Test mode (free, watermarked)</span>
                        </label>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                      size="lg"
                      onClick={handleBatchGenerate}
                      disabled={generateVideos.isPending}
                      className="w-full bg-teal-600 hover:bg-teal-700"
                    >
                      {generateVideos.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Generating Videos...
                        </>
                      ) : (
                        <>
                          <Film className="h-5 w-5 mr-2" />
                          Generate Videos
                          {testMode && " (Test Mode)"}
                        </>
                      )}
                    </Button>

                    {generateVideos.data && (
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                          <p className="text-sm font-medium text-green-800">
                            <CheckCircle2 className="h-4 w-4 inline mr-1" />
                            Generation complete
                          </p>
                          <pre className="text-xs text-green-700 mt-2 whitespace-pre-wrap">
                            {JSON.stringify(generateVideos.data, null, 2)}
                          </pre>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Mic className="h-5 w-5 text-purple-500" />
                        Audio Generation
                      </CardTitle>
                      <CardDescription>Generate ElevenLabs narration for lessons</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        Select a lesson from the Lesson Videos tab, then use the "Generate Audio" button on each lesson card.
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {status?.elevenlabsConfigured ? "ElevenLabs ready" : "ElevenLabs not configured"}
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tips</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-600 space-y-2">
                      <p>- <strong>Test mode</strong> generates free watermarked videos to preview before using credits.</p>
                      <p>- Scripts are auto-extracted from course lesson content (modules 1-4 have pre-written scripts).</p>
                      <p>- Modules 5-8 scripts will be auto-generated by AI if not available.</p>
                      <p>- HeyGen has a 3,000 character limit per video script.</p>
                      <p>- Videos take 3-10 minutes to render per lesson.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* LESSON VIDEOS TAB */}
            <TabsContent value="lessons">
              {!lessonsByProduct || Object.keys(lessonsByProduct).length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No course lessons found.</p>
                </Card>
              ) : (
                <div className="space-y-8">
                  {Object.entries(lessonsByProduct).map(([productName, productLessons]: [string, any]) => (
                    <div key={productName}>
                      <h2 className="text-2xl font-bold mb-4 text-teal-600">{productName}</h2>
                      <div className="space-y-3">
                        {productLessons.map((lesson: any) => (
                          <Card key={lesson.id} className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-gray-500">
                                    {lesson.module.title} - Lesson {lesson.lessonNumber}
                                  </span>
                                  {lesson.videoUrl ? (
                                    <Badge className="bg-green-100 text-green-700 text-xs">Has Video</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-400 text-xs">No Video</Badge>
                                  )}
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{lesson.title}</h3>

                                {editingId === lesson.id ? (
                                  <div className="space-y-3 mt-4">
                                    <div>
                                      <label className="text-sm font-medium mb-1 block">Video URL</label>
                                      <Input
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        placeholder="https://vimeo.com/... or YouTube URL"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium mb-1 block">Duration (seconds)</label>
                                      <Input
                                        type="number"
                                        value={videoDuration}
                                        onChange={(e) => setVideoDuration(e.target.value)}
                                        placeholder="720"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button onClick={() => handleSave(lesson.id)} disabled={updateLesson.isPending}>
                                        {updateLesson.isPending ? "Saving..." : "Save"}
                                      </Button>
                                      <Button variant="outline" onClick={handleCancel} disabled={updateLesson.isPending}>
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-gray-600">Video:</span>
                                      {lesson.videoUrl ? (
                                        <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer"
                                          className="text-sm text-teal-600 hover:underline truncate max-w-md">
                                          {lesson.videoUrl}
                                        </a>
                                      ) : (
                                        <span className="text-sm text-gray-400 italic">Not set</span>
                                      )}
                                    </div>
                                    {lesson.videoDuration && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Duration:</span>
                                        <span className="text-sm">
                                          {Math.floor(lesson.videoDuration / 60)}:{(lesson.videoDuration % 60).toString().padStart(2, "0")}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {editingId !== lesson.id && (
                                <div className="flex flex-col gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleEdit(lesson)}>
                                    {lesson.videoUrl ? "Edit" : "Add Video"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      generateAudio.mutate({
                                        lessonId: lesson.id,
                                        script: lesson.description || lesson.title,
                                        title: lesson.title,
                                      });
                                    }}
                                    disabled={generateAudio.isPending}
                                    className="text-purple-600 border-purple-300"
                                  >
                                    <Mic className="h-3 w-3 mr-1" />
                                    {generateAudio.isPending ? "..." : "Audio"}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
