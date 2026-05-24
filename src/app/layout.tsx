import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from '@/components/ui/toaster';
import { Inter, Sora, DM_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'PickInvoice | Professional Invoice & Receipt Generator',
  description:
    'Create, send, and track professional invoices and receipts in minutes. WhatsApp-native. Mobile-first.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`
            ${inter.variable}
            ${sora.variable}
            ${dmMono.variable}
            font-sans
            antialiased
            bg-gray-50
          `}
        >
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}