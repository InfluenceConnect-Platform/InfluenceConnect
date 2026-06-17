import type { Metadata } from 'next';
import LegalDocument from '@/components/shared/LegalDocument';
import { LEGAL_DOCS } from '@/lib/legalContent';

export const metadata: Metadata = {
  title: 'Terms & Conditions · Influence Connect',
  description: 'The terms and conditions governing your use of the Influence Connect platform.',
};

export default function TermsPage() {
  return <LegalDocument doc={LEGAL_DOCS.terms} />;
}
