import type { Viewport } from 'next';
import { resolveRoleThemeColor } from '@/lib/roleThemeColor';
import LoginClient from './LoginClient';

// The sign-in screen is themed by `?role=` (creator ruby / brand green), so
// its status-bar colour can't come from a static `viewport` export the way
// /influencer and /brand get theirs from their layouts. Reading the param
// here puts the right colour in the SSR'd HTML — which is what an installed
// PWA actually paints the Android status bar from.
export async function generateViewport({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Viewport> {
  const { role } = await searchParams;
  return { themeColor: resolveRoleThemeColor(role) };
}

export default function LoginPage() {
  return <LoginClient />;
}
