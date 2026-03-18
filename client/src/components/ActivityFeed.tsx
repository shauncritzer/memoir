import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, RefreshCw } from "lucide-react";

interface Activity {
  timestamp: string;
  action: string;
  status: "success" | "failed" | "in_progress";
  details?: Record<string, any>;
  tokensUsed?: number;
  agent: string;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data, isLoading } = trpc.admin.getActivityFeed.useQuery(
    { limit: 50, offset: 0 },
    { refetchInterval: autoRefresh ? 5000 : false } // Auto-refresh every 5 seconds if enabled
  );

  useEffect(() => {
    if (data?.activities) {
      setActivities(data.activities);
    }
  }, [data]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      default:
        return null;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>🦞 Freddy Activity Feed</CardTitle>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`p-2 rounded-lg transition-colors ${
            autoRefresh ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
          }`}
          title={autoRefresh ? "Auto-refresh enabled" : "Auto-refresh disabled"}
        >
          <RefreshCw className={`w-5 h-5 ${autoRefresh ? "animate-spin" : ""}`} />
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center text-gray-500 py-8">Loading activity...</div>
          ) : activities.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No activity yet</div>
          ) : (
            activities.map((activity, idx) => (
              <div
                key={`${activity.timestamp}-${idx}`}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(activity.status)}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 justify-between">
                    <span className="font-medium text-sm truncate">
                      {activity.action}
                    </span>
                    {getStatusBadge(activity.status)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <div>
                      {formatDate(activity.timestamp)} at{" "}
                      <span className="font-mono">{formatTime(activity.timestamp)}</span>
                    </div>
                    {activity.tokensUsed ? (
                      <div className="mt-1 text-gray-600">
                        Tokens: <span className="font-mono">{activity.tokensUsed}</span>
                      </div>
                    ) : null}
                  </div>
                  {activity.details && Object.keys(activity.details).length > 0 ? (
                    <div className="text-xs text-gray-600 mt-2 bg-white p-2 rounded border border-gray-200 font-mono overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(activity.details, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
        {data ? (
          <div className="text-xs text-gray-500 mt-4 pt-4 border-t">
            Showing {activities.length} of {data.total} activities
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
