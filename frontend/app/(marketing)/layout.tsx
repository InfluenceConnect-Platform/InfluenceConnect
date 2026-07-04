import MarketingNav from '@/components/marketing/MarketingNav';
import Footer from '@/components/marketing/Footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    // Marketing pages render in Geist (loaded in the root layout); the app keeps its default body font.
    <div className="flex flex-col min-h-dvh font-[family-name:var(--font-geist-sans)]">
      <MarketingNav />
      {/* pt-16 offsets the fixed 64px nav */}
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
