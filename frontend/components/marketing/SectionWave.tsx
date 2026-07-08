/* Live wave divider pinned to the bottom of a saturated hero band — three
   seamless sine layers drift horizontally at different speeds/directions,
   like a liquid surface. Pass fill classes matching the NEXT section's top
   background color in both themes, e.g. "fill-white dark:fill-[#0E1B2E]";
   the paths inherit the fill from the wrapper. Falls back to a static wave
   with reduced motion (animations disabled in globals.css). */

/* Each path is periodic every 720 units, so shifting the 200%-wide SVG by
   half its width (marqueeX's translateX(-50%) = 1440 units = 2 periods)
   loops without a visible seam. */
const WAVES = [
  // back — highest crest, faintest, fastest
  {
    d: 'M0,44 C120,26 240,26 360,44 C480,62 600,62 720,44 C840,26 960,26 1080,44 C1200,62 1320,62 1440,44 C1560,26 1680,26 1800,44 C1920,62 2040,62 2160,44 C2280,26 2400,26 2520,44 C2640,62 2760,62 2880,44 L2880,120 L0,120 Z',
    cls: 'anim-wave-fast opacity-25',
    delay: '-5s',
  },
  // middle — counter-drifts for the liquid shimmer
  {
    d: 'M0,52 C120,32 240,32 360,52 C480,72 600,72 720,52 C840,32 960,32 1080,52 C1200,72 1320,72 1440,52 C1560,32 1680,32 1800,52 C1920,72 2040,72 2160,52 C2280,32 2400,32 2520,52 C2640,72 2760,72 2880,52 L2880,120 L0,120 Z',
    cls: 'anim-wave-mid opacity-45',
    delay: '-9s',
  },
  // front — the opaque surface that meets the next section
  {
    d: 'M0,60 C120,36 240,36 360,60 C480,84 600,84 720,60 C840,36 960,36 1080,60 C1200,84 1320,84 1440,60 C1560,36 1680,36 1800,60 C1920,84 2040,84 2160,60 C2280,36 2400,36 2520,60 C2640,84 2760,84 2880,60 L2880,120 L0,120 Z',
    cls: 'anim-wave-slow',
    delay: '0s',
  },
];

export default function SectionWave({ className = 'fill-white dark:fill-[#060D1A]' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`absolute bottom-0 inset-x-0 h-12 sm:h-16 overflow-hidden pointer-events-none ${className}`}
    >
      {WAVES.map(w => (
        <svg
          key={w.cls}
          viewBox="0 0 2880 120"
          preserveAspectRatio="none"
          className={`absolute bottom-0 left-0 w-[200%] h-full ${w.cls}`}
          style={w.delay !== '0s' ? { animationDelay: w.delay } : undefined}
        >
          <path d={w.d} />
        </svg>
      ))}
    </div>
  );
}
