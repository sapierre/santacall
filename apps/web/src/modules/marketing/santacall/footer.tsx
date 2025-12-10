import Link from "next/link";

import { Icons } from "@turbostarter/ui-web/icons";

export const SantaFooter = () => {
  return (
    <footer className="relative bg-white py-12">
      {/* Top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-200 to-transparent" />

      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎅</span>
            <span className="text-2xl font-bold text-gray-900">SantaCall</span>
          </div>

          {/* Tagline */}
          <p className="max-w-md text-center text-gray-600">
            Bringing the magic of Christmas to families everywhere with
            AI-powered Santa experiences. 🎄
          </p>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            <Link
              href="/book?type=call"
              className="font-medium text-gray-600 transition-colors hover:text-red-600"
            >
              Book a Call
            </Link>
            <Link
              href="/book?type=video"
              className="font-medium text-gray-600 transition-colors hover:text-red-600"
            >
              Get a Video
            </Link>
            <Link
              href="/contact"
              className="font-medium text-gray-600 transition-colors hover:text-red-600"
            >
              Contact
            </Link>
            <Link
              href="/privacy"
              className="font-medium text-gray-600 transition-colors hover:text-red-600"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="font-medium text-gray-600 transition-colors hover:text-red-600"
            >
              Terms
            </Link>
          </div>

          {/* Divider */}
          <div className="h-px w-full max-w-xs bg-gray-200" />

          {/* Bottom */}
          <div className="flex flex-col items-center gap-4 text-sm text-gray-500 sm:flex-row sm:gap-8">
            <p>© {new Date().getFullYear()} SantaCall. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <Icons.Lock className="size-4 text-green-600" />
              <span>Secure payments with Stripe</span>
            </div>
          </div>

          {/* Christmas decorations */}
          <div className="flex items-center gap-4 text-2xl">
            <span>🎄</span>
            <span>⭐</span>
            <span>🎁</span>
            <span>❄️</span>
            <span>🦌</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
