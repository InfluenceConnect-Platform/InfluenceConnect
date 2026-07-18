import LegalDocument from '@/components/shared/LegalDocument';
import { LEGAL_DOCS } from '@/lib/legalContent';
import { pageMetadata, breadcrumbJsonLd } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Privacy Policy · Influence Connect',
  description: 'How Influence Connect collects, uses, shares, and protects your personal data.',
  path: '/legal/privacy',
});

const breadcrumb = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Privacy Policy', path: '/legal/privacy' },
]);

export default function PrivacyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <LegalDocument doc={LEGAL_DOCS.privacy} />
    </>
  );
}
