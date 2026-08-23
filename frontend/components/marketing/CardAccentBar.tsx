interface CardAccentBarProps {
  /** Tailwind gradient stops for the stripe, e.g. `from-amber-400 to-orange-500`. */
  gradient: string;
}

/**
 * The coloured accent stripe along the top edge of a marketing card.
 *
 * Drawn as a full-card overlay whose *background band* is 4px tall, rather
 * than as a 4px-tall element. That distinction is the whole point: a 4px-tall
 * box cannot carry the card's 15px corner radius. CSS scales down any
 * border-radius whose adjacent radii exceed the box's side length (Backgrounds
 * spec, "Overlapping Curves"), so the previous `h-1 rounded-t-2xl` silently
 * collapsed from 16px to 4px and the stripe's near-square ends jutted out past
 * the card's rounded corners, reading as a bar floating loose above the card.
 * Sizing the element to the whole card lets it hold the real radius, and the
 * background band gets clipped exactly along the card's curve.
 *
 * `overflow-hidden` on the card is the usual fix for this and is what the
 * non-glow marketing cards use — but these are `card-glow` cards, whose hover
 * ring is drawn at `inset: -1px` and would be clipped away along with it.
 *
 * 15px is the card's inner (padding-box) radius — `rounded-2xl` (16px) less
 * its 1px border — which is the box an `inset-0` child is laid out against.
 * Keep it in step with the card's `rounded-2xl` + `border` if either changes.
 */
export default function CardAccentBar({ gradient }: CardAccentBarProps) {
  return (
    <span
      aria-hidden
      className={`absolute inset-0 rounded-[15px] bg-gradient-to-r ${gradient} bg-no-repeat [background-size:100%_4px] pointer-events-none`}
    />
  );
}
