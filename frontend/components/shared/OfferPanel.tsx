'use client';

import { useState } from 'react';
import api from '@/lib/api';

export interface Offer {
  _id: string;
  amount: number;
  reason?: string;
  proposedBy: string;
  proposedByRole: 'brand' | 'influencer';
  status: 'pending' | 'accepted' | 'countered';
  createdAt: string;
}

interface OfferPanelProps {
  dealId: string;
  budgetMin: number;
  budgetMax: number;
  offers: Offer[];
  negotiationStatus: 'open' | 'agreed';
  agreedAmount: number;
  currentUserId: string;
  dealClosed: boolean;
  onUpdated: (patch: { offers: Offer[]; negotiationStatus: 'open' | 'agreed'; agreedAmount: number }) => void;
}

export default function OfferPanel({
  dealId,
  budgetMin,
  budgetMax,
  offers,
  negotiationStatus,
  agreedAmount,
  currentUserId,
  dealClosed,
  onUpdated,
}: OfferPanelProps) {
  const [offerInput, setOfferInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [offering, setOffering] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const isAgreed = negotiationStatus === 'agreed';
  const isLocked = isAgreed || dealClosed;

  const pending = offers.filter(o => o.status === 'pending');
  const latestPending = pending[pending.length - 1] ?? null;
  const canAccept = !!latestPending && latestPending.proposedBy !== currentUserId;
  const myOfferWaiting = !!latestPending && latestPending.proposedBy === currentUserId;

  const handleMakeOffer = async () => {
    const parsed = Number(offerInput);
    if (!offerInput || isNaN(parsed) || parsed <= 0) {
      setFieldError('Enter a valid amount.');
      return;
    }
    if (parsed < budgetMin || parsed > budgetMax) {
      setFieldError(`Must be between ₹${budgetMin.toLocaleString('en-IN')} and ₹${budgetMax.toLocaleString('en-IN')}.`);
      return;
    }
    setOffering(true);
    setFieldError('');
    try {
      const res = await api.post(`/api/deals/${dealId}/offer`, { amount: parsed, reason: reasonInput.trim() });
      setOfferInput('');
      setReasonInput('');
      onUpdated({ ...res.data, negotiationStatus: res.data.negotiationStatus as 'open' | 'agreed' });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setFieldError(e.response?.data?.error || 'Failed to send offer.');
    } finally {
      setOffering(false);
    }
  };

  const handleAccept = async () => {
    setAccepting(true);
    setFieldError('');
    try {
      const res = await api.put(`/api/deals/${dealId}/offer/accept`);
      onUpdated({ ...res.data, negotiationStatus: res.data.negotiationStatus as 'open' | 'agreed' });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setFieldError(e.response?.data?.error || 'Failed to accept offer.');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className={`border-b flex-shrink-0 transition-colors duration-200 ${
      isAgreed ? 'bg-emerald-50/60 border-emerald-200/60' : 'bg-amber-50/50 border-amber-200/50'
    }`}>

      {/* Header row */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 pt-2.5 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isAgreed ? 'text-emerald-500' : 'text-amber-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12M6 8h12M12 21 6 8"/><path d="M6 13h3a4 4 0 1 0 0-5H6"/>
          </svg>
          <span className="text-[12px] font-semibold text-gray-700">Price Negotiation</span>
          <span className="text-[11px] text-gray-400 hidden sm:inline">
            · Budget ₹{budgetMin.toLocaleString('en-IN')} – ₹{budgetMax.toLocaleString('en-IN')}
          </span>
        </div>

        {isAgreed ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 flex-shrink-0">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Agreed · ₹{agreedAmount.toLocaleString('en-IN')}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending
          </span>
        )}
      </div>

      {/* Body */}
      {isAgreed ? (
        /* Agreed state — show locked summary */
        <div className="px-4 sm:px-5 pb-2.5">
          <p className="text-[11px] text-emerald-600 font-medium">
            ₹{agreedAmount.toLocaleString('en-IN')} agreed. Negotiation is closed — proceed with the campaign.
          </p>
        </div>
      ) : !isLocked ? (
        /* Active negotiation */
        <div className="px-4 sm:px-5 pb-3 flex flex-col gap-2">

          {/* Pending offer from the other party */}
          {canAccept && latestPending && (
            <div className="flex flex-col gap-1.5 p-2.5 bg-white border border-amber-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    {latestPending.proposedByRole === 'brand' ? 'Brand' : 'Creator'} offered
                  </p>
                  <p className="text-base font-bold text-gray-900">₹{latestPending.amount.toLocaleString('en-IN')}</p>
                </div>
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3.5 py-2 rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 shadow-sm flex-shrink-0"
                >
                  {accepting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                  {accepting ? 'Accepting…' : `Accept ₹${latestPending.amount.toLocaleString('en-IN')}`}
                </button>
              </div>
              {latestPending.reason && (
                <p className="text-[11px] text-gray-500 italic bg-amber-50/60 px-2.5 py-1.5 rounded-lg border border-amber-100">
                  &ldquo;{latestPending.reason}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* My offer waiting */}
          {myOfferWaiting && latestPending && (
            <div className="flex flex-col gap-1.5 p-2.5 bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Your offer</p>
                  <p className="text-sm font-bold text-gray-700">₹{latestPending.amount.toLocaleString('en-IN')} · Waiting for response</p>
                </div>
              </div>
              {latestPending.reason && (
                <p className="text-[11px] text-gray-400 italic bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                  &ldquo;{latestPending.reason}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Make / counter offer input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium pointer-events-none select-none">₹</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={offerInput}
                  onChange={e => { setOfferInput(e.target.value); setFieldError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleMakeOffer()}
                  placeholder={`${budgetMin.toLocaleString('en-IN')} – ${budgetMax.toLocaleString('en-IN')}`}
                  min={budgetMin}
                  max={budgetMax}
                  className="w-full pl-7 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 hover:border-gray-300 transition-all bg-white"
                />
              </div>
              <button
                onClick={handleMakeOffer}
                disabled={offering || !offerInput.trim()}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-4 py-2 rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 shadow-sm whitespace-nowrap"
              >
                {offering ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                )}
                {offering ? '…' : canAccept ? 'Counter →' : 'Send offer →'}
              </button>
            </div>
            <input
              type="text"
              value={reasonInput}
              onChange={e => setReasonInput(e.target.value.slice(0, 300))}
              placeholder="Why this amount? (optional)"
              className="w-full px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 hover:border-gray-300 transition-all bg-white"
            />
          </div>

          {fieldError && (
            <p className="text-[11px] text-red-500 font-medium">{fieldError}</p>
          )}
        </div>
      ) : null /* dealClosed but not agreed — show nothing extra */ }
    </div>
  );
}
