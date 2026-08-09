'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useTheme } from '@/lib/useTheme';

export interface SubscriptionInfo {
  id: string;
  tier: string;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  status: 'created' | 'authenticated' | 'active' | 'pending' | 'halted' | 'cancelled' | 'completed' | 'expired';
  currentEnd: string | null;
  chargeAt: string | null;
  cancelAtCycleEnd: boolean;
  cancelledAt: string | null;
  willRenew: boolean;
  paidCount: number;
  lastFailedAt: string | null;
}

export interface ScheduledChange {
  tier: string;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  startsAt: string;
}

interface Props {
  /** Role accent hex — ruby #E0115F for creators, forest green #228B22 for brands. */
  accent: string;
  accentDark: string;
  tierLabel?: (tier: string) => string;
  onChanged?: () => void;
  notify?: (msg: string) => void;
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—';

export default function SubscriptionPanel({ accent, accentDark, tierLabel, onChanged, notify }: Props) {
  const { isDark } = useTheme();
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [scheduled, setScheduled] = useState<ScheduledChange | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [immediate, setImmediate] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/payments/subscription');
      setSub(res.data.subscription);
      setScheduled(res.data.scheduledChange ?? null);
    } catch {
      setSub(null);
      setScheduled(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Nothing to manage on a one-time plan — render nothing rather than an
  // empty card, so the billing page looks unchanged for those users.
  if (loading || !sub) return null;

  const label = tierLabel?.(sub.tier) ?? sub.tier;
  const failing = sub.status === 'halted' || sub.status === 'pending' || !!sub.lastFailedAt;

  async function handleCancel() {
    setSubmitting(true);
    try {
      const res = await api.post('/api/payments/subscription/cancel', { immediate, reason });
      notify?.(res.data.message);
      setDialogOpen(false);
      setReason('');
      setImmediate(false);
      await load();
      onChanged?.();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      notify?.(e.response?.data?.error || 'Could not cancel. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const card = isDark
    ? 'bg-[#0f1e31] border-slate-700/60'
    : 'bg-white border-gray-200';

  return (
    <>
      <section className={`rounded-2xl border p-5 sm:p-6 shadow-sm mb-6 ${card}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${accent}1A`, color: isDark ? '#fff' : accentDark }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                Auto-renewing
              </span>
              {sub.cancelAtCycleEnd && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50">
                  Cancelling
                </span>
              )}
              {failing && !sub.cancelAtCycleEnd && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50">
                  Payment issue
                </span>
              )}
            </div>

            <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
              {label} · {sub.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
            </h2>

            <p className={`text-xs mt-1.5 max-w-md leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {sub.cancelAtCycleEnd ? (
                <>Auto-renewal is off. You keep {label} until <strong>{fmt(sub.currentEnd)}</strong>, then your account moves to the free plan.</>
              ) : failing ? (
                <>We could not collect your last payment. Access continues until <strong>{fmt(sub.currentEnd)}</strong> — update your payment method to keep renewing.</>
              ) : (
                <>Renews automatically on <strong>{fmt(sub.chargeAt || sub.currentEnd)}</strong> at ₹{sub.amount.toLocaleString('en-IN')}. Cancel any time.</>
              )}
            </p>
          </div>

          {!sub.cancelAtCycleEnd && !scheduled && (
            <button
              onClick={() => setDialogOpen(true)}
              className={`shrink-0 text-xs font-bold px-3.5 py-2 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel plan
            </button>
          )}
        </div>

        {scheduled && (
          <div
            className="mt-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-3"
            style={{ borderColor: `${accent}40`, backgroundColor: `${accent}0D` }}
          >
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accent }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <p className={`text-[12px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              Switching to <strong>{tierLabel?.(scheduled.tier) ?? scheduled.tier}</strong>{' '}
              ({scheduled.billingCycle === 'yearly' ? 'yearly' : 'monthly'}, ₹{scheduled.amount.toLocaleString('en-IN')}) on{' '}
              <strong>{fmt(scheduled.startsAt)}</strong>. Your current plan runs until then and is not charged again.
            </p>
          </div>
        )}
      </section>

      {dialogOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-sub-title"
          onClick={e => { if (e.target === e.currentTarget && !submitting) setDialogOpen(false); }}
        >
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${card}`}>
            <h3 id="cancel-sub-title" className={`text-lg font-bold mb-1.5 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
              Cancel auto-renewal?
            </h3>
            <p className={`text-[13px] leading-relaxed mb-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Choose what happens to the time you have already paid for.
            </p>

            <div className="flex flex-col gap-2.5 mb-5">
              <label className={`flex gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                !immediate
                  ? 'border-transparent'
                  : isDark ? 'border-slate-700 hover:border-slate-600' : 'border-gray-200 hover:border-gray-300'
              }`}
                style={!immediate ? { borderColor: accent, backgroundColor: `${accent}0F` } : undefined}
              >
                <input
                  type="radio" name="cancel-mode" checked={!immediate}
                  onChange={() => setImmediate(false)} className="mt-0.5 accent-current"
                  style={{ accentColor: accent }}
                />
                <span>
                  <span className={`block text-[13px] font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                    Keep access until {fmt(sub.currentEnd)}
                  </span>
                  <span className={`block text-[12px] mt-0.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Recommended. You are not charged again, and nothing you paid for is lost.
                  </span>
                </span>
              </label>

              <label className={`flex gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                immediate
                  ? 'border-red-400 bg-red-50/60 dark:border-red-700/60 dark:bg-red-900/20'
                  : isDark ? 'border-slate-700 hover:border-slate-600' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio" name="cancel-mode" checked={immediate}
                  onChange={() => setImmediate(true)} className="mt-0.5"
                  style={{ accentColor: '#dc2626' }}
                />
                <span>
                  <span className={`block text-[13px] font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                    End my plan now
                  </span>
                  <span className={`block text-[12px] mt-0.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Premium stops immediately. The rest of this paid period is forfeited and is not refunded.
                  </span>
                </span>
              </label>
            </div>

            <label htmlFor="cancel-reason" className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Why are you cancelling? <span className="font-medium normal-case tracking-normal opacity-70">(optional)</span>
            </label>
            <textarea
              id="cancel-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="This helps us improve — it will not affect your cancellation."
              className={`w-full px-3 py-2.5 text-[13px] rounded-xl border resize-none mb-5 focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-[#0A1628] border-slate-700 text-slate-100 placeholder-slate-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
              style={{ ['--tw-ring-color' as string]: `${accent}40` }}
            />

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
                className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                  isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Keep my plan
              </button>
              <button
                onClick={handleCancel}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white shadow-sm transition-colors cursor-pointer disabled:opacity-60 bg-red-600 hover:bg-red-700"
              >
                {submitting ? 'Cancelling…' : immediate ? 'End plan now' : 'Turn off auto-renewal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
