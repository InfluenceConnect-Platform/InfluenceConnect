import { ImageResponse } from 'next/og';

// Maskable variant for Android's adaptive-icon shapes (circle, squircle,
// rounded square...). The OS crops to whatever shape it wants, so content
// must sit inside the center ~80% "safe zone" with no rounded corners of our
// own — a full-bleed background lets the OS mask do the shaping.
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
          background: 'linear-gradient(135deg, #3FA34D, #14531D)',
          color: '#fff',
          fontSize: 200,
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
