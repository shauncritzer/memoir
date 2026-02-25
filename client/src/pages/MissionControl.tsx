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
} from "lucide-react";
import { toast } from "sonner";

export default function MissionControl() {
  const [activeTab, setActiveTab] = useState("overview");

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
          <TabsList className="bg-gray-900 border border-gray-800 mb-6">
            <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="approvals" className="text-gray-300 data-[state=active]:text-white">
              Approvals {(pendingActions.data?.length || 0) > 0 && `(${pendingActions.data?.length})`}
            </TabsTrigger>
            <TabsTrigger value="businesses" className="text-gray-300 data-[state=active]:text-white">Businesses</TabsTrigger>
            <TabsTrigger value="briefings" className="text-gray-300 data-[state=active]:text-white">Briefings</TabsTrigger>
            <TabsTrigger value="ideas" className="text-gray-300 data-[state=active]:text-white">Ideas</TabsTrigger>
            <TabsTrigger value="history" className="text-gray-300 data-[state=active]:text-white">Action History</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
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
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate({ actionId: action.id })}
                            disabled={approveMutation.isPending}
                            className="bg-green-700 hover:bg-green-600"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => denyMutation.mutate({ actionId: action.id })}
                            disabled={denyMutation.isPending}
                            className="border-red-700 text-red-400 hover:bg-red-700/20"
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Deny
                          </Button>
                        </div>
                      </div>
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
