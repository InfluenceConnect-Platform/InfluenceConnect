import type { Viewport } from 'next';
import InfluencerLayoutClient from './InfluencerLayoutClient';

// Tints the mobile browser chrome (status bar / address bar) to match the
// influencer palette's ruby instead of the default theme-color.
export const viewport: Viewport = {
  themeColor: '#E0115F',
};

export default function InfluencerLayout({ children }: { children: React.ReactNode }) {
  return <InfluencerLayoutClient>{children}</InfluencerLayoutClient>;
}
