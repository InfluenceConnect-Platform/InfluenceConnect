import { ImageResponse } from 'next/og';

// Full-resolution app icon for the PWA manifest (home-screen tile + native
// splash screen generation). The 32x32 `/icon` route is fine for a browser
// tab favicon, but Android upscales whatever the manifest points at for its
// install splash — pointing it at a 32px image renders it blurry. This is
// the same mark/gradient as `/icon` and `/apple-icon`, just at full size.
//
// A plain `route.tsx` (not the special `icon.tsx` file convention) needs a
// named HTTP-method export rather than the icon convention's default export.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 96,
          background: 'linear-gradient(135deg, #3FA34D, #14531D)',
          color: '#fff',
          fontSize: 320,
          fontWeight: 700,
          fontFamily: 'sans-serif',
        }}
      >
        IC
      </div>
    ),
    { width: 512, height: 512 }
  );
}
