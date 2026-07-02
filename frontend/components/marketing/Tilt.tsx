'use client';

import { useRef } from 'react';

interface TiltProps {
  children: React.ReactNode;
  /** Max tilt in degrees */
  max?: number;
  className?: string;
}

/** 3D perspective tilt that follows the cursor. No-op on touch devices and with reduced motion. */
export default function Tilt({ children, max = 8, className = '' }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number>(0);

  const canTilt = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || !canTilt()) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5 … 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) scale3d(1.015, 1.015, 1)`;
    });
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)', willChange: 'transform' }}
      className={className}
    >
      {children}
    </div>
  );
}
