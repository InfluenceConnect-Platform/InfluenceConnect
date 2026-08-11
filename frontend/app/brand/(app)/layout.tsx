import type { Viewport } from 'next';
import BrandAppLayoutClient from './BrandAppLayoutClient';

// Tints the mobile browser chrome (status bar / address bar) to match the
// brand palette's green instead of the default theme-color.
export const viewport: Viewport = {
  themeColor: '#228B22',
};

export default function BrandAppLayout({ children }: { children: React.ReactNode }) {
  return <BrandAppLayoutClient>{children}</BrandAppLayoutClient>;
}
