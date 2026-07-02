import MarketingNav from '@/components/marketing/MarketingNav';
import Footer from '@/components/marketing/Footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh">
      <MarketingNav />
      {/* pt-16 offsets the fixed 64px nav */}
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
