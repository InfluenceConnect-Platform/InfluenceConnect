/**
 * Injects Cloudinary delivery transforms (auto format, auto quality,
 * width cap) into an image URL so we serve right-sized WebP/AVIF
 * instead of the full-resolution original upload.
 *
 * `width` should be ~2x the largest CSS display size (for retina).
 * Non-Cloudinary URLs and already-transformed URLs pass through untouched.
 */
export function cdnImg(url: string, width = 256): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  const marker = '/image/upload/';
  const i = url.indexOf(marker);
  if (i === -1) return url;
  const rest = url.slice(i + marker.length);
  // Skip URLs that already carry a transform segment (e.g. w_..., f_auto)
  if (/^[a-z]{1,3}_[^/]+\//.test(rest)) return url;
  return `${url.slice(0, i + marker.length)}f_auto,q_auto,c_limit,w_${width}/${rest}`;
}
