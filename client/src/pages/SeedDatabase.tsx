import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import AdminNav from "@/components/AdminNav";

export default function SeedDatabase() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [pdfStatus, setPdfStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pdfMessage, setPdfMessage] = useState("");
  const [migrateStatus, setMigrateStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [migrateMessage, setMigrateMessage] = useState("");
  const [courseStatus, setCourseStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [courseMessage, setCourseMessage] = useState("");
  const [lessonsStatus, setLessonsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [lessonsMessage, setLessonsMessage] = useState("");

  const seedMutation = trpc.admin.seedNewBlogPosts.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage(data.message || `Successfully added ${data.postsCreated} new blog posts!`);
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error.message);
    },
  });

  const fixPdfMutation = trpc.admin.fixLeadMagnetPDFs.useMutation({
    onSuccess: (data) => {
      setPdfStatus("success");
      setPdfMessage(data.message || "Successfully updated PDF URLs!");
    },
    onError: (error) => {
      setPdfStatus("error");
      setPdfMessage(error.message);
    },
  });

  const seedCourseMutation = trpc.admin.seedFromBrokenToWhole.useMutation({
    onSuccess: (data) => {
      setCourseStatus("success");
      setCourseMessage(data.message || `Seeded ${data.modules} modules and ${data.lessons} lessons!`);
    },
    onError: (error) => {
      setCourseStatus("error");
      setCourseMessage(error.message);
    },
  });

  const seedLessonsMutation = trpc.admin.seedLessons.useMutation({
    onSuccess: (data) => {
      setLessonsStatus("success");
      setLessonsMessage(data.message || `Seeded ${data.count} lessons!`);
    },
    onError: (error) => {
      setLessonsStatus("error");
      setLessonsMessage(error.message);
    },
  });

  const migrateMutation = trpc.admin.migrateAiCoachTable.useMutation({
    onSuccess: (data) => {
      setMigrateStatus(data.success ? "success" : "error");
      setMigrateMessage(data.message);
    },
    onError: (error) => {
      setMigrateStatus("error");
      setMigrateMessage(error.message);
    },
  });

  const handleSeed = () => {
    setStatus("loading");
    setMessage("");
    seedMutation.mutate({});
  };

  const handleFixPdfs = () => {
    setPdfStatus("loading");
    setPdfMessage("");
    fixPdfMutation.mutate({});
  };

  const handleSeedCourse = () => {
    setCourseStatus("loading");
    setCourseMessage("");
    seedCourseMutation.mutate();
  };

  const handleSeedLessons = () => {
    setLessonsStatus("loading");
    setLessonsMessage("");
    seedLessonsMutation.mutate({});
  };

  const handleMigrate = () => {
    setMigrateStatus("loading");
    setMigrateMessage("");
    migrateMutation.mutate({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="max-w-2xl mx-auto">
        <AdminNav />
      </div>
      <Card className="max-w-2xl mx-auto w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Database Admin</h1>
          <p className="text-muted-foreground">
            Manage database migrations and seeding
          </p>
        </div>

        <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-200">
            <strong>⚠️ Important:</strong> Each button below performs a separate, independent action.
            Clicking one will NOT trigger the others. Review what each button does before clicking.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">AI Coach Migration</h3>
          <p className="text-sm text-muted-foreground">
            <strong>What this does:</strong> Creates the ai_coach_users table for email tracking and message counter system.
            Does NOT modify any existing data or files.
          </p>

          <Button
            onClick={handleMigrate}
            disabled={migrateStatus === "loading"}
            variant="default"
            className="w-full h-12 text-lg bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
          >
            {migrateStatus === "loading" ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Running Migration...
              </>
            ) : (
              "🚀 Migrate AI Coach Table"
            )}
          </Button>

          {migrateStatus === "success" && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-green-900 dark:text-green-100">Success!</p>
                <p className="text-sm text-green-800 dark:text-green-200">{migrateMessage}</p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Now visit <a href="/ai-coach?reset=true" className="underline font-medium hover:text-green-900">/ai-coach?reset=true</a> to test
                </p>
              </div>
            </div>
          )}

          {migrateStatus === "error" && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-red-900 dark:text-red-100">Error</p>
                <p className="text-sm text-red-800 dark:text-red-200">{migrateMessage}</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-6 space-y-4">
          <h3 className="font-semibold">Seed "From Broken to Whole" Course</h3>
          <p className="text-sm text-muted-foreground">
            <strong>What this does:</strong> Creates 8 modules and 30 daily lessons for the $97 course in the database.
            Deletes any existing course data first to avoid duplicates. Video URLs are left empty (will be generated via HeyGen pipeline).
          </p>

          <Button
            onClick={handleSeedCourse}
            disabled={courseStatus === "loading"}
            variant="default"
            className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 text-white font-bold"
          >
            {courseStatus === "loading" ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Seeding Course...
              </>
            ) : (
              "Seed 30-Day Course"
            )}
          </Button>

          {courseStatus === "success" && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-green-900 dark:text-green-100">Success!</p>
                <p className="text-sm text-green-800 dark:text-green-200">{courseMessage}</p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Visit <a href="/course/from-broken-to-whole" className="underline font-medium hover:text-green-900">/course/from-broken-to-whole</a> to test (requires purchase)
                </p>
              </div>
            </div>
          )}

          {courseStatus === "error" && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-red-900 dark:text-red-100">Error</p>
                <p className="text-sm text-red-800 dark:text-red-200">{courseMessage}</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-6 space-y-4">
          <h3 className="font-semibold">Seed 7-Day Reset Lessons</h3>
          <p className="text-sm text-muted-foreground">
            <strong>What this does:</strong> Seeds (or re-seeds) the 7 daily lessons for the 7-Day REWIRED Reset course ($47).
            Updates video URLs to the latest Cloudflare R2 location. Deletes existing lessons first to avoid duplicates.
          </p>

          <Button
            onClick={handleSeedLessons}
            disabled={lessonsStatus === "loading"}
            variant="default"
            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            {lessonsStatus === "loading" ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Seeding Lessons...
              </>
            ) : (
              "Seed 7-Day Reset Lessons"
            )}
          </Button>

          {lessonsStatus === "success" && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-green-900 dark:text-green-100">Success!</p>
                <p className="text-sm text-green-800 dark:text-green-200">{lessonsMessage}</p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Visit <a href="/members/7-day-reset" className="underline font-medium hover:text-green-900">/members/7-day-reset</a> to test (requires purchase)
                </p>
              </div>
            </div>
          )}

          {lessonsStatus === "error" && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-red-900 dark:text-red-100">Error</p>
                <p className="text-sm text-red-800 dark:text-red-200">{lessonsMessage}</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-6 space-y-4">
          <h3 className="font-semibold">Add Blog Posts</h3>
          <p className="text-sm text-muted-foreground">
            <strong>What this does:</strong> Adds new blog posts WITHOUT deleting existing ones. Checks for duplicates by slug.
            Topics: Nervous System, Self-Compassion, Inner Child, Somatic Healing, REWIRED Method.
          </p>

          <Button
            onClick={handleSeed}
            disabled={status === "loading"}
            variant="outline"
            className="w-full h-12 text-lg"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Seeding Database...
              </>
            ) : (
              "Add New Blog Posts (Safe)"
            )}
          </Button>

          {status === "success" && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-green-900 dark:text-green-100">Success!</p>
                <p className="text-sm text-green-800 dark:text-green-200">{message}</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-red-900 dark:text-red-100">Error</p>
                <p className="text-sm text-red-800 dark:text-red-200">{message}</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-6 space-y-4">
          <h3 className="font-semibold">Fix PDF Downloads</h3>
          <p className="text-sm text-muted-foreground">
            <strong>What this does:</strong> Updates database URLs only. Points Recovery Toolkit and Reading Guide to /recovery-toolkit.pdf and /reading-guide.pdf.
            Does NOT generate or modify actual PDF files—only updates the database pointers to existing files in /client/public/.
          </p>

          <Button
            onClick={handleFixPdfs}
            disabled={pdfStatus === "loading"}
            variant="outline"
            className="w-full h-12 text-lg"
          >
            {pdfStatus === "loading" ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Fixing PDFs...
              </>
            ) : (
              "Fix PDF URLs"
            )}
          </Button>

          {pdfStatus === "success" && (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-green-900 dark:text-green-100">Success!</p>
                <p className="text-sm text-green-800 dark:text-green-200">{pdfMessage}</p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Visit <a href="/resources" className="underline font-medium hover:text-green-900">Resources page</a> to test PDF downloads
                </p>
              </div>
            </div>
          )}

          {pdfStatus === "error" && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-red-900 dark:text-red-100">Error</p>
                <p className="text-sm text-red-800 dark:text-red-200">{pdfMessage}</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-6 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Summary:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Blog seeding adds new posts only — never deletes existing content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Course seeding creates 8 modules + 30 daily lessons for From Broken to Whole</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>7-Day Reset seeding updates all 7 lesson video URLs to latest Cloudflare R2</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>AI Coach migration creates the table for message tracking</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>All actions are safe to run multiple times</span>
            </li>
          </ul>
        </div>

        <div className="text-xs text-center text-muted-foreground pt-4 border-t">
          After seeding, visit <a href="/blog" className="text-primary hover:underline">/blog</a> to verify the changes
        </div>
      </Card>
    </div>
  );
}
