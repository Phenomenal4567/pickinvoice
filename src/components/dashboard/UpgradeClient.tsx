'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap, Star, Crown, Sparkles, Copy, CheckCircle } from 'lucide-react';
import type { BusinessProfile, Plan } from '@/types';

interface Props {
  profile: BusinessProfile;
}

const PLANS: {
  id: Plan;
  name: string;
  price: number;
  period: string;
  icon: typeof Zap;
  color: string;
  bg: string;
  border: string;
  popular?: boolean;
  features: string[];
  limits: string;
}[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    icon: Sparkles,
    color: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    limits: '20 invoices/month · 50 clients',
    features: [
      '20 invoices per month',
      '50 clients',
      '2 templates (Classic + Modern)',
      '30-day document history',
      'PDF download',
      'Shareable payment links',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 1000,
    period: '/month',
    icon: Zap,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    limits: '50 invoices/month · 200 clients',
    features: [
      '50 invoices per month',
      '200 clients',
      '2 templates',
      '90-day document history',
      'PDF download',
      'Shareable payment links',
      'Priority email support',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 3000,
    period: '/month',
    icon: Star,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-300',
    popular: true,
    limits: 'Unlimited invoices & clients',
    features: [
      'Unlimited invoices',
      'Unlimited clients',
      'All 4 templates',
      'Unlimited history',
      'PDF download',
      'Shareable payment links',
      'Custom branding & logo',
      'Priority support',
      'Bulk export',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 5000,
    period: '/month',
    icon: Crown,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    limits: 'Everything in Growth, plus',
    features: [
      'Everything in Growth',
      'Team members (coming soon)',
      'API access (coming soon)',
      'White-label documents(coming soon)',
      'Dedicated account manager(coming soon)',
      'SLA support(coming soon)',
      'Custom integrations(coming soon)',
    ],
  },
];

const BANK_DETAILS = {
  bank: 'PalmPay',
  accountName: 'Abdulsalam Adewale Adelakun',
  accountNumber: '8069904015',
  instruction: 'Transfer your plan fee, then enter your activation code below.',
};

function formatNGN(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export function UpgradeClient({ profile }: Props) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const currentPlan = profile.plan;

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setActivating(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`🎉 Activated! Your plan has been upgraded to ${data.plan?.toUpperCase()}.`);
        setCode('');
        setTimeout(() => router.refresh(), 1500);
      } else {
        setError(data.message || 'Invalid or expired activation code.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setActivating(false);
    }
  }

  function copyAccount() {
    // Primary: modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(BANK_DETAILS.accountNumber)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
        .catch(() => fallbackCopy(BANK_DETAILS.accountNumber));
    } else {
      fallbackCopy(BANK_DETAILS.accountNumber);
    }
  }

  function fallbackCopy(text: string) {
    // Fallback: create a temp textarea, select, execCommand
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    el.style.top = '-9999px';
    document.body.appendChild(el);
    el.focus();
    el.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Account number: ' + text + '\n\nPlease copy it manually.');
    } finally {
      document.body.removeChild(el);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Plans & Pricing</h1>
        <p className="text-sm text-gray-500 mt-1">
          Choose the plan that fits your business. Pay via bank transfer and activate instantly.
        </p>
      </div>

      {/* Current plan badge */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-8 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-sm font-semibold text-indigo-900 capitalize">
            You are on the <span className="font-bold">{currentPlan}</span> plan
          </div>
          {profile.plan_expires_at && currentPlan !== 'free' && (
            <div className="text-xs text-indigo-600 mt-0.5">
              Renews {new Date(profile.plan_expires_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
          {currentPlan === 'free' && (
            <div className="text-xs text-indigo-500 mt-0.5">
              Upgrade to unlock more invoices, templates, and features
            </div>
          )}
        </div>
        {currentPlan !== 'free' && (
          <span className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium capitalize">
            {currentPlan} Active
          </span>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = plan.id === currentPlan;
          const isDowngrade = PLANS.findIndex(p => p.id === plan.id) < PLANS.findIndex(p => p.id === currentPlan);

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-5 flex flex-col transition-all ${plan.border} ${plan.popular ? 'shadow-md' : ''} ${isCurrent ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  Current
                </div>
              )}

              <div className={`w-9 h-9 rounded-xl ${plan.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={plan.color} />
              </div>

              <div className="font-bold text-gray-900 text-lg mb-0.5">{plan.name}</div>

              <div className="mb-1">
                {plan.price === 0 ? (
                  <span className="text-2xl font-bold text-gray-900">Free</span>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-gray-900">{formatNGN(plan.price)}</span>
                    <span className="text-sm text-gray-500">{plan.period}</span>
                  </>
                )}
              </div>

              <div className="text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                {plan.limits}
              </div>

              <ul className="space-y-2 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <Check size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.price > 0 && !isCurrent && !isDowngrade && (
                <a
                  href="#activate"
                  className="mt-5 block text-center text-sm font-medium py-2 px-4 rounded-xl transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Get {plan.name}
                </a>
              )}
              {isCurrent && (
                <div className="mt-5 text-center text-xs text-gray-400 py-2">
                  ✓ Your current plan
                </div>
              )}
              {isDowngrade && !isCurrent && (
                <div className="mt-5 text-center text-xs text-gray-400 py-2">
                  Lower than current plan
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment instructions */}
      <div id="activate" className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Bank details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-1">How to Pay</h2>
          <p className="text-xs text-gray-500 mb-5">Bank transfer via PalmPay or Moniepoint</p>

          <div className="space-y-3 mb-5">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Bank</div>
              <div className="font-semibold text-gray-900 text-sm">{BANK_DETAILS.bank}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Account Name</div>
              <div className="font-semibold text-gray-900 text-sm">{BANK_DETAILS.accountName}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-1">Account Number</div>
                <div className="font-bold text-gray-900 text-lg tracking-widest">
                  {BANK_DETAILS.accountNumber}
                </div>
              </div>
              <button
                onClick={copyAccount}
                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
            <strong>After payment:</strong> Contact us via WhatsApp to receive your activation code. Include your registered email and the plan you paid for.
          </div>

          <div className="mt-4 text-xs text-gray-500 space-y-1">
             <div>💬 <a href="https://wa.me/2349042427548" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">WhatsApp: +234 904 242 7548</a></div>
          </div>
        </div>

        {/* Activation code */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-1">Enter Activation Code</h2>
          <p className="text-xs text-gray-500 mb-5">
            Received your code? Enter it below to activate your plan instantly.
          </p>

          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Activation Code
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. PICK-XXXX-XXXX"
                maxLength={20}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-700 font-medium">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={activating || !code.trim()}
              className="w-full bg-indigo-600 text-white text-sm font-semibold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Zap size={15} />
              {activating ? 'Activating...' : 'Activate Plan'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-700 mb-3">Pricing Summary</div>
            <div className="space-y-2">
              {PLANS.filter(p => p.price > 0).map(p => (
                <div key={p.id} className="flex justify-between text-xs text-gray-600">
                  <span className="font-medium">{p.name}</span>
                  <span>{formatNGN(p.price)}/month</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              All plans billed monthly. Cancel anytime. Prices in NGN.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              q: 'How do I get an activation code?',
              a: 'After bank transfer, send proof of payment to our WhatsApp. We\'ll send your code within a few hours.',
            },
            {
              q: 'Can I downgrade my plan?',
              a: 'Yes, but downgrading takes effect at your next billing cycle. Your current plan remains active until then.',
            },
            {
              q: 'What happens when my plan expires?',
              a: 'Your account reverts to the Free plan. All your documents remain safe, you just won\'t be able to create more than the free limit allows.',
            },
            {
              q: 'Is my data safe?',
              a: 'Absolutely. Your invoices and client data are encrypted and stored securely. We never share your data.',
            },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm font-semibold text-gray-900 mb-1.5">{item.q}</div>
              <div className="text-xs text-gray-600 leading-relaxed">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
