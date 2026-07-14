import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/useTheme";
import { ToastProvider } from "@/components/shared/Toast";
import { ConfirmProvider } from "@/components/shared/ConfirmModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://influenceconnect.in';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Influence Connect — India\'s Creator & Brand Collaboration Platform',
    template: '%s',
  },
  description:
    'Influence Connect matches Indian creators with GST-verified brands. Discover campaigns, negotiate safely in moderated chat, and grow — free to start.',
  keywords: [
    'influencer marketing India', 'creator platform', 'brand collaborations',
    'influencer campaigns', 'micro influencers India', 'creator economy',
  ],
  openGraph: {
    siteName: 'Influence Connect',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Tell browsers (esp. Android Chrome's "Auto Dark Theme") that this
            page declares and manages its own light/dark styling, so they
            don't force-repaint it with a heuristic darkening filter that
            fights our own `dark` class toggle. */}
        <meta name="color-scheme" content="light dark" />
        {/* Anti-flash: apply stored theme before React hydrates. A native inline
            script runs synchronously during HTML parse, so the `dark` class is
            set before first paint with no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ic-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
