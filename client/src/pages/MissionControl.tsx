import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  FileText,
  Lightbulb,
  RefreshCw,
  Shield,
  Zap,
  TrendingUp,
  Send,
  MessageSquare,
  Search,
  MessageCircle,
  Film,
  Loader2,
  Mic,
} from "lucide-react";
import { toast } from "sonner";
import AdminNav from "@/components/AdminNav";

export default function MissionControl() {
  const [activeTab, setActiveTab] = useState("overview");
  const [commandInput, setCommandInput] = useState("");
  const [feedbackInputs, setFeedbackInputs] = useState<Record<number, string>>({});
  const [showFeedback, setShowFeedback] = useState<Record<number, boolean>>({});

  // Research Agent state
  const [researchTopic, setResearchTopic] = useState("");
  const [researchScope, setResearchScope] = useState<string>("course");
  const [researchDepth, setResearchDepth] = useState<string>("standard");
  const [researchContext, setResearchContext] = useState("");
  const [createDraft, setCreateDraft] = useState(true);

  // Content Feedback state
  const [feedbackTarget, setFeedbackTarget] = useState<string>("blog_post");
  const [feedbackTargetId, setFeedbackTargetId] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackType, setFeedbackType] = useState<string>("suggestion");
  const [feedbackAutoApply, setFeedbackAutoApply] = useState(false);

  const agentState = trpc.agent.getState.useQuery();
  const businesses = trpc.agent.getBusinesses.useQuery();
  const pendingActions = trpc.agent.getPendingActions.useQuery();
  const recentActions = trpc.agent.getRecentActions.useQuery({ limit: 30 });
  const briefings = trpc.agent.getReports.useQuery({ type: "daily_briefing", limit: 5 });
  const ideas = trpc.agent.getReports.useQuery({ type: "idea", limit: 5 });

  const approveMutation = trpc.agent.approveAction.useMutation({
    onSuccess: () => {
      toast.success("Action approved");
      pendingActions.refetch();
      recentActions.refetch();
    },
  });

  const denyMutation = trpc.agent.denyAction.useMutation({
    onSuccess: () => {
      toast.success("Action denied");
      pendingActions.refetch();
      recentActions.refetch();
    },
  });

  const respondMutation = trpc.agent.respondToAction.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Action ${vars.decision === "approve" ? "approved" : vars.decision === "deny" ? "denied" : "updated"} with feedback`);
      setFeedbackInputs(prev => { const next = { ...prev }; delete next[vars.actionId]; return next; });
      setShowFeedback(prev => { const next = { ...prev }; delete next[vars.actionId]; return next; });
      pendingActions.refetch();
      recentActions.refetch();
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });

  const sendCommandMutation = trpc.agent.sendCommand.useMutation({
    onSuccess: () => {
      toast.success("Command sent to Mission Control");
      setCommandInput("");
      recentActions.refetch();
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });

  const runCycleMutation = trpc.agent.runCycle.useMutation({
    onSuccess: (data) => {
      toast.success(`Agent cycle complete: ${data.activeBusinesses} businesses monitored`);
      agentState.refetch();
      pendingActions.refetch();
      recentActions.refetch();
      briefings.refetch();
    },
    onError: (err) => toast.error(`Cycle failed: ${err.message}`),
  });

  const markReadMutation = trpc.agent.markReportRead.useMutation({
    onSuccess: () => briefings.refetch(),
  });

  // Research Agent mutations
  const researchReports = trpc.agent.getReports.useQuery({ type: "research", limit: 10 });

  const conductResearch = trpc.agent.conductResearch.useMutation({
    onSuccess: (data) => {
      toast.success("Research complete!");
      setResearchTopic("");
      setResearchContext("");
      researchReports.refetch();
    },
    onError: (err) => toast.error(`Research failed: ${err.message}`),
  });

  const analyzeCompetitors = trpc.agent.analyzeCompetitors.useMutation({
    onSuccess: () => {
      toast.success("Competitor analysis complete!");
      setResearchTopic("");
      researchReports.refetch();
    },
    onError: (err) => toast.error(`Analysis failed: ${err.message}`),
  });

  // Content Feedback mutation
  const submitFeedback = trpc.agent.submitContentFeedback.useMutation({
    onSuccess: (data) => {
      toast.success(`Feedback processed: ${data.success ? "applied" : "proposed"}`);
      setFeedbackText("");
      setFeedbackTargetId("");
      recentActions.refetch();
    },
    onError: (err) => toast.error(`Feedback failed: ${err.message}`),
  });

  // Video Producer status
  const videoStatus = trpc.admin.videoProducerStatus.useQuery(undefined, { retry: false });

  const state = agentState.data;

  return (
    <div className="dark min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-400" />
            <div>
              <h1 className="text-xl font-bold">Mission Control</h1>
              <p className="text-sm text-gray-400">Autonomous Business Operating System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {state?.isRunning && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-400 animate-pulse">
                <Activity className="h-3 w-3 mr-1" /> Running
              </Badge>
            )}
            <Badge variant="outline" className="border-gray-600 text-gray-300">
              {state?.activeBusinesses || 0} businesses
            </Badge>
            {(state?.pendingApprovals || 0) > 0 && (
              <Badge className="bg-orange-600">
                {state?.pendingApprovals} pending
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => runCycleMutation.mutate()}
              disabled={runCycleMutation.isPending}
              className="border-purple-600 text-purple-300 hover:bg-purple-600/20"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${runCycleMutation.isPending ? "animate-spin" : ""}`} />
              Run Cycle
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <AdminNav />
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <Building2 className="h-6 w-6 mx-auto mb-1 text-blue-400" />
              <div className="text-2xl font-bold">{state?.activeBusinesses || 0}</div>
              <div className="text-xs text-gray-400">Active Businesses</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-1 text-orange-400" />
              <div className="text-2xl font-bold">{state?.pendingApprovals || 0}</div>
              <div className="text-xs text-gray-400">Pending Approvals</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <Zap className="h-6 w-6 mx-auto mb-1 text-green-400" />
              <div className="text-2xl font-bold">{state?.todayActions || 0}</div>
              <div className="text-xs text-gray-400">Actions Today</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-yellow-400" />
              <div className="text-2xl font-bold">{state?.alerts?.length || 0}</div>
              <div className="text-xs text-gray-400">Active Alerts</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4 text-center">
              <Activity className="h-6 w-6 mx-auto mb-1 text-purple-400" />
              <div className="text-sm font-medium">
                {state?.lastRun
                  ? new Date(state.lastRun).toLocaleTimeString()
                  : "Never"}
              </div>
              <div className="text-xs text-gray-400">Last Run</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-900 border border-gray-800 mb-6 flex-wrap">
            <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="approvals" className="text-gray-300 data-[state=active]:text-white">
              Approvals {(pendingActions.data?.length || 0) > 0 && `(${pendingActions.data?.length})`}
            </TabsTrigger>
            <TabsTrigger value="research" className="text-gray-300 data-[state=active]:text-white">
              <Search className="h-3.5 w-3.5 mr-1" /> Research
            </TabsTrigger>
            <TabsTrigger value="feedback" className="text-gray-300 data-[state=active]:text-white">
              <MessageCircle className="h-3.5 w-3.5 mr-1" /> Feedback
            </TabsTrigger>
            <TabsTrigger value="video-producer" className="text-gray-300 data-[state=active]:text-white">
              <Film className="h-3.5 w-3.5 mr-1" /> Video
            </TabsTrigger>
            <TabsTrigger value="businesses" className="text-gray-300 data-[state=active]:text-white">Businesses</TabsTrigger>
            <TabsTrigger value="briefings" className="text-gray-300 data-[state=active]:text-white">Briefings</TabsTrigger>
            <TabsTrigger value="ideas" className="text-gray-300 data-[state=active]:text-white">Ideas</TabsTrigger>
            <TabsTrigger value="history" className="text-gray-300 data-[state=active]:text-white">History</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Command Input */}
              <Card className="bg-gray-900/50 border-gray-800 md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <MessageSquare className="h-5 w-5 text-green-400" />
                    Talk to Mission Control
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Send instructions, ask questions, or tell the agent what to do next
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && commandInput.trim()) {
                          sendCommandMutation.mutate({ message: commandInput.trim() });
                        }
                      }}
                      placeholder="e.g., 'Generate 5 Instagram posts about recovery', 'Fix the content queue', 'Pause all posting'..."
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <Button
                      onClick={() => commandInput.trim() && sendCommandMutation.mutate({ message: commandInput.trim() })}
                      disabled={sendCommandMutation.isPending || !commandInput.trim()}
                      className="bg-purple-700 hover:bg-purple-600"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      {sendCommandMutation.isPending ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Latest Briefing */}
              <Card className="bg-gray-900/50 border-gray-800 md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileText className="h-5 w-5 text-blue-400" />
                    Latest Briefing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {briefings.data?.[0] ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: briefings.data[0].content
                            .replace(/^## /gm, "<h2>")
                            .replace(/^### /gm, "<h3>")
                            .replace(/^- /gm, "<li>")
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/\n/g, "<br/>"),
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-4">
                        Generated: {new Date(briefings.data[0].created_at).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400">No briefings yet. Run an agent cycle to generate one.</p>
                  )}
                </CardContent>
              </Card>

              {/* Active Alerts */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    Active Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {state?.alerts?.length ? (
                    state.alerts.map((alert, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border ${
                          alert.severity === "critical"
                            ? "border-red-800 bg-red-950/30"
                            : alert.severity === "warning"
                            ? "border-yellow-800 bg-yellow-950/30"
                            : "border-gray-700 bg-gray-800/30"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={
                              alert.severity === "critical"
                                ? "border-red-500 text-red-400"
                                : alert.severity === "warning"
                                ? "border-yellow-500 text-yellow-400"
                                : "border-gray-500 text-gray-400"
                            }
                          >
                            {alert.severity}
                          </Badge>
                          <span className="text-sm font-medium text-gray-100">{alert.title}</span>
                        </div>
                        <p className="text-xs text-gray-400">{alert.message}</p>
                        {alert.suggestedAction && (
                          <p className="text-xs text-blue-400 mt-1">Suggested: {alert.suggestedAction}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">No active alerts. All systems operational.</p>
                  )}
                </CardContent>
              </Card>

              {/* Risk Tier Legend */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Shield className="h-5 w-5 text-green-400" />
                    Risk Tiers
                  </CardTitle>
                  <CardDescription className="text-gray-400">How the agent handles different action types</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { tier: 1, label: "Auto-Execute", desc: "Post content, send scheduled emails", color: "text-green-400 border-green-800" },
                    { tier: 2, label: "Execute + Notify", desc: "Spend < $25, adjust schedules", color: "text-blue-400 border-blue-800" },
                    { tier: 3, label: "Ask First", desc: "Spend > $25, contact customers", color: "text-yellow-400 border-yellow-800" },
                    { tier: 4, label: "Must Approve", desc: "Financial > $100, pricing, new business", color: "text-red-400 border-red-800" },
                  ].map((t) => (
                    <div key={t.tier} className={`p-2 rounded border ${t.color} bg-gray-800/30`}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={t.color}>Tier {t.tier}</Badge>
                        <span className="text-sm font-medium text-gray-100">{t.label}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{t.desc}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* APPROVALS TAB */}
          <TabsContent value="approvals">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Pending Approvals</CardTitle>
                <CardDescription className="text-gray-400">
                  Actions the agent wants to take but needs your approval first
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingActions.data?.length ? (
                  pendingActions.data.map((action: any) => (
                    <div key={action.id} className="p-4 rounded-lg border border-gray-700 bg-gray-800/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="border-orange-600 text-orange-400">
                              Tier {action.risk_tier}
                            </Badge>
                            <Badge variant="outline" className="border-gray-600 text-gray-300">
                              {action.category}
                            </Badge>
                            {action.business_name && (
                              <Badge variant="outline" className="border-purple-600 text-purple-300">
                                {action.business_name}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium mb-1 text-gray-100">{action.title}</h4>
                          <p className="text-sm text-gray-400">{action.description}</p>
                          {action.cost_estimate > 0 && (
                            <p className="text-sm text-yellow-400 mt-1">
                              Estimated cost: ${(action.cost_estimate / 100).toFixed(2)}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Proposed: {new Date(action.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const fb = feedbackInputs[action.id];
                                if (fb) {
                                  respondMutation.mutate({ actionId: action.id, decision: "approve", feedback: fb });
                                } else {
                                  approveMutation.mutate({ actionId: action.id });
                                }
                              }}
                              disabled={approveMutation.isPending || respondMutation.isPending}
                              className="bg-green-700 hover:bg-green-600"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Yes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const fb = feedbackInputs[action.id];
                                if (fb) {
                                  respondMutation.mutate({ actionId: action.id, decision: "deny", feedback: fb });
                                } else {
                                  denyMutation.mutate({ actionId: action.id });
                                }
                              }}
                              disabled={denyMutation.isPending || respondMutation.isPending}
                              className="border-red-700 text-red-400 hover:bg-red-700/20"
                            >
                              <XCircle className="h-4 w-4 mr-1" /> No
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowFeedback(prev => ({ ...prev, [action.id]: !prev[action.id] }))}
                              className="border-blue-700 text-blue-400 hover:bg-blue-700/20"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" /> Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                      {/* Feedback input */}
                      {showFeedback[action.id] && (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={feedbackInputs[action.id] || ""}
                            onChange={(e) => setFeedbackInputs(prev => ({ ...prev, [action.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && feedbackInputs[action.id]?.trim()) {
                                respondMutation.mutate({
                                  actionId: action.id,
                                  decision: "modify",
                                  feedback: feedbackInputs[action.id].trim(),
                                });
                              }
                            }}
                            placeholder="Add feedback, modify instructions, or explain why..."
                            className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                          />
                          <Button
                            size="sm"
                            onClick={() => feedbackInputs[action.id]?.trim() && respondMutation.mutate({
                              actionId: action.id,
                              decision: "modify",
                              feedback: feedbackInputs[action.id].trim(),
                            })}
                            disabled={respondMutation.isPending || !feedbackInputs[action.id]?.trim()}
                            className="bg-blue-700 hover:bg-blue-600"
                          >
                            <Send className="h-3 w-3 mr-1" /> Send
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                    <p>No pending approvals. The agent is handling everything within its authority.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* RESEARCH AGENT TAB */}
          <TabsContent value="research">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gray-900/50 border-gray-800 md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Search className="h-5 w-5 text-cyan-400" />
                    Research Agent
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Conduct market research, competitor analysis, and draft courses or lead magnets
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">Topic</label>
                    <input
                      type="text"
                      value={researchTopic}
                      onChange={(e) => setResearchTopic(e.target.value)}
                      placeholder="e.g., 'addiction recovery online courses', 'trauma-informed coaching certifications'"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-1 block">Scope</label>
                      <select
                        value={researchScope}
                        onChange={(e) => setResearchScope(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="course">Course</option>
                        <option value="digital_product">Digital Product</option>
                        <option value="lead_magnet">Lead Magnet</option>
                        <option value="blog_series">Blog Series</option>
                        <option value="social_campaign">Social Campaign</option>
                        <option value="content_strategy">Content Strategy</option>
                        <option value="competitor_analysis">Competitor Analysis</option>
                        <option value="market_research">Market Research</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-1 block">Depth</label>
                      <select
                        value={researchDepth}
                        onChange={(e) => setResearchDepth(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="quick">Quick (3-5 findings)</option>
                        <option value="standard">Standard (8-12 findings)</option>
                        <option value="deep">Deep (15+ findings)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">Additional Context (optional)</label>
                    <textarea
                      value={researchContext}
                      onChange={(e) => setResearchContext(e.target.value)}
                      placeholder="Any specific angles, requirements, or constraints..."
                      rows={3}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createDraft}
                      onChange={(e) => setCreateDraft(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Create draft from research</span>
                  </label>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => conductResearch.mutate({
                        scope: researchScope as any,
                        topic: researchTopic,
                        context: researchContext || undefined,
                        depth: researchDepth as any,
                        createDraft,
                      })}
                      disabled={conductResearch.isPending || !researchTopic.trim()}
                      className="bg-cyan-700 hover:bg-cyan-600"
                    >
                      {conductResearch.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Researching...</>
                      ) : (
                        <><Search className="h-4 w-4 mr-2" /> Run Research</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => analyzeCompetitors.mutate({ topic: researchTopic })}
                      disabled={analyzeCompetitors.isPending || !researchTopic.trim()}
                      className="border-cyan-700 text-cyan-300 hover:bg-cyan-700/20"
                    >
                      {analyzeCompetitors.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                      ) : (
                        <><TrendingUp className="h-4 w-4 mr-2" /> Competitor Analysis</>
                      )}
                    </Button>
                  </div>

                  {conductResearch.isSuccess && conductResearch.data && (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-cyan-300 mb-2">
                          <CheckCircle2 className="h-4 w-4 inline mr-1" /> Research Complete
                        </p>
                        <pre className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-gray-300 text-xs">
                          {JSON.stringify(conductResearch.data, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              {/* Research Reports */}
              <div className="space-y-4">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Recent Research</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                    {researchReports.data?.map((report: any) => (
                      <div key={report.id} className="p-3 rounded-lg border border-gray-700 bg-gray-800/30">
                        <h4 className="text-sm font-medium text-gray-100 mb-1">{report.title}</h4>
                        <p className="text-xs text-gray-400 line-clamp-3">{report.content?.substring(0, 200)}...</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(report.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {!researchReports.data?.length && (
                      <p className="text-sm text-gray-500">No research reports yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* CONTENT FEEDBACK TAB */}
          <TabsContent value="feedback">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <MessageCircle className="h-5 w-5 text-amber-400" />
                    Content Feedback Agent
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Submit feedback on any content asset — the agent analyzes and applies changes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-1 block">Content Type</label>
                      <select
                        value={feedbackTarget}
                        onChange={(e) => setFeedbackTarget(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="blog_post">Blog Post</option>
                        <option value="social_post">Social Post</option>
                        <option value="course_lesson">Course Lesson</option>
                        <option value="course_module">Course Module</option>
                        <option value="lead_magnet">Lead Magnet</option>
                        <option value="image">Image</option>
                        <option value="video_script">Video Script</option>
                        <option value="audio_script">Audio Script</option>
                        <option value="page_copy">Page Copy</option>
                        <option value="product_description">Product Description</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-1 block">Feedback Type</label>
                      <select
                        value={feedbackType}
                        onChange={(e) => setFeedbackType(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="suggestion">Suggestion</option>
                        <option value="criticism">Criticism</option>
                        <option value="bug_report">Bug Report</option>
                        <option value="content_update">Content Update</option>
                        <option value="style_change">Style Change</option>
                        <option value="factual_correction">Factual Correction</option>
                        <option value="tone_adjustment">Tone Adjustment</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">Target ID (numeric)</label>
                    <input
                      type="number"
                      value={feedbackTargetId}
                      onChange={(e) => setFeedbackTargetId(e.target.value)}
                      placeholder="e.g., blog post ID, lesson ID..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">Your Feedback</label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Describe what you'd like changed, improved, or fixed..."
                      rows={4}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={feedbackAutoApply}
                      onChange={(e) => setFeedbackAutoApply(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">Auto-apply if within risk tier (tier 1-2)</span>
                  </label>

                  <Button
                    onClick={() => submitFeedback.mutate({
                      target: feedbackTarget as any,
                      targetId: feedbackTargetId ? parseInt(feedbackTargetId) : undefined,
                      feedback: feedbackText,
                      feedbackType: feedbackType as any,
                      autoApply: feedbackAutoApply,
                    })}
                    disabled={submitFeedback.isPending || !feedbackText.trim()}
                    className="w-full bg-amber-700 hover:bg-amber-600"
                  >
                    {submitFeedback.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing Feedback...</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" /> Submit Feedback</>
                    )}
                  </Button>

                  {submitFeedback.data && (
                    <Card className="bg-gray-800/50 border-gray-700">
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-amber-300 mb-2">
                          <CheckCircle2 className="h-4 w-4 inline mr-1" /> Feedback Processed
                        </p>
                        <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                          {JSON.stringify(submitFeedback.data, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              {/* Feedback Guide */}
              <div className="space-y-4">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">How It Works</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-gray-400">
                    <div className="p-3 rounded border border-gray-700 bg-gray-800/30">
                      <p className="font-medium text-gray-200 mb-1">Risk-Tiered Processing</p>
                      <p>The agent assesses the impact of each change:</p>
                      <ul className="mt-2 space-y-1 text-xs">
                        <li><Badge variant="outline" className="text-xs border-green-600 text-green-400 mr-1">Tier 1</Badge> Bug fixes, minor social edits — auto-applied</li>
                        <li><Badge variant="outline" className="text-xs border-blue-600 text-blue-400 mr-1">Tier 2</Badge> Blog corrections, images — applied + notification</li>
                        <li><Badge variant="outline" className="text-xs border-yellow-600 text-yellow-400 mr-1">Tier 3</Badge> Course content, lead magnets — needs approval</li>
                        <li><Badge variant="outline" className="text-xs border-red-600 text-red-400 mr-1">Tier 4</Badge> Page copy, pricing — must approve</li>
                      </ul>
                    </div>
                    <div className="p-3 rounded border border-gray-700 bg-gray-800/30">
                      <p className="font-medium text-gray-200 mb-1">Supported Targets</p>
                      <p className="text-xs">Blog posts, social posts, course lessons & modules, lead magnets, images, video/audio scripts, page copy, product descriptions</p>
                    </div>
                    <div className="p-3 rounded border border-gray-700 bg-gray-800/30">
                      <p className="font-medium text-gray-200 mb-1">Finding Target IDs</p>
                      <p className="text-xs">Check the Blog Editor, Content Pipeline, or Videos page for numeric IDs. For blog posts, the ID is in the URL when editing.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* VIDEO PRODUCER TAB */}
          <TabsContent value="video-producer">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Film className="h-5 w-5 text-rose-400" />
                    Video Producer Status
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    HeyGen avatar video generation and ElevenLabs audio synthesis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {videoStatus.isLoading ? (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin" /> Checking status...
                    </div>
                  ) : videoStatus.error ? (
                    <div className="p-3 rounded border border-red-800 bg-red-950/30">
                      <p className="text-sm text-red-400">Failed to check status: {videoStatus.error.message}</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Film className="h-5 w-5 text-rose-400" />
                            <span className="font-medium text-gray-200">HeyGen</span>
                          </div>
                          {videoStatus.data?.heygenConfigured ? (
                            <>
                              <Badge className="bg-green-900/50 text-green-400 border-green-700 mb-2">Connected</Badge>
                              {videoStatus.data.heygenCredits && (
                                <p className="text-sm text-gray-300">Credits: <strong>{videoStatus.data.heygenCredits.remaining}</strong></p>
                              )}
                              {videoStatus.data.avatarId && (
                                <p className="text-xs text-gray-500 mt-1">Avatar: {videoStatus.data.avatarId}</p>
                              )}
                            </>
                          ) : (
                            <Badge variant="outline" className="border-orange-600 text-orange-400">Not Configured</Badge>
                          )}
                        </div>
                        <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Mic className="h-5 w-5 text-purple-400" />
                            <span className="font-medium text-gray-200">ElevenLabs</span>
                          </div>
                          {videoStatus.data?.elevenlabsConfigured ? (
                            <Badge className="bg-green-900/50 text-green-400 border-green-700">Connected</Badge>
                          ) : (
                            <Badge variant="outline" className="border-orange-600 text-orange-400">Not Configured</Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => videoStatus.refetch()}
                        disabled={videoStatus.isFetching}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${videoStatus.isFetching ? "animate-spin" : ""}`} />
                        Refresh Status
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a href="/admin/videos">
                    <Button className="w-full bg-rose-700 hover:bg-rose-600 mb-2">
                      <Film className="h-4 w-4 mr-2" />
                      Open Video Generation Dashboard
                    </Button>
                  </a>
                  <div className="p-3 rounded border border-gray-700 bg-gray-800/30">
                    <p className="text-sm text-gray-300 font-medium mb-2">Video Producer Agent Capabilities:</p>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>- Batch generate HeyGen avatar videos for course lessons</li>
                      <li>- Auto-extract scripts from course content (modules 1-4)</li>
                      <li>- AI-generate scripts for modules 5-8</li>
                      <li>- ElevenLabs audio narration fallback</li>
                      <li>- Test mode for free watermarked previews</li>
                      <li>- 3,000 char limit per HeyGen video script</li>
                    </ul>
                  </div>
                  <div className="p-3 rounded border border-gray-700 bg-gray-800/30">
                    <p className="text-sm text-gray-300 font-medium mb-2">Pipeline:</p>
                    <p className="text-xs text-gray-400">
                      Script extraction → HeyGen render (3-10 min) → Storage upload → DB update → YouTube upload (optional)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* BUSINESSES TAB */}
          <TabsContent value="businesses">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businesses.data?.map((biz: any) => (
                <Card key={biz.id} className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">{biz.name}</CardTitle>
                      <Badge
                        className={
                          biz.status === "active"
                            ? "bg-green-700"
                            : biz.status === "paused"
                            ? "bg-yellow-700"
                            : "bg-gray-600"
                        }
                      >
                        {biz.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-400">{biz.domain || "No domain"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">Type: {biz.business_type}</span>
                    </div>
                    {biz.daily_budget > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">
                          Budget: ${(biz.daily_budget / 100).toFixed(0)}/day | ${(biz.monthly_budget / 100).toFixed(0)}/mo
                        </span>
                      </div>
                    )}
                    {biz.brand_voice && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-3">{biz.brand_voice}</p>
                    )}
                    {biz.products?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Products:</p>
                        <div className="flex flex-wrap gap-1">
                          {biz.products.map((p: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs border-gray-600 text-gray-400">
                              {p.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* BRIEFINGS TAB */}
          <TabsContent value="briefings">
            <div className="space-y-4">
              {briefings.data?.map((report: any) => (
                <Card key={report.id} className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-white">
                        <FileText className="h-5 w-5 text-blue-400" />
                        {report.title}
                      </CardTitle>
                      {!report.is_read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markReadMutation.mutate({ reportId: report.id })}
                          className="text-gray-400"
                        >
                          Mark Read
                        </Button>
                      )}
                    </div>
                    <CardDescription className="text-gray-400">{new Date(report.created_at).toLocaleString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                      {report.content}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!briefings.data?.length && (
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="py-12 text-center text-gray-400">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No briefings yet. The agent generates daily briefings after 6 AM.</p>
                    <Button
                      className="mt-4"
                      variant="outline"
                      onClick={() => runCycleMutation.mutate()}
                    >
                      Generate Now
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* IDEAS TAB */}
          <TabsContent value="ideas">
            <div className="space-y-4">
              {ideas.data?.map((report: any) => (
                <Card key={report.id} className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Lightbulb className="h-5 w-5 text-yellow-400" />
                      {report.title}
                    </CardTitle>
                    <CardDescription className="text-gray-400">{new Date(report.created_at).toLocaleString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                      {report.content}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!ideas.data?.length && (
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="py-12 text-center text-gray-400">
                    <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No strategic ideas yet. The agent generates new ideas weekly.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ACTION HISTORY TAB */}
          <TabsContent value="history">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Action History</CardTitle>
                <CardDescription className="text-gray-400">Everything the agent has done or proposed</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActions.data?.length ? (
                  <div className="space-y-2">
                    {recentActions.data.map((action: any) => (
                      <div
                        key={action.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-700/50 bg-gray-800/20"
                      >
                        {action.status === "executed" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                        ) : action.status === "failed" ? (
                          <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                        ) : action.status === "proposed" ? (
                          <Clock className="h-5 w-5 text-orange-400 shrink-0" />
                        ) : action.status === "denied" ? (
                          <XCircle className="h-5 w-5 text-gray-500 shrink-0" />
                        ) : (
                          <Activity className="h-5 w-5 text-blue-400 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate text-gray-100">{action.title}</span>
                            <Badge variant="outline" className="text-xs border-gray-600 shrink-0">
                              {action.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 truncate">
                            {action.business_name || "System"} | Tier {action.risk_tier} |{" "}
                            {new Date(action.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`shrink-0 ${
                            action.status === "executed"
                              ? "border-green-600 text-green-400"
                              : action.status === "failed"
                              ? "border-red-600 text-red-400"
                              : action.status === "denied"
                              ? "border-gray-600 text-gray-400"
                              : "border-orange-600 text-orange-400"
                          }`}
                        >
                          {action.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No actions recorded yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
