import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ExternalLink, Heart, Mail, Gift } from "lucide-react";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-yellow-600/20 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center space-x-6">
            <Link href="/about" className="text-sm font-medium text-gray-300 hover:text-yellow-500 transition-colors">
              About
            </Link>
            <Link href="/memoir" className="text-sm font-medium text-gray-300 hover:text-yellow-500 transition-colors">
              The Memoir
            </Link>
            <Link href="/blog" className="text-sm font-medium text-gray-300 hover:text-yellow-500 transition-colors">
              Blog
            </Link>
            <Link href="/resources" className="text-sm font-medium text-gray-300 hover:text-yellow-500 transition-colors">
              Resources
            </Link>
            <Link href="/products" className="text-sm font-medium text-gray-300 hover:text-yellow-500 transition-colors">
              Products
            </Link>
            <Link href="/ai-coach" className="text-sm font-medium text-gray-300 hover:text-yellow-500 transition-colors">
              AI Coach
            </Link>
            <Link href="/products">
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <article className="prose prose-invert prose-yellow max-w-none">
            <h1 className="text-4xl font-bold text-yellow-500 mb-4">Refund Policy</h1>
            <p className="text-gray-400 mb-8">Last Updated: December 9, 2025</p>

            <Card className="bg-gradient-to-br from-yellow-900/20 to-black border-yellow-600/30 mb-8">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Heart className="h-8 w-8 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-yellow-500 mb-2">Our Philosophy</h3>
                    <p className="text-gray-300">
                      "People don't care what you know until they know that you care." Every interaction, even a refund request,
                      is an opportunity for connection. This refund process is designed to make you feel seen, heard, and valued—not just processed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">The "Connection & Feedback" Refund Process</h2>
            <p className="text-gray-300 mb-6">
              Instead of a standard, impersonal refund system, we've created a 3-step process that honors your journey
              and provides us with invaluable insights to better serve others.
            </p>

            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-gray-900 to-black border-yellow-600/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-600 text-black flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-yellow-500 mb-2">The Request - A Gentle Off-Ramp</h3>
                      <p className="text-gray-300 mb-3">
                        Click the "Request a Refund" button in your course dashboard. This doesn't immediately trigger a refund—instead,
                        it initiates a personalized, automated email sequence.
                      </p>
                      <p className="text-sm text-gray-400">
                        <strong>User Action:</strong> Clicks "Request a Refund"<br />
                        <strong>System Action:</strong> Sends personalized email (see below)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-900 to-black border-yellow-600/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-600 text-black flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-yellow-500 mb-2">The Conversation - "The Language of the Heart"</h3>
                      <p className="text-gray-300 mb-4">
                        You'll receive a personal email from Shaun asking for your honest feedback. This is where we show we truly care.
                      </p>

                      <Card className="bg-black/50 border-yellow-600/30">
                        <CardContent className="pt-6 space-y-3">
                          <div className="flex items-center gap-2 mb-4">
                            <Mail className="h-5 w-5 text-yellow-500" />
                            <p className="text-sm font-semibold text-yellow-500">Sample Email: "We're here to listen."</p>
                          </div>

                          <p className="text-sm text-gray-400"><strong>Subject:</strong> A note from Shaun about your refund request</p>

                          <div className="text-sm text-gray-300 space-y-2 pl-4 border-l-2 border-yellow-600/30">
                            <p>Hi [First Name],</p>

                            <p>
                              I saw your request to refund the [Course Name] program. I want you to know that's completely okay.
                              My goal is to support you on your journey, and if this wasn't the right fit, or the right time, I honor that.
                            </p>

                            <p>
                              Before we process the refund, I have one small request. It would mean the world to me if you could share
                              a bit about your experience. There are no right or wrong answers, and your honesty will help us better serve
                              others who are walking this path.
                            </p>

                            <p className="font-semibold text-yellow-500">What were you hoping for that you didn't find?</p>

                            <p>Simply reply to this email with your thoughts. Your feedback is a gift.</p>

                            <p>In the meantime, whether you continue with us or not, I want you to have this.</p>

                            <div className="flex items-center gap-2 my-3">
                              <Gift className="h-5 w-5 text-yellow-500" />
                              <p className="font-semibold text-yellow-500">[Link to a Free, High-Value Resource]</p>
                            </div>

                            <p>This is for you, no strings attached. Thank you for trusting us, even for a short time.</p>

                            <p>Once you reply, your refund will be processed automatically within 24 hours.</p>

                            <p>With you on the journey,<br />Shaun Critzer</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-gray-900 to-black border-yellow-600/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-600 text-black flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-yellow-500 mb-2">The Resolution - Honoring Your Voice</h3>
                      <p className="text-gray-300 mb-3">
                        When you reply to the email:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-300">
                        <li><strong>Your feedback is captured:</strong> Saved to our database to help us improve</li>
                        <li><strong>Your refund is processed:</strong> Full refund initiated through Stripe automatically</li>
                        <li><strong>You receive confirmation:</strong> A final email confirms your refund has been processed</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <h2 className="text-2xl font-bold text-yellow-500 mt-12 mb-4">Why This Approach Works</h2>
            <ul className="space-y-3 text-gray-300">
              <li>
                <strong className="text-yellow-500">It Makes People Feel Seen/Heard:</strong> By asking for your story instead of
                just taking your money back, we show we value your experience over your transaction.
              </li>
              <li>
                <strong className="text-yellow-500">It Provides Valuable Information:</strong> We learn exactly why our product isn't
                working for some people, helping us improve for future students.
              </li>
              <li>
                <strong className="text-yellow-500">It Aligns with Our Brand:</strong> It's an authentic, human-centered process that
                builds trust, even with customers who are leaving.
              </li>
              <li>
                <strong className="text-yellow-500">The "Wow" Factor:</strong> Offering a free, high-value resource as a parting gift
                is an unexpected act of generosity that leaves a lasting positive impression.
              </li>
            </ul>

            <Card className="bg-gradient-to-br from-yellow-900/20 to-black border-yellow-600/30 mt-8">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold text-yellow-500 mb-3">Important Notes</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Refunds are processed within 24 hours of receiving your feedback email</li>
                  <li>• Full refunds are available for all course purchases</li>
                  <li>• Your feedback helps us improve our programs for future students</li>
                  <li>• The free resource is yours to keep, regardless of refund status</li>
                  <li>• All refunds are processed through Stripe to your original payment method</li>
                </ul>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold text-yellow-500 mt-12 mb-4">Contact Us</h2>
            <p className="text-gray-300">
              If you have any questions about our refund policy or need assistance, please contact us through your course dashboard
              or via our website contact form.
            </p>
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-yellow-600/20 bg-black py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Logo />
              <p className="text-sm text-gray-400">
                13 years sober. Helping others find hope, healing, and wholeness in recovery.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-yellow-500">Navigation</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-yellow-500 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-yellow-500 transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-gray-400 hover:text-yellow-500 transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="text-gray-400 hover:text-yellow-500 transition-colors">
                    Resources
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="text-gray-400 hover:text-yellow-500 transition-colors">
                    Products
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-yellow-500">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/terms-of-use" className="text-gray-400 hover:text-yellow-500 transition-colors">
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link href="/refund-policy" className="text-gray-400 hover:text-yellow-500 transition-colors">
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link href="/faqs" className="text-gray-400 hover:text-yellow-500 transition-colors">
                    FAQs
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-yellow-500">Support</h3>
              <ul className="space-y-2 text-sm">
                <li className="text-gray-400">
                  <strong>Crisis Hotline:</strong> 988
                </li>
                <li className="text-gray-400">
                  <strong>SAMHSA:</strong> 1-800-662-4357
                </li>
                <li>
                  <a
                    href="https://www.aa.org/find-aa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-yellow-500 transition-colors inline-flex items-center gap-1"
                  >
                    Find AA Meetings <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-yellow-600/20 text-center text-sm text-gray-400">
            <p>© 2025 Shaun Critzer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
