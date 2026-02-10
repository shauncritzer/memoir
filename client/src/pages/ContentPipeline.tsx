import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap, Target, Users, ArrowLeft, Plus, Trash2, Play, Pause, Eye,
  Send, Clock, CheckCircle2, XCircle, Loader2, BarChart3, Link2,
} from "lucide-react";
import { Link } from "wouter";

// Platform icons/colors
const platformConfig: Record<string, { label: string; color: string }> = {
  x: { label: "X (Twitter)", color: "bg-black text-white" },
  instagram: { label: "Instagram", color: "bg-gradient-to-r from-purple-500 to-pink-500 text-white" },
  linkedin: { label: "LinkedIn", color: "bg-blue-700 text-white" },
  facebook: { label: "Facebook", color: "bg-blue-600 text-white" },
  youtube: { label: "YouTube", color: "bg-red-600 text-white" },
  tiktok: { label: "TikTok", color: "bg-black text-white" },
  podcast: { label: "Podcast", color: "bg-purple-700 text-white" },
  blog: { label: "Blog", color: "bg-green-600 text-white" },
  all: { label: "All Platforms", color: "bg-gray-600 text-white" },
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  generating: { label: "Generating", variant: "secondary" },
  ready: { label: "Ready", variant: "default" },
  posting: { label: "Posting", variant: "secondary" },
  posted: { label: "Posted", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
};

export default function ContentPipeline() {
  const trpcUtils = trpc.useUtils();

  // === Content Queue State ===
  const [queueFilter, setQueueFilter] = useState<string>("");
  const [addQueueOpen, setAddQueueOpen] = useState(false);
  const [newQueueItem, setNewQueueItem] = useState({
    platform: "",
    contentType: "post",
    content: "",
    scheduledFor: "",
  });

  // === CTA Offers State ===
  const [addCtaOpen, setAddCtaOpen] = useState(false);
  const [newCta, setNewCta] = useState({
    name: "",
    description: "",
    ctaText: "",
    ctaUrl: "",
    offerType: "product" as "product" | "affiliate" | "lead_magnet" | "course",
    weight: 50,
    platforms: ["all"],
    imageUrl: "",
  });

  // === Affiliate State ===
  const [addAffiliateOpen, setAddAffiliateOpen] = useState(false);
  const [newAffiliate, setNewAffiliate] = useState({
    userId: 0,
    referralCode: "",
    commissionRate: 30,
    payoutEmail: "",
  });

  // === Generate from Blog State ===
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedBlogId, setSelectedBlogId] = useState<number | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // === Queries ===
  const { data: queueItems, isLoading: queueLoading } = trpc.contentPipeline.getQueue.useQuery();
  const { data: queueStats } = trpc.contentPipeline.getQueueStats.useQuery();
  const { data: ctaOffers, isLoading: ctaLoading } = trpc.cta.getAll.useQuery();
  const { data: affiliatesData, isLoading: affiliatesLoading } = trpc.affiliate.getAll.useQuery();
  const { data: blogPosts } = trpc.admin.getAllBlogPosts.useQuery();
  const { data: users } = trpc.admin.getAllUsers.useQuery();

  // === Mutations ===
  const addToQueue = trpc.contentPipeline.addToQueue.useMutation({
    onSuccess: () => {
      trpcUtils.contentPipeline.getQueue.invalidate();
      trpcUtils.contentPipeline.getQueueStats.invalidate();
      setAddQueueOpen(false);
      setNewQueueItem({ platform: "", contentType: "post", content: "", scheduledFor: "" });
    },
  });

  const deleteQueueItem = trpc.contentPipeline.deleteQueueItem.useMutation({
    onSuccess: () => {
      trpcUtils.contentPipeline.getQueue.invalidate();
      trpcUtils.contentPipeline.getQueueStats.invalidate();
    },
  });

  const generateFromBlog = trpc.contentPipeline.generateFromBlogPost.useMutation({
    onSuccess: (data) => {
      trpcUtils.contentPipeline.getQueue.invalidate();
      trpcUtils.contentPipeline.getQueueStats.invalidate();
      setGenerateOpen(false);
      setSelectedBlogId(null);
      setSelectedPlatforms([]);
      alert(`Content queued for ${data.platforms.length} platforms from "${data.blogPostTitle}"`);
    },
  });

  const createCta = trpc.cta.create.useMutation({
    onSuccess: () => {
      trpcUtils.cta.getAll.invalidate();
      setAddCtaOpen(false);
      setNewCta({ name: "", description: "", ctaText: "", ctaUrl: "", offerType: "product", weight: 50, platforms: ["all"], imageUrl: "" });
    },
  });

  const updateCta = trpc.cta.update.useMutation({
    onSuccess: () => trpcUtils.cta.getAll.invalidate(),
  });

  const deleteCta = trpc.cta.delete.useMutation({
    onSuccess: () => trpcUtils.cta.getAll.invalidate(),
  });

  const createAffiliate = trpc.affiliate.create.useMutation({
    onSuccess: () => {
      trpcUtils.affiliate.getAll.invalidate();
      setAddAffiliateOpen(false);
      setNewAffiliate({ userId: 0, referralCode: "", commissionRate: 30, payoutEmail: "" });
    },
  });

  // === Helpers ===
  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const getStatCount = (status: string) => {
    const stat = queueStats?.find((s: any) => s.status === status);
    return stat?.count || 0;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Content Pipeline</h1>
            <p className="text-muted-foreground mt-2">
              Create, schedule, and distribute content across platforms
            </p>
          </div>
          <Link href="/admin">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Admin Dashboard
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: "Pending", count: getStatCount("pending"), icon: Clock, color: "text-yellow-500" },
            { label: "Generating", count: getStatCount("generating"), icon: Loader2, color: "text-blue-500" },
            { label: "Ready", count: getStatCount("ready"), icon: CheckCircle2, color: "text-green-500" },
            { label: "Posted", count: getStatCount("posted"), icon: Send, color: "text-emerald-500" },
            { label: "Failed", count: getStatCount("failed"), icon: XCircle, color: "text-red-500" },
            { label: "CTA Offers", count: ctaOffers?.length || 0, icon: Target, color: "text-purple-500" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.count}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="queue" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-3">
            <TabsTrigger value="queue">
              <Zap className="mr-2 h-4 w-4" />
              Content Queue
            </TabsTrigger>
            <TabsTrigger value="cta">
              <Target className="mr-2 h-4 w-4" />
              CTA Offers
            </TabsTrigger>
            <TabsTrigger value="affiliates">
              <Users className="mr-2 h-4 w-4" />
              Affiliates
            </TabsTrigger>
          </TabsList>

          {/* ================= CONTENT QUEUE TAB ================= */}
          <TabsContent value="queue" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle>Content Queue</CardTitle>
                  <div className="flex gap-2">
                    <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Zap className="mr-2 h-4 w-4" />
                          Generate from Blog Post
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Generate Content from Blog Post</DialogTitle>
                          <DialogDescription>
                            Select a blog post and choose platforms. AI will generate optimized content for each.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Blog Post</Label>
                            <Select onValueChange={(v) => setSelectedBlogId(Number(v))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a blog post..." />
                              </SelectTrigger>
                              <SelectContent>
                                {blogPosts?.map((post: any) => (
                                  <SelectItem key={post.id} value={String(post.id)}>
                                    {post.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Platforms</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {["x", "instagram", "linkedin", "facebook", "youtube", "tiktok"].map((p) => (
                                <Button
                                  key={p}
                                  variant={selectedPlatforms.includes(p) ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => togglePlatform(p)}
                                >
                                  {platformConfig[p]?.label || p}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => {
                              if (selectedBlogId && selectedPlatforms.length > 0) {
                                generateFromBlog.mutate({
                                  blogPostId: selectedBlogId,
                                  platforms: selectedPlatforms,
                                });
                              }
                            }}
                            disabled={!selectedBlogId || selectedPlatforms.length === 0 || generateFromBlog.isPending}
                          >
                            {generateFromBlog.isPending ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                            ) : (
                              <><Zap className="mr-2 h-4 w-4" />Generate {selectedPlatforms.length} Posts</>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={addQueueOpen} onOpenChange={setAddQueueOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Manually
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add to Content Queue</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Platform</Label>
                            <Select onValueChange={(v) => setNewQueueItem({ ...newQueueItem, platform: v })}>
                              <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                              <SelectContent>
                                {["x", "instagram", "linkedin", "facebook", "youtube", "tiktok"].map((p) => (
                                  <SelectItem key={p} value={p}>{platformConfig[p]?.label || p}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Content</Label>
                            <Textarea
                              value={newQueueItem.content}
                              onChange={(e) => setNewQueueItem({ ...newQueueItem, content: e.target.value })}
                              placeholder="Write your post content..."
                              rows={5}
                            />
                          </div>
                          <div>
                            <Label>Schedule For (optional)</Label>
                            <Input
                              type="datetime-local"
                              value={newQueueItem.scheduledFor}
                              onChange={(e) => setNewQueueItem({ ...newQueueItem, scheduledFor: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => {
                              if (newQueueItem.platform) {
                                addToQueue.mutate({
                                  platform: newQueueItem.platform,
                                  contentType: newQueueItem.contentType,
                                  content: newQueueItem.content || undefined,
                                  scheduledFor: newQueueItem.scheduledFor || undefined,
                                });
                              }
                            }}
                            disabled={!newQueueItem.platform || addToQueue.isPending}
                          >
                            Add to Queue
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {queueLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !queueItems || queueItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No content in queue</p>
                    <p className="text-sm mt-1">Generate from a blog post or add content manually to get started.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Platform</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Content Preview</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Scheduled</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {queueItems.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Badge className={platformConfig[item.platform]?.color || "bg-gray-500 text-white"}>
                                {platformConfig[item.platform]?.label || item.platform}
                              </Badge>
                            </TableCell>
                            <TableCell className="capitalize">{item.contentType}</TableCell>
                            <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                              {item.content ? item.content.substring(0, 80) + "..." : <em>Pending generation</em>}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.sourceBlogTitle || "Manual"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusConfig[item.status]?.variant || "outline"}>
                                {statusConfig[item.status]?.label || item.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(item.scheduledFor)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {item.platformPostUrl && (
                                  <a href={item.platformPostUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                                  </a>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm("Delete this queue item?")) {
                                      deleteQueueItem.mutate({ id: item.id });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= CTA OFFERS TAB ================= */}
          <TabsContent value="cta" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>CTA Offers</CardTitle>
                    <CardDescription>Manage rotating calls-to-action for monetization</CardDescription>
                  </div>
                  <Dialog open={addCtaOpen} onOpenChange={setAddCtaOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Offer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Create CTA Offer</DialogTitle>
                        <DialogDescription>
                          Add a new offer that will rotate across your content and social posts.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                        <div>
                          <Label>Offer Name</Label>
                          <Input
                            value={newCta.name}
                            onChange={(e) => setNewCta({ ...newCta, name: e.target.value })}
                            placeholder="e.g., 7-Day REWIRED Reset"
                          />
                        </div>
                        <div>
                          <Label>CTA Text (what users see)</Label>
                          <Input
                            value={newCta.ctaText}
                            onChange={(e) => setNewCta({ ...newCta, ctaText: e.target.value })}
                            placeholder="e.g., Start your healing journey - 7 days for $7"
                          />
                        </div>
                        <div>
                          <Label>CTA URL</Label>
                          <Input
                            value={newCta.ctaUrl}
                            onChange={(e) => setNewCta({ ...newCta, ctaUrl: e.target.value })}
                            placeholder="https://shauncritzer.com/7-day-reset"
                          />
                        </div>
                        <div>
                          <Label>Offer Type</Label>
                          <Select
                            value={newCta.offerType}
                            onValueChange={(v: any) => setNewCta({ ...newCta, offerType: v })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="product">Product (your course/service)</SelectItem>
                              <SelectItem value="affiliate">Affiliate (earn commission)</SelectItem>
                              <SelectItem value="lead_magnet">Lead Magnet (free download)</SelectItem>
                              <SelectItem value="course">Course</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Rotation Weight (1-100, higher = shown more)</Label>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={newCta.weight}
                            onChange={(e) => setNewCta({ ...newCta, weight: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>Description (optional)</Label>
                          <Textarea
                            value={newCta.description}
                            onChange={(e) => setNewCta({ ...newCta, description: e.target.value })}
                            placeholder="Internal notes about this offer..."
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>Image URL (optional)</Label>
                          <Input
                            value={newCta.imageUrl}
                            onChange={(e) => setNewCta({ ...newCta, imageUrl: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => createCta.mutate(newCta)}
                          disabled={!newCta.name || !newCta.ctaText || !newCta.ctaUrl || createCta.isPending}
                        >
                          {createCta.isPending ? "Creating..." : "Create Offer"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {ctaLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !ctaOffers || ctaOffers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No CTA offers yet</p>
                    <p className="text-sm mt-1">Create your first offer to start rotating CTAs across your content.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>CTA Text</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Weight</TableHead>
                          <TableHead>Impressions</TableHead>
                          <TableHead>Clicks</TableHead>
                          <TableHead>CTR</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ctaOffers.map((offer: any) => {
                          const ctr = offer.impressions > 0
                            ? ((offer.clicks / offer.impressions) * 100).toFixed(1) + "%"
                            : "—";
                          return (
                            <TableRow key={offer.id}>
                              <TableCell className="font-medium">{offer.name}</TableCell>
                              <TableCell className="max-w-xs truncate text-sm">{offer.ctaText}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">{offer.offerType.replace("_", " ")}</Badge>
                              </TableCell>
                              <TableCell>{offer.weight}</TableCell>
                              <TableCell>{offer.impressions.toLocaleString()}</TableCell>
                              <TableCell>{offer.clicks.toLocaleString()}</TableCell>
                              <TableCell>{ctr}</TableCell>
                              <TableCell>{formatPrice(offer.revenue)}</TableCell>
                              <TableCell>
                                <Badge variant={offer.status === "active" ? "default" : "secondary"}>
                                  {offer.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateCta.mutate({
                                      id: offer.id,
                                      status: offer.status === "active" ? "paused" : "active",
                                    })}
                                  >
                                    {offer.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm("Delete this offer?")) deleteCta.mutate({ id: offer.id });
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= AFFILIATES TAB ================= */}
          <TabsContent value="affiliates" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Affiliate Program</CardTitle>
                    <CardDescription>Manage affiliates, referral codes, and commissions</CardDescription>
                  </div>
                  <Dialog open={addAffiliateOpen} onOpenChange={setAddAffiliateOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Affiliate
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Affiliate</DialogTitle>
                        <DialogDescription>
                          Create an affiliate account for a user. They'll get a unique referral link.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>User</Label>
                          <Select onValueChange={(v) => setNewAffiliate({ ...newAffiliate, userId: Number(v) })}>
                            <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                            <SelectContent>
                              {users?.map((user: any) => (
                                <SelectItem key={user.id} value={String(user.id)}>
                                  {user.name || user.email} ({user.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Referral Code</Label>
                          <Input
                            value={newAffiliate.referralCode}
                            onChange={(e) => setNewAffiliate({ ...newAffiliate, referralCode: e.target.value })}
                            placeholder="e.g., coach-mike (lowercase, hyphens OK)"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Link: shauncritzer.com/?ref={newAffiliate.referralCode || "..."}
                          </p>
                        </div>
                        <div>
                          <Label>Commission Rate (%)</Label>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={newAffiliate.commissionRate}
                            onChange={(e) => setNewAffiliate({ ...newAffiliate, commissionRate: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>Payout Email (PayPal)</Label>
                          <Input
                            value={newAffiliate.payoutEmail}
                            onChange={(e) => setNewAffiliate({ ...newAffiliate, payoutEmail: e.target.value })}
                            placeholder="affiliate@email.com"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => createAffiliate.mutate(newAffiliate)}
                          disabled={!newAffiliate.userId || !newAffiliate.referralCode || createAffiliate.isPending}
                        >
                          {createAffiliate.isPending ? "Creating..." : "Create Affiliate"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {affiliatesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !affiliatesData || affiliatesData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No affiliates yet</p>
                    <p className="text-sm mt-1">Add your first affiliate to start your referral program.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Affiliate</TableHead>
                          <TableHead>Referral Code</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Referrals</TableHead>
                          <TableHead>Total Earned</TableHead>
                          <TableHead>Pending Payout</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {affiliatesData.map((aff: any) => (
                          <TableRow key={aff.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{aff.userName || "—"}</p>
                                <p className="text-xs text-muted-foreground">{aff.userEmail}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="bg-muted px-2 py-1 rounded text-sm">{aff.referralCode}</code>
                            </TableCell>
                            <TableCell>{aff.commissionRate}%</TableCell>
                            <TableCell>{aff.totalReferrals}</TableCell>
                            <TableCell>{formatPrice(aff.totalEarnings)}</TableCell>
                            <TableCell>{formatPrice(aff.pendingPayout)}</TableCell>
                            <TableCell>
                              <Badge variant={aff.status === "active" ? "default" : "secondary"}>
                                {aff.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
