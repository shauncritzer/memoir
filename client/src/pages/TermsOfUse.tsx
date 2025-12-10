import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";

export default function TermsOfUse() {
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
            <h1 className="text-4xl font-bold text-yellow-500 mb-4">Terms of Use</h1>
            <p className="text-gray-400 mb-8">Last Updated: December 9, 2025</p>

            <p className="text-gray-300">
              Welcome to shauncritzer.com (the "Site"), operated by Shaun Critzer and Digital Gravity ("we," "us," or "our").
              By accessing or using our Site, our AI Coach, our courses (the "Services"), you agree to be bound by these Terms of Use ("Terms").
            </p>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300">
              By using our Services, you confirm that you are at least 18 years old and have the legal capacity to enter into these Terms.
              You agree to comply with these Terms and all applicable local, state, national, and international laws and regulations.
            </p>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">2. Our Services</h2>
            <p className="text-gray-300">
              Our Services provide resources, courses, and coaching for individuals seeking recovery from compulsive behaviors and process addictions.
              The information provided is for educational and informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.
              Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </p>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">3. AI Recovery Coach</h2>
            <p className="text-gray-300">
              Our AI Recovery Coach is a tool designed to provide support and guidance. It is not a licensed therapist or medical professional.
              Your conversations are confidential, but we may use anonymized data to improve the service. You are granted a limited number of free messages,
              after which you may be required to provide an email or purchase a course to continue.
            </p>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">4. User Conduct</h2>
            <p className="text-gray-300 mb-3">You agree not to use the Services to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li>Post or transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable.</li>
              <li>Impersonate any person or entity.</li>
              <li>Violate the privacy of others.</li>
              <li>Engage in any activity that would constitute a criminal offense or give rise to a civil liability.</li>
            </ul>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">5. Intellectual Property</h2>
            <p className="text-gray-300">
              All content on this Site, including text, graphics, logos, images, and course materials, is our property or the property of our licensors
              and is protected by copyright and other intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to access
              and use the Services for your personal, non-commercial use.
            </p>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">6. Disclaimers</h2>
            <p className="text-gray-300 uppercase">
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
              WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE. WE MAKE NO GUARANTEES REGARDING THE RESULTS OF USING THE SERVICES.
            </p>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-300 uppercase">
              TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
              OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL,
              OR OTHER INTANGIBLE LOSSES, RESULTING FROM (A) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES;
              (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICES; OR (C) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.
            </p>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">8. Governing Law</h2>
            <p className="text-gray-300">
              These Terms shall be governed by the laws of the United States, without respect to its conflict of laws principles.
            </p>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">9. Changes to Terms</h2>
            <p className="text-gray-300">
              We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page.
              Your continued use of the Services after any such change constitutes your acceptance of the new Terms.
            </p>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">10. Contact Us</h2>
            <p className="text-gray-300">
              If you have any questions about these Terms, please contact us through our website.
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
