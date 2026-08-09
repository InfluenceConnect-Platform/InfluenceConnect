import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          background: 'linear-gradient(135deg, #F0417B, #7A0F3D)',
          color: '#fff',
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        IC
      </div>
    ),
    { ...size }
  );
}
