import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { data: posts, isLoading } = trpc.blog.list.useQuery({ limit: 20 });
  const subscribeMutation = trpc.email.subscribe.useMutation();

  // Define available categories
  const categories = ["Trauma", "Recovery", "Neuroscience", "Mental Health", "Addiction"];

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    setIsSubscribing(true);
    try {
      await subscribeMutation.mutateAsync({
        email: newsletterEmail,
        source: "blog",
      });
      toast.success("Success!", {
        description: "You've been added to our weekly newsletter. Check your email to confirm.",
      });
      setNewsletterEmail("");
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const filteredPosts = posts?.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || post.category?.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

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

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="pt-28 pb-20 bg-gradient-to-b from-background to-accent/20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold">
                Stories of{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Recovery & Redemption
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Real talk about trauma, addiction, healing, and building a life worth staying sober for.
              </p>
              <div className="space-y-4">
                <Input
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full max-w-md"
                />

                {/* Category Filter Pills */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground">Filter by category:</p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant={selectedCategory === null ? "default" : "outline"}
                      onClick={() => setSelectedCategory(null)}
                      className={`text-base px-6 py-3 h-auto ${
                        selectedCategory === null
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      All Posts
                    </Button>
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        onClick={() => setSelectedCategory(category)}
                        className={`text-base px-6 py-3 h-auto ${
                          selectedCategory === category
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        }`}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                  {selectedCategory && (
                    <p className="text-sm text-muted-foreground">
                      Showing posts in <span className="font-semibold text-primary">{selectedCategory}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden">
              <img 
                src="/shaun-shannon-couple.jpg" 
                alt="Shaun and Shannon Critzer" 
                className="w-full h-auto"
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
                    <Link href={`/blog/${post.slug}`}>
                      <Button variant="ghost" className="group">
                        Read More
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
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
            <form onSubmit={handleNewsletterSubmit} className="flex gap-3 max-w-md mx-auto">
              <Input 
                type="email" 
                placeholder="your@email.com" 
                className="flex-1"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                disabled={isSubscribing}
              />
              <Button 
                type="submit"
                className="bg-primary hover:bg-primary/90"
                disabled={isSubscribing}
              >
                {isSubscribing ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
            <p className="text-sm text-muted-foreground">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
