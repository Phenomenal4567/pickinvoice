'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FileText, Receipt, History,
  Users, Package, Settings, CreditCard, Plus, Menu, X
} from 'lucide-react';
import { PropsWithChildren, useState, Suspense } from 'react';

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'New Invoice', href: '/invoice/new?type=invoice', icon: FileText },
  { label: 'New Receipt', href: '/invoice/new?type=receipt', icon: Receipt },
  { label: 'History', href: '/history', icon: History },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Upgrade', href: '/upgrade', icon: CreditCard },
];

// Bug #6: clicking PickInvoice logo redirects to dashboard
// Bug #4: fix active state — new invoice vs new receipt active highlight
function NavContent({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentType = searchParams.get('type');

  function isActive(href: string) {
    const [hrefPath, hrefQuery] = href.split('?');
    // Special case for new invoice / new receipt: must match both path AND type param
    if (hrefPath === '/invoice/new') {
      const hrefType = new URLSearchParams(hrefQuery || '').get('type');
      return pathname === hrefPath && currentType === hrefType;
    }
    // For edit pages, don't highlight new invoice/receipt nav
    if (pathname.startsWith('/invoice/edit') || pathname.startsWith('/invoice/view')) {
      return false;
    }
    return pathname === hrefPath || (hrefPath !== '/dashboard' && pathname.startsWith(hrefPath) && hrefPath !== '/invoice/new');
  }

  return (
    <nav className="flex-1 px-3 py-3 overflow-y-auto">
      {NAV.map(({ label, href, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors',
              active
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon size={17} className={active ? 'text-indigo-600' : 'text-gray-400'} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppLayout({ children }: PropsWithChildren) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-100 flex flex-col transition-transform duration-200',
        'lg:relative lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo — Bug #6: redirects to dashboard */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-1 hover:opacity-80 transition-opacity" onClick={() => setMobileOpen(false)}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-gray-900">PickInvoice</span>
          </Link>
          <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-3 border-b border-gray-100">
          <Link
            href="/invoice/new?type=invoice"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            New Invoice
          </Link>
        </div>

        {/* Nav — wrapped in Suspense for useSearchParams */}
        <Suspense fallback={<nav className="flex-1 px-3 py-3" />}>
          <NavContent onClose={() => setMobileOpen(false)} />
        </Suspense>

        {/* User */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <UserButton />
            <div className="text-xs text-gray-500">My Account</div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 text-gray-500 hover:text-gray-900">
            <Menu size={20} />
          </button>
          {/* Bug #6: mobile logo also redirects to dashboard */}
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">PickInvoice</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
