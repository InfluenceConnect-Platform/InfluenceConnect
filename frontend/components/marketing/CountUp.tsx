'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  end: number;
  /** Start value — lets ₹0 count down from 99 for effect */
  from?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

/** Animates a number from `from` to `end` the first time it scrolls into view. */
export default function CountUp({ end, from = 0, prefix = '', suffix = '', duration = 1600, className = '' }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(from);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        observer.disconnect();

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setValue(end);
          return;
        }

        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
          setValue(Math.round(from + (end - from) * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, from, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}{value.toLocaleString('en-IN')}{suffix}
    </span>
  );
}
