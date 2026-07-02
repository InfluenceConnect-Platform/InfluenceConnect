'use client';

import { useEffect, useRef } from 'react';

interface ParallaxProps {
  children: React.ReactNode;
  /** Positive drifts down slower than scroll; negative drifts up. Sensible range: -0.3 … 0.3 */
  speed?: number;
  className?: string;
}

/** Subtle scroll-linked vertical drift, rAF-throttled. Disabled with reduced motion. */
export default function Parallax({ children, speed = 0.15, className = '' }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      // Offset of the element's centre from the viewport centre
      const delta = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${(delta * speed).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [speed]);

  return (
    <div ref={ref} style={{ willChange: 'transform' }} className={className}>
      {children}
    </div>
  );
}
