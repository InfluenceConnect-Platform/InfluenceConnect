'use client';

import { useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/shared/Toast';
import IdChip from '@/components/shared/IdChip';

const TEAL = '#7FA8AD';

const DEAL_STATUS_STYLES: Record<string, string> = {
  'in-progress':       'bg-blue-50 text-blue-700 border border-blue-100',
  'content-submitted': 'bg-violet-50 text-violet-700 border border-violet-100',
  'completed':         'bg-green-50 text-green-700 border border-green-100',
  'cancelled':          'bg-gray-50 text-gray-500 border border-gray-200',
};

const PAYOUT_STATUS_STYLES: Record<string, string> = {
  paid:          'bg-green-50 text-green-700 border border-green-100',
  submitted:     'bg-amber-50 text-amber-700 border border-amber-100',
  not_submitted: 'bg-gray-50 text-gray-500 border border-gray-200',
};

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  paid: 'Paid', submitted: 'Awaiting payment', not_submitted: 'Not submitted',
};

const inr = (n: number) => '₹' + (Number.isFinite(n) ? n : 0).toLocaleString('en-IN');
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export interface PaymentRow {
  dealId: string;
  customId: string;
  campaignTitle: string;
  campaignCustomId: string;
  brandName: string;
  brandEmail: string;
  influencerName: string;
  influencerEmail: string;
  agreedAmount: number;
  dealStatus: string;
  startedAt?: string;
  completedAt?: string | null;
  payoutStatus: 'paid' | 'submitted' | 'not_submitted';
  payoutMethod: 'bank' | 'upi' | null;
  paidAt?: string | null;
  transactionRef: string;
  receiptUrl: string;
}

interface RevealedPayout {
  method: 'bank' | 'upi';
  accountHolderName: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
}

interface Props {
  payment: PaymentRow | null;
  onClose: () => void;
}

export default function PaymentDetailDrawer({ payment, onClose }: Props) {
  const toast = useToast();
  const [revealed, setRevealed] = useState<RevealedPayout | null>(null);
  const [revealing, setRevealing] = useState(false);

  const showToast = (msg: string) =>
    toast.show(msg, /fail|error|cannot|unable|wrong/.test(msg.toLowerCase()) ? 'error' : 'success');

  // Reset the revealed bank/UPI details whenever a different deal is opened,
  // so switching rows never leaks the previous deal's decrypted data.
  useEffect(() => { setRevealed(null); }, [payment?.dealId]);

  useEffect(() => {
    if (!payment) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [payment, onClose]);

  const handleReveal = async () => {
    if (!payment) return;
    setRevealing(true);
    try {
      const res = await api.get(`/api/admin/deals/${payment.dealId}/payout`);
      if (!res.data?.payout) {
        showToast('No payout details submitted for this deal.');
        return;
      }
      setRevealed(res.data.payout);
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to reveal payout details.');
    } finally {
      setRevealing(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[120] ${payment ? '' : 'pointer-events-none'}`} aria-hidden={!payment}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${
          payment ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute top-0 right-0 h-full w-full sm:w-[480px] bg-[#F7F8FA] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          payment ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-[#3E4751] text-white flex-shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">Payment details</p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {payment && (
          <div className="flex-1 overflow-y-auto">

            {/* Header */}
            <div className="px-5 pt-5 pb-4 bg-white border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-gray-900 leading-snug truncate">{payment.campaignTitle}</h2>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {payment.customId && <IdChip id={payment.customId} size="xs" tone="subtle" />}
                    {payment.campaignCustomId && <IdChip id={payment.campaignCustomId} size="xs" tone="subtle" />}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${DEAL_STATUS_STYLES[payment.dealStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                    {payment.dealStatus}
                  </span>
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${PAYOUT_STATUS_STYLES[payment.payoutStatus]}`}>
                    {PAYOUT_STATUS_LABELS[payment.payoutStatus]}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-[#F7F8FA] border border-gray-100 rounded-xl px-2.5 py-2 text-center">
                  <p className="text-sm font-bold text-gray-900">{inr(payment.agreedAmount)}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-0.5">Agreed amount</p>
                </div>
                <div className="bg-[#F7F8FA] border border-gray-100 rounded-xl px-2.5 py-2 text-center">
                  <p className="text-sm font-bold text-gray-900">{fmtDate(payment.paidAt)}</p>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-0.5">Paid on</p>
                </div>
              </div>
            </div>

            <div className="px-5 py-5 space-y-5">

              <Section title="Parties">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Brand" value={payment.brandName} />
                  <Field label="Brand email" value={payment.brandEmail} />
                  <Field label="Influencer" value={payment.influencerName} />
                  <Field label="Influencer email" value={payment.influencerEmail} />
                  <Field label="Started" value={fmtDate(payment.startedAt)} />
                  <Field label="Completed" value={fmtDate(payment.completedAt)} />
                </div>
              </Section>

              <Section title="Payment proof">
                {payment.transactionRef || payment.receiptUrl ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <Field label="Transaction ref" value={payment.transactionRef || '—'} full />
                    <Field
                      label="Receipt"
                      value={payment.receiptUrl
                        ? <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-[#3E4751] underline">View receipt</a>
                        : '—'}
                      full
                    />
                  </div>
                ) : (
                  <p className="text-[13px] text-gray-400 bg-white border border-gray-100 rounded-xl px-3.5 py-3">
                    No payment proof submitted yet.
                  </p>
                )}
              </Section>

              <Section title="Payout details">
                {payment.payoutStatus === 'not_submitted' ? (
                  <p className="text-[13px] text-gray-400 bg-white border border-gray-100 rounded-xl px-3.5 py-3">
                    The influencer hasn't submitted payout details for this deal.
                  </p>
                ) : revealed ? (
                  <div className="bg-white border border-gray-100 rounded-xl p-3.5 space-y-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <Field label="Method" value={revealed.method === 'upi' ? 'UPI' : 'Bank transfer'} />
                      <Field label="Account holder" value={revealed.accountHolderName || '—'} />
                      {revealed.method === 'bank' ? (
                        <>
                          <Field label="Account number" value={revealed.accountNumber || '—'} />
                          <Field label="IFSC code" value={revealed.ifscCode || '—'} />
                        </>
                      ) : (
                        <Field label="UPI ID" value={revealed.upiId || '—'} full />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-100 rounded-xl p-3.5">
                    <p className="text-[12px] text-gray-500 leading-relaxed mb-3">
                      Bank/UPI details are encrypted. Revealing them here is logged in the admin audit trail —
                      only do this for dispute resolution.
                    </p>
                    <button
                      onClick={handleReveal}
                      disabled={revealing}
                      className="w-full py-2.5 rounded-xl text-[13px] font-semibold bg-[#3E4751] text-white hover:bg-[#333A42] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {revealing ? 'Revealing…' : 'Reveal payout details'}
                    </button>
                  </div>
                )}
              </Section>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: TEAL }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, value, full }: { label: string; value: ReactNode; full?: boolean }) {
  const display = value === undefined || value === null || value === '' ? '—' : value;
  return (
    <div className={full ? 'col-span-2 min-w-0' : 'min-w-0'}>
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <div className="text-[13px] font-semibold text-gray-900 mt-0.5 break-words">{display}</div>
    </div>
  );
}
