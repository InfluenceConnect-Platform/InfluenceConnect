'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import BrandNav from '@/components/shared/BrandNav';

const NICHES = ['beauty', 'fashion', 'food', 'fitness', 'lifestyle', 'travel', 'tech', 'books'];
const CITIES = ['all', 'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata'];

const CAMPAIGN_STATUS_STYLES: Record<string, string> = {
  active:        'bg-gradient-to-r from-emerald-500 to-green-600 text-white',
  draft:         'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200',
  'in-progress': 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
  completed:     'bg-gradient-to-r from-blue-500 to-indigo-600 text-white',
  closed:        'bg-gradient-to-r from-red-500 to-rose-600 text-white',
};

const InstagramLogo = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <defs>
      <radialGradient id="ig-camp" cx="30%" cy="110%" r="130%">
        <stop offset="0%" stopColor="#ffd676"/><stop offset="25%" stopColor="#f46f30"/>
        <stop offset="50%" stopColor="#e1306c"/><stop offset="75%" stopColor="#833ab4"/>
        <stop offset="100%" stopColor="#4a23a8"/>
      </radialGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#ig-camp)"/>
    <rect x="6.5" y="6.5" width="11" height="11" rx="3.5" fill="none" stroke="white" strokeWidth="1.6"/>
    <circle cx="12" cy="12" r="3" fill="none" stroke="white" strokeWidth="1.6"/>
    <circle cx="17.2" cy="6.8" r="1.1" fill="white"/>
  </svg>
);
const YouTubeLogo = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect width="24" height="24" rx="5" fill="#FF0000"/>
    <path d="M17.8 8.6c-.2-.7-.8-1.3-1.5-1.5C15 6.8 12 6.8 12 6.8s-3 0-4.3.3c-.7.2-1.3.8-1.5 1.5C6 9.9 6 12 6 12s0 2.1.2 3.4c.2.7.8 1.3 1.5 1.5C9 17.2 12 17.2 12 17.2s3 0 4.3-.3c.7-.2 1.3-.8 1.5-1.5.2-1.3.2-3.4.2-3.4s0-2.1-.2-3.4z" fill="white"/>
    <polygon points="10.5,9.5 10.5,14.5 14.5,12" fill="#FF0000"/>
  </svg>
);
const FacebookLogo = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <rect width="24" height="24" rx="5" fill="#1877F2"/>
    <path d="M16 4h-2.5C11.6 4 10 5.6 10 7.7V10H7.5v3H10v7h3v-7h2.5l.5-3H13V7.7c0-.4.3-.7.7-.7H16V4z" fill="white"/>
  </svg>
);

const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  active:        'Active',
  draft:         'Draft',
  'in-progress': 'In Progress',
  completed:     'Completed',
  closed:        'Closed',
  all:           'All',
};

const TABS = ['active', 'draft', 'in-progress', 'completed', 'all'] as const;

