import type { Metadata } from 'next';
import LegalDocument from '@/components/shared/LegalDocument';
import { LEGAL_DOCS } from '@/lib/legalContent';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy · Influence Connect',
  description: 'Our policy on Premium subscription cancellations, refunds, and billing.',
};

export default function RefundPage() {
  return <LegalDocument doc={LEGAL_DOCS.refund} />;
}
