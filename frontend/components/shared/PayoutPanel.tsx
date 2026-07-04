'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { useTheme } from '@/lib/useTheme';
import { ChatAttachment, validateChatFile, uploadChatAttachment, downloadUrlFor } from '@/lib/chatAttachments';

export interface Payout {
  method: 'bank' | 'upi';
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  paid: boolean;
  paidAt: string | null;
  transactionRef: string;
  receiptUrl: string;
  receiptFileName: string;
}

interface PayoutPanelProps {
  dealId: string;
  role: 'brand' | 'influencer';
  open: boolean;
  onClose: () => void;
  /** Brand only — whether the creator has marked content submitted, a prerequisite for marking paid. */
  canMarkPaid?: boolean;
  /** Fires after every load/submit/mark-paid so the parent can drive the composer lock + status strip without its own fetch. */
  onStatusChange?: (payout: Payout | null) => void;
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

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function PayoutPanel({ dealId, role, open, onClose, canMarkPaid = true, onStatusChange, accentColor = '#27717E' }: PayoutPanelProps) {
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

  // Proof-of-payment, captured at the moment the brand confirms Mark as Paid.
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptAttachment, setReceiptAttachment] = useState<ChatAttachment | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState('');
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  // Keeps polling regardless of `open` so the composer-lock / status strip in
  // the parent stay live even while this modal is closed.
  useEffect(() => {
    let cancelled = false;
    const fetchPayout = (isFirst: boolean) => {
      if (isFirst) setLoading(true);
      api.get(`/api/deals/${dealId}/payout`)
        .then(res => {
          if (cancelled) return;
          setPayout(res.data.payout);
          onStatusChangeRef.current?.(res.data.payout);
          if (isFirst && !res.data.payout) setEditing(true);
        })
        .catch(() => { if (!cancelled && isFirst) setPayout(null); })
        .finally(() => { if (!cancelled && isFirst) setLoading(false); });
    };

    setEditing(false);
    setConfirmingPayment(false);
    setTransactionRef('');
    setReceiptAttachment(null);
    setReceiptError('');
    fetchPayout(true);
    const interval = setInterval(() => fetchPayout(false), 3000);
    return () => { cancelled = true; clearInterval(interval); };
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
      onStatusChangeRef.current?.(res.data.payout);
      setEditing(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to save payout details.');
    } finally {
      setSaving(false);
    }
  };

  const handleReceiptSelected = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (file.type.startsWith('video/')) { setReceiptError('Receipts must be an image or PDF.'); return; }
    const validationError = validateChatFile(file);
    if (validationError) { setReceiptError(validationError); return; }
    setReceiptError('');
    setUploadingReceipt(true);
    try {
      const uploaded = await uploadChatAttachment(file, dealId, 'payout-receipt');
      setReceiptAttachment(uploaded);
    } catch (err: unknown) {
      setReceiptError(err instanceof Error ? err.message : 'Failed to upload receipt.');
    } finally {
      setUploadingReceipt(false);
      if (receiptInputRef.current) receiptInputRef.current.value = '';
    }
  };

