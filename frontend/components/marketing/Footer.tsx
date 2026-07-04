import Link from 'next/link';

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: 'Platform',
    links: [
      { href: '/for-creators', label: 'For Creators' },
      { href: '/for-brands', label: 'For Brands' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/auth/signup', label: 'Create account' },
      { href: '/auth/login', label: 'Log in' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '/about', label: 'About us' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/legal/terms', label: 'Terms of Service' },
      { href: '/legal/privacy', label: 'Privacy Policy' },
      { href: '/legal/refund', label: 'Refund Policy' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand blurb */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 w-fit">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7FA8AD] to-[#7C3AED] flex items-center justify-center text-white font-bold text-sm shadow-md">
                IC
              </span>
              <span className="text-sm font-bold tracking-tight text-gray-900">Influence Connect</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-5">
              The trusted platform where Indian creators and GST-verified brands find each other,
              collaborate safely, and grow together.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Made in India, for India&apos;s creator economy
            </div>
          </div>

          {COLUMNS.map(col => (
            <div key={col.heading}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-4">{col.heading}</h3>
              <ul className="flex flex-col gap-2.5">
                {col.links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-500 hover:text-[#5D8A8F] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-7 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Influence Connect. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Payments secured by Razorpay · Accounts verified via OTP
          </p>
        </div>
      </div>
    </footer>
  );
}
