import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, ArrowRight, Download } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: posts, isLoading } = trpc.blog.list.useQuery({ limit: 20 });
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadMutation = trpc.blog.download.useMutation();

  const filteredPosts = posts?.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPost || !email) return;

    setIsDownloading(true);

    try {
      const result = await downloadMutation.mutateAsync({
        slug: selectedPost.slug,
        email: email,
      });

      if (result.success && result.downloadUrl) {
        // Open download in new tab
        window.open(result.downloadUrl, "_blank");

        toast.success("Download started!", {
          description: "Check your downloads folder.",
        });

        // Close dialog and reset
        setSelectedPost(null);
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
            <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors">
              Products
            </Link>
            <Link href="/coach" className="text-sm font-medium hover:text-primary transition-colors">
              AI Coach
            </Link>
            <Link href="/products">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-background to-accent/20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold">
              Stories of{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Recovery & Redemption
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Real talk about trauma, addiction, healing, and building a life worth staying sober for.
            </p>
            <div className="max-w-md mx-auto">
              <Input
                type="search"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-20">
        <div className="container">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading posts...</div>
          ) : filteredPosts && filteredPosts.length > 0 ? (
            <div className="grid gap-8 max-w-4xl mx-auto">
              {filteredPosts.map((post) => (
                <Card key={post.id} className="p-8 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
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
                    <Link href={`/blog/${post.slug}`}>
                      <h2 className="text-3xl font-bold hover:text-primary transition-colors cursor-pointer">
                        {post.title}
                      </h2>
                    </Link>
                    {post.excerpt && (
                      <p className="text-lg text-muted-foreground">{post.excerpt}</p>
                    )}
                    <div className="flex gap-3">
                      <Link href={`/blog/${post.slug}`}>
                        <Button variant="ghost" className="group">
                          Read More
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                      {post.fileUrl && (
                        <Button
                          variant="outline"
                          className="group"
                          onClick={() => setSelectedPost(post)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              No posts found. Try a different search term.
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold">Get Weekly Insights</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of readers finding hope in their recovery journey. Weekly insights on trauma, addiction, and building a life worth staying sober for.
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
        </div>
      </section>

      {/* Download Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download {selectedPost?.title}</DialogTitle>
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
                onClick={() => setSelectedPost(null)}
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