  const handleMarkPaid = async () => {
    if (!transactionRef.trim()) { setError('Enter the transaction ID / UTR number.'); return; }
    if (!receiptAttachment) { setError('Attach a payment receipt.'); return; }
    setMarkingPaid(true);
    setError('');
    try {
      const res = await api.put(`/api/deals/${dealId}/payout/mark-paid`, {
        transactionRef: transactionRef.trim(),
        receiptUrl: receiptAttachment.url,
        receiptFileName: receiptAttachment.fileName,
      });
      setPayout(res.data.payout);
      onStatusChangeRef.current?.(res.data.payout);
      setConfirmingPayment(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to mark as paid.');
    } finally {
      setMarkingPaid(false);
    }
  };

  if (!open) return null;

  const cardClass = `w-full max-w-md rounded-2xl shadow-2xl p-5 ${isDark ? 'bg-[#0E1B2E] border border-slate-700/60' : 'bg-white border border-gray-200'}`;
  const inputClass = `w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
    isDark ? 'bg-slate-800 text-slate-100 placeholder:text-slate-500 border-slate-600' : 'bg-white text-gray-900 placeholder:text-gray-400 border-gray-200'
  }`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={cardClass} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-[15px] font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>💳 Payout details</h3>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            <XIcon />
          </button>
        </div>

        {loading ? (
          <p className={`text-[13px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Loading…</p>

        ) : role === 'brand' ? (
          !payout ? (
            <p className={`text-[13px] font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Waiting for the creator to submit payout details.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  {payout.method === 'bank' ? 'Bank transfer' : 'UPI'}
                </p>
                {payout.method === 'bank' ? (
                  <p className={`text-[14px] font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                    {payout.accountHolderName}<br />{payout.accountNumber} · {payout.ifscCode}
                  </p>
                ) : (
                  <p className={`text-[14px] font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                    {payout.accountHolderName}<br />UPI: {payout.upiId}
                  </p>
                )}
              </div>
              {payout.paid ? (
                <div className="flex flex-col gap-2">
                  <span className="self-start flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-full border text-emerald-700 bg-emerald-100 border-emerald-200">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Paid {formatDate(payout.paidAt!)}
                  </span>
                  <p className={`text-[12px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Txn ID: <span className="font-semibold">{payout.transactionRef}</span>
                  </p>
                  {payout.receiptUrl && (
                    <a
                      href={downloadUrlFor({ url: payout.receiptUrl, fileName: payout.receiptFileName, type: 'raw', fileSize: 0, mimeType: '' })}
                      download={payout.receiptFileName || true}
                      className={`self-start text-[12px] font-semibold underline underline-offset-2 cursor-pointer ${isDark ? 'text-teal-300' : 'text-[#27717E]'}`}
                    >
                      View receipt
                    </a>
                  )}
                </div>
              ) : canMarkPaid ? (
                !confirmingPayment ? (
                  <button
                    onClick={() => setConfirmingPayment(true)}
                    className="self-start text-[13px] font-bold text-white px-4 py-2.5 rounded-xl transition-all duration-150 cursor-pointer shadow-sm"
                    style={{ backgroundColor: accentColor }}
                  >
                    Mark as Paid
                  </button>
                ) : (
                  <div className={`flex flex-col gap-2 p-3 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-[12px] font-semibold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>Confirm payment</p>
                    <input
                      type="text"
                      value={transactionRef}
                      onChange={e => setTransactionRef(e.target.value)}
                      placeholder="Transaction ID / UTR number"
                      className={inputClass}
                    />
                    <input ref={receiptInputRef} type="file" accept="image/*,application/pdf" hidden onChange={e => handleReceiptSelected(e.target.files)} />
                    {receiptAttachment ? (
                      <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}`}>
                        <span className={`text-[12px] truncate ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>📎 {receiptAttachment.fileName}</span>
                        <button onClick={() => setReceiptAttachment(null)} className={`text-[11px] font-semibold cursor-pointer flex-shrink-0 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>Remove</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => receiptInputRef.current?.click()}
                        disabled={uploadingReceipt}
                        className={`text-[12px] font-semibold px-3 py-2 rounded-lg border transition-all duration-150 cursor-pointer disabled:opacity-50 ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                      >
                        {uploadingReceipt ? 'Uploading…' : '📎 Attach payment receipt'}
                      </button>
                    )}
                    {receiptError && <p className="text-[11px] text-red-500 font-medium">{receiptError}</p>}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleMarkPaid}
                        disabled={markingPaid || uploadingReceipt}
                        className="text-[13px] font-bold text-white px-4 py-2 rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 shadow-sm"
                        style={{ backgroundColor: accentColor }}
                      >
                        {markingPaid ? 'Confirming…' : 'Confirm Payment'}
                      </button>
                      <button
                        onClick={() => { setConfirmingPayment(false); setError(''); }}
                        className={`text-[12px] font-semibold px-3 py-2 rounded-xl border transition-all duration-150 cursor-pointer ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <p className={`text-[12px] font-medium px-3 py-2 rounded-xl border ${isDark ? 'text-amber-300 bg-amber-900/20 border-amber-800/40' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                  Available once the creator marks the content as submitted.
                </p>
              )}
              {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
            </div>
          )

        ) : payout && !editing ? (
          <div className="flex flex-col gap-3">
            <p className={`text-[14px] font-semibold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
              {payout.method === 'bank'
                ? `${payout.accountHolderName} · ${maskAccount(payout.accountNumber)} · ${payout.ifscCode}`
                : `${payout.accountHolderName} · UPI: ${maskUpi(payout.upiId)}`}
            </p>
            {payout.paid ? (
              <div className="flex flex-col gap-2">
                <span className="self-start flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-full border text-emerald-700 bg-emerald-100 border-emerald-200">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Paid {formatDate(payout.paidAt!)}
                </span>
                <p className={`text-[12px] ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Txn ID: <span className="font-semibold">{payout.transactionRef}</span>
                </p>
                {payout.receiptUrl && (
                  <a
                    href={downloadUrlFor({ url: payout.receiptUrl, fileName: payout.receiptFileName, type: 'raw', fileSize: 0, mimeType: '' })}
                    download={payout.receiptFileName || true}
                    className={`self-start text-[12px] font-semibold underline underline-offset-2 cursor-pointer ${isDark ? 'text-teal-300' : 'text-[#27717E]'}`}
                  >
                    View receipt
                  </a>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`text-[12px] font-semibold px-3 py-1.5 rounded-full border ${isDark ? 'text-amber-300 bg-amber-900/30 border-amber-700/40' : 'text-amber-700 bg-amber-100 border-amber-200'}`}>
                  Awaiting payment
                </span>
                <button
                  onClick={startEdit}
                  className={`text-[12px] font-semibold px-3 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                >
                  Edit
                </button>
              </div>
            )}
          </div>

        ) : (
          <div className="flex flex-col gap-2">
            {!payout && (
              <p className={`text-[12px] mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Required before you can continue chatting with the brand.
              </p>
            )}
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
              className={inputClass}
            />

            {method === 'bank' ? (
              <>
                <input
                  type="text"
                  inputMode="numeric"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Account number"
                  className={inputClass}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={confirmAccountNumber}
                  onChange={e => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Confirm account number"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={ifscCode}
                  onChange={e => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="IFSC code"
                  className={`${inputClass} uppercase`}
                />
              </>
            ) : (
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="UPI ID (e.g. name@bank)"
                className={inputClass}
              />
            )}

            {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}

            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="text-[13px] font-bold text-white px-4 py-2 rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 shadow-sm"
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
        )}
      </div>
    </div>
  );
}
