import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, ArrowLeft, Share2, Download } from "lucide-react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { useState } from "react";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = trpc.blog.getBySlug.useQuery({ slug: slug! });
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadMutation = trpc.blog.download.useMutation();

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.excerpt || "",
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!post || !email) return;

    setIsDownloading(true);

    try {
      const result = await downloadMutation.mutateAsync({
        slug: post.slug,
        email: email,
      });

      if (result.success && result.downloadUrl) {
        // Open download in new tab
        window.open(result.downloadUrl, "_blank");

        toast.success("Download started!", {
          description: "Check your downloads folder.",
        });

        // Close dialog and reset
        setShowDownloadDialog(false);
        setEmail("");
      }
    } catch (error) {
      toast.error("Download failed", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Post Not Found</h1>
          <Link href="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Shaun Critzer
            </span>
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/memoir" className="text-sm font-medium hover:text-primary transition-colors">
              The Memoir
            </Link>
            <Link href="/blog" className="text-sm font-medium text-primary">
              Blog
            </Link>
            <Link href="/resources" className="text-sm font-medium hover:text-primary transition-colors">
              Resources
            </Link>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Article */}
      <article className="py-12">
        <div className="container max-w-4xl">
          {/* Back Button */}
          <Link href="/blog">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>

          {/* Article Header */}
          <div className="space-y-6 mb-12">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {post.category && (
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {post.category}
                </span>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(post.publishedAt)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {getReadingTime(post.content)}
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">{post.title}</h1>
            {post.excerpt && (
              <p className="text-xl text-muted-foreground">{post.excerpt}</p>
            )}
            <div className="flex items-center gap-4 pt-4">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              {post.fileUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDownloadDialog(true)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              )}
            </div>
          </div>

          {/* Article Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <Streamdown>{post.content}</Streamdown>
          </div>

          {/* Author Bio */}
          <Card className="p-8 mt-12 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="flex items-start gap-6">
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                SC
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl font-bold">Shaun Critzer</h3>
                <p className="text-muted-foreground">
                  Author, speaker, and recovery advocate. 13 years sober and helping others find hope in their own journey. Shaun lives in Charlottesville, Virginia with his wife Shannon and their blended family.
                </p>
                <div className="flex gap-3">
                  <Link href="/about">
                    <Button variant="outline" size="sm">Learn More</Button>
                  </Link>
                  <Link href="/memoir">
                    <Button variant="outline" size="sm">Read the Memoir</Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* Newsletter CTA */}
          <Card className="p-8 mt-8 bg-gradient-to-br from-primary/10 to-secondary/10">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">Get More Stories Like This</h3>
              <p className="text-muted-foreground">
                Weekly insights on recovery, trauma healing, and building a life worth staying sober for.
              </p>
              <div className="flex gap-3 max-w-md mx-auto">
                <Input type="email" placeholder="your@email.com" className="flex-1" />
                <Button className="bg-primary hover:bg-primary/90">
                  Subscribe
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </Card>
        </div>
      </article>

      {/* Download Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download {post?.title}</DialogTitle>
            <DialogDescription>
              Enter your email to download this blog post as a PDF.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDownload} className="space-y-4">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowDownloadDialog(false)}
                disabled={isDownloading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={isDownloading}
              >
                {isDownloading ? "Downloading..." : "Download"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Shaun Critzer</h3>
              <p className="text-sm text-muted-foreground">
                Author, speaker, and recovery advocate. 13 years sober and helping others find hope in their own journey.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">The Memoir</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/memoir" className="hover:text-primary transition-colors">About the Book</Link></li>
                <li><Link href="/memoir/excerpt" className="hover:text-primary transition-colors">Read an Excerpt</Link></li>
                <li><Link href="/memoir/reviews" className="hover:text-primary transition-colors">Reviews</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/resources" className="hover:text-primary transition-colors">Free Downloads</Link></li>
                <li><Link href="/courses" className="hover:text-primary transition-colors">Courses</Link></li>
                <li><Link href="/community" className="hover:text-primary transition-colors">Community</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">YouTube</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Facebook</a></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Shaun Critzer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
