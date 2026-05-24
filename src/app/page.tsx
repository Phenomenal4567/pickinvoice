import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">PickInvoice</span>
        </div>
        <div className="flex items-center gap-3">
          <SignedOut>
            <Link href="/sign-in" className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">Sign In</Link>
            <Link href="/sign-up" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium">Get Started Free</Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium">Dashboard</Link>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
          <span>🇳🇬</span> Built for Nigerian &amp; African businesses
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Invoices your clients<br />
          <span className="text-indigo-600">actually trust</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Create professional invoices and receipts in under 2 minutes. Share on WhatsApp instantly. Track payments. Look like a pro.
        </p>

        {/* Hero CTAs — different for signed-in vs signed-out users */}
        <SignedOut>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up" className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              Start for Free — No Credit Card
            </Link>
            <Link href="/sign-in" className="bg-white text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-colors border border-gray-200">
              Already have an account? Sign In
            </Link>
          </div>
        </SignedOut>
        <SignedIn>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard" className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              Go to Dashboard →
            </Link>
          </div>
        </SignedIn>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '⚡', title: 'Ready in 2 minutes', desc: 'Fill in your details once. Every invoice after is pre-filled and ready to send.' },
            { icon: '📱', title: 'WhatsApp-native', desc: 'Export as image and share directly on WhatsApp — no link, no friction.' },
            { icon: '🎨', title: '4 stunning templates', desc: 'Classic, Modern, Minimal, Bold. Match your brand personality.' },
            { icon: '📊', title: 'Track everything', desc: 'See paid, overdue, and outstanding at a glance from your dashboard.' },
            { icon: '🔄', title: 'Regenerate anytime', desc: 'Find and resend any past invoice or receipt from your history.' },
            { icon: '💰', title: 'Fair pricing', desc: 'Free forever with 20 invoices/month. Grow plan from ₦3,000/month.' },
          ].map((f) => (
            <div key={f.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} PickInvoice. Built for mobile businesses.</p>
      </footer>
    </div>
  );
}
