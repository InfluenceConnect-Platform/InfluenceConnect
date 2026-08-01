'use client';

import { useEffect, useRef, useState } from 'react';

// Renders text as a static, truncated line when it fits, and switches to a
// looping horizontal ticker only when it actually overflows its container —
// so short titles never animate unnecessarily.
export default function MarqueeText({
  text,
  className = '',
  speed = 45, // px/sec — controls scroll speed so longer titles don't finish faster than short ones
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [duration, setDuration] = useState(12);

  useEffect(() => {
    const check = () => {
      if (!containerRef.current || !measureRef.current) return;
      const over = measureRef.current.scrollWidth > containerRef.current.clientWidth;
      setOverflowing(over);
      if (over) setDuration(Math.max(6, measureRef.current.scrollWidth / speed));
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [text, speed]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${overflowing ? 'marquee-mask' : ''} ${className}`}>
      {/* Hidden measuring copy — always mounted so overflow can be re-checked (e.g. on resize) regardless of which visible mode is active below. */}
      <span ref={measureRef} className="invisible absolute whitespace-nowrap pointer-events-none" aria-hidden="true">{text}</span>

      {overflowing ? (
        <div
          className="inline-flex whitespace-nowrap anim-marquee-title"
          style={{ '--marquee-duration': `${duration}s` } as React.CSSProperties}
        >
          <span className="inline-block pr-12">{text}</span>
          <span className="inline-block pr-12" aria-hidden="true">{text}</span>
        </div>
      ) : (
        <span className="inline-block whitespace-nowrap truncate max-w-full align-bottom">{text}</span>
      )}
    </div>
  );
}
