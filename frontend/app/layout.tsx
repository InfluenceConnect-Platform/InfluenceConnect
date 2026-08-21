import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/useTheme";
import { ToastProvider } from "@/components/shared/Toast";
import { ConfirmProvider } from "@/components/shared/ConfirmModal";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import GoogleAnalytics from "@/components/marketing/GoogleAnalytics";
import ServiceWorkerRegister from "@/components/shared/ServiceWorkerRegister";

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
  // Set GOOGLE_SITE_VERIFICATION once Search Console issues a code for the live domain.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

// Fallback for routes with no more specific `viewport` export of their own
// (/auth, /admin, /legal) — without this, the mobile status bar/address bar
// renders the browser's default chrome color on first paint, before any
// client-side theme-color sync (e.g. useThemeColor) can run post-hydration.
// Marketing, brand, influencer and the public creator-profile layouts each
// set their own more specific themeColor and take precedence over this.
export const viewport: Viewport = {
  themeColor: '#228B22',
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
        {/* iOS ignores manifest.ts for "Add to Home Screen" — these are its own
            equivalents: run fullscreen without Safari chrome, and let our navy
            boot splash sit under a translucent (not white) status bar. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Influence Connect" />
        {/* Anti-flash: apply stored theme before React hydrates. A native inline
            script runs synchronously during HTML parse, so the `dark` class is
            set before first paint with no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ic-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`,
          }}
        />
        {/* Same anti-flash pattern, for the boot splash below: only an app
            launched from its home-screen icon (installed PWA) should ever see
            it, never a plain browser tab. Detecting synchronously here — before
            first paint — means the splash is either fully there or fully absent,
            with no flash of it appearing/disappearing either way. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var m=window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches;var i=navigator.standalone===true;if(m||i)document.documentElement.classList.add('ic-standalone-boot');}catch(e){}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {/* Hidden by default (see .ic-boot-splash rules in globals.css); the
            inline script above reveals it pre-paint only for standalone
            launches. Purely decorative and self-dismissing, so it's inert to
            assistive tech and never blocks interaction once its animation ends. */}
        <div id="ic-boot-splash" aria-hidden="true">
          <div className="ic-boot-mark">IC</div>
          <div className="ic-boot-word">Influence Connect</div>
          <div className="ic-boot-tagline">
            <b className="ic-boot-creators">Creators</b> × <b className="ic-boot-brands">Brands</b>
          </div>
        </div>
        <ThemeProvider>
          <ToastProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </ToastProvider>
        </ThemeProvider>
        <GoogleAnalytics />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
