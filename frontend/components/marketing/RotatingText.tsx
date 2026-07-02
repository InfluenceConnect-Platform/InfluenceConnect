'use client';

import { useEffect, useState } from 'react';

interface RotatingTextProps {
  phrases: string[];
  interval?: number;
  className?: string;
}

/**
 * Cycles through phrases with a vertical cross-fade. All phrases are stacked in
 * one grid cell so the container auto-sizes to the widest phrase (no layout shift).
 * The first phrase is server-rendered, so crawlers still see real headline text.
 */
export default function RotatingText({ phrases, interval = 2800, className = '' }: RotatingTextProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setActive(a => (a + 1) % phrases.length), interval);
    return () => clearInterval(id);
  }, [phrases.length, interval]);

  return (
    <span className={`rotating-word-stack ${className}`}>
      {phrases.map((phrase, i) => (
        <span
          key={phrase}
          data-state={i === active ? 'in' : i === (active + 1) % phrases.length ? 'next' : 'out'}
          aria-hidden={i !== active}
        >
          {phrase}
        </span>
      ))}
    </span>
  );
}
