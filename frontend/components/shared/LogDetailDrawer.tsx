'use client';

import { useEffect, ReactNode } from 'react';
import IdChip from '@/components/shared/IdChip';

const SLATE = '#3E4751';

const ACTION_META: Record<string, { label: string; cls: string }> = {
  USER_SUSPENDED:   { label: 'User suspended',   cls: 'bg-red-50 text-red-700 border-red-100' },
  USER_RESTORED:    { label: 'User restored',    cls: 'bg-green-50 text-green-700 border-green-100' },
  USER_VIEWED:      { label: 'User viewed',      cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  GSTIN_APPROVED:   { label: 'GSTIN approved',   cls: 'bg-green-50 text-green-700 border-green-100' },
  GSTIN_REJECTED:   { label: 'GSTIN rejected',   cls: 'bg-red-50 text-red-700 border-red-100' },
  GSTIN_REOPENED:   { label: 'GSTIN reopened',   cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  CAMPAIGN_REMOVED: { label: 'Campaign removed', cls: 'bg-orange-50 text-orange-600 border-orange-100' },
  CAMPAIGN_FLAGGED: { label: 'Campaign flagged', cls: 'bg-orange-50 text-orange-600 border-orange-100' },
  CAMPAIGN_VIEWED:  { label: 'Campaign viewed',  cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  PAYOUT_VIEWED:    { label: 'Payout viewed',    cls: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  ADMIN_LOGIN:      { label: 'Admin login',      cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  SYSTEM_NOTE:      { label: 'System note',      cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};
const actionMeta = (a: string) => ACTION_META[a] || { label: a, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');

function fmtTimestamp(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${date}, ${h}:${m}:${s} ${ampm}`;
}

interface Log {
  _id: string;
  adminId?: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  details: string;
  metadata: Record<string, any>;
  ipAddress: string;
  createdAt: string;
}

interface Props {
  log: Log | null;
  onClose: () => void;
}

export default function LogDetailDrawer({ log, onClose }: Props) {
  const open = !!log;

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

  const meta = log ? actionMeta(log.action) : null;
  const metadataEntries = Object.entries(log?.metadata || {});

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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" />
              </svg>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/80">Log details</p>
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

        {log && meta && (
          <>
            <div className="flex-1 overflow-y-auto">
              {/* Summary header */}
              <div className="px-5 pt-5 pb-5 bg-white border-b border-gray-100">
                <span className={`inline-flex items-center text-[11px] px-2.5 py-1 rounded-full font-bold border ${meta.cls}`}>
                  {meta.label}
                </span>
                <p className="text-[15px] font-semibold text-gray-900 leading-snug mt-3">
                  {log.details || 'No description recorded for this action.'}
                </p>
                <p className="text-[12px] text-gray-400 font-medium mt-2 tabular-nums">
                  {fmtTimestamp(log.createdAt)} · IST
                </p>
              </div>

              <div className="px-5 py-5 space-y-5">
                {/* Who / what */}
                <Section title="Action">
                  <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-x-4 gap-y-3.5 shadow-sm">
                    <Field label="Performed by" value={log.adminName || '—'} />
                    <Field label="Admin ID" value={log.adminId ? <span className="font-mono text-[12px]">{log.adminId}</span> : '—'} />
                    <Field label="Target type" value={cap(log.targetType)} />
                    <Field label="Target name" value={log.targetName || '—'} />
                    <Field
                      label="Target ID"
                      value={log.targetId ? <IdChip id={log.targetId} size="xs" tone="subtle" /> : '—'}
                      full
                    />
                    <Field label="Log ID" value={<span className="font-mono text-[12px] break-all">{log._id}</span>} full />
                  </div>
                </Section>

                {/* Full details text */}
                <Section title="Details">
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                      {log.details || 'No further details were recorded for this action.'}
                    </p>
                  </div>
                </Section>

                {/* Metadata */}
                <Section title="Metadata">
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    {metadataEntries.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        {metadataEntries.map(([k, v]) => (
                          <div key={k} className="flex items-baseline justify-between gap-3 border-b border-gray-50 pb-1.5">
                            <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{k}</span>
                            <span className="text-[12px] font-semibold text-gray-800 text-right break-words">
                              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12.5px] text-gray-400">No additional metadata was recorded for this action.</p>
                    )}
                  </div>
                </Section>

                {/* Request info */}
                <Section title="Request">
                  <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-x-4 gap-y-3.5 shadow-sm">
                    <Field label="IP address" value={log.ipAddress ? <span className="font-mono text-[12px]">{log.ipAddress}</span> : '—'} full />
                  </div>
                </Section>
              </div>
            </div>

            {/* Footer */}
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
