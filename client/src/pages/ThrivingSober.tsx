import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const suggestions = [
  "Don't drink or use, no matter what.",
  "Go to meetings.",
  "Ask for help.",
  "Get a sponsor and work the steps.",
  "Read the Big Book and other A.A. literature.",
  "Go to 90 meetings in 90 days.",
  "Don't go to bars or hang around your old drinking friends.",
  "Get phone numbers and use them.",
  "Don't get too hungry, angry, lonely, or tired (HALT).",
  "Live in the now.",
  "Stay out of your head.",
  "Remember that alcoholism is cunning, baffling, and powerful.",
  "Remember that you have a daily reprieve.",
  "Use the Serenity Prayer.",
  "Call your sponsor before, not after, you take the first drink.",
  "Remember that it's the first drink that gets you drunk.",
  "Stay humble.",
  "Be of service.",
  "Practice these principles in all your affairs.",
  "Don't compare your insides to other people's outsides.",
  "Keep coming back—it works if you work it.",
  "Stick with the winners.",
  "Pray and meditate.",
  "Easy does it.",
  "First things first.",
  "Live and let live.",
  "Let go and let God.",
  "Keep it simple.",
  "Progress, not perfection.",
  "One day at a time.",
  "Turn it over.",
  "Act as if.",
  "This too shall pass.",
  "Fake it till you make it.",
  "Keep the plug in the jug.",
  "Don't drink and go to meetings.",
  "Utilize, don't analyze.",
  "There are no coincidences in A.A.",
  "It's a selfish program.",
  "Get out of the driver's seat.",
  "Share your happiness.",
  "You're exactly where you're supposed to be.",
  "Don't leave before the miracle happens.",
  "Stay in the middle of the boat.",
  "Principles before personalities.",
  "You can't give away what you don't have.",
  "Keep your side of the street clean.",
  "Suit up and show up.",
  "Be part of the solution, not the problem.",
  "Remember: You're not alone.",
  "Keep the focus on yourself.",
];

export default function ThrivingSober() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <div className="border-b bg-gradient-to-r from-teal-500/10 to-amber-500/10">
        <div className="container py-16 text-center">
          <h1 className="text-5xl font-bold mb-4">Thriving Sober</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            50 Timeless Suggestions for Living a Fulfilling Life in Recovery
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Introduction */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-lg leading-relaxed">
                These 50 suggestions are drawn from the collective wisdom of recovery communities 
                around the world. They're not rules—they're tools. Some will resonate immediately, 
                others may take time to understand. Take what works, leave what doesn't, and come 
                back to the rest when you're ready.
              </p>
            </CardContent>
          </Card>

          {/* Suggestions Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-start gap-3 text-base font-medium">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="flex-1">{suggestion}</span>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Closing Message */}
          <Card className="bg-gradient-to-br from-teal-500/5 to-amber-500/5 border-teal-200">
            <CardContent className="pt-6 text-center space-y-4">
              <h3 className="text-2xl font-bold">Remember</h3>
              <p className="text-lg leading-relaxed max-w-2xl mx-auto">
                Recovery is not about perfection—it's about progress. These suggestions are 
                guideposts on your journey, not destinations. Be patient with yourself, celebrate 
                small victories, and know that every day sober is a day worth celebrating.
              </p>
              <p className="text-xl font-semibold text-teal-600">
                One day at a time. You've got this.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
