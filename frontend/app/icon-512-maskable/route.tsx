import { ImageResponse } from 'next/og';

// Maskable variant for Android's adaptive-icon shapes (circle, squircle,
// rounded square...). The OS crops to whatever shape it wants, so content
// must sit inside the center ~80% "safe zone" with no rounded corners of our
// own — a full-bleed background lets the OS mask do the shaping.
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon512Maskable() {
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
    { ...size }
  );
}
