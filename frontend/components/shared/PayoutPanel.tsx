'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useTheme } from '@/lib/useTheme';

interface Payout {
  method: 'bank' | 'upi';
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  paid: boolean;
  paidAt: string | null;
}

interface PayoutPanelProps {
  dealId: string;
  role: 'brand' | 'influencer';
  accentColor?: string; // hex, defaults to teal to match the influencer theme
}

const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_NUMBER_PATTERN = /^\d{9,18}$/;
const UPI_PATTERN = /^[\w.-]{2,256}@[a-zA-Z]{2,64}$/;

const maskAccount = (num: string) => (num ? `•••• ${num.slice(-4)}` : '');
const maskUpi = (upi: string) => {
  const [name, domain] = upi.split('@');
  if (!domain) return upi;
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(name.length - 2, 2))}@${domain}`;
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function PayoutPanel({ dealId, role, accentColor = '#27717E' }: PayoutPanelProps) {
  const { isDark } = useTheme();
  const [payout, setPayout] = useState<Payout | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [error, setError] = useState('');

  const [method, setMethod] = useState<'bank' | 'upi'>('bank');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setEditing(false);
    api.get(`/api/deals/${dealId}/payout`)
      .then(res => {
        if (cancelled) return;
        setPayout(res.data.payout);
        if (!res.data.payout) setEditing(true);
      })
      .catch(() => { if (!cancelled) setPayout(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [dealId]);

  const startEdit = () => {
    if (payout) {
      setMethod(payout.method);
      setAccountHolderName(payout.accountHolderName);
      setAccountNumber(payout.accountNumber);
      setConfirmAccountNumber(payout.accountNumber);
      setIfscCode(payout.ifscCode);
      setUpiId(payout.upiId);
    }
    setError('');
    setEditing(true);
  };

  const handleSubmit = async () => {
    if (!accountHolderName.trim()) { setError('Enter the account holder name.'); return; }
    if (method === 'bank') {
      if (!ACCOUNT_NUMBER_PATTERN.test(accountNumber)) { setError('Enter a valid account number (9–18 digits).'); return; }
      if (accountNumber !== confirmAccountNumber) { setError('Account numbers do not match.'); return; }
      if (!IFSC_PATTERN.test(ifscCode.toUpperCase())) { setError('Enter a valid IFSC code (e.g. HDFC0001234).'); return; }
    } else {
      if (!UPI_PATTERN.test(upiId)) { setError('Enter a valid UPI ID (e.g. name@bank).'); return; }
    }

    setSaving(true);
    setError('');
    try {
      const res = await api.post(`/api/deals/${dealId}/payout`, {
        method,
        accountHolderName: accountHolderName.trim(),
        accountNumber: method === 'bank' ? accountNumber : undefined,
        ifscCode: method === 'bank' ? ifscCode.toUpperCase() : undefined,
        upiId: method === 'upi' ? upiId : undefined,
      });
      setPayout(res.data.payout);
      setEditing(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to save payout details.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async () => {
    setMarkingPaid(true);
    setError('');
    try {
      const res = await api.put(`/api/deals/${dealId}/payout/mark-paid`);
      setPayout(res.data.payout);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to mark as paid.');
    } finally {
      setMarkingPaid(false);
    }
  };

  if (loading) return null;

  const panelClass = `border-b flex-shrink-0 px-4 sm:px-5 py-3 ${isDark ? 'bg-slate-900/40 border-slate-700/60' : 'bg-gray-50/70 border-gray-200/70'}`;

  // ── Brand view ──────────────────────────────────────────────
  if (role === 'brand') {
    if (!payout) {
      return (
        <div className={panelClass}>
          <p className={`text-[12px] font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            💳 Waiting for the creator to submit payout details.
          </p>
        </div>
      );
    }
    return (
      <div className={panelClass}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Payout details</p>
            {payout.method === 'bank' ? (
              <p className={`text-[13px] font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                {payout.accountHolderName} · {payout.accountNumber} · {payout.ifscCode}
              </p>
            ) : (
              <p className={`text-[13px] font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                {payout.accountHolderName} · UPI: {payout.upiId}
              </p>
            )}
          </div>
          {payout.paid ? (
            <span className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border text-emerald-700 bg-emerald-100 border-emerald-200">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Paid {formatDate(payout.paidAt!)}
            </span>
          ) : (
            <button
              onClick={handleMarkPaid}
              disabled={markingPaid}
              className="flex-shrink-0 text-[12px] font-bold text-white px-3.5 py-2 rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              {markingPaid ? 'Marking…' : 'Mark as Paid'}
            </button>
          )}
        </div>
        {error && <p className="text-[11px] text-red-500 font-medium mt-1.5">{error}</p>}
      </div>
    );
  }

  // ── Influencer view ──────────────────────────────────────────
  if (payout && !editing) {
    return (
      <div className={panelClass}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Payout details</p>
            <p className={`text-[13px] font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
              {payout.method === 'bank'
                ? `${payout.accountHolderName} · ${maskAccount(payout.accountNumber)} · ${payout.ifscCode}`
                : `${payout.accountHolderName} · UPI: ${maskUpi(payout.upiId)}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {payout.paid ? (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border text-emerald-700 bg-emerald-100 border-emerald-200">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Paid {formatDate(payout.paidAt!)}
              </span>
            ) : (
              <>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${isDark ? 'text-amber-300 bg-amber-900/30 border-amber-700/40' : 'text-amber-700 bg-amber-100 border-amber-200'}`}>
                  Awaiting payment
                </span>
                <button
                  onClick={startEdit}
                  className={`text-[12px] font-semibold px-3 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={panelClass}>
      <p className={`text-[12px] font-semibold mb-2 ${isDark ? 'text-slate-100' : 'text-gray-700'}`}>
        💳 {payout ? 'Update payout details' : 'Submit payout details'}
      </p>
      <div className="flex flex-col gap-2 max-w-md">
        <div className="flex gap-2">
          {(['bank', 'upi'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMethod(m); setError(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 cursor-pointer ${
                method === m
                  ? 'text-white border-transparent'
                  : isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-500 hover:bg-gray-100'
              }`}
              style={method === m ? { backgroundColor: accentColor } : undefined}
            >
              {m === 'bank' ? 'Bank Transfer' : 'UPI'}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={accountHolderName}
          onChange={e => setAccountHolderName(e.target.value)}
          placeholder="Account holder name"
          className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
            isDark ? 'bg-slate-800 text-slate-100 placeholder:text-slate-500 border-slate-600' : 'bg-white text-gray-900 placeholder:text-gray-400 border-gray-200'
          }`}
        />

        {method === 'bank' ? (
          <>
            <input
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="Account number"
              className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                isDark ? 'bg-slate-800 text-slate-100 placeholder:text-slate-500 border-slate-600' : 'bg-white text-gray-900 placeholder:text-gray-400 border-gray-200'
              }`}
            />
            <input
              type="text"
              inputMode="numeric"
              value={confirmAccountNumber}
              onChange={e => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="Confirm account number"
              className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                isDark ? 'bg-slate-800 text-slate-100 placeholder:text-slate-500 border-slate-600' : 'bg-white text-gray-900 placeholder:text-gray-400 border-gray-200'
              }`}
            />
            <input
              type="text"
              value={ifscCode}
              onChange={e => setIfscCode(e.target.value.toUpperCase())}
              placeholder="IFSC code"
              className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all uppercase ${
                isDark ? 'bg-slate-800 text-slate-100 placeholder:text-slate-500 border-slate-600' : 'bg-white text-gray-900 placeholder:text-gray-400 border-gray-200'
              }`}
            />
          </>
        ) : (
          <input
            type="text"
            value={upiId}
            onChange={e => setUpiId(e.target.value)}
            placeholder="UPI ID (e.g. name@bank)"
            className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
              isDark ? 'bg-slate-800 text-slate-100 placeholder:text-slate-500 border-slate-600' : 'bg-white text-gray-900 placeholder:text-gray-400 border-gray-200'
            }`}
          />
        )}

        {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}

        <div className="flex items-center gap-2">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="text-[12px] font-bold text-white px-4 py-2 rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 shadow-sm"
            style={{ backgroundColor: accentColor }}
          >
            {saving ? 'Saving…' : payout ? 'Save changes' : 'Submit'}
          </button>
          {payout && (
            <button
              onClick={() => { setEditing(false); setError(''); }}
              className={`text-[12px] font-semibold px-3 py-2 rounded-xl border transition-all duration-150 cursor-pointer ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
            >
              Cancel
            </button>
          )}
        </div>
        <p className={`text-[10.5px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
          Encrypted and only visible to you and the brand.
        </p>
      </div>
    </div>
  );
}
