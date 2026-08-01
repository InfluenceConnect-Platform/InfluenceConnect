'use client';

import { useEffect, ReactNode } from 'react';
import IdChip from '@/components/shared/IdChip';

const SLATE = '#3E4751';

const STATUS_CONFIG: Record<string, { cls: string; dot: string; label: string }> = {
  paid:    { cls: 'bg-green-50 text-green-700 border border-green-200', dot: 'bg-green-500', label: 'Paid' },
  created: { cls: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-400', label: 'Awaiting payment' },
  failed:  { cls: 'bg-red-50 text-red-600 border border-red-200',       dot: 'bg-red-400',   label: 'Failed' },
};

const METHOD_LABELS: Record<string, string> = {
  card: 'Card',
  upi: 'UPI',
  netbanking: 'Netbanking',
  wallet: 'Wallet',
  emi: 'EMI',
  paylater: 'Pay later',
};

const inr = (paise?: number) => '₹' + ((paise ?? 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');
const fmtDateTime = (d?: string) =>
  d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : '—';

interface Props {
  payment: any | null;
  onClose: () => void;
}

export default function SubscriptionDetailDrawer({ payment, onClose }: Props) {
  const open = !!payment;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const p = payment;
  const user = p?.userId || {};
  const cfg = p ? (STATUS_CONFIG[p.status] || STATUS_CONFIG.created) : null;

  return (
    <div className={`fixed inset-0 z-[120] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute top-0 right-0 h-full w-full sm:w-[480px] bg-[#F4F5F9] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#3E4751] to-[#262C33] text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/80">Subscription details</p>
          </div>
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

        {p && cfg && (
          <>
            <div className="flex-1 overflow-y-auto">
              {/* Summary */}
              <div className="px-5 pt-5 pb-5 bg-white border-b border-gray-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-bold ${cfg.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold border bg-gray-100 text-gray-600 border-gray-200 capitalize">
                    {cap(p.role)} Premium
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold border bg-indigo-50 text-indigo-700 border-indigo-100 capitalize">
                    {p.billingCycle}
                  </span>
                </div>
                <p className="text-[26px] font-bold text-gray-900 leading-tight mt-3">{inr(p.amount)}</p>
                {p.customId && <div className="mt-2"><IdChip id={p.customId} size="xs" tone="subtle" /></div>}
              </div>

              <div className="px-5 py-5 space-y-5">
                {/* Subscriber */}
                <Section title="Subscriber">
                  <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-x-4 gap-y-3.5 shadow-sm">
                    <Field label="Name" value={user.name || '—'} full />
                    <Field label="Email" value={user.email || '—'} full />
                    <Field label="Account ID" value={user.customId ? <IdChip id={user.customId} size="xs" tone="subtle" /> : '—'} />
                    <Field label="Role" value={cap(user.role)} />
                    <Field label="Current plan" value={user.plan ? cap(user.plan) : '—'} />
                    <Field label="Premium expires" value={fmtDateTime(user.premiumUntil)} />
                  </div>
                </Section>

                {/* Plan & timing */}
                <Section title="Plan & timing">
                  <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-x-4 gap-y-3.5 shadow-sm">
                    <Field label="Billing cycle" value={cap(p.billingCycle)} />
                    <Field label="Amount paid" value={inr(p.amount)} />
                    <Field label="Purchased on" value={fmtDateTime(p.createdAt)} full />
                    <Field label="Last updated" value={fmtDateTime(p.updatedAt)} full />
                  </div>
                </Section>

                {/* Payment / Razorpay */}
                <Section title="Payment">
                  <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-x-4 gap-y-3.5 shadow-sm">
                    <Field label="Method" value={p.method ? (METHOD_LABELS[p.method] || cap(p.method)) : '—'} />
                    <Field label="Currency" value={p.currency || 'INR'} />
                    <Field label="Razorpay order ID" value={<span className="font-mono text-[12px] break-all">{p.razorpayOrderId || '—'}</span>} full />
                    <Field label="Razorpay payment ID" value={<span className="font-mono text-[12px] break-all">{p.razorpayPaymentId || '—'}</span>} full />
                    <Field label="Internal payment ID" value={<span className="font-mono text-[12px] break-all">{p._id}</span>} full />
                  </div>
                </Section>
              </div>
            </div>

            <div className="flex-shrink-0 border-t border-gray-200 bg-white px-5 py-3.5">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-[13px] font-bold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: SLATE }}>
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
