import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navigation />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <article className="prose prose-invert prose-yellow max-w-none">
            <h1 className="text-4xl font-bold text-yellow-500 mb-4">Privacy Policy</h1>
            <p className="text-gray-400 mb-8">Last Updated: February 17, 2026</p>

            <p className="text-gray-300">
              Welcome to shauncritzer.com (the "Site"), operated by Shaun Critzer and Digital Gravity ("we," "us," or "our").
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our Site
              and use our services, including courses, the AI Recovery Coach, and social media integrations.
            </p>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">1. Information We Collect</h2>
            <p className="text-gray-300 mb-3">We may collect information about you in various ways, including:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li><strong>Personal Data:</strong> Name, email address, and payment information you voluntarily provide when registering, purchasing courses, or subscribing to our newsletter.</li>
              <li><strong>Usage Data:</strong> Browser type, operating system, pages visited, time spent on pages, and other diagnostic data collected automatically.</li>
              <li><strong>Cookies:</strong> We use session cookies to maintain your login state and preferences.</li>
              <li><strong>AI Coach Conversations:</strong> Messages you send to our AI Recovery Coach to provide responses and improve the service.</li>
            </ul>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li>To provide, maintain, and improve our services and courses.</li>
              <li>To process transactions and send related information (receipts, confirmations).</li>
              <li>To send you marketing communications (with your consent), which you can opt out of at any time.</li>
              <li>To respond to your inquiries and provide customer support.</li>
              <li>To monitor usage patterns and improve user experience.</li>
              <li>To detect, prevent, and address technical issues or fraud.</li>
            </ul>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">3. Sharing Your Information</h2>
            <p className="text-gray-300 mb-3">We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li><strong>Service Providers:</strong> Payment processors (Stripe), email services (ConvertKit), and hosting providers (Railway) that help us operate our business.</li>
              <li><strong>Social Media Platforms:</strong> If you interact with our content on platforms like Facebook, Instagram, Twitter/X, LinkedIn, YouTube, or TikTok, those platforms' own privacy policies apply.</li>
              <li><strong>Legal Requirements:</strong> If required by law, regulation, or legal process.</li>
            </ul>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">4. Data Security</h2>
            <p className="text-gray-300">
              We use industry-standard security measures to protect your personal information, including encrypted connections (HTTPS),
              secure password hashing, and access controls. However, no method of transmission over the Internet is 100% secure,
              and we cannot guarantee absolute security.
            </p>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">5. Your Rights</h2>
            <p className="text-gray-300 mb-3">Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-300">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Opt out of marketing communications.</li>
              <li>Withdraw consent where processing is based on consent.</li>
            </ul>
            <p className="text-gray-300 mt-3">
              To exercise any of these rights, please contact us through our website.
            </p>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">6. Third-Party Links</h2>
            <p className="text-gray-300">
              Our Site may contain links to third-party websites or services. We are not responsible for the privacy practices
              of these third parties. We encourage you to review their privacy policies before providing any personal information.
            </p>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">7. Children's Privacy</h2>
            <p className="text-gray-300">
              Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information
              from children. If we become aware that we have collected data from a child without parental consent, we will take
              steps to delete that information.
            </p>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">8. Changes to This Policy</h2>
            <p className="text-gray-300">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page and updating the "Last Updated" date. Your continued use of the Site after changes
              are posted constitutes your acceptance of the revised policy.
            </p>

            <h2 className="text-2xl font-bold text-yellow-500 mt-8 mb-4">9. Contact Us</h2>
            <p className="text-gray-300">
              If you have any questions about this Privacy Policy, please contact us through our website's contact page.
            </p>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
