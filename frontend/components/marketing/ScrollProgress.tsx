'use client';

import { useEffect, useRef } from 'react';

/** Thin gradient bar under the nav showing reading progress. */
export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      el.style.transform = `scaleX(${p.toFixed(4)})`;
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
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="absolute bottom-0 left-0 right-0 h-[2.5px] origin-left scale-x-0 bg-gradient-to-r from-[#7FA8AD] via-[#5D8A8F] to-[#3D5087]"
      style={{ willChange: 'transform' }}
    />
  );
}
