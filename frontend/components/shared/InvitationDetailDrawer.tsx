'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import IdChip from '@/components/shared/IdChip';
import { NICHE_STYLES as NICHE_COLORS, NICHE_LABELS } from '@/lib/niches';

const NAVY = '#3D5087';

const STATUS_CONFIG: Record<string, { cls: string; dot: string; label: string }> = {
  pending:  { cls: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-400', label: 'Pending' },
  accepted: { cls: 'bg-green-50 text-green-700 border border-green-200', dot: 'bg-green-500', label: 'Accepted' },
  rejected: { cls: 'bg-red-50 text-red-600 border border-red-200',       dot: 'bg-red-400',   label: 'Declined' },
};

const STATUS_HINT: Record<string, { text: string; box: string; icon: string }> = {
  pending:  { text: 'Invitation sent — waiting for the creator to respond.', box: 'bg-amber-50 border-amber-100 text-amber-800', icon: 'text-amber-500' },
  accepted: { text: 'The creator accepted! A deal is open — head to Messages to coordinate.', box: 'bg-green-50 border-green-100 text-green-800', icon: 'text-green-500' },
  rejected: { text: 'The creator declined this invitation.', box: 'bg-red-50 border-red-100 text-red-700', icon: 'text-red-500' },
};

const LEVEL_BADGE: Record<string, string> = {
  starter:      'bg-gray-100 text-gray-600 border-gray-200',
  growing:      'bg-teal-50 text-teal-700 border-teal-200',
  professional: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  elite:        'bg-amber-50 text-amber-700 border-amber-200',
};

const AVATAR_GRADS = [
  'from-violet-500 to-purple-600',
  'from-teal-500 to-cyan-600',
  'from-amber-500 to-orange-500',
  'from-indigo-500 to-blue-600',
  'from-pink-500 to-rose-500',
  'from-emerald-500 to-green-600',
];

const inr = (n?: number) => '₹' + (Number.isFinite(n as number) ? (n as number) : 0).toLocaleString('en-IN');
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');
const fmtNum = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};

interface Props {
  invitation: any | null;
  onClose: () => void;
}

