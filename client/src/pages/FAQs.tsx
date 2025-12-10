import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ExternalLink, HelpCircle } from "lucide-react";

export default function FAQs() {
  const faqs = [
    {
      category: "About Our Approach",
      questions: [
        {
          q: "What makes your approach different from traditional recovery programs?",
          a: "Our approach is grounded in neuroscience and trauma-informed care. We understand that compulsive behaviors aren't moral failures—they're nervous system responses to trauma and dysregulation. Instead of focusing on willpower, we address the root causes: childhood trauma, nervous system dysregulation, and the brain chemistry behind addiction."
        },
        {
          q: "Is this a 12-step program?",
          a: "No, our programs are not 12-step based. We respect 12-step programs and believe they work for many people. However, our approach is science-based, focusing on nervous system regulation, trauma processing, and neuroplasticity. We incorporate elements from polyvagal theory, EMDR, somatic therapy, and neuroscience research."
        },
        {
          q: "What are process addictions?",
          a: "Process addictions are compulsive behaviors that don't involve substances—things like affairs, work addiction, fitness/bodybuilding obsession, gaming, shopping, or pornography. These behaviors serve the same function as substance addictions: they regulate a dysregulated nervous system. We specialize in addressing these often-overlooked compulsions."
        }
      ]
    },
    {
      category: "AI Recovery Coach",
      questions: [
        {
          q: "Is the AI Coach a replacement for therapy?",
          a: "No. The AI Recovery Coach is a support tool, not a licensed therapist or medical professional. It's designed to provide guidance, education, and support based on trauma-informed recovery principles. For clinical diagnosis or treatment of mental health conditions, always consult with a licensed healthcare provider."
        },
        {
          q: "How many free messages do I get with the AI Coach?",
          a: "You get 3 free messages without providing any information. After that, you can unlock 7 additional messages (10 total) by registering your email. Your chat history will be saved so you can pick up where you left off on any device. For unlimited access, you can enroll in the 'From Broken to Whole' course."
        },
        {
          q: "Is my conversation with the AI Coach confidential?",
          a: "Yes, your conversations are confidential. We may use anonymized data to improve the AI Coach, but we never share personally identifiable information. Your chat history is only accessible to you when logged in with your email."
        },
        {
          q: "Can the AI Coach handle crisis situations?",
          a: "No. If you're in crisis, please call the 988 Suicide & Crisis Lifeline (call or text 988) or the SAMHSA National Helpline (1-800-662-4357). The AI Coach is for educational support and guidance, not emergency intervention."
        }
      ]
    },
    {
      category: "Courses & Programs",
      questions: [
        {
          q: "What's included in the '7-Day Reset' course?",
          a: "The 7-Day Reset is a crash course in nervous system regulation. You'll learn breathwork techniques, somatic exercises, and practical tools to calm your dysregulated nervous system. It's designed to give you immediate relief and a foundation for deeper recovery work. Includes video lessons, guided exercises, and downloadable worksheets."
        },
        {
          q: "What's the difference between '7-Day Reset' and 'From Broken to Whole'?",
          a: "The 7-Day Reset ($27) is a short, intensive introduction to nervous system regulation—perfect if you need immediate tools or want to test our approach. 'From Broken to Whole' ($97) is a comprehensive 30-day program that goes deeper: processing childhood trauma, understanding your attachment style, rewiring shame responses, and building a complete recovery framework. It also includes unlimited AI Coach access."
        },
        {
          q: "Do I need to have a diagnosed addiction to benefit from these courses?",
          a: "No. Our programs are for anyone struggling with compulsive behaviors, emotional dysregulation, unprocessed trauma, or relationship patterns they want to change. You don't need a formal diagnosis. If you feel stuck in patterns that aren't serving you, this work can help."
        },
        {
          q: "How long do I have access to the course content?",
          a: "Lifetime access. Once you purchase a course, you can revisit the materials as many times as you need. Recovery isn't linear—we understand you might need to return to lessons as you grow."
        }
      ]
    },
    {
      category: "Refunds & Payments",
      questions: [
        {
          q: "What's your refund policy?",
          a: "We offer refunds with a personal touch. If a course isn't the right fit, click 'Request a Refund' in your dashboard. You'll receive a personal email from Shaun asking for honest feedback about your experience. Once you reply, your refund is processed automatically within 24 hours. We also send you a free high-value resource as a thank you for your time. See our full Refund Policy page for details."
        },
        {
          q: "Why do you ask for feedback before processing refunds?",
          a: "Because we genuinely care about your experience and want to learn how to better serve others. Your feedback is a gift that helps us improve our programs. This isn't about creating friction—it's about connection and understanding. And we'll give you a valuable free resource just for sharing your thoughts."
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure Stripe payment processor. All transactions are encrypted and secure."
        }
      ]
    },
    {
      category: "Getting Started",
      questions: [
        {
          q: "I'm new to recovery work. Where should I start?",
          a: "Start with the AI Coach—it's free for your first 3 messages and can help you understand where you are in your journey. If you want to dive in, the 7-Day Reset is perfect for beginners. It gives you immediate tools without overwhelming you. If you're ready for deeper work and know you want comprehensive support, go straight to 'From Broken to Whole.'"
        },
        {
          q: "Do I need to do the courses in a specific order?",
          a: "No, but we recommend starting with the 7-Day Reset if you're new to nervous system work. It builds the foundation that makes the deeper content in 'From Broken to Whole' more accessible. However, if you're already familiar with trauma work and nervous system regulation, you can start with 'From Broken to Whole.'"
        },
        {
          q: "Can I do these programs while in therapy?",
          a: "Absolutely. Our programs complement therapy beautifully. Many therapists don't have time to teach nervous system regulation tools in detail—our courses fill that gap. However, always discuss new approaches with your therapist, especially if you have complex PTSD or are working through severe trauma."
        }
      ]
    },
    {
      category: "Technical Support",
      questions: [
        {
          q: "I'm having trouble accessing my course. What should I do?",
          a: "First, make sure you're logged in with the email you used to purchase. Check your spam folder for your login link. If you're still having issues, use the contact form on our website and we'll get you sorted out within 24 hours."
        },
        {
          q: "Can I access the courses on my phone?",
          a: "Yes! Our platform is fully mobile-responsive. You can watch videos, complete exercises, and access all course materials on any device—phone, tablet, or computer."
        },
        {
          q: "Do the video lessons have subtitles?",
          a: "Yes, all video content includes closed captions for accessibility."
        }
      ]
    }
  ];

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
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-yellow-500 mb-4">Frequently Asked Questions</h1>
            <p className="text-gray-300 text-lg">
              Everything you need to know about our trauma-informed approach to recovery
            </p>
          </div>

          <div className="space-y-8">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h2 className="text-2xl font-bold text-yellow-500 mb-6 flex items-center gap-2">
                  <HelpCircle className="h-6 w-6" />
                  {category.category}
                </h2>

                <div className="space-y-4">
                  {category.questions.map((faq, faqIndex) => (
                    <Card key={faqIndex} className="bg-gradient-to-br from-gray-900 to-black border-yellow-600/20">
                      <CardContent className="pt-6">
                        <h3 className="text-lg font-bold text-yellow-500 mb-3">{faq.q}</h3>
                        <p className="text-gray-300 leading-relaxed">{faq.a}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Card className="bg-gradient-to-br from-yellow-900/20 to-black border-yellow-600/30 mt-12">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold text-yellow-500 mb-3">Still have questions?</h3>
              <p className="text-gray-300 mb-4">
                We're here to help. Try the AI Coach for immediate answers, or reach out through our contact form.
                We typically respond within 24 hours.
              </p>
              <div className="flex gap-4">
                <Link href="/ai-coach">
                  <Button className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold">
                    Chat with AI Coach
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="outline" className="border-yellow-600 text-yellow-500 hover:bg-yellow-600/10">
                    View Courses
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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
