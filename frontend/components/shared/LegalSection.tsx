'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/useTheme';

const TERMS_SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By creating an account on InfluenceConnect, you confirm that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform. We reserve the right to update these terms at any time, and your continued use of the platform constitutes acceptance of any changes.`,
  },
  {
    title: '2. Eligibility',
    body: `You must be at least 18 years of age to use InfluenceConnect. By registering, you represent and warrant that you are 18 or older, that you have the legal capacity to enter into a binding agreement, and that all information you provide during registration is accurate and truthful.`,
  },
  {
    title: '3. Account Responsibilities',
    body: `You are responsible for maintaining the confidentiality of your account credentials. You agree not to share your password with any third party. You are fully responsible for all activities that occur under your account. You must notify us immediately at support@influenceconnect.in if you suspect any unauthorized access to your account.`,
  },
  {
    title: '4. Platform Use — Brands',
    body: `Brand accounts may create campaigns, discover influencers, and communicate through the platform's messaging system. You agree to provide accurate campaign briefs and budget information. You must not use InfluenceConnect to promote illegal products or services, make false or misleading claims, or engage in any form of discrimination or harassment. All campaigns must comply with applicable advertising standards and regulations in your jurisdiction.`,
  },
  {
    title: '5. Platform Use — Influencers',
    body: `Influencer accounts may apply to campaigns, negotiate deals, and communicate with brands. You represent that any content you commit to delivering will be original, lawful, and comply with the brand's brief. You must disclose any sponsored or paid content in accordance with applicable laws and platform guidelines. You must not misrepresent your audience metrics, engagement rates, or follower counts.`,
  },
  {
    title: '6. Payments and Fees',
    body: `InfluenceConnect offers both Freemium and Premium subscription plans. Premium plan fees are charged on a subscription basis as described on the Billing page. All payments are non-refundable except as required by applicable law or as stated in our Refund Policy. We reserve the right to modify pricing with at least 30 days' advance notice.`,
  },
  {
    title: '7. Intellectual Property',
    body: `All content, trademarks, logos, and software on InfluenceConnect are the property of InfluenceConnect or its licensors. You may not reproduce, distribute, or create derivative works from our platform content without explicit written permission. You retain ownership of any content you create and upload, but grant InfluenceConnect a non-exclusive licence to display and distribute it within the platform for the purpose of operating the service.`,
  },
  {
    title: '8. Privacy',
    body: `Your use of InfluenceConnect is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the platform, you consent to our collection and use of your data as described in the Privacy Policy.`,
  },
  {
    title: '9. Prohibited Conduct',
    body: `You agree not to: (a) scrape, crawl, or use automated tools to extract data from the platform; (b) impersonate any person or entity; (c) transmit spam, malware, or any harmful code; (d) attempt to gain unauthorised access to any part of the platform or its infrastructure; (e) use the platform for any unlawful purpose; or (f) interfere with or disrupt the platform's integrity or performance.`,
  },
  {
    title: '10. Termination',
    body: `We may suspend or terminate your account at any time if you violate these Terms or if we reasonably believe your conduct poses a risk to other users or the platform. You may delete your account at any time through Account Settings. Upon termination, your right to use the platform ceases immediately. Sections relating to intellectual property, limitation of liability, and governing law survive termination.`,
  },
  {
    title: '11. Limitation of Liability',
    body: `To the fullest extent permitted by law, InfluenceConnect shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform. Our total liability for any claim arising from these Terms shall not exceed the fees you paid to us in the twelve months preceding the claim.`,
  },
  {
    title: '12. Governing Law',
    body: `These Terms are governed by the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts located in India. If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.`,
  },
  {
    title: '13. Contact',
    body: `If you have any questions about these Terms and Conditions, please contact us at support@influenceconnect.in. We aim to respond to all enquiries within 2 business days.`,
  },
];

const OTHER_DOCS = [
  { title: 'Privacy Policy', desc: 'How we collect, use, and protect your data.', href: '/legal/privacy' },
  { title: 'Cookie Policy', desc: 'How we use cookies and similar technologies.', href: '/legal/cookies' },
  { title: 'Refund Policy', desc: 'Our policy on subscription refunds and cancellations.', href: '/legal/refund' },
];

export default function LegalSection() {
  const { isDark } = useTheme();
  const [tcOpen, setTcOpen] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const cardInner = `rounded-xl border overflow-hidden ${isDark ? 'border-slate-700/60' : 'border-gray-200'}`;

  return (
    <div className="space-y-4">
      {/* Terms & Conditions — expandable inline */}
      <div className={cardInner}>
        <button
          onClick={() => setTcOpen(v => !v)}
          className={`w-full flex items-center justify-between px-4 py-4 text-left transition-colors cursor-pointer ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}`}
        >
          <div>
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>Terms &amp; Conditions</p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              The rules governing your use of InfluenceConnect. Last updated May 2026.
            </p>
          </div>
          <svg
            className={`w-4 h-4 flex-shrink-0 ml-3 transition-transform ${tcOpen ? 'rotate-180' : ''} ${isDark ? 'text-slate-500' : 'text-gray-400'}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {tcOpen && (
          <div className={`border-t px-4 pb-4 ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
            <div className={`mt-3 mb-4 text-xs px-3 py-2.5 rounded-lg ${isDark ? 'bg-slate-800/60 text-slate-400 border border-slate-700' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
              These Terms and Conditions apply to all users of the InfluenceConnect platform. Please read them carefully.
            </div>

            <div className="space-y-1">
              {TERMS_SECTIONS.map((sec, i) => (
                <div key={i} className={`rounded-lg border overflow-hidden ${isDark ? 'border-slate-700/50' : 'border-gray-200'}`}>
                  <button
                    onClick={() => setOpenIdx(openIdx === i ? null : i)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 text-left text-xs font-semibold transition-colors cursor-pointer ${isDark ? 'hover:bg-slate-800/50 text-slate-300' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    {sec.title}
                    <svg
                      className={`w-3.5 h-3.5 flex-shrink-0 ml-2 transition-transform ${openIdx === i ? 'rotate-180' : ''} ${isDark ? 'text-slate-600' : 'text-gray-300'}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {openIdx === i && (
                    <div className={`px-3.5 pb-3.5 text-xs leading-relaxed ${isDark ? 'text-slate-400 border-t border-slate-800' : 'text-gray-600 border-t border-gray-100'}`}>
                      <p className="pt-3">{sec.body}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className={`text-xs mt-4 ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
              © {new Date().getFullYear()} InfluenceConnect · India · All rights reserved.
            </p>
          </div>
        )}
      </div>

      {/* Other legal docs */}
      {OTHER_DOCS.map(item => (
        <a
          key={item.title}
          href={item.href}
          className={`flex items-center justify-between p-4 rounded-xl border transition-all group ${isDark ? 'border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/40' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
        >
          <div>
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>{item.title}</p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{item.desc}</p>
          </div>
          <svg
            className={`w-4 h-4 flex-shrink-0 ml-3 transition-transform group-hover:translate-x-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </a>
      ))}
    </div>
  );
}
