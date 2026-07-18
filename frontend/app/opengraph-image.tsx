import { ImageResponse } from 'next/og';

export const alt = 'Influence Connect — India\'s Creator & Brand Collaboration Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '80px',
          background: 'linear-gradient(135deg, #0E1B2E 0%, #143b40 55%, #3d2a63 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #7FA8AD, #5D8A8F)',
              display: 'flex',
            }}
          />
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, color: '#ffffff' }}>
            Influence Connect
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 56,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.15,
            maxWidth: 920,
          }}
        >
          Where Indian Creators & Brands Collaborate
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            color: '#B9C2CC',
            marginTop: 28,
            maxWidth: 820,
          }}
        >
          GST-verified brands. Real creators. Free to start.
        </div>
      </div>
    ),
    { ...size }
  );
}
