import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export const metadata: Metadata = {
  title: 'SecondBrain - Personal Knowledge Manager',
  description: 'Your AI-powered personal knowledge management system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          {/* Navigation */}
          <nav className="fixed bottom-4 right-4 z-50 flex gap-2">
            <Link
              href="/"
              className="px-3 py-1.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-xs font-light text-[#E5E5E5] transition-colors"
            >
              PKM
            </Link>
            <Link
              href="/transcribe"
              className="px-3 py-1.5 bg-[#4A5C4A] hover:bg-[#5A6C5A] border border-[#4A5C4A] rounded-lg text-xs font-light text-white transition-colors"
            >
              Transcribir Audio
            </Link>
          </nav>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
