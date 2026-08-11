import type { Viewport } from 'next';

// The public creator-profile link (opened from the influencer's own profile
// page, browsed by brands) sits outside the /brand/(app) group so it never
// picked up that segment's theme-color — it fell back to the browser's
// default chrome color. Brands are the audience here, so it gets brand green.
export const viewport: Viewport = {
  themeColor: '#228B22',
};

export default function PublicCreatorProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
