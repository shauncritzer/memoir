import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Shield, Clock, AlertTriangle } from "lucide-react";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Navigation */}
      <Navigation />

      {/* Content */}
      <main className="flex-1 pt-24 pb-12">
        <div className="container max-w-4xl">
          <article className="prose prose-invert prose-yellow max-w-none">
            <h1 className="text-4xl font-bold text-yellow-500 mb-4">Refund Policy</h1>
            <p className="text-gray-400 mb-8">Last Updated: February 9, 2026</p>

            {/* Philosophy Card */}
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
              Instead of a standard, impersonal refund system, we've created a heart-centered process that honors your journey
              while protecting the integrity of our programs.
            </p>

            {/* 30-Day Guarantee */}
            <Card className="bg-gradient-to-br from-yellow-900/10 to-black border-yellow-600/20 mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-6 w-6 text-yellow-500" />
                  <h3 className="text-xl font-bold text-yellow-500">30-Day Complete Satisfaction Guarantee</h3>
                </div>
                <p className="text-gray-300">
                  Try the REWIRED Reset completely risk-free for 30 days. If you've engaged with the program and it's not resonating,
                  we'll refund you in full—and we genuinely want to understand why.
                </p>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-bold text-yellow-500 mt-12 mb-6">How It Works</h2>

            <div className="space-y-6">
              {/* Step 1 */}
              <Card className="bg-gradient-to-br from-gray-900 to-black border-yellow-600/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-600 text-black flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-yellow-500 mb-2">The Request - A Gentle Off-Ramp</h3>
                      <p className="text-gray-300 mb-3">
                        Click the "Request a Refund" button in your course dashboard within 30 days of purchase. This initiates
                        a personalized, automated email sequence and triggers an immediate account review.
                      </p>
                      <div className="bg-yellow-900/20 border border-yellow-600/30 rounded p-3 text-sm">
                        <p className="text-gray-300"><strong className="text-yellow-500">User Action:</strong> Clicks "Request a Refund"</p>
                        <p className="text-gray-300"><strong className="text-yellow-500">System Action:</strong> Sends personalized email + initiates account activity review</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 2 */}
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
                      
                      <div className="bg-gray-900/50 border border-yellow-600/20 rounded-lg p-6">
                        <p className="text-sm text-yellow-500 font-semibold mb-3">Sample Email: "We're here to listen."</p>
                        <p className="text-gray-400 text-sm mb-2"><strong>Subject:</strong> A note from Shaun about your refund request</p>
                        <div className="text-gray-300 text-sm space-y-3 mt-4">
                          <p>Hi [First Name],</p>
                          <p>
                            I saw your request to refund the [Course Name] program. I want you to know that's completely okay.
                            My goal is to support you on your journey, and if this wasn't the right fit, or the right time, I honor that.
                          </p>
                          <p>
                            Before we process the refund, I have one small request. It would mean the world to me if you could share
                            a bit about your experience. There are no right or wrong answers, and your honesty will help us better
                            serve others who are walking this path.
                          </p>
                          <p className="font-semibold text-yellow-500">What were you hoping for that you didn't find?</p>
                          <p>Simply reply to this email with your thoughts. Your feedback is a gift.</p>
                          <p>In the meantime, whether you continue with us or not, I want you to have this.</p>
                          <p className="font-semibold text-yellow-500">[Link to a Free, High-Value Resource]</p>
                          <p>This is for you, no strings attached. Thank you for trusting us, even for a short time.</p>
                          <p>Once you reply, your refund will be processed automatically within 24 hours.</p>
                          <p className="mt-4">
                            With you on the journey,<br />
                            <strong>Shaun Critzer</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 3 */}
              <Card className="bg-gradient-to-br from-gray-900 to-black border-yellow-600/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-600 text-black flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-yellow-500 mb-2">The Resolution - Honoring Your Voice</h3>
                      <p className="text-gray-300 mb-3">When you reply to the email:</p>
                      <ul className="list-disc ml-6 space-y-2 text-gray-300">
                        <li><strong className="text-yellow-500">Your feedback is captured:</strong> Saved to our database to help us improve</li>
                        <li><strong className="text-yellow-500">Your refund is processed:</strong> Full refund initiated through Stripe automatically (pending account review)</li>
                        <li><strong className="text-yellow-500">You receive confirmation:</strong> A final email confirms your refund has been processed</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Refund Eligibility */}
            <h2 className="text-2xl font-bold text-yellow-500 mt-12 mb-6">Refund Eligibility</h2>
            <p className="text-gray-300 mb-6">
              To ensure fairness for everyone while maintaining our commitment to your success:
            </p>

            <Card className="bg-gradient-to-br from-gray-900 to-black border-yellow-600/20 mb-6">
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold text-yellow-500 mb-4">Time & Completion Limits</h3>
                <ul className="list-disc ml-6 space-y-2 text-gray-300">
                  <li><strong>Refunds must be requested within 30 days of purchase</strong></li>
                  <li><strong>Refunds are not available once you've completed 50% or more of the course content</strong> (you've received the core value at that point)</li>
                  <li><strong>One refund per customer</strong> (we trust you, but this prevents system abuse)</li>
                  <li><strong>Course access is immediately revoked upon refund</strong> (you'll lose access to all materials, community, and future updates)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900 to-black border-yellow-600/20 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <Shield className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
                  <h3 className="text-lg font-bold text-yellow-500">Intellectual Property Protection</h3>
                </div>
                <p className="text-gray-300 mb-3"><strong>Refunds are void if the purchaser is found to be:</strong></p>
                <ul className="list-disc ml-6 space-y-2 text-gray-300 mb-4">
                  <li>A competing course creator or business in the recovery/fitness coaching space</li>
                  <li>Reproducing, reselling, or redistributing course materials</li>
                  <li>Sharing login credentials with others</li>
                </ul>
                <p className="text-gray-300">
                  <strong>Excessive downloading of course materials within the first 48-72 hours may affect refund eligibility</strong> and
                  will trigger a manual review to ensure program integrity.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/10 to-black border-yellow-600/30 mb-8">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
                  <h3 className="text-lg font-bold text-yellow-500">Account Activity Review</h3>
                </div>
                <p className="text-gray-300 mb-3"><strong>All refund requests trigger an immediate review of account activity</strong> including:</p>
                <ul className="list-disc ml-6 space-y-2 text-gray-300 mb-4">
                  <li>Course completion progress</li>
                  <li>Material download patterns</li>
                  <li>Login sharing or suspicious access</li>
                  <li>Terms of service compliance</li>
                </ul>
                <p className="text-gray-300 mb-3"><strong>We reserve the right to deny refunds in cases of:</strong></p>
                <ul className="list-disc ml-6 space-y-2 text-gray-300">
                  <li>Clear policy abuse</li>
                  <li>Terms of service violations</li>
                  <li>Intellectual property theft or unauthorized distribution</li>
                  <li>Evidence of bad faith enrollment</li>
                </ul>
              </CardContent>
            </Card>

            <p className="text-gray-300 italic mb-8">
              We're confident that if you engage with the first week of content in good faith, you'll see why this program has
              helped so many people transform their lives. But if it's not clicking, we want to make it right.
            </p>

            {/* Why This Works */}
            <h2 className="text-2xl font-bold text-yellow-500 mt-12 mb-6">Why This Approach Works</h2>
            <div className="space-y-3 text-gray-300">
              <p>
                <strong className="text-yellow-500">It Makes People Feel Seen/Heard:</strong> By asking for your story instead of just
                taking your money back, we show we value your experience over your transaction.
              </p>
              <p>
                <strong className="text-yellow-500">It Provides Valuable Information:</strong> We learn exactly why our product isn't
                working for some people, helping us improve for future students.
              </p>
              <p>
                <strong className="text-yellow-500">It Aligns with Our Brand:</strong> It's an authentic, human-centered process that
                builds trust, even with customers who are leaving.
              </p>
              <p>
                <strong className="text-yellow-500">The "Wow" Factor:</strong> Offering a free, high-value resource as a parting gift
                is an unexpected act of generosity that leaves a lasting positive impression.
              </p>
              <p>
                <strong className="text-yellow-500">It Models Healthy Boundaries:</strong> Recovery is about balance—being generous
                while honoring limits that protect everyone.
              </p>
              <p>
                <strong className="text-yellow-500">It Protects Our Community:</strong> By preventing abuse, we ensure resources remain
                available for those who genuinely need support.
              </p>
            </div>

            {/* Important Notes */}
            <h2 className="text-2xl font-bold text-yellow-500 mt-12 mb-6">Important Notes</h2>
            <ul className="list-disc ml-6 space-y-2 text-gray-300 mb-8">
              <li>Refunds are processed within 24 hours of receiving your feedback email (subject to account review)</li>
              <li>All refunds are processed through Stripe to your original payment method</li>
              <li>The free resource is yours to keep, regardless of refund status (for good-faith enrollments)</li>
              <li>Your feedback helps us improve our programs for future students</li>
              <li>After 30 days or 50% course completion, refunds are not available as you've received substantial value from the program</li>
              <li>Refund denials (due to policy violations) will be communicated clearly with specific reasons</li>
            </ul>

            {/* 30-Day Commitment */}
            <Card className="bg-gradient-to-br from-yellow-900/20 to-black border-yellow-600/30 mb-8">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold text-yellow-500 mb-3">Our 30-Day Commitment to You</h3>
                <p className="text-gray-300 mb-3">
                  We chose 30 days (not the standard 14) because we believe in giving you real time to engage with the material,
                  especially if life gets chaotic. Recovery isn't linear, and neither is transformation.
                </p>
                <p className="text-gray-300">
                  This generous window shows our confidence in the program and our respect for your journey. We want you to feel
                  safe taking this step, not rushed or pressured.
                </p>
              </CardContent>
            </Card>

            {/* Contact & Special Circumstances */}
            <h2 className="text-2xl font-bold text-yellow-500 mt-12 mb-6">Contact Us</h2>
            <p className="text-gray-300 mb-6">
              If you have any questions about our refund policy or need assistance, please contact us through your course dashboard
              or via our website contact form.
            </p>

            <Card className="bg-gradient-to-br from-gray-900 to-black border-yellow-600/20 mb-8">
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold text-yellow-500 mb-3">Special Circumstances</h3>
                <p className="text-gray-300 mb-3">
                  We understand that life happens. If you have extenuating circumstances beyond the 30-day window (medical emergency,
                  family crisis, military deployment, etc.), please reach out directly. We'll review each situation individually with
                  compassion and care.
                </p>
                <p className="text-gray-400 text-sm italic">
                  <strong>Please note:</strong> Special circumstance reviews are subject to verification and the same eligibility
                  requirements listed above.
                </p>
              </CardContent>
            </Card>

            <p className="text-gray-400 italic text-center mt-12">
              This policy reflects our commitment to your success and our respect for the transformational work we do together.
              We believe in second chances, fresh starts, and doing the right thing—even when it's hard. These protections ensure
              we can continue serving our community with integrity.
            </p>
          </article>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
