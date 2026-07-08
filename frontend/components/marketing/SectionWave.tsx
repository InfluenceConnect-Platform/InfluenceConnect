/* Decorative wave divider pinned to the bottom of a saturated hero band.
   Pass fill classes matching the NEXT section's top background color in
   both themes, e.g. "fill-white dark:fill-[#0E1B2E]". */
export default function SectionWave({ className = 'fill-white dark:fill-[#060D1A]' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 64"
      preserveAspectRatio="none"
      className="absolute bottom-0 inset-x-0 w-full h-10 sm:h-14 pointer-events-none"
    >
      <path
        d="M0,34 C240,64 480,6 720,18 C960,30 1200,60 1440,22 L1440,64 L0,64 Z"
        className={className}
      />
    </svg>
  );
}
