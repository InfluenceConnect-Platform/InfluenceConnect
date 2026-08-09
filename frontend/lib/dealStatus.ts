// Single source of truth for deal/collaboration status → label + color,
// shared between influencer and brand messaging so badges match on both sides.
// Real values live on Deal.status (backend/models/Deal.js): in-progress, content-submitted, completed, cancelled.

export type DealStatus = 'in-progress' | 'content-submitted' | 'completed' | 'cancelled' | string;

interface DealStatusMeta {
  label: string;
  badge: string;   // pill background + text classes
  dot: string;      // solid dot/bg class for compact indicators
}

export const DEAL_STATUS_META: Record<string, DealStatusMeta> = {
  'in-progress':       { label: 'Active',   badge: 'bg-blue-500 text-white',    dot: 'bg-blue-500' },
  'content-submitted': { label: 'Review',   badge: 'bg-sky-500 text-white', dot: 'bg-sky-500' },
  'completed':          { label: 'Completed', badge: 'bg-emerald-500 text-white', dot: 'bg-emerald-500' },
  'cancelled':          { label: 'Cancelled', badge: 'bg-red-500 text-white',  dot: 'bg-red-500' },
};

const DEFAULT_META: DealStatusMeta = { label: 'Pending', badge: 'bg-amber-500 text-white', dot: 'bg-amber-500' };

export function dealStatusMeta(status?: DealStatus): DealStatusMeta {
  return (status && DEAL_STATUS_META[status]) || DEFAULT_META;
}
