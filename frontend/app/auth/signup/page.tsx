import type { Viewport } from 'next';
import { resolveRoleThemeColor } from '@/lib/roleThemeColor';
import SignupClient from './SignupClient';

// Same as the login page: the role lives in `?role=`, not the path, so the
// status-bar colour has to be resolved per request rather than exported
// statically. See lib/roleThemeColor.ts for why this must be server-side.
export async function generateViewport({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Viewport> {
  const { role } = await searchParams;
  return { themeColor: resolveRoleThemeColor(role) };
}

export default function SignupPage() {
  return <SignupClient />;
}
