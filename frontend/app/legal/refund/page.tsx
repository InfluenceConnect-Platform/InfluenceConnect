import LegalDocument from '@/components/shared/LegalDocument';
import { LEGAL_DOCS } from '@/lib/legalContent';
import { pageMetadata, breadcrumbJsonLd } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Refund & Cancellation Policy · Influence Connect',
  description: 'Our policy on Premium subscription cancellations, refunds, and billing.',
  path: '/legal/refund',
});

const breadcrumb = breadcrumbJsonLd([
  { name: 'Home', path: '/' },
  { name: 'Refund & Cancellation Policy', path: '/legal/refund' },
]);

export default function RefundPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <LegalDocument doc={LEGAL_DOCS.refund} />
    </>
  );
}
