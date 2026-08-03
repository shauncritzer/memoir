import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import AdminNav from "@/components/AdminNav";

/**
 * Engagement audit — aggregates the last 90 days of posted content from
 * content_queue so the "is any of this landing?" question has real numbers.
 */
export default function AuditReport() {
  const { data, isLoading, error } = trpc.admin.getEngagementAudit.useQuery();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <AdminNav />
        <div>
          <h1 className="text-3xl font-bold">Engagement Audit</h1>
          <p className="text-muted-foreground">Posted content over the last 90 days, with real platform metrics</p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && <p className="text-red-600">Error: {error.message}</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">{data.totalPosts}</div>
                <div className="text-sm text-muted-foreground">posts in {data.windowDays} days</div>
              </CardContent></Card>
              <Card><CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">{data.postsPerWeek}</div>
                <div className="text-sm text-muted-foreground">posts / week</div>
              </CardContent></Card>
              <Card><CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">{data.zeroEngagementCount}</div>
                <div className="text-sm text-muted-foreground">posts with ZERO engagement</div>
              </CardContent></Card>
              <Card><CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold">
                  {data.totalPosts > 0 ? Math.round((data.zeroEngagementCount / data.totalPosts) * 100) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">zero-engagement rate</div>
              </CardContent></Card>
            </div>

            <Card>
              <CardHeader><CardTitle>By Platform</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Platform</TableHead><TableHead>Posts</TableHead>
                    <TableHead>Likes</TableHead><TableHead>Comments</TableHead>
                    <TableHead>Shares</TableHead><TableHead>Views</TableHead>
                    <TableHead>Zero-engagement</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {Object.entries(data.byPlatform).map(([platform, s]) => (
                      <TableRow key={platform}>
                        <TableCell className="font-medium capitalize">{platform}</TableCell>
                        <TableCell>{s.posts}</TableCell>
                        <TableCell>{s.likes}</TableCell>
                        <TableCell>{s.comments}</TableCell>
                        <TableCell>{s.shares}</TableCell>
                        <TableCell>{s.views}</TableCell>
                        <TableCell>{s.zeroEngagement} ({Math.round((s.zeroEngagement / s.posts) * 100)}%)</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 5 Posts by Engagement</CardTitle>
                <CardDescription>If even these are near zero, the problem is reach, not content ranking</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Platform</TableHead><TableHead>Preview</TableHead>
                    <TableHead>Likes</TableHead><TableHead>Comments</TableHead><TableHead>Shares</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {data.topPosts.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="capitalize">{p.platform}</TableCell>
                        <TableCell className="max-w-xs truncate text-sm">{p.preview}</TableCell>
                        <TableCell>{p.likes}</TableCell>
                        <TableCell>{p.comments}</TableCell>
                        <TableCell>{p.shares}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Content Type Mix</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {Object.entries(data.contentTypeMix).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                    <li key={type} className="flex justify-between border-b py-1">
                      <span className="capitalize">{type.replace(/_/g, " ")}</span>
                      <span className="font-medium">{count}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
