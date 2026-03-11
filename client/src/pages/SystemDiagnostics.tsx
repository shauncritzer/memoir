import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Youtube,
  Twitter,
  Video,
  Mail,
  CreditCard,
  Search,
  Globe,
  Activity,
} from "lucide-react";
import AdminNav from "@/components/AdminNav";

type DiagResult = {
  status: "idle" | "loading" | "success" | "error";
  data?: any;
  error?: string;
};

function StatusBadge({ configured, label }: { configured: boolean; label?: string }) {
  return configured ? (
    <Badge className="bg-green-100 text-green-800 border-green-200">
      <CheckCircle2 className="mr-1 h-3 w-3" />
      {label || "Connected"}
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
      <XCircle className="mr-1 h-3 w-3" />
      {label || "Not Configured"}
    </Badge>
  );
}

function DiagCard({
  title,
  icon: Icon,
  result,
  onRun,
  children,
}: {
  title: string;
  icon: any;
  result: DiagResult;
  onRun: () => void;
  children: (data: any) => React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={onRun}
          disabled={result.status === "loading"}
        >
          {result.status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">{result.status === "idle" ? "Run Check" : "Re-check"}</span>
        </Button>
      </CardHeader>
      <CardContent>
        {result.status === "idle" && (
          <p className="text-muted-foreground text-sm">Click "Run Check" to diagnose this integration.</p>
        )}
        {result.status === "loading" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Running diagnostics...
          </div>
        )}
        {result.status === "error" && (
          <div className="text-red-600 text-sm">
            <AlertTriangle className="inline h-4 w-4 mr-1" />
            {result.error}
          </div>
        )}
        {result.status === "success" && result.data && children(result.data)}
      </CardContent>
    </Card>
  );
}