export default function InvitationDetailDrawer({ invitation, onClose }: Props) {
  const router = useRouter();
  const open = !!invitation;

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

  const inv = invitation;
  const campaign = inv?.campaignId || {};
  const creator = inv?.influencer || {};
  const name = creator.name || inv?.influencerName || 'Influencer';
  const slug = creator.slug || inv?.influencerSlug || '';
  const avatar = creator.profilePicUrl || inv?.influencerProfilePicUrl || '';
  const grad = AVATAR_GRADS[(name.charCodeAt(0) || 0) % AVATAR_GRADS.length];
  const cfg = inv ? (STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending) : null;
  const hint = inv ? STATUS_HINT[inv.status] : null;

  const platforms = creator.platforms || [];
  const totalFollowers = platforms.reduce((s: number, p: any) => s + (p.followers || 0), 0);
  const avgEng = platforms.length
    ? (platforms.reduce((s: number, p: any) => s + (p.engagementRate || 0), 0) / platforms.length).toFixed(1)
    : '0';

  const budgetLabel = campaign.budgetMin || campaign.budgetMax
    ? `${inr(campaign.budgetMin)} – ${inr(campaign.budgetMax)}`
    : 'Open';

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
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#3D5087] to-[#4a5fa0] text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="m22 6-10 7L2 6" />
              </svg>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/80">Invitation details</p>
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

        {inv && (
          <>
            <div className="flex-1 overflow-y-auto">
              {/* Influencer header */}
              <div className="px-5 pt-5 pb-5 bg-white border-b border-gray-100">
                <div className="flex items-start gap-3.5">
                  <div className={`w-14 h-14 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${grad} shadow-sm`}>
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-xl">{name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-[18px] font-bold text-gray-900 leading-tight">{name}</h2>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border capitalize ${LEVEL_BADGE[creator.level] || LEVEL_BADGE.starter}`}>
                        {creator.level || 'starter'}
                      </span>
                    </div>
                    {creator.city && (
                      <p className="text-[12.5px] text-gray-500 font-medium mt-1 inline-flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6B7FBB]">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        {creator.city}
                      </p>
                    )}
                    {creator.customId && <div className="mt-2"><IdChip id={creator.customId} size="xs" tone="subtle" /></div>}
                  </div>
                </div>

                {creator.niche?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {creator.niche.map((n: string) => (
                      <span key={n} className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${NICHE_COLORS[n] || 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                        {NICHE_LABELS[n] ?? n}
                      </span>
                    ))}
                  </div>
                )}

                {/* Influencer stat tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                  <StatTile label="Followers" value={totalFollowers > 0 ? fmtNum(totalFollowers) : '—'} />
                  <StatTile label="Engagement" value={avgEng !== '0' ? `${avgEng}%` : '—'} />
                  <StatTile label="Credibility" value={creator.credibilityScore ? String(creator.credibilityScore) : '—'} />
                </div>

                {creator.bio && (
                  <p className="text-[12.5px] text-gray-500 leading-relaxed mt-3.5">{creator.bio}</p>
                )}
              </div>

              <div className="px-5 py-5 space-y-5">
                {/* Status hint */}
                {hint && (
                  <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 ${hint.box}`}>
                    <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${hint.icon}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                    </svg>
                    <p className="text-[12.5px] leading-snug font-medium">{hint.text}</p>
                  </div>
                )}

                {/* Invitation meta */}
                <Section title="Invitation">
                  <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-x-4 gap-y-3.5 shadow-sm">
                    <Field label="Status" value={
                      cfg && (
                        <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-bold ${cfg.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                        </span>
                      )
                    } />
                    <Field label="Campaign" value={campaign.title || '—'} />
                    <Field label="Sent on" value={fmtDate(inv.createdAt)} />
                    <Field label="Responded" value={fmtDate(inv.respondedAt)} />
                  </div>
                </Section>

                {/* Campaign details */}
                <Section title="Campaign">
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    {campaign.niche?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3.5">
                        {campaign.niche.map((n: string) => (
                          <span key={n} className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${NICHE_COLORS[n] || 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                            {NICHE_LABELS[n] ?? n}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                      <Field label="Budget" value={budgetLabel} />
                      <Field label="Deadline" value={fmtDate(campaign.deadline)} />
                      <Field
                        label="Target platforms"
                        value={campaign.targetPlatforms?.length ? campaign.targetPlatforms.map(cap).join(', ') : 'Any'}
                      />
                      <Field
                        label="Target city"
                        value={campaign.targetCity?.length ? campaign.targetCity.join(', ') : 'All'}
                      />
                      <Field label="Deliverables" value={campaign.deliverables || '—'} full />
                      <Field label="Campaign brief" value={campaign.description || '—'} full />
                    </div>
                  </div>
                </Section>
              </div>
            </div>

            {/* Actions (sticky footer) */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white px-5 py-3.5">
              <div className="flex gap-2">
                {slug && (
                  <button
                    onClick={() => router.push(`/brand/creator/${slug}`)}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-bold bg-white text-[#3D5087] border border-[#C7D2EC] hover:bg-[#EEF1FB] transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    View profile
                  </button>
                )}
                {inv.status === 'accepted' && (
                  <button
                    onClick={() => router.push(inv.dealId ? `/brand/messages?deal=${inv.dealId}` : '/brand/messages')}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3D5087] to-[#4a5fa0] hover:from-[#2B3B68] hover:to-[#3D5087] transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Go to Messages
                  </button>
                )}
                {inv.status !== 'accepted' && !slug && (
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-bold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#EEF1FB] border border-[#D9E1F2] rounded-xl px-2.5 py-2.5 text-center">
      <p className="text-[14px] font-bold text-[#3D5087] leading-tight">{value}</p>
      <p className="text-[10px] text-[#6B7FBB] font-semibold uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: NAVY }}>
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