export default function BrandCampaigns() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user] = useState<any>(() => {
    if (typeof window === 'undefined') return null;
    try { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('active');
  const [toast, setToast] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    niche: [] as string[],
    deliverables: '',
    budgetMin: '',
    budgetMax: '',
    deadline: '',
    targetCity: ['all'],
    targetPlatform: 'any',
    minFollowers: '0',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !localStorage.getItem('user')) { router.push('/auth/login'); return; }
    fetchCampaigns();
  }, []);

  useEffect(() => {
    const campaignParam = searchParams.get('campaign');
    if (!campaignParam || campaigns.length === 0 || selectedCampaign) return;
    const match = campaigns.find((c) => c._id === campaignParam);
    if (match) handleSelectCampaign(match);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns, searchParams]);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/api/brand/campaigns');
      setCampaigns(response.data.campaigns);
    } catch (error) {
      console.error('Fetch campaigns error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (campaignId: string) => {
    try {
      const response = await api.get(`/api/brand/campaigns/${campaignId}/applications`);
      setApplications(response.data.applications);
    } catch (error) {
      console.error('Fetch applications error:', error);
    }
  };

  const handleSelectCampaign = (campaign: any) => {
    setSelectedCampaign(campaign);
    fetchApplications(campaign._id);
    setShowPanel(true);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const resetForm = () => setForm({
    title: '', description: '', niche: [],
    deliverables: '', budgetMin: '', budgetMax: '',
    deadline: '', targetCity: ['all'],
    targetPlatform: 'any', minFollowers: '0',
  });

  const handleCreateCampaign = async () => {
    if (!form.title || !form.description || !form.deliverables) {
      showToast('Please fill in campaign title, description, and deliverables.');
      return;
    }
    if (!form.deadline) {
      showToast('Please set a campaign deadline.');
      return;
    }
    const budgetMin = parseInt(form.budgetMin);
    const budgetMax = parseInt(form.budgetMax);
    if (!form.budgetMin || isNaN(budgetMin) || budgetMin <= 0) {
      showToast('Budget min must be a positive value.');
      return;
    }
    if (!form.budgetMax || isNaN(budgetMax) || budgetMax <= 0) {
      showToast('Budget max must be a positive value.');
      return;
    }
    if (budgetMin > budgetMax) {
      showToast('Budget min cannot be greater than budget max.');
      return;
    }
    setCreating(true);
    try {
      await api.post('/api/brand/campaigns', {
        ...form,
        budgetMin,
        budgetMax,
        minFollowers: parseInt(form.minFollowers) || 0,
      });
      showToast('Campaign created successfully!');
      setShowForm(false);
      resetForm();
      fetchCampaigns();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to create campaign.');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!form.title.trim()) { showToast('A title is required to save a draft.'); return; }
    setSavingDraft(true);
    try {
      await api.post('/api/brand/campaigns', {
        ...form,
        budgetMin: parseInt(form.budgetMin) || 0,
        budgetMax: parseInt(form.budgetMax) || 0,
        minFollowers: parseInt(form.minFollowers) || 0,
        status: 'draft',
      });
      showToast('Draft saved successfully!');
      setShowForm(false);
      resetForm();
      fetchCampaigns();
    } catch (error: any) {
      showToast(error.response?.data?.message || error.response?.data?.error || 'Failed to save draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublishDraft = async (campaign: any) => {
    setPublishingId(campaign._id);
    try {
      const res = await api.put(`/api/brand/campaigns/${campaign._id}`, {
        title: campaign.title,
        description: campaign.description,
        niche: campaign.niche,
        deliverables: campaign.deliverables,
        budgetMin: campaign.budgetMin,
        budgetMax: campaign.budgetMax,
        deadline: campaign.deadline,
        targetCity: campaign.targetCity,
        targetPlatform: campaign.targetPlatform,
        minFollowers: campaign.minFollowers,
        status: 'active',
      });
      setCampaigns(prev => prev.map(c => c._id === campaign._id ? res.data.campaign : c));
      if (selectedCampaign?._id === campaign._id) setSelectedCampaign(res.data.campaign);
      showToast('Campaign published successfully!');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || '';
      if (msg) showToast(msg);
      else showToast('Failed to publish. Make sure all required fields are filled in.');
    } finally {
      setPublishingId(null);
    }
  };

  const openEdit = (campaign: any) => {
    setEditingCampaign(campaign);
    setForm({
      title: campaign.title ?? '',
      description: campaign.description ?? '',
      niche: campaign.niche ?? [],
      deliverables: campaign.deliverables ?? '',
      budgetMin: campaign.budgetMin?.toString() ?? '',
      budgetMax: campaign.budgetMax?.toString() ?? '',
      deadline: campaign.deadline ? campaign.deadline.split('T')[0] : '',
      targetCity: campaign.targetCity ?? ['all'],
      targetPlatform: campaign.targetPlatform ?? 'any',
      minFollowers: campaign.minFollowers?.toString() ?? '0',
    });
  };

  const closeEdit = () => {
    setEditingCampaign(null);
    resetForm();
  };

  const handleEditCampaign = async () => {
    if (!form.title || !form.description || !form.deliverables) {
      showToast('Please fill in campaign title, description, and deliverables.');
      return;
    }
    if (!form.deadline) { showToast('Please set a campaign deadline.'); return; }
    const budgetMin = parseInt(form.budgetMin);
    const budgetMax = parseInt(form.budgetMax);
    if (!form.budgetMin || isNaN(budgetMin) || budgetMin <= 0) { showToast('Budget min must be a positive value.'); return; }
    if (!form.budgetMax || isNaN(budgetMax) || budgetMax <= 0) { showToast('Budget max must be a positive value.'); return; }
    if (budgetMin > budgetMax) { showToast('Budget min cannot be greater than budget max.'); return; }
    setSaving(true);
    try {
      const res = await api.put(`/api/brand/campaigns/${editingCampaign._id}`, {
        ...form, budgetMin, budgetMax, minFollowers: parseInt(form.minFollowers) || 0,
      });
      showToast('Campaign updated successfully!');
      setCampaigns(prev => prev.map(c => c._id === editingCampaign._id ? res.data.campaign : c));
      if (selectedCampaign?._id === editingCampaign._id) setSelectedCampaign(res.data.campaign);
      closeEdit();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to update campaign.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string, campaignTitle: string) => {
    if (!window.confirm(`Delete "${campaignTitle}"? This will also remove all applications. This cannot be undone.`)) return;
    setDeletingId(campaignId);
    try {
      await api.delete(`/api/brand/campaigns/${campaignId}`);
      setCampaigns(prev => prev.filter(c => c._id !== campaignId));
      if (selectedCampaign?._id === campaignId) { setSelectedCampaign(null); setShowPanel(false); }
      showToast('Campaign deleted.');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to delete campaign.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateStatus = async (applicationId: string, status: string) => {
    try {
      await api.put(`/api/brand/applications/${applicationId}/status`, { status });
      showToast(`Application ${status}.`);
      if (selectedCampaign) fetchApplications(selectedCampaign._id);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to update status.');
    }
  };

  const filteredCampaigns = campaigns.filter(c =>
    activeTab === 'all' ? true : c.status === activeTab
  );

  const fieldClass = 'w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#3D5087]/30 focus:border-[#3D5087] hover:border-gray-300 transition-all placeholder:text-gray-400';
  const labelClass = 'text-xs font-semibold text-gray-600 block mb-1.5';

  return (
    <div className="min-h-screen bg-[#F4F6FB]">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-4 sm:right-6 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl z-50 max-w-[calc(100vw-32px)] sm:max-w-sm animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}

      <BrandNav user={user} />

      {/* Create Campaign Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-900">Create new campaign</h3>
                <p className="text-xs text-gray-400 mt-0.5">Fill in the brief to attract the right creators</p>
              </div>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Campaign title <span className="text-red-400">*</span></label>
                  <input
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Summer Skincare Launch 2025"
                    className={fieldClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Description <span className="text-red-400">*</span></label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="What is the campaign about? What kind of creators are you looking for?"
                    rows={3}
                    className={`${fieldClass} resize-none`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Deliverables <span className="text-red-400">*</span></label>
                  <input
                    value={form.deliverables}
                    onChange={e => setForm(p => ({ ...p, deliverables: e.target.value }))}
                    placeholder="e.g. 2 reels + 3 stories"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Deadline <span className="text-red-400">*</span></label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Budget min (₹) <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    min={1}
                    value={form.budgetMin}
                    onChange={e => setForm(p => ({ ...p, budgetMin: e.target.value }))}
                    placeholder="e.g. 5000"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Budget max (₹) <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    min={1}
                    value={form.budgetMax}
                    onChange={e => setForm(p => ({ ...p, budgetMax: e.target.value }))}
                    placeholder="e.g. 15000"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Target city</label>
                  <select
                    value={form.targetCity[0]}
                    onChange={e => setForm(p => ({ ...p, targetCity: [e.target.value] }))}
                    className={fieldClass}
                  >
                    {CITIES.map(c => (
                      <option key={c} value={c}>{c === 'all' ? 'All India' : c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Platform</label>
                  <select
                    value={form.targetPlatform}
                    onChange={e => setForm(p => ({ ...p, targetPlatform: e.target.value }))}
                    className={fieldClass}
                  >
                    {['any', 'instagram', 'youtube', 'facebook'].map(p => (
                      <option key={p} value={p} className="capitalize">
                        {p === 'any' ? 'Any platform' : p.charAt(0).toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Niche</label>
                  <div className="flex flex-wrap gap-2">
                    {NICHES.map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setForm(p => ({
                          ...p,
                          niche: p.niche.includes(n) ? p.niche.filter(x => x !== n) : [...p.niche, n],
                        }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all cursor-pointer ${
                          form.niche.includes(n)
                            ? 'bg-gradient-to-r from-[#3D5087] to-[#4a5fa0] border-transparent text-white shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-[#3D5087]/50 hover:bg-blue-50/50'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex flex-wrap gap-3 flex-shrink-0">
              <button
                onClick={handleCreateCampaign}
                disabled={creating || savingDraft}
                className="flex-1 sm:flex-none bg-[#3D5087] hover:bg-[#2B3B68] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating…
                  </>
                ) : 'Publish campaign'}
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={creating || savingDraft}
                className="flex-1 sm:flex-none px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {savingDraft ? (
                  <>
                    <span className="w-4 h-4 border-2 border-gray-400/40 border-t-gray-500 rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Save as Draft
                  </>
                )}
              </button>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                disabled={creating || savingDraft}
                className="sm:ml-auto px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {editingCampaign && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-900">Edit campaign</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{editingCampaign.title}</p>
              </div>
              <button onClick={closeEdit} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all cursor-pointer">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Campaign title <span className="text-red-400">*</span></label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Summer Skincare Launch 2025" className={fieldClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Description <span className="text-red-400">*</span></label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className={`${fieldClass} resize-none`} />
                </div>
                <div>
                  <label className={labelClass}>Deliverables <span className="text-red-400">*</span></label>
                  <input value={form.deliverables} onChange={e => setForm(p => ({ ...p, deliverables: e.target.value }))} placeholder="e.g. 2 reels + 3 stories" className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Deadline <span className="text-red-400">*</span></label>
                  <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Budget min (₹) <span className="text-red-400">*</span></label>
                  <input type="number" min={1} value={form.budgetMin} onChange={e => setForm(p => ({ ...p, budgetMin: e.target.value }))} className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Budget max (₹) <span className="text-red-400">*</span></label>
                  <input type="number" min={1} value={form.budgetMax} onChange={e => setForm(p => ({ ...p, budgetMax: e.target.value }))} className={fieldClass} />
                </div>
                <div>
                  <label className={labelClass}>Target city</label>
                  <select value={form.targetCity[0]} onChange={e => setForm(p => ({ ...p, targetCity: [e.target.value] }))} className={fieldClass}>
                    {CITIES.map(c => <option key={c} value={c}>{c === 'all' ? 'All India' : c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Platform</label>
                  <select value={form.targetPlatform} onChange={e => setForm(p => ({ ...p, targetPlatform: e.target.value }))} className={fieldClass}>
                    {['any', 'instagram', 'youtube', 'facebook'].map(p => (
                      <option key={p} value={p}>{p === 'any' ? 'Any platform' : p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Niche</label>
                  <div className="flex flex-wrap gap-2">
                    {NICHES.map(n => (
                      <button key={n} type="button"
                        onClick={() => setForm(p => ({ ...p, niche: p.niche.includes(n) ? p.niche.filter(x => x !== n) : [...p.niche, n] }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all cursor-pointer ${
                          form.niche.includes(n) ? 'bg-gradient-to-r from-[#3D5087] to-[#4a5fa0] border-transparent text-white shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:border-[#3D5087]/50 hover:bg-blue-50/50'
                        }`}
                      >{n}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button onClick={handleEditCampaign} disabled={saving}
                className="flex-1 sm:flex-none bg-[#3D5087] hover:bg-[#2B3B68] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2">
                {saving ? (<><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>) : 'Save changes'}
              </button>
              <button onClick={closeEdit} className="flex-1 sm:flex-none px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile applications panel overlay */}
      {showPanel && selectedCampaign && (
        <div className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-end">
          <div className="bg-white w-full rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 truncate pr-4">{selectedCampaign.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{applications.length} applications</p>
              </div>
              <button
                onClick={() => setShowPanel(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <ApplicationsList applications={applications} onUpdateStatus={handleUpdateStatus} />
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {/* Hero banner */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1e2f5c] via-[#3D5087] to-[#4a5fa0] rounded-2xl px-6 sm:px-10 py-7 sm:py-9 mb-5 shadow-lg">
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" preserveAspectRatio="none">
            <defs>
              <pattern id="bc-dots" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="white"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bc-dots)"/>
          </svg>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-blue-300/80 text-xs font-semibold uppercase tracking-widest mb-2">Your campaigns</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">Campaigns</h1>
              <p className="text-blue-200/70 text-sm mt-1">
                {campaigns.length} total · {campaigns.filter(c => c.status === 'active').length} active
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="self-start sm:self-auto flex items-center gap-2 bg-white/[0.15] hover:bg-white/[0.25] backdrop-blur-sm border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span className="hidden sm:inline">New campaign</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-5 overflow-x-auto max-w-full">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-[#3D5087] to-[#4a5fa0] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {CAMPAIGN_STATUS_LABELS[tab] ?? tab}
              {tab !== 'all' && (
                <span className={`ml-1.5 text-[11px] font-bold ${activeTab === tab ? 'text-blue-200' : 'text-gray-400'}`}>
                  {campaigns.filter(c => c.status === tab).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">

          {/* Campaign list */}
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white border border-gray-200/80 rounded-2xl p-5 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                    <div className="grid grid-cols-3 gap-2">
                      {[1,2,3].map(j => <div key={j} className="h-10 bg-gray-100 rounded-lg" />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700/60 rounded-2xl p-12 sm:p-16 text-center bg-white/50 dark:bg-white/[0.03]">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-[#0f1e31] border border-gray-100 dark:border-gray-700/50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-300 dark:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">No campaigns yet</p>
                <p className="text-xs text-gray-400 mb-5 max-w-xs mx-auto">
                  Create your first campaign to start finding the right creators for your brand.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-sm text-[#3D5087] dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                >
                  Create first campaign →
                </button>
              </div>
            ) : (
              filteredCampaigns.map(campaign => (
                <button
                  key={campaign._id}
                  onClick={() => handleSelectCampaign(campaign)}
                  className={`w-full text-left bg-white border rounded-2xl overflow-hidden transition-all shadow-sm cursor-pointer ${
                    selectedCampaign?._id === campaign._id
                      ? 'border-[#3D5087] shadow-md ring-2 ring-[#3D5087]/15'
                      : 'border-gray-200/80 hover:border-[#3D5087]/50 hover:shadow-md'
                  }`}
                >
                  {/* Top accent strip by status */}
                  <div className={`h-1 w-full ${
                    campaign.status === 'active' ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                    campaign.status === 'draft' ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                    campaign.status === 'in-progress' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                    campaign.status === 'closed' ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                    'bg-gradient-to-r from-blue-400 to-indigo-500'
                  }`} />
                  <div className="p-5">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-0.5 truncate">{campaign.title}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${CAMPAIGN_STATUS_STYLES[campaign.status] || 'bg-gray-100 text-gray-600'}`}>
                        {CAMPAIGN_STATUS_LABELS[campaign.status] ?? campaign.status}
                      </span>
                      {/* Edit button — locked when a deal is active */}
                      {campaign.hasActiveDeal ? (
                        <span title="Cannot edit — a deal is in progress" className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 cursor-not-allowed">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        </span>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); openEdit(campaign); }}
                          title="Edit campaign"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#3D5087] hover:bg-blue-50 transition-all duration-150 cursor-pointer"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      )}
                      {(campaign.status === 'draft' || campaign.status === 'active') && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteCampaign(campaign._id, campaign.title); }}
                          disabled={deletingId === campaign._id}
                          title="Delete campaign"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 cursor-pointer disabled:opacity-50"
                        >
                          {deletingId === campaign._id ? (
                            <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Info cards row */}
                  <div className="grid grid-cols-2 gap-2 mb-2.5">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200/80">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-violet-400 mb-1.5">Niche</p>
                      {campaign.niche?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {campaign.niche.map((n: string) => (
                            <span key={n} className="px-1.5 py-0.5 rounded-md bg-violet-100 text-[10px] font-bold text-violet-700 capitalize">{n}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-violet-300">No niche</p>
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200/80">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-teal-400 mb-1.5">Deliverables</p>
                      <p className="text-xs font-bold text-teal-900 leading-snug line-clamp-2">{campaign.deliverables || '—'}</p>
                    </div>
                  </div>

                  {/* Stat cards row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 text-center">
                      <p className="text-base font-black text-blue-900 leading-none mb-1">{campaign.applicantCount ?? 0}</p>
                      <p className="text-[10px] font-semibold text-blue-500">Applicants</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/80 text-center">
                      <p className="text-[11px] font-black text-emerald-900 leading-none mb-1 truncate">
                        {(campaign.budgetMin > 0 || campaign.budgetMax > 0)
                          ? `₹${(campaign.budgetMin||0).toLocaleString('en-IN')}–${(campaign.budgetMax||0).toLocaleString('en-IN')}`
                          : 'Open'}
                      </p>
                      <p className="text-[10px] font-semibold text-emerald-600">Budget</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 text-center">
                      <p className="text-[11px] font-black text-amber-900 leading-none mb-1">
                        {campaign.deadline
                          ? new Date(campaign.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : '—'}
                      </p>
                      <p className="text-[10px] font-semibold text-amber-600">Deadline</p>
                    </div>
                  </div>

                  {/* Footer row — platform + city + mobile hint */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5">
                      {campaign.targetPlatform && campaign.targetPlatform !== 'any' && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md capitalize">
                          {campaign.targetPlatform === 'instagram' && <InstagramLogo size={11} />}
                          {campaign.targetPlatform === 'youtube'   && <YouTubeLogo size={11} />}
                          {campaign.targetPlatform === 'facebook'  && <FacebookLogo size={11} />}
                          {campaign.targetPlatform}
                        </span>
                      )}
                      {campaign.targetCity?.[0] && campaign.targetCity[0] !== 'all' && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {campaign.targetCity[0]}
                        </span>
                      )}
                    </div>
                    {campaign.status !== 'draft' && (
                      <p className="text-[10px] text-[#3D5087] font-semibold lg:hidden flex items-center gap-0.5">
                        View applicants
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      </p>
                    )}
                  </div>

                  {/* Publish strip — drafts only */}
                  {campaign.status === 'draft' && (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex items-center justify-between gap-2">
                      <p className="text-[10px] text-gray-400 font-medium">Not visible to creators yet</p>
                      <button
                        onClick={e => { e.stopPropagation(); handlePublishDraft(campaign); }}
                        disabled={publishingId === campaign._id}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-60 shadow-sm"
                      >
                        {publishingId === campaign._id ? (
                          <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                        {publishingId === campaign._id ? 'Publishing…' : 'Publish'}
                      </button>
                    </div>
                  )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Applications panel — desktop only */}
          <div className="hidden lg:block bg-white dark:bg-[#0f1e31] border border-gray-200/80 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-hidden h-fit sticky top-[72px]">
            {selectedCampaign ? (
              <>
                {/* Panel header */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700/60 bg-gradient-to-r from-[#F4F6FB] to-white dark:from-slate-800/60 dark:to-[#0f1e31]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-slate-100 truncate text-[15px]">{selectedCampaign.title}</h3>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${CAMPAIGN_STATUS_STYLES[selectedCampaign.status] || 'bg-gray-100 text-gray-600'}`}>
                      {CAMPAIGN_STATUS_LABELS[selectedCampaign.status] ?? selectedCampaign.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      <strong className="text-gray-900 dark:text-slate-200">{applications.length}</strong> applicant{applications.length !== 1 ? 's' : ''}
                    </span>
                    {selectedCampaign.budgetMin > 0 && (
                      <span className="flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        ₹{selectedCampaign.budgetMin.toLocaleString('en-IN')}–{selectedCampaign.budgetMax.toLocaleString('en-IN')}
                      </span>
                    )}
                    {selectedCampaign.deadline && (
                      <span className="flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {new Date(selectedCampaign.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
                <ApplicationsList applications={applications} onUpdateStatus={handleUpdateStatus} />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-[#F4F6FB] dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-gray-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-600 dark:text-slate-400 mb-1">Select a campaign</p>
                <p className="text-xs text-gray-400 dark:text-slate-600">Click any campaign to see its applications here</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ApplicationsList({
  applications,
  onUpdateStatus,
}: {
  applications: any[];
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const STATUS_STYLES: Record<string, string> = {
    applied:     'bg-blue-50 text-blue-700 border border-blue-100',
    shortlisted: 'bg-amber-50 text-amber-700 border border-amber-100',
    accepted:    'bg-green-50 text-green-700 border border-green-100',
    rejected:    'bg-red-50 text-red-600 border border-red-100',
    'on-hold':   'bg-gray-50 text-gray-500 border border-gray-100',
  };

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <p className="text-sm text-gray-500 font-medium mb-1">No applications yet</p>
        <p className="text-xs text-gray-400">Creators will apply once they discover this campaign.</p>
      </div>
    );
  }

  const AVATAR_GRADS = ['bg-gradient-to-br from-violet-500 to-purple-600','bg-gradient-to-br from-teal-500 to-cyan-600','bg-gradient-to-br from-amber-500 to-orange-500','bg-gradient-to-br from-indigo-500 to-blue-600','bg-gradient-to-br from-pink-500 to-rose-500','bg-gradient-to-br from-emerald-500 to-green-600'];

  return (
    <div className="divide-y divide-gray-100 max-h-[60vh] lg:max-h-[520px] overflow-y-auto">
      {applications.map((app, i) => {
        const primaryPlatform = app.influencerProfile?.platforms?.[0];
        const totalFollowers = (app.influencerProfile?.platforms || []).reduce((s: number, p: any) => s + (p.followers || 0), 0);
        const engRate = primaryPlatform?.engagementRate;
        return (
        <div key={i} className="p-4 hover:bg-gray-50/60 transition-colors duration-100">
          {/* Header row */}
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-sm flex items-center justify-center ${
              !app.influencerProfile?.profilePicUrl ? AVATAR_GRADS[(app.influencerId?.name?.charCodeAt(0) || 0) % 6] : ''
            }`}>
              {app.influencerProfile?.profilePicUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={app.influencerProfile.profilePicUrl} alt={app.influencerId?.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">{app.influencerId?.name?.charAt(0).toUpperCase() ?? '?'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <p className="text-[13px] font-bold text-gray-900">{app.influencerId?.name}</p>
                {app.influencerProfile?.slug && (
                  <a href={`/brand/creator/${app.influencerProfile.slug}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#3D5087] hover:text-[#5D8A8F] transition-colors"
                    title="View full profile">
                    View profile
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
                {totalFollowers > 0 && (
                  <span className="flex items-center gap-0.5 font-semibold text-gray-700">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    {totalFollowers >= 1000 ? `${(totalFollowers/1000).toFixed(1)}k` : totalFollowers}
                  </span>
                )}
                {engRate > 0 && (
                  <span className="flex items-center gap-0.5 text-emerald-600 font-semibold">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    {engRate}% eng.
                  </span>
                )}
                {app.influencerProfile?.city && <span>· {app.influencerProfile.city}</span>}
                {app.influencerProfile?.credibilityScore > 0 && (
                  <span className="flex items-center gap-0.5 text-amber-600 font-semibold" title="Credibility score (0–100)">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    {app.influencerProfile.credibilityScore}
                    <span className="text-amber-400 font-normal">cred.</span>
                  </span>
                )}
              </div>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize flex-shrink-0 ${STATUS_STYLES[app.status]}`}>
              {app.status === 'on-hold' ? 'On hold' : app.status}
            </span>
          </div>

          {/* Niche tags */}
          {app.influencerProfile?.niche?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {app.influencerProfile.niche.map((n: string) => (
                <span key={n} className="px-1.5 py-0.5 rounded-full bg-violet-50 border border-violet-100 text-[10px] font-semibold text-violet-600 capitalize">{n}</span>
              ))}
            </div>
          )}

          {/* Application message */}
          {app.message && (
            <p className="text-[11px] text-gray-500 italic bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-3 line-clamp-2">
              &ldquo;{app.message}&rdquo;
            </p>
          )}

          {/* Proposed rate */}
          {app.proposedRate > 0 && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 mb-3 w-fit">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Proposed ₹{app.proposedRate.toLocaleString('en-IN')}
            </div>
          )}

          {app.status === 'applied' && (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onUpdateStatus(app._id, 'shortlisted')}
                className="py-2 text-xs font-semibold bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg hover:from-amber-100 hover:to-orange-100 transition-all cursor-pointer text-amber-700"
              >
                Shortlist
              </button>
              <button
                onClick={() => onUpdateStatus(app._id, 'accepted')}
                className="py-2 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all cursor-pointer"
              >
                Accept
              </button>
              <button
                onClick={() => onUpdateStatus(app._id, 'rejected')}
                className="py-2 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all cursor-pointer"
              >
                Reject
              </button>
            </div>
          )}

          {app.status === 'shortlisted' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateStatus(app._id, 'accepted')}
                className="py-2 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all cursor-pointer"
              >
                Accept & create deal
              </button>
              <button
                onClick={() => onUpdateStatus(app._id, 'rejected')}
                className="py-2 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all cursor-pointer"
              >
                Reject
              </button>
            </div>
          )}

          {app.status === 'accepted' && (
            <div className="flex items-center gap-2">
              {app.dealStatus === 'cancelled' ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Deal cancelled
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg cursor-not-allowed select-none">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Chat now →
                  </span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Deal active
                  </div>
                  <a
                    href={`/brand/messages${app.influencerId?._id ? `?influencerId=${app.influencerId._id}` : ''}`}
                    className="flex items-center gap-1 text-xs font-semibold text-white bg-gradient-to-r from-[#3D5087] to-[#5D8A8F] px-2.5 py-1 rounded-lg hover:shadow-md transition-all duration-150 cursor-pointer"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Chat now →
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      );
      })}
    </div>
  );
}
