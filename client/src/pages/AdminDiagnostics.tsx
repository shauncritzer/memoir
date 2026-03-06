import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import AdminNav from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MinusCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

type DiagResult = {
  status: "ok" | "warning" | "error" | "not_configured";
  message: string;
  details?: any;
};

const SERVICE_LABELS: Record<string, { label: string; category: string }> = {
  database: { label: "Database (MySQL)", category: "Core" },
  stripe: { label: "Stripe Payments", category: "Core" },
  llm: { label: "LLM (Gemini/OpenAI)", category: "Core" },
  convertkit: { label: "ConvertKit Email", category: "Core" },
  facebook: { label: "Facebook", category: "Social Media" },
  instagram: { label: "Instagram", category: "Social Media" },
  twitter: { label: "X / Twitter", category: "Social Media" },
  youtube: { label: "YouTube", category: "Social Media" },
  linkedin: { label: "LinkedIn", category: "Social Media" },
  heygen: { label: "HeyGen (Video)", category: "Video & Audio" },
  elevenlabs: { label: "ElevenLabs (Voice)", category: "Video & Audio" },
  tavily: { label: "Tavily (Web Research)", category: "Agent Tools" },
  browserbase: { label: "Browserbase (Browser)", category: "Agent Tools" },
  make: { label: "Make.com (Automation)", category: "Agent Tools" },
};

function StatusIcon({ status }: { status: DiagResult["status"] }) {
  switch (status) {
    case "ok":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case "error":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "not_configured":
      return <MinusCircle className="h-5 w-5 text-gray-400" />;
  }
}

function StatusBadge({ status }: { status: DiagResult["status"] }) {
  const variants: Record<string, string> = {
    ok: "bg-green-100 text-green-800",
    warning: "bg-amber-100 text-amber-800",
    error: "bg-red-100 text-red-800",
    not_configured: "bg-gray-100 text-gray-600",
  };
  const labels: Record<string, string> = {
    ok: "Connected",
    warning: "Warning",
    error: "Error",
    not_configured: "Not Configured",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function AdminDiagnostics() {
  const [results, setResults] = useState<Record<string, DiagResult> | null>(null);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runDiagnostics = trpc.contentPipeline.systemDiagnostics.useMutation({
    onSuccess: (data) => {
      setResults(data as Record<string, DiagResult>);
      setLastRun(new Date());
    },
  });

  const categories = ["Core", "Social Media", "Video & Audio", "Agent Tools"];

  const grouped = (cat: string) =>
    Object.entries(SERVICE_LABELS)
      .filter(([, v]) => v.category === cat)
      .map(([key, v]) => ({ key, ...v, result: results?.[key] }));

  const summary = results
    ? {
        ok: Object.values(results).filter((r) => r.status === "ok").length,
        warning: Object.values(results).filter((r) => r.status === "warning").length,
        error: Object.values(results).filter((r) => r.status === "error").length,
        notConfigured: Object.values(results).filter((r) => r.status === "not_configured").length,
      }
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container pt-24 pb-12">
        <AdminNav />

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Activity className="h-8 w-8 text-primary" />
                System Diagnostics
              </h1>
              <p className="text-muted-foreground mt-1">
                Check the health of all integrations and services
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastRun && (
                <span className="text-sm text-muted-foreground">
                  Last run: {lastRun.toLocaleTimeString()}
                </span>
              )}
              <Button
                onClick={() => runDiagnostics.mutate()}
                disabled={runDiagnostics.isPending}
                size="lg"
              >
                {runDiagnostics.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Checks...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Run Diagnostics
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{summary.ok}</div>
                  <div className="text-sm text-green-700">Connected</div>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-amber-600">{summary.warning}</div>
                  <div className="text-sm text-amber-700">Warnings</div>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-red-600">{summary.error}</div>
                  <div className="text-sm text-red-700">Errors</div>
                </CardContent>
              </Card>
              <Card className="border-gray-200 bg-gray-50/50">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-gray-500">{summary.notConfigured}</div>
                  <div className="text-sm text-gray-600">Not Configured</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* No results yet */}
          {!results && !runDiagnostics.isPending && (
            <Card className="p-12 text-center">
              <Activity className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No diagnostics run yet</h2>
              <p className="text-muted-foreground mb-6">
                Click "Run Diagnostics" to check the status of all connected services.
              </p>
            </Card>
          )}

          {/* Results by Category */}
          {results &&
            categories.map((cat) => {
              const items = grouped(cat);
              if (items.length === 0) return null;
              return (
                <Card key={cat}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{cat}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {items.map(({ key, label, result }) => (
                      <div
                        key={key}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <StatusIcon status={result?.status ?? "not_configured"} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium">{label}</span>
                            <StatusBadge status={result?.status ?? "not_configured"} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {result?.message ?? "Not checked yet"}
                          </p>
                          {result?.details && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                Show details
                              </summary>
                              <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}

          {/* Error state */}
          {runDiagnostics.error && (
            <Card className="border-red-200 bg-red-50/50 p-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-6 w-6 text-red-500" />
                <div>
                  <h3 className="font-semibold text-red-800">Diagnostics Failed</h3>
                  <p className="text-sm text-red-700">{runDiagnostics.error.message}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
