import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  description: string;
  nextRun: string;
  lastRun: string;
  enabled: boolean;
}

export function CronJobsCalendar() {
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const { data: jobs = [], isLoading } = trpc.admin.getCronJobs.useQuery(
    {},
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getTimeUntilNextRun = (nextRun: string) => {
    const now = new Date();
    const next = new Date(nextRun);
    const diffMs = next.getTime() - now.getTime();
    
    if (diffMs < 0) return "Overdue";
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `in ${diffDays}d`;
    if (diffHours > 0) return `in ${diffHours}h`;
    return `in ${diffMins}m`;
  };

  const parseCronExpression = (cronExpr: string): string => {
    // Simple cron parser for display
    const parts = cronExpr.split(" ");
    if (parts.length !== 5) return cronExpr;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Build readable schedule
    const expressions: string[] = [];

    if (minute === "*" && hour === "*") {
      expressions.push("every minute");
    } else if (minute === "*/10") {
      expressions.push("every 10 minutes");
    } else if (minute === "*/30") {
      expressions.push("every 30 minutes");
    } else if (minute === "0" && hour === "*") {
      expressions.push("every hour at :00");
    } else if (minute === "0" && hour === "0") {
      expressions.push("daily at midnight");
    } else if (minute === "0" && hour !== "*") {
      expressions.push(`daily at ${hour}:00`);
    } else if (minute === "0" && hour === "9" && dayOfWeek === "1") {
      expressions.push("every Monday at 9:00 AM");
    } else if (minute === "0" && hour === "*/12") {
      expressions.push("every 12 hours");
    }

    return expressions.length > 0 ? expressions.join(", ") : cronExpr;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Scheduled Cron Jobs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No jobs configured</div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                  className="w-full p-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{job.name}</h3>
                        {job.enabled ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Enabled
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 text-xs">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                        {job.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {parseCronExpression(job.schedule)}
                        </span>
                        <span className="font-mono text-blue-600">
                          {getTimeUntilNextRun(job.nextRun)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs">
                        <div className="text-gray-500">Next</div>
                        <div className="font-mono text-sm mt-1">
                          {formatTime(job.nextRun)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {formatDate(job.nextRun)}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>

                {expandedJob === job.id && (
                  <div className="bg-gray-50 border-t border-gray-200 p-3 space-y-2 text-xs">
                    <div>
                      <div className="font-medium text-gray-700">Cron Expression</div>
                      <div className="font-mono bg-white p-2 rounded border border-gray-200 mt-1">
                        {job.schedule}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="font-medium text-gray-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          Last Run
                        </div>
                        <div className="text-gray-600 mt-1">
                          {new Date(job.lastRun).toLocaleString("en-US")}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700 flex items-center gap-1">
                          <Clock className="w-4 h-4 text-blue-600" />
                          Next Run
                        </div>
                        <div className="text-gray-600 mt-1">
                          {new Date(job.nextRun).toLocaleString("en-US")}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Description</div>
                      <div className="text-gray-600 mt-1">{job.description}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
