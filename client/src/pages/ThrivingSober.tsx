import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";

export default function ThrivingSober() {
  const { user } = useAuth();

  // Check if user has access to the course
  const { data: hasAccess, isLoading: accessLoading } = trpc.members.checkCourseAccess.useQuery(
    { moduleId: 30001 },
    { enabled: !!user }
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-16 text-center max-w-2xl mx-auto">
          <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-4xl font-bold mb-4">Bonus Content</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Please log in to access this bonus content.
          </p>
          <Button asChild size="lg">
            <a href="/7-day-reset">View Course</a>
          </Button>
        </div>
      </div>
    );
  }

  if (accessLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-16 text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-16 text-center max-w-2xl mx-auto">
          <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-4xl font-bold mb-4">Bonus Content Locked</h1>
          <p className="text-xl text-muted-foreground mb-8">
            This bonus content is available to 7-Day REWIRED Reset course members.
          </p>
          <Button asChild size="lg">
            <a href="/7-day-reset">Enroll in the Course</a>
          </Button>
        </div>
      </div>
    );
  }

  const bonusPdfUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/96788853/CuoaWcKryKXFnAfe.pdf";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            🎉 Bonus: 50 Ways to Thrive
          </h1>
          <p className="text-xl text-muted-foreground">
            Proven strategies for staying strong in recovery
          </p>
        </div>

        {/* Download Card */}
        <Card className="mb-12 bg-gradient-to-br from-[#1E3A5F] to-gray-900 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Download Your Bonus Content</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-gray-300">
              This comprehensive guide contains 50 practical strategies to help you thrive in your recovery journey. 
              Download it now and keep it as a reference for the hard days ahead.
            </p>
            <Button 
              size="lg" 
              className="bg-[#D4AF37] hover:bg-[#B8941F] text-black font-bold"
              asChild
            >
              <a href={bonusPdfUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-5 w-5" />
                Download 50 Ways to Thrive (PDF)
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Content Preview */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>What's Inside</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                This bonus resource is your practical toolkit for navigating recovery. Inside, you'll find:
              </p>
              <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                <li>Daily practices to regulate your nervous system</li>
                <li>Strategies for managing triggers and cravings</li>
                <li>Tools for building meaningful connections</li>
                <li>Techniques for self-compassion and releasing shame</li>
                <li>Ways to create structure and routine that supports recovery</li>
                <li>Methods for discovering purpose and meaning</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Use This Resource</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                This isn't a checklist to complete all at once. Think of it as a menu of options. 
                Some strategies will resonate with you immediately. Others might become relevant later in your journey.
              </p>
              <p>
                <strong>Recommended approach:</strong>
              </p>
              <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
                <li>Read through the entire document once</li>
                <li>Highlight 3-5 strategies that feel most relevant right now</li>
                <li>Implement one new strategy each week</li>
                <li>Return to this resource whenever you need fresh ideas or inspiration</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Continue Your Journey</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                You've completed the 7-Day REWIRED Reset and now have access to 50 additional strategies. 
                You're building a strong foundation for lasting change.
              </p>
              <p className="text-muted-foreground">
                Remember: Recovery isn't about perfection. It's about progress. It's about showing up for yourself, 
                even on the hard days. You've got this.
              </p>
              <div className="pt-4">
                <Button asChild variant="outline">
                  <a href="/7-day-reset">← Back to Course</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
