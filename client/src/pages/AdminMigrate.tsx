import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Database, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function AdminMigrate() {
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; message: string } | null>(null);
  const migrateMutation = trpc.admin.migrateAiCoachTable.useMutation();

  const handleMigrate = async () => {
    try {
      const result = await migrateMutation.mutateAsync({ secret: "migrate-ai-coach-2025" });
      setMigrationResult(result);

      if (result.success) {
        toast.success("Migration successful!", {
          description: result.message,
        });
      } else {
        toast.error("Migration had issues", {
          description: result.message,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setMigrationResult({
        success: false,
        message: errorMessage,
      });
      toast.error("Migration failed", {
        description: errorMessage,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-yellow-600/20 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
        <div className="container flex h-16 items-center">
          <Logo />
        </div>
      </nav>

      {/* Content */}
      <section className="flex-1 flex items-center justify-center py-12">
        <div className="container max-w-2xl">
          <Card className="bg-gradient-to-br from-yellow-900/20 to-black border-yellow-600/30 text-white">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-yellow-600/20">
                  <Database className="h-12 w-12 text-yellow-500" />
                </div>
              </div>
              <CardTitle className="text-3xl text-yellow-500">AI Coach Migration</CardTitle>
              <CardDescription className="text-gray-300">
                Click the button below to create the AI Coach users table in your database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-900/50 border border-yellow-600/20 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-300">
                  <strong className="text-yellow-500">What this does:</strong>
                </p>
                <ul className="text-sm text-gray-400 space-y-1 ml-4 list-disc">
                  <li>Creates the <code className="text-yellow-500">ai_coach_users</code> table</li>
                  <li>Adds email, message_count, and has_unlimited_access columns</li>
                  <li>Sets up proper indexes for performance</li>
                  <li>Safe to run multiple times (uses CREATE IF NOT EXISTS)</li>
                </ul>
              </div>

              <Button
                onClick={handleMigrate}
                disabled={migrateMutation.isPending}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold text-lg py-6"
              >
                {migrateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Running Migration...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-5 w-5" />
                    Run Migration
                  </>
                )}
              </Button>

              {migrationResult && (
                <div
                  className={`border rounded-lg p-4 flex items-start gap-3 ${
                    migrationResult.success
                      ? "bg-green-900/20 border-green-600/50"
                      : "bg-red-900/20 border-red-600/50"
                  }`}
                >
                  {migrationResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p
                      className={`font-semibold ${
                        migrationResult.success ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {migrationResult.success ? "Success!" : "Error"}
                    </p>
                    <p className="text-sm text-gray-300">{migrationResult.message}</p>
                  </div>
                </div>
              )}

              {migrationResult?.success && (
                <div className="text-center space-y-4 pt-4 border-t border-yellow-600/20">
                  <p className="text-sm text-gray-300">
                    Migration complete! You can now use the AI Coach.
                  </p>
                  <Button
                    onClick={() => (window.location.href = "/ai-coach")}
                    variant="outline"
                    className="border-yellow-600 text-yellow-500 hover:bg-yellow-600/10"
                  >
                    Go to AI Coach →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
