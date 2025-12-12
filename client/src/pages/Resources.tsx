import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, BookOpen, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Resources() {
  const [selectedMagnet, setSelectedMagnet] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: leadMagnets, isLoading } = trpc.leadMagnets.list.useQuery();
  const downloadMutation = trpc.leadMagnets.download.useMutation();

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMagnet || !email) return;

    setIsDownloading(true);

    try {
      const result = await downloadMutation.mutateAsync({
        slug: selectedMagnet.slug,
        email: email,
      });

      if (result.success && result.downloadUrl) {
        // Open download in new tab
        window.open(result.downloadUrl, "_blank");
        
        toast.success("Download started!", {
          description: "Check your downloads folder. You've also been added to our email list for weekly insights.",
        });

        // Close dialog and reset
        setSelectedMagnet(null);
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

  const getIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return FileText;
      default:
        return Download;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-background to-accent/20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold">
                Free{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Recovery Resources
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Tools, guides, and downloads to support your recovery journey. All free, no strings attached—just enter your email to download.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden">
              <img 
                src="/family-of-5-fixed.png" 
                alt="Shaun Critzer and family" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Lead Magnets Grid */}
      <section className="py-20">
        <div className="container">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading resources...</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {leadMagnets
                ?.sort((a, b) => {
                  // Custom order: First 3 Chapters, Recovery Toolkit, Reading Guide
                  const order = ['first-3-chapters', 'recovery-toolkit', 'reading-guide'];
                  return order.indexOf(a.slug) - order.indexOf(b.slug);
                })
                .map((magnet) => {
                const Icon = getIcon(magnet.type);
                return (
                  <Card key={magnet.id} className="p-8 flex flex-col hover:shadow-lg transition-shadow">
                    <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-3 mt-6 flex-grow">
                      <h3 className="text-2xl font-bold">{magnet.title}</h3>
                      <p className="text-muted-foreground">{magnet.description}</p>
                    </div>
                    <div className="flex items-center justify-end text-sm text-muted-foreground mt-4">
                      <span className="uppercase font-medium">{magnet.type}</span>
                    </div>
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 mt-6"
                      onClick={() => setSelectedMagnet(magnet)}
                    >
                      Download Free
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Additional Resources Section */}
      <section className="py-20 bg-accent/30">
        <div className="container">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">More Ways to Get Support</h2>
              <p className="text-xl text-muted-foreground">
                Recovery is a journey, not a destination. Here are more resources to help you along the way.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Read the Full Memoir</h3>
                <p className="text-muted-foreground">
                  Get the complete story of trauma, addiction, rock bottom, and redemption. Available in paperback, ebook, and audiobook.
                </p>
                <Button variant="outline" className="w-full">
                  Buy the Book
                </Button>
              </Card>
              <Card className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Join the Community</h3>
                <p className="text-muted-foreground">
                  Connect with others on the same journey. Get support, share your story, and find accountability partners.
                </p>
                <Button variant="outline" className="w-full">
                  Join Now
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Crisis Resources */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <Card className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10">
              <h2 className="text-3xl font-bold mb-6">Need Help Now?</h2>
              <div className="space-y-4 text-lg">
                <p>
                  <strong>988 Suicide & Crisis Lifeline:</strong> Call or text 988
                </p>
                <p>
                  <strong>SAMHSA National Helpline:</strong> 1-800-662-HELP (4357)
                </p>
                <p>
                  <strong>Crisis Text Line:</strong> Text HOME to 741741
                </p>
                <p>
                  <strong>RAINN Sexual Assault Hotline:</strong> 1-800-656-HOPE (4673)
                </p>
              </div>
              <p className="mt-6 text-muted-foreground">
                You are not alone. Help is available 24/7, 365 days a year.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Download Dialog */}
      <Dialog open={!!selectedMagnet} onOpenChange={(open) => !open && setSelectedMagnet(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download {selectedMagnet?.title}</DialogTitle>
            <DialogDescription>
              Enter your email to download this free resource. You'll also receive weekly insights on recovery, trauma healing, and building a life worth staying sober for.
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
                onClick={() => setSelectedMagnet(null)}
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
            <p className="text-xs text-muted-foreground text-center">
              No spam. Unsubscribe anytime. Your email is safe with me.
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container">
          <div className="grid md:grid-cols-5 gap-8">
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
                <li><Link href="/products" className="hover:text-primary transition-colors">Products</Link></li>
                <li><Link href="/ai-coach" className="hover:text-primary transition-colors">AI Coach</Link></li>
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
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms-of-use" className="hover:text-primary transition-colors">Terms of Use</Link></li>
                <li><Link href="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link></li>
                <li><Link href="/faqs" className="hover:text-primary transition-colors">FAQs</Link></li>
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
