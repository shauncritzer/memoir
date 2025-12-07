import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function SeedDatabase() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const seedMutation = trpc.admin.seedBlogPosts.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage(data.message || `Successfully seeded ${data.postsCreated} blog posts!`);
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error.message);
    },
  });

  const handleSeed = () => {
    setStatus("loading");
    setMessage("");
    seedMutation.mutate({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Database Seeding</h1>
          <p className="text-muted-foreground">
            Click the button below to seed the database with updated blog posts
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleSeed}
            disabled={status === "loading"}
            className="w-full bg-primary hover:bg-primary/90 h-12 text-lg"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Seeding Database...
              </>
            ) : (
              "Seed Blog Posts"
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

        <div className="border-t pt-6 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">What this does:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Deletes existing blog posts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Creates 2 new blog posts with updated language</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Updates: "Sexual Abuse" → "Childhood Trauma"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>All content is kid-safe and ad-platform approved</span>
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
