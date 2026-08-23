import type { Viewport } from 'next';
import MarketingNav from '@/components/marketing/MarketingNav';
import Footer from '@/components/marketing/Footer';
import ThemeColorSync from '@/components/marketing/ThemeColorSync';
import SmoothScroll from '@/components/shared/SmoothScroll';

// Tints the mobile browser chrome (status bar / address bar) to the brand
// green, matching the (app) dashboards — see [[website-means-marketing-pages]].
export const viewport: Viewport = {
  themeColor: '#228B22',
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    // Marketing pages render in Geist (loaded in the root layout); the app keeps its default body font.
    <div className="flex flex-col min-h-dvh font-[family-name:var(--font-geist-sans)]">
      <ThemeColorSync />
      {/* Damps wheel scrolling — the marketing pages scrolled too fast per notch.
          Tune with the `step` (distance) and `catchUp` (glide) props. */}
      <SmoothScroll />
      <MarketingNav />
      {/* pt-16 offsets the fixed 64px nav */}
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