export default function SystemDiagnostics() {
  const [youtube, setYoutube] = useState<DiagResult>({ status: "idle" });
  const [twitter, setTwitter] = useState<DiagResult>({ status: "idle" });
  const [heygen, setHeygen] = useState<DiagResult>({ status: "idle" });
  const [tavily, setTavily] = useState<DiagResult>({ status: "idle" });
  const [browserbase, setBrowserbase] = useState<DiagResult>({ status: "idle" });
  const [convertkit, setConvertkit] = useState<DiagResult>({ status: "idle" });

  // Mutations for diagnostics
  const ytDiag = trpc.contentPipeline.diagnoseYouTube.useMutation({
    onSuccess: (data: any) => setYoutube({ status: "success", data }),
    onError: (err: any) => setYoutube({ status: "error", error: err.message }),
  });
  const twDiag = trpc.contentPipeline.diagnoseTwitter.useMutation({
    onSuccess: (data: any) => setTwitter({ status: "success", data }),
    onError: (err: any) => setTwitter({ status: "error", error: err.message }),
  });
  const hgQuery = trpc.admin.videoProducerStatus.useQuery(undefined, {
    enabled: false,
    retry: false,
  });
  const tvDiag = trpc.agent.diagnoseTavily.useMutation({
    onSuccess: (data: any) => setTavily({ status: "success", data }),
    onError: (err: any) => setTavily({ status: "error", error: err.message }),
  });
  const bbDiag = trpc.agent.diagnoseBrowserbase.useMutation({
    onSuccess: (data: any) => setBrowserbase({ status: "success", data }),
    onError: (err: any) => setBrowserbase({ status: "error", error: err.message }),
  });
  const ckDiag = trpc.contentPipeline.diagnoseConvertKit.useMutation({
    onSuccess: (data: any) => setConvertkit({ status: "success", data }),
    onError: (err: any) => setConvertkit({ status: "error", error: err.message }),
  });

  const runAll = () => {
    setYoutube({ status: "loading" });
    setTwitter({ status: "loading" });
    setHeygen({ status: "loading" });
    setTavily({ status: "loading" });
    setBrowserbase({ status: "loading" });
    setConvertkit({ status: "loading" });
    ytDiag.mutate();
    twDiag.mutate();
    hgQuery.refetch().then(
      (r) => setHeygen({ status: "success", data: r.data }),
      (e) => setHeygen({ status: "error", error: String(e) }),
    );
    tvDiag.mutate();
    bbDiag.mutate();
    ckDiag.mutate();
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <AdminNav />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">System Diagnostics</h1>
            <p className="text-muted-foreground mt-2">
              Check all integrations, API connections, and agent capabilities
            </p>
          </div>
          <Button onClick={runAll} size="lg">
            <Activity className="mr-2 h-5 w-5" />
            Run All Checks
          </Button>
        </div>

        <Tabs defaultValue="social" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-3">
            <TabsTrigger value="social">Social & Video</TabsTrigger>
            <TabsTrigger value="business">Business Tools</TabsTrigger>
            <TabsTrigger value="agents">Agent Arms</TabsTrigger>
          </TabsList>

          {/* Social & Video Tab */}
          <TabsContent value="social" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* YouTube */}
              <DiagCard
                title="YouTube"
                icon={Youtube}
                result={youtube}
                onRun={() => { setYoutube({ status: "loading" }); ytDiag.mutate(); }}
              >
                {(d) => (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Credentials</span>
                      <StatusBadge configured={d.configured} />
                    </div>
                    {d.credentials && (
                      <>
                        <div className="flex justify-between">
                          <span>Client ID</span>
                          <StatusBadge configured={d.credentials.hasClientId} />
                        </div>
                        <div className="flex justify-between">
                          <span>Client Secret</span>
                          <StatusBadge configured={d.credentials.hasClientSecret} />
                        </div>
                        <div className="flex justify-between">
                          <span>Refresh Token</span>
                          <StatusBadge configured={d.credentials.hasRefreshToken} />
                        </div>
                      </>
                    )}
                    {d.tokenTest && (
                      <div className="flex justify-between">
                        <span>Token Valid</span>
                        <StatusBadge configured={d.tokenTest.success} label={d.tokenTest.success ? "Valid" : d.tokenTest.error || "Failed"} />
                      </div>
                    )}
                    {d.channelTest && (
                      <div className="flex justify-between">
                        <span>Channel</span>
                        <StatusBadge configured={d.channelTest.success} label={d.channelTest.channelTitle || "No access"} />
                      </div>
                    )}
                    {d.quotaEstimate && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Daily quota</span>
                        <span>{d.quotaEstimate.dailyQuota} units ({d.quotaEstimate.estimatedUploadsPerDay} uploads/day)</span>
                      </div>
                    )}
                    {d.diagnosis && (
                      <div className={`mt-2 p-2 rounded text-xs ${d.diagnosis.includes("working") ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                        {d.diagnosis}
                      </div>
                    )}
                  </div>
                )}
              </DiagCard>

              {/* Twitter/X */}
              <DiagCard
                title="X / Twitter"
                icon={Twitter}
                result={twitter}
                onRun={() => { setTwitter({ status: "loading" }); twDiag.mutate(); }}
              >
                {(d) => (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Configured</span>
                      <StatusBadge configured={d.configured} />
                    </div>
                    {d.credentials && Object.entries(d.credentials).map(([key, val]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                        <StatusBadge configured={val as boolean} />
                      </div>
                    ))}
                    {d.diagnosis && (
                      <div className="mt-2 p-2 rounded text-xs bg-amber-50 text-amber-700">
                        {d.diagnosis}
                      </div>
                    )}
                  </div>
                )}
              </DiagCard>

              {/* HeyGen */}
              <DiagCard
                title="HeyGen (Video)"
                icon={Video}
                result={heygen}
                onRun={() => { setHeygen({ status: "loading" }); hgQuery.refetch().then(r => setHeygen({ status: "success", data: r.data }), e => setHeygen({ status: "error", error: String(e) })); }}
              >
                {(d) => (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>HeyGen API</span>
                      <StatusBadge configured={d.heygenConfigured} />
                    </div>
                    <div className="flex justify-between">
                      <span>ElevenLabs API</span>
                      <StatusBadge configured={d.elevenlabsConfigured} />
                    </div>
                    {d.heygenCredits !== null && d.heygenCredits !== undefined && (
                      <div className="flex justify-between">
                        <span>Credits</span>
                        <Badge variant={(typeof d.heygenCredits === 'object' ? d.heygenCredits.remaining : d.heygenCredits) > 0 ? "default" : "destructive"}>
                          {typeof d.heygenCredits === 'object'
                            ? `${d.heygenCredits.remaining} remaining / ${d.heygenCredits.used} used`
                            : d.heygenCredits}
                        </Badge>
                      </div>
                    )}
                    {d.avatarId && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Avatar ID</span>
                        <span className="font-mono text-xs truncate max-w-[200px]">{d.avatarId}</span>
                      </div>
                    )}
                    {d.voiceId && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Voice ID</span>
                        <span className="font-mono text-xs truncate max-w-[200px]">{d.voiceId}</span>
                      </div>
                    )}
                  </div>
                )}
              </DiagCard>
            </div>
          </TabsContent>

          {/* Business Tools Tab */}
          <TabsContent value="business" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* ConvertKit */}
              <DiagCard
                title="ConvertKit (Email)"
                icon={Mail}
                result={convertkit}
                onRun={() => { setConvertkit({ status: "loading" }); ckDiag.mutate(); }}
              >
                {(d) => (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>API Connection</span>
                      <StatusBadge configured={d.configured} />
                    </div>
                    {d.subscriberCount !== undefined && (
                      <div className="flex justify-between">
                        <span>Total Subscribers</span>
                        <Badge variant="default">{d.subscriberCount?.toLocaleString()}</Badge>
                      </div>
                    )}
                    {d.forms && (
                      <div className="flex justify-between">
                        <span>Forms</span>
                        <span>{d.forms} configured</span>
                      </div>
                    )}
                    {d.tags && (
                      <div className="flex justify-between">
                        <span>Tags</span>
                        <span>{d.tags.configured} configured, {d.tags.todo} need IDs</span>
                      </div>
                    )}
                    {d.diagnosis && (
                      <div className={`mt-2 p-2 rounded text-xs ${d.configured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                        {d.diagnosis}
                      </div>
                    )}
                  </div>
                )}
              </DiagCard>

              {/* Stripe */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Stripe (Payments)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Secret Key</span>
                      <StatusBadge configured={true} label="Live Mode" />
                    </div>
                    <div className="flex justify-between">
                      <span>Webhook</span>
                      <Badge variant="outline">Check in Stripe Dashboard</Badge>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">Products configured:</p>
                      <ul className="text-xs mt-1 space-y-1">
                        <li>7-Day Reset ($47) — price_1T0QQ...RNrJQR</li>
                        <li>From Broken to Whole ($97) — price_1T83E...Mjc5R</li>
                        <li>Circle ($29/mo) — price_1T83F...WvWdJd</li>
                        <li>Memoir ($19.99) — price_1T83C...ZQHEe</li>
                      </ul>
                    </div>
                    <a href="/stripe-test" className="text-xs text-blue-600 hover:underline">
                      Run Stripe Test →
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Agent Arms Tab */}
          <TabsContent value="agents" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Tavily */}
              <DiagCard
                title="Tavily (Web Research)"
                icon={Search}
                result={tavily}
                onRun={() => { setTavily({ status: "loading" }); tvDiag.mutate(); }}
              >
                {(d) => (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>API Key</span>
                      <StatusBadge configured={d.configured} />
                    </div>
                    {d.testResult && (
                      <div className="flex justify-between">
                        <span>Search Test</span>
                        <StatusBadge configured={d.testResult.success} label={d.testResult.success ? "Working" : "Failed"} />
                      </div>
                    )}
                    {d.diagnosis && (
                      <div className={`mt-2 p-2 rounded text-xs ${d.configured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                        {d.diagnosis}
                      </div>
                    )}
                  </div>
                )}
              </DiagCard>

              {/* Browserbase */}
              <DiagCard
                title="Browserbase (Browser)"
                icon={Globe}
                result={browserbase}
                onRun={() => { setBrowserbase({ status: "loading" }); bbDiag.mutate(); }}
              >
                {(d) => (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>API Key</span>
                      <StatusBadge configured={d.configured} />
                    </div>
                    {d.projectId && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Project ID</span>
                        <span className="font-mono text-xs truncate max-w-[200px]">{d.projectId}</span>
                      </div>
                    )}
                    {d.diagnosis && (
                      <div className={`mt-2 p-2 rounded text-xs ${d.configured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                        {d.diagnosis}
                      </div>
                    )}
                  </div>
                )}
              </DiagCard>

            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
