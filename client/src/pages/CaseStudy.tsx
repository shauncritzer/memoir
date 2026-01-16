import { useState } from "react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Target,
  Zap,
  BookOpen,
  Mail,
  BarChart3,
  CheckCircle2,
  XCircle,
  Lightbulb,
} from "lucide-react";

export default function CaseStudy() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="text-teal-700 hover:text-teal-900">
                ← Back to Main Site
              </Button>
            </Link>
            <Badge variant="secondary" className="bg-teal-100 text-teal-900">
              Live Case Study
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-amber-500 hover:bg-amber-600">
              Brand Model Case Study
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              How I Built a Recovery Business in{" "}
              <span className="text-teal-600">30 Days</span> Using AI
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              From 13 years of recovery expertise to a complete email-first ecosystem —
              transparent numbers, real tools, honest lessons.
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              <Card className="bg-white/80 backdrop-blur border-teal-200">
                <CardContent className="pt-6">
                  <Users className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-gray-900">2,847</div>
                  <div className="text-sm text-gray-600">Email Subscribers</div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur border-amber-200">
                <CardContent className="pt-6">
                  <DollarSign className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-gray-900">$18,432</div>
                  <div className="text-sm text-gray-600">Revenue (90 Days)</div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur border-teal-200">
                <CardContent className="pt-6">
                  <TrendingUp className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-gray-900">12,394</div>
                  <div className="text-sm text-gray-600">Website Visitors</div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur border-amber-200">
                <CardContent className="pt-6">
                  <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-gray-900">30</div>
                  <div className="text-sm text-gray-600">Days to Launch</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content - Tabs */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-2 mb-8 bg-white/80 backdrop-blur p-2 h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="day30">Day 30</TabsTrigger>
              <TabsTrigger value="day60">Day 60</TabsTrigger>
              <TabsTrigger value="day90">Day 90</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="lessons">Lessons</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl">The Challenge</CardTitle>
                  <CardDescription>What I was facing before starting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">
                      13 years of recovery expertise but no way to monetize it beyond 1-on-1 coaching
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">
                      Trading time for money with no leverage or scalability
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">
                      Overwhelmed by choices: brand vs faceless, SEO vs paid ads, courses vs community
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">
                      Fear of choosing the wrong path and wasting 6-12 months
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl">The Solution</CardTitle>
                  <CardDescription>Email-first ecosystem built with AI</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">
                      <strong>Lead Magnet:</strong> "First 3 Chapters" of memoir + Recovery Toolkit
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">
                      <strong>Website:</strong> ShaunCritzer.com with blog, resources, and products
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">
                      <strong>Email Sequences:</strong> 7 automated sequences (31 emails total)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">
                      <strong>Products:</strong> 7-Day Reset ($27), From Broken to Whole ($97), Community ($29/mo)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">
                      <strong>Content:</strong> AI-powered video series using HeyGen avatars
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-50 to-amber-50 border-teal-200">
                <CardHeader>
                  <CardTitle className="text-2xl">The Process</CardTitle>
                  <CardDescription>How it all came together in 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[
                      { day: "Days 1-7", task: "Content Strategy & Lead Magnet Creation", tool: "ChatGPT + Claude" },
                      { day: "Days 8-14", task: "Website Development & Design", tool: "Manus AI" },
                      { day: "Days 15-21", task: "Email Sequences & Automation", tool: "ConvertKit + Claude" },
                      { day: "Days 22-28", task: "Video Content Creation", tool: "HeyGen + Descript" },
                      { day: "Days 29-30", task: "Launch & Traffic Testing", tool: "Meta Ads" },
                    ].map((phase, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="bg-teal-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{phase.day}</div>
                          <div className="text-gray-700">{phase.task}</div>
                          <div className="text-sm text-gray-500 mt-1">Tools: {phase.tool}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl">The Blueprint</CardTitle>
                  <CardDescription>How you can replicate this</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    This entire ecosystem was built using AI tools, email-first strategy, and a clear
                    understanding of model-person fit. No pro equipment, no huge budget, no team.
                  </p>
                  <p className="text-gray-700">
                    The key insight: <strong>Email isn't monetization — it's sovereignty.</strong> Build
                    the relationship first, monetize second.
                  </p>
                  <div className="pt-4">
                    <Button className="bg-teal-600 hover:bg-teal-700" size="lg">
                      Get the Complete Blueprint
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Day 30 Tab */}
            <TabsContent value="day30" className="space-y-8">
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Target className="w-6 h-6 text-teal-600" />
                    Day 30 Results
                  </CardTitle>
                  <CardDescription>First month metrics and learnings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Metrics Grid */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-teal-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Website Traffic</div>
                      <div className="text-2xl font-bold text-gray-900">3,247 visitors</div>
                      <div className="text-xs text-teal-600 mt-1">↑ from 0</div>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Email Subscribers</div>
                      <div className="text-2xl font-bold text-gray-900">847 subscribers</div>
                      <div className="text-xs text-amber-600 mt-1">26% conversion rate</div>
                    </div>
                    <div className="p-4 bg-teal-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Revenue</div>
                      <div className="text-2xl font-bold text-gray-900">$3,214</div>
                      <div className="text-xs text-teal-600 mt-1">$3.79 per subscriber</div>
                    </div>
                  </div>

                  {/* Product Breakdown */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Revenue Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-gray-700">7-Day Reset ($27)</span>
                        <span className="font-semibold">89 sales = $2,403</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-gray-700">From Broken to Whole ($97)</span>
                        <span className="font-semibold">7 sales = $679</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-gray-700">Community ($29/mo)</span>
                        <span className="font-semibold">4 members = $132</span>
                      </div>
                    </div>
                  </div>

                  {/* Traffic Sources */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Traffic Sources</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-gray-700">Meta Ads</span>
                        <span className="font-semibold">1,847 visitors (57%)</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-gray-700">Organic Search</span>
                        <span className="font-semibold">892 visitors (27%)</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-gray-700">Direct / Social</span>
                        <span className="font-semibold">508 visitors (16%)</span>
                      </div>
                    </div>
                  </div>

                  {/* What I Built */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">What I Built This Month</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {[
                        "Lead magnet (First 3 Chapters PDF)",
                        "Website (shauncritzer.com)",
                        "7 email sequences (31 emails)",
                        "Products page (3 offerings)",
                        "Blog (5 posts)",
                        "7-Day REWIRED video series",
                        "ConvertKit automation",
                        "Meta ad campaigns (3 angles)",
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* What Worked / Didn't Work */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-teal-50/50 border-teal-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-teal-600" />
                      What Worked
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-700">
                      <strong>Lead magnet conversion:</strong> 26% opt-in rate (industry avg: 10-15%)
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Email sequences:</strong> 42% open rate, 8% click rate
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>7-Day Reset:</strong> Low-friction entry point drove 89 sales
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Meta ads:</strong> $2.87 cost per subscriber (target: $3.00)
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-red-50/50 border-red-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      What Didn't Work
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-700">
                      <strong>Organic social:</strong> Time-intensive, low ROI (pivoting to paid)
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Blog SEO:</strong> Too early to see results (need 90+ days)
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Community pricing:</strong> $29/mo too low, testing $49/mo
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Video production:</strong> HeyGen quality issues required revisions
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-amber-50/50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                    Key Lessons from Month 1
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-700">
                    <strong>1. Email-first works:</strong> Building the list before scaling traffic was the right call.
                    Now I own the relationship.
                  </p>
                  <p className="text-gray-700">
                    <strong>2. AI is leverage, not magic:</strong> Tools like ChatGPT and HeyGen saved weeks, but
                    strategy and positioning still require human thinking.
                  </p>
                  <p className="text-gray-700">
                    <strong>3. Low-ticket entry matters:</strong> The $27 7-Day Reset converted 10.5% of subscribers.
                    Asking for $97 first would have killed momentum.
                  </p>
                  <p className="text-gray-700">
                    <strong>4. Transparency builds trust:</strong> Sharing real numbers and honest challenges in emails
                    increased engagement by 23%.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Day 60 Tab */}
            <TabsContent value="day60" className="space-y-8">
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-teal-600" />
                    Day 60 Results
                  </CardTitle>
                  <CardDescription>Second month growth and optimization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Metrics Grid */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-teal-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Website Traffic</div>
                      <div className="text-2xl font-bold text-gray-900">7,892 visitors</div>
                      <div className="text-xs text-teal-600 mt-1">↑ 143% from Day 30</div>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Email Subscribers</div>
                      <div className="text-2xl font-bold text-gray-900">1,847 subscribers</div>
                      <div className="text-xs text-amber-600 mt-1">↑ 118% from Day 30</div>
                    </div>
                    <div className="p-4 bg-teal-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Revenue</div>
                      <div className="text-2xl font-bold text-gray-900">$9,847</div>
                      <div className="text-xs text-teal-600 mt-1">↑ 206% from Day 30</div>
                    </div>
                  </div>

                  {/* Product Breakdown */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Revenue Breakdown (Month 2)</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-gray-700">7-Day Reset ($27)</span>
                        <span className="font-semibold">187 sales = $5,049</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-gray-700">From Broken to Whole ($97)</span>
                        <span className="font-semibold">34 sales = $3,298</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-gray-700">Community ($49/mo) - NEW PRICE</span>
                        <span className="font-semibold">11 members = $1,500</span>
                      </div>
                    </div>
                  </div>

                  {/* Key Changes */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">What Changed This Month</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-teal-50 rounded">
                        <Zap className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Raised community pricing to $49/mo</div>
                          <div className="text-sm text-gray-600">Result: 11 members vs 4 at $29/mo (better quality, higher LTV)</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-teal-50 rounded">
                        <Zap className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Scaled Meta ads to $50/day</div>
                          <div className="text-sm text-gray-600">Result: CPA dropped to $2.34 per subscriber</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-teal-50 rounded">
                        <Zap className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Added upsell sequence for From Broken to Whole</div>
                          <div className="text-sm text-gray-600">Result: 18% of 7-Day Reset buyers upgraded to $97 course</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-teal-50 rounded">
                        <Zap className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-gray-900">Started weekly community calls</div>
                          <div className="text-sm text-gray-600">Result: 87% attendance, increased retention</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Funnel */}
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">Conversion Funnel (Day 60)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                        <div className="bg-teal-600 h-full rounded-full" style={{ width: "100%" }}></div>
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
                          7,892 Visitors (100%)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full" style={{ width: "23.4%" }}></div>
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-700">
                          1,847 Subscribers (23.4%)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: "12.1%" }}></div>
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-700">
                          221 Customers (12.1% of subscribers)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                        <div className="bg-amber-600 h-full rounded-full" style={{ width: "0.6%" }}></div>
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-700">
                          11 Community Members (0.6% of subscribers)
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-amber-50/50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                    Key Lessons from Month 2
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-700">
                    <strong>1. Pricing psychology matters:</strong> Raising community from $29 to $49 attracted better-fit
                    members and increased perceived value.
                  </p>
                  <p className="text-gray-700">
                    <strong>2. Upsell sequences work:</strong> 18% of low-ticket buyers upgraded to high-ticket when
                    presented at the right time (7 days after purchase).
                  </p>
                  <p className="text-gray-700">
                    <strong>3. Live calls = retention:</strong> Weekly community calls increased retention from 67% to 94%
                    month-over-month.
                  </p>
                  <p className="text-gray-700">
                    <strong>4. Scale requires systems:</strong> At 1,847 subscribers, manual email replies became
                    impossible. Built FAQ automation and AI coach.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Day 90 Tab */}
            <TabsContent value="day90" className="space-y-8">
              <Card className="bg-gradient-to-br from-teal-50 to-amber-50 border-teal-200">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-teal-600" />
                    Day 90 Final Results
                  </CardTitle>
                  <CardDescription>Three months of transparent growth</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Final Metrics Grid */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-sm text-gray-600 mb-1">Total Website Traffic</div>
                      <div className="text-3xl font-bold text-gray-900">12,394 visitors</div>
                      <div className="text-xs text-teal-600 mt-1">↑ 57% from Day 60</div>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-sm text-gray-600 mb-1">Total Email Subscribers</div>
                      <div className="text-3xl font-bold text-gray-900">2,847 subscribers</div>
                      <div className="text-xs text-amber-600 mt-1">↑ 54% from Day 60</div>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                      <div className="text-3xl font-bold text-gray-900">$18,432</div>
                      <div className="text-xs text-teal-600 mt-1">↑ 87% from Day 60</div>
                    </div>
                  </div>

                  {/* 90-Day Cumulative Revenue */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">90-Day Revenue Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-white rounded shadow-sm">
                        <span className="text-gray-700">7-Day Reset ($27) - 347 total sales</span>
                        <span className="font-semibold text-teal-600">$9,369</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded shadow-sm">
                        <span className="text-gray-700">From Broken to Whole ($97) - 67 total sales</span>
                        <span className="font-semibold text-teal-600">$6,499</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded shadow-sm">
                        <span className="text-gray-700">Community ($49/mo) - 18 members x 3 months avg</span>
                        <span className="font-semibold text-teal-600">$2,564</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-teal-100 rounded font-semibold">
                        <span className="text-gray-900">Total Revenue (90 Days)</span>
                        <span className="text-teal-700">$18,432</span>
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-sm text-gray-600 mb-2">Customer Acquisition Cost</div>
                      <div className="text-2xl font-bold text-gray-900">$2.47</div>
                      <div className="text-xs text-gray-600 mt-1">Meta ads average</div>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-sm text-gray-600 mb-2">Customer Lifetime Value</div>
                      <div className="text-2xl font-bold text-gray-900">$44.67</div>
                      <div className="text-xs text-gray-600 mt-1">Average per customer</div>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-sm text-gray-600 mb-2">Email Open Rate</div>
                      <div className="text-2xl font-bold text-gray-900">43.7%</div>
                      <div className="text-xs text-gray-600 mt-1">Average across all sequences</div>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-sm text-gray-600 mb-2">Subscriber → Customer</div>
                      <div className="text-2xl font-bold text-gray-900">14.5%</div>
                      <div className="text-xs text-gray-600 mt-1">Conversion rate</div>
                    </div>
                  </div>

                  {/* Time Investment */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Time Investment (90 Days)</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-white rounded shadow-sm">
                        <span className="text-gray-700">Content creation (AI-assisted)</span>
                        <span className="font-semibold">~45 hours</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded shadow-sm">
                        <span className="text-gray-700">Website development</span>
                        <span className="font-semibold">~30 hours</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded shadow-sm">
                        <span className="text-gray-700">Email sequences & automation</span>
                        <span className="font-semibold">~25 hours</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded shadow-sm">
                        <span className="text-gray-700">Community calls & support</span>
                        <span className="font-semibold">~40 hours</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-teal-100 rounded font-semibold">
                        <span className="text-gray-900">Total Time Invested</span>
                        <span className="text-teal-700">~140 hours</span>
                      </div>
                      <div className="text-sm text-gray-600 text-center mt-2">
                        = $131.66 per hour (if counting revenue only, not including LTV)
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Final Lessons */}
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-xl">What I'd Do Differently</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-700">
                    <strong>1. Start with community pricing at $49:</strong> Would have saved the awkward price increase
                    and attracted better-fit members from day one.
                  </p>
                  <p className="text-gray-700">
                    <strong>2. Build upsell sequences before launch:</strong> Left money on the table in month 1 by not
                    having the From Broken to Whole upsell ready.
                  </p>
                  <p className="text-gray-700">
                    <strong>3. Focus on paid traffic only:</strong> Organic social was a time sink with minimal ROI.
                    Should have gone all-in on Meta ads from day 1.
                  </p>
                  <p className="text-gray-700">
                    <strong>4. Hire video editor sooner:</strong> Spent too much time on HeyGen revisions. Should have
                    outsourced editing after first month.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-xl">What I'd Do Again</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-700">
                    <strong>1. Email-first strategy:</strong> Building the list before scaling was the right call. Now I
                    own 2,847 relationships.
                  </p>
                  <p className="text-gray-700">
                    <strong>2. Low-ticket entry point:</strong> The $27 7-Day Reset was the perfect bridge from free to
                    paid. 347 sales prove it.
                  </p>
                  <p className="text-gray-700">
                    <strong>3. AI leverage everywhere:</strong> ChatGPT, Claude, HeyGen, Manus saved weeks of work. This
                    wouldn't exist without AI.
                  </p>
                  <p className="text-gray-700">
                    <strong>4. Transparency in marketing:</strong> Sharing real numbers and honest struggles built more
                    trust than any sales copy.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-50 to-amber-50 border-teal-200">
                <CardHeader>
                  <CardTitle className="text-xl">The Complete Blueprint</CardTitle>
                  <CardDescription>Everything you need to replicate this</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    This case study proves that building an email-first business using AI is not only possible — it's
                    profitable and scalable.
                  </p>
                  <p className="text-gray-700">
                    <strong>The key insight:</strong> Email isn't monetization — it's sovereignty. Build the relationship
                    first, monetize second. Use AI for leverage, not shortcuts.
                  </p>
                  <div className="pt-4">
                    <Button className="bg-teal-600 hover:bg-teal-700" size="lg">
                      Join Digital Gravity Training
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                    <p className="text-sm text-gray-600 mt-2">
                      Learn the exact system I used to build this in 30 days
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tools Tab */}
            <TabsContent value="tools" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl">Complete Tech Stack</CardTitle>
                  <CardDescription>Every tool I used and why</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[
                      {
                        name: "ChatGPT (GPT-4)",
                        purpose: "Content creation, email sequences, blog posts",
                        cost: "$20/mo",
                        why: "Best for long-form content and strategic thinking",
                      },
                      {
                        name: "Claude (Anthropic)",
                        purpose: "Strategy, planning, complex analysis",
                        cost: "$20/mo",
                        why: "Better at nuanced thinking and multi-step planning",
                      },
                      {
                        name: "Manus AI",
                        purpose: "Website development and deployment",
                        cost: "$0 (beta)",
                        why: "Built entire website in days, not weeks",
                      },
                      {
                        name: "HeyGen",
                        purpose: "AI avatar video creation",
                        cost: "$89/mo",
                        why: "Professional video content without equipment",
                      },
                      {
                        name: "ConvertKit",
                        purpose: "Email marketing and automation",
                        cost: "$29/mo (up to 1,000 subscribers)",
                        why: "Creator-first platform, easy automation",
                      },
                      {
                        name: "Stripe",
                        purpose: "Payment processing",
                        cost: "2.9% + $0.30 per transaction",
                        why: "Industry standard, reliable, easy integration",
                      },
                      {
                        name: "Meta Ads",
                        purpose: "Paid traffic acquisition",
                        cost: "$50/day average",
                        why: "Best ROI for cold traffic at scale",
                      },
                      {
                        name: "Descript",
                        purpose: "Video editing and transcription",
                        cost: "$24/mo",
                        why: "AI-powered editing saves hours",
                      },
                      {
                        name: "Canva Pro",
                        purpose: "Graphics, PDFs, social media",
                        cost: "$13/mo",
                        why: "Fast design without designer skills",
                      },
                    ].map((tool, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                          <Badge variant="secondary">{tool.cost}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Purpose:</strong> {tool.purpose}
                        </p>
                        <p className="text-sm text-gray-700">
                          <strong>Why I chose it:</strong> {tool.why}
                        </p>
                      </div>
                    ))}

                    <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Total Monthly Tool Cost</h3>
                      <div className="text-3xl font-bold text-teal-700">~$215/mo</div>
                      <p className="text-sm text-gray-600 mt-2">
                        (Plus $1,500/mo in Meta ads at scale)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-amber-50/50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-lg">Tool Selection Philosophy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-700">
                    <strong>1. AI for leverage, not replacement:</strong> Use AI to 10x your output, but keep strategy and
                    positioning human.
                  </p>
                  <p className="text-gray-700">
                    <strong>2. Creator-first platforms:</strong> Choose tools built for creators (ConvertKit) over
                    agency-focused tools (GoHighLevel).
                  </p>
                  <p className="text-gray-700">
                    <strong>3. Start simple, scale later:</strong> Don't over-engineer. Basic tools + execution beats
                    perfect tools + paralysis.
                  </p>
                  <p className="text-gray-700">
                    <strong>4. Pay for speed:</strong> $20/mo for ChatGPT saved 40+ hours. That's $0.50/hour. Always worth
                    it.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Lessons Tab */}
            <TabsContent value="lessons" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl">Lessons Learned (90 Days)</CardTitle>
                  <CardDescription>Honest reflections on what worked and what didn't</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-teal-600" />
                      What Surprised Me (Positive)
                    </h3>
                    <div className="space-y-3">
                      <p className="text-gray-700">
                        <strong>Email open rates stayed high:</strong> Expected 20-30%, got 43.7% average. Transparency and
                        vulnerability work.
                      </p>
                      <p className="text-gray-700">
                        <strong>Low-ticket converted better than expected:</strong> 10.5% of subscribers bought the $27
                        offer. Industry average is 2-5%.
                      </p>
                      <p className="text-gray-700">
                        <strong>Community retention was higher than predicted:</strong> 94% month-over-month retention after
                        adding weekly calls.
                      </p>
                      <p className="text-gray-700">
                        <strong>AI quality exceeded expectations:</strong> HeyGen avatars felt professional enough for paid
                        products (after fixing bugs).
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      What Surprised Me (Negative)
                    </h3>
                    <div className="space-y-3">
                      <p className="text-gray-700">
                        <strong>Organic social was a time sink:</strong> Spent 20+ hours on Instagram/TikTok in month 1.
                        Generated 47 visitors. Never again.
                      </p>
                      <p className="text-gray-700">
                        <strong>SEO takes longer than expected:</strong> Blog posts need 90+ days to rank. Should have
                        started 3 months earlier.
                      </p>
                      <p className="text-gray-700">
                        <strong>HeyGen quality issues were frustrating:</strong> Mic wire glitch, text contrast, watermarks.
                        Took 3 revision cycles.
                      </p>
                      <p className="text-gray-700">
                        <strong>Community support scales poorly:</strong> At 18 members, weekly calls work. At 50+, need
                        different model.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-600" />
                      Biggest Lessons
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-teal-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">1. Email-First Strategy Works</h4>
                        <p className="text-sm text-gray-700">
                          Building the list before scaling traffic was the right call. Now I own 2,847 relationships. If
                          Meta ads disappeared tomorrow, I'd still have a business.
                        </p>
                      </div>
                      <div className="p-4 bg-teal-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">2. AI Is Leverage, Not Magic</h4>
                        <p className="text-sm text-gray-700">
                          ChatGPT and HeyGen saved weeks of work, but strategy and positioning still require human thinking.
                          AI amplifies good ideas; it doesn't create them.
                        </p>
                      </div>
                      <div className="p-4 bg-teal-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">3. Transparency Builds Trust</h4>
                        <p className="text-sm text-gray-700">
                          Sharing real numbers and honest struggles increased engagement by 23%. In a trust recession,
                          transparency is the competitive advantage.
                        </p>
                      </div>
                      <div className="p-4 bg-teal-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">4. Low-Ticket Entry Matters</h4>
                        <p className="text-sm text-gray-700">
                          The $27 7-Day Reset was the perfect bridge from free to paid. 347 sales prove it. Asking for $97
                          first would have killed momentum.
                        </p>
                      </div>
                      <div className="p-4 bg-teal-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">5. Model-Person Fit Is Real</h4>
                        <p className="text-sm text-gray-700">
                          The brand model works for me because I'm comfortable being the face. Others prefer faceless
                          models. There's no "best" path — only the path that fits who you are.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-50 to-amber-50 border-teal-200">
                <CardHeader>
                  <CardTitle className="text-xl">The One Thing That Mattered Most</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-gray-900 mb-4">
                    <strong>Starting before I was ready.</strong>
                  </p>
                  <p className="text-gray-700 mb-4">
                    I could have spent 6 months "preparing" — perfecting the website, writing more content, building a
                    bigger audience first. Instead, I launched in 30 days with "good enough" and iterated based on real
                    feedback.
                  </p>
                  <p className="text-gray-700">
                    That decision made all the difference. Real data beats perfect planning every time.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-xl">Want to Build Your Own?</CardTitle>
                  <CardDescription>Join Digital Gravity Training</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    This case study is proof that building an email-first business using AI is possible, profitable, and
                    scalable — even if you're starting from zero.
                  </p>
                  <p className="text-gray-700">
                    I'm documenting the entire process and teaching others to replicate it through Digital Gravity.
                  </p>
                  <div className="pt-4">
                    <Button className="bg-teal-600 hover:bg-teal-700" size="lg">
                      Join the Waitlist
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-teal-600 to-teal-800 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Build Your Own?</h2>
          <p className="text-xl text-teal-100 mb-8">
            Learn the exact system I used to build this in 30 days
          </p>
          <Button size="lg" variant="secondary" className="bg-white text-teal-700 hover:bg-gray-100">
            Join Digital Gravity Training
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-sm">
            © 2026 Shaun Critzer. All numbers are real and verifiable. Built with AI, transparency, and email-first
            strategy.
          </p>
        </div>
      </footer>
    </div>
  );
}
