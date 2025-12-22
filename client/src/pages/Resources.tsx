import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, BookOpen, CheckCircle2, Wrench, BookMarked, FileDown } from "lucide-react";
import { Link } from "wouter";

// Define the resources we want to display
const resources = [
  {
    id: 1,
    title: "First 3 Chapters",
    description: "Read the opening chapters of Crooked Lines: Bent, Not Broken. Experience the raw, unflinching story of trauma, addiction, and the beginning of redemption.",
    icon: BookOpen,
    link: "/first-3-chapters",
    type: "Interactive Page"
  },
  {
    id: 2,
    title: "The Recovery Toolkit",
    description: "Interactive worksheets and exercises for your recovery journey. Daily check-ins, trigger identification, gratitude practice, and more.",
    icon: Wrench,
    link: "/recovery-toolkit",
    type: "Interactive Tools"
  },
  {
    id: 3,
    title: "Reading Guide",
    description: "Discussion questions for individual reflection or group study. Go deeper with the themes of trauma, addiction, and redemption.",
    icon: BookMarked,
    link: "/reading-guide",
    type: "Study Guide"
  }
];

export default function Resources() {
  const getIcon = (IconComponent: any) => {
    return IconComponent;
  };

  return (
    <div className="min-h-screen pt-16">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section - Redesigned */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black py-20">
        <div className="max-w-6xl mx-auto px-4">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">

            {/* LEFT: Extended Text */}
            <div className="text-white">
              <h2 className="text-4xl font-bold mb-6">Free Recovery Resources</h2>

              <p className="text-xl text-gray-300 mb-4">
                Tools, guides, and downloads to support your nervous system regulation journey.
              </p>

              <p className="text-gray-400 mb-6">
                Real resources from real recovery. These tools helped me navigate my
                journey from chaos to wholeness. Everything here is free—no strings
                attached—because healing shouldn't have a paywall.
              </p>

              <p className="text-gray-400 mb-6">
                Whether you're just starting to understand nervous system dysregulation
                or you've been working on recovery for years, these resources will meet
                you where you are.
              </p>

              <p className="text-gray-400 mb-6">
                Each tool is grounded in polyvagal theory, trauma-informed care, and
                evidence-based practices. No pseudoscience. No shame. Just practical
                strategies that work.
              </p>

              <div className="bg-gray-800 border-l-4 border-teal-400 p-6 rounded">
                <p className="text-gray-300 italic">
                  "These aren't just theoretical concepts—they're the exact practices
                  I used (and still use) to regulate my nervous system daily. I'm sharing
                  them because they work, and everyone deserves access to tools that heal."
                </p>
                <p className="text-teal-400 font-bold mt-3">— Shaun Critzer</p>
              </div>
            </div>

            {/* RIGHT: Photo */}
            <div className="flex justify-center">
              <img
                src="/pro-creator-portrait (29).png"
                alt="Shaun Critzer"
                className="rounded-lg shadow-2xl w-full max-w-md object-cover"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="py-20">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            {resources.map((resource) => {
              const Icon = resource.icon;
              return (
                <Card key={resource.id} className="p-8 flex flex-col hover:shadow-lg transition-shadow">
                  <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-3 mt-6 flex-grow">
                    <h3 className="text-2xl font-bold">{resource.title}</h3>
                    <p className="text-muted-foreground">{resource.description}</p>
                  </div>
                  <div className="flex items-center justify-end text-sm text-muted-foreground mt-4">
                    <span className="uppercase font-medium">{resource.type}</span>
                  </div>
                  <Link href={resource.link}>
                    <Button className="w-full bg-primary hover:bg-primary/90 mt-6">
                      Access Free
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>
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

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Shaun Critzer</h3>
              <p className="text-sm text-muted-foreground">
                Author, speaker, and recovery advocate helping others find hope in their own journey.
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
