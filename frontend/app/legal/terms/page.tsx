import LegalDocument from '@/components/shared/LegalDocument';
import { LEGAL_DOCS } from '@/lib/legalContent';
import { pageMetadata, breadcrumbJsonLd } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Terms & Conditions · Influence Connect',
  description: 'The terms and conditions governing your use of the Influence Connect platform.',
  path: '/legal/terms',
});

const breadcrumb = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Terms & Conditions', path: '/legal/terms' },
]);

export default function TermsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <LegalDocument doc={LEGAL_DOCS.terms} />
    </>
  );
}
