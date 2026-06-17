import type { Metadata } from 'next';
import LegalDocument from '@/components/shared/LegalDocument';
import { LEGAL_DOCS } from '@/lib/legalContent';

export const metadata: Metadata = {
  title: 'Privacy Policy · Influence Connect',
  description: 'How Influence Connect collects, uses, shares, and protects your personal data.',
};

export default function PrivacyPage() {
  return <LegalDocument doc={LEGAL_DOCS.privacy} />;
}
