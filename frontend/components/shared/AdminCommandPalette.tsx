'use client';

import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import UserDetailDrawer from '@/components/shared/UserDetailDrawer';
import CampaignDetailDrawer from '@/components/shared/CampaignDetailDrawer';
import { cdnImg } from '@/lib/img';

type Item = {
  id: string;
  group: string;
  label: string;
  sub?: string;
  icon: ReactNode;
  run: () => void;
};

type UserHit = { _id: string; name?: string; email?: string; role?: string; avatarUrl?: string };
type CampaignHit = { _id: string; title?: string; status?: string; brandId?: { name?: string } };

const ICON = {
  page: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  action: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  campaign: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  ),
};

export default function AdminCommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [searching, setSearching] = useState(false);
  const [userResults, setUserResults] = useState<UserHit[]>([]);
  const [campaignResults, setCampaignResults] = useState<CampaignHit[]>([]);
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);
  const [drawerCampaignId, setDrawerCampaignId] = useState<string | null>(null);

  // Reset on open, focus the input
  useEffect(() => {
    if (open) {
      setQuery('');
      setUserResults([]);
      setCampaignResults([]);
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Debounced live search across users + campaigns
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setUserResults([]);
      setCampaignResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const [usersRes, campaignsRes] = await Promise.all([
          api.get('/api/admin/users', { params: { search: q, limit: 5, page: 1 } }).catch(() => null),
          api.get('/api/admin/campaigns', { params: { search: q, limit: 5, page: 1 } }).catch(() => null),
        ]);
        setUserResults(usersRes?.data?.users ?? []);
        setCampaignResults(campaignsRes?.data?.campaigns ?? []);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, open]);

  const items: Item[] = useMemo(() => {
    const go = (href: string) => () => { onClose(); router.push(href); };
    const q = query.trim().toLowerCase();

    const pages: Item[] = [
      { id: 'p-overview', group: 'Go to', label: 'Overview', sub: '/admin/dashboard', icon: ICON.page, run: go('/admin/dashboard') },
      { id: 'p-users', group: 'Go to', label: 'Users', sub: '/admin/users', icon: ICON.page, run: go('/admin/users') },
      { id: 'p-campaigns', group: 'Go to', label: 'Campaigns', sub: '/admin/campaigns', icon: ICON.page, run: go('/admin/campaigns') },
      { id: 'p-gst', group: 'Go to', label: 'GST Verification', sub: '/admin/gst', icon: ICON.page, run: go('/admin/gst') },
      { id: 'p-subs', group: 'Go to', label: 'Subscriptions', sub: '/admin/subscriptions', icon: ICON.page, run: go('/admin/subscriptions') },
      { id: 'p-logs', group: 'Go to', label: 'Activity Log', sub: '/admin/logs', icon: ICON.page, run: go('/admin/logs') },
      { id: 'p-settings', group: 'Go to', label: 'Admin Settings', sub: '/admin/settings', icon: ICON.page, run: go('/admin/settings') },
    ];

    const actions: Item[] = [
      { id: 'a-premium', group: 'Quick actions', label: 'View premium users', sub: 'Filter users by premium plan', icon: ICON.action, run: go('/admin/users?plan=premium') },
      { id: 'a-suspended', group: 'Quick actions', label: 'Review pending GSTINs', sub: 'Jump to the verification queue', icon: ICON.action, run: go('/admin/gst') },
      { id: 'a-brands', group: 'Quick actions', label: 'View premium brands', sub: 'Premium brand accounts', icon: ICON.action, run: go('/admin/users?plan=premium&role=brand') },
      { id: 'a-audit', group: 'Quick actions', label: 'Open audit trail', sub: 'Recent admin activity', icon: ICON.action, run: go('/admin/logs') },
    ];

    const staticItems = [...pages, ...actions].filter(
      it => !q || it.label.toLowerCase().includes(q) || (it.sub ?? '').toLowerCase().includes(q)
    );

    const users: Item[] = userResults.map(u => ({
      id: `u-${u._id}`,
      group: 'Users',
      label: u.name ?? '—',
      sub: [u.email, u.role].filter(Boolean).join(' · '),
      icon: u.avatarUrl ? (
        <img loading="lazy" decoding="async" src={cdnImg(u.avatarUrl)} alt="" className="w-6 h-6 rounded-full object-cover" />
      ) : (
        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#3E4751] to-[#5A6472] text-white flex items-center justify-center font-bold text-[10px]">
          {u.name?.charAt(0).toUpperCase()}
        </span>
      ),
      run: () => { onClose(); setDrawerUserId(u._id); },
    }));

    const campaigns: Item[] = campaignResults.map(c => ({
      id: `c-${c._id}`,
      group: 'Campaigns',
      label: c.title ?? 'Untitled campaign',
      sub: [c.brandId?.name, c.status].filter(Boolean).join(' · '),
      icon: ICON.campaign,
      run: () => { onClose(); setDrawerCampaignId(c._id); },
    }));

    return [...users, ...campaigns, ...staticItems];
  }, [query, userResults, campaignResults, onClose, router]);

  // Clamp the active row when the list shrinks
  useEffect(() => {
    setActive(a => Math.min(a, Math.max(0, items.length - 1)));
  }, [items.length]);

  // Keep the active row visible while arrowing through
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); items[active]?.run(); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  // Group rows for rendering while keeping one flat index for keyboard nav
  let flatIdx = -1;
  const grouped = items.reduce<{ group: string; entries: { item: Item; idx: number }[] }[]>((acc, item) => {
    flatIdx += 1;
    const last = acc[acc.length - 1];
    if (last && last.group === item.group) last.entries.push({ item, idx: flatIdx });
    else acc.push({ group: item.group, entries: [{ item, idx: flatIdx }] });
    return acc;
  }, []);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[110]" role="dialog" aria-modal="true" aria-label="Command palette">
          <div className="absolute inset-0 bg-[#141A20]/40 backdrop-blur-[2px] anim-pop" onClick={onClose} />

          <div className="absolute left-1/2 -translate-x-1/2 top-[7vh] sm:top-[12vh] w-[94vw] max-w-[600px] anim-pop">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200/80 shadow-[0_24px_80px_rgba(16,24,40,0.28)] overflow-hidden">

              {/* Search input */}
              <div className="flex items-center gap-3 px-4 border-b border-gray-100">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Search users, campaigns, or jump to a page…"
                  className="flex-1 py-4 text-[15px] text-gray-900 placeholder:text-gray-400 bg-transparent focus:outline-none"
                />
                {searching ? (
                  <div className="w-4 h-4 border-2 border-[#7FA8AD] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <kbd className="hidden sm:inline-flex text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-200 rounded-md px-1.5 py-0.5 flex-shrink-0">ESC</kbd>
                )}
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[46vh] overflow-y-auto py-2">
                {items.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-400">
                    {searching ? 'Searching…' : 'No matches. Try a name, email, campaign or page.'}
                  </p>
                ) : (
                  grouped.map(g => (
                    <div key={g.group}>
                      <p className="px-4 pt-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{g.group}</p>
                      {g.entries.map(({ item, idx }) => (
                        <button
                          key={item.id}
                          data-idx={idx}
                          onClick={item.run}
                          onMouseMove={() => setActive(idx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                            idx === active ? 'bg-[#7FA8AD]/12' : ''
                          }`}
                        >
                          <span className={`flex items-center justify-center flex-shrink-0 ${idx === active ? 'text-[#3E4751]' : 'text-gray-400'}`}>
                            {item.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block text-sm font-semibold truncate ${idx === active ? 'text-[#26343C]' : 'text-gray-700'}`}>
                              {item.label}
                            </span>
                            {item.sub && <span className="block text-[11px] text-gray-400 truncate">{item.sub}</span>}
                          </span>
                          {idx === active && (
                            <kbd className="hidden sm:inline-flex text-[10px] font-bold text-gray-400 bg-white border border-gray-200 rounded-md px-1.5 py-0.5 flex-shrink-0">↵</kbd>
                          )}
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>

              {/* Footer hints */}
              <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 bg-gray-50/60">
                {[
                  { keys: '↑↓', label: 'navigate' },
                  { keys: '↵', label: 'open' },
                  { keys: 'esc', label: 'close' },
                ].map(h => (
                  <span key={h.label} className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
                    <kbd className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 rounded-md px-1.5 py-0.5">{h.keys}</kbd>
                    {h.label}
                  </span>
                ))}
                <span className="ml-auto text-[11px] text-gray-300 font-medium hidden sm:block">Influence Connect Admin</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result drawers — outlive the palette so details stay open after it closes */}
      <UserDetailDrawer userId={drawerUserId} onClose={() => setDrawerUserId(null)} onChanged={() => {}} />
      <CampaignDetailDrawer campaignId={drawerCampaignId} onClose={() => setDrawerCampaignId(null)} onChanged={() => {}} />
    </>
  );
}
