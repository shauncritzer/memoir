import { Link } from "wouter";
import { ExternalLink } from "lucide-react";

// Logo component (inline for simplicity)
function Logo() {
  return (
    <Link href="/">
      <div className="flex items-center gap-2 cursor-pointer">
        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center">
          <span className="text-black font-bold text-xl">SC</span>
        </div>
        <span className="font-bold text-lg text-white">Shaun Critzer</span>
      </div>
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-yellow-600/20 bg-black py-12">
      <div className="container">
        <div className="grid md:grid-cols-5 gap-8">
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
                <Link href="/memoir" className="text-gray-400 hover:text-yellow-500 transition-colors">
                  The Memoir
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
            <h3 className="font-semibold mb-4 text-yellow-500">Connect</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.youtube.com/@ShaunCritzer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-yellow-500 transition-colors inline-flex items-center gap-1"
                >
                  YouTube <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/shauncritzer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-yellow-500 transition-colors inline-flex items-center gap-1"
                >
                  Instagram <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/shauncritzer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-yellow-500 transition-colors inline-flex items-center gap-1"
                >
                  Facebook <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="mailto:shaun@passiveaffiliate.com"
                  className="text-gray-400 hover:text-yellow-500 transition-colors"
                >
                  Contact Us
                </a>
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
                <Link href="/privacy-policy" className="text-gray-400 hover:text-yellow-500 transition-colors">
                  Privacy Policy
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
          <p>&copy; {new Date().getFullYear()} Shaun Critzer. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
