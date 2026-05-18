'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import BrandNav from '@/components/shared/BrandNav';

const NICHES = ['beauty', 'fashion', 'food', 'fitness', 'lifestyle', 'travel', 'tech', 'books'];
const CITIES = ['all', 'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata'];

const CAMPAIGN_STATUS_STYLES: Record<string, string> = {
  active:    'bg-gradient-to-r from-emerald-500 to-green-600 text-white',
  draft:     'bg-gray-200 text-gray-700',
  closed:    'bg-gradient-to-r from-red-500 to-rose-600 text-white',
  completed: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white',
};

const TABS = ['active', 'draft', 'closed', 'completed', 'all'] as const;

export default function BrandCampaigns() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('active');
  const [toast, setToast] = useState('');
  const [showPanel, setShowPanel] = useState(false);

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
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    setUser(JSON.parse(stored));
    fetchCampaigns();
  }, []);

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
    setCreating(true);
    try {
      await api.post('/api/brand/campaigns', {
        ...form,
        budgetMin: parseInt(form.budgetMin) || 0,
        budgetMax: parseInt(form.budgetMax) || 0,
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
                  <label className={labelClass}>Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Budget min (₹)</label>
                  <input
                    type="number"
                    value={form.budgetMin}
                    onChange={e => setForm(p => ({ ...p, budgetMin: e.target.value }))}
                    placeholder="e.g. 5000"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Budget max (₹)</label>
                  <input
                    type="number"
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

            <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button
                onClick={handleCreateCampaign}
                disabled={creating}
                className="flex-1 sm:flex-none bg-[#3D5087] hover:bg-[#2B3B68] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating…
                  </>
                ) : 'Create campaign'}
              </button>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="flex-1 sm:flex-none px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
              >
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
        <section className="relative overflow-hidden bg-gradient-to-br from-[#2B3B68] via-[#3D5087] to-[#4a5fa0] rounded-2xl px-5 sm:px-8 py-5 sm:py-6 mb-5 shadow-lg">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-blue-200/90 text-xs font-semibold uppercase tracking-wider mb-1">Your campaigns</p>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Campaigns</h1>
              <p className="text-blue-200/70 text-sm mt-1">
                {campaigns.length} total · {campaigns.filter(c => c.status === 'active').length} active
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="self-start sm:self-auto flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
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
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-[#3D5087] to-[#4a5fa0] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
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
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 sm:p-16 text-center bg-white/50">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">No campaigns yet</p>
                <p className="text-xs text-gray-400 mb-5 max-w-xs mx-auto">
                  Create your first campaign to start finding the right creators for your brand.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-sm text-[#3D5087] font-semibold hover:underline cursor-pointer"
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
                    campaign.status === 'closed' ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                    'bg-gradient-to-r from-blue-400 to-indigo-500'
                  }`} />
                  <div className="p-5">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-0.5 truncate">{campaign.title}</h3>
                      <p className="text-xs text-gray-400 capitalize truncate">
                        {campaign.niche?.join(', ') || 'No niche'} · {campaign.deliverables}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${CAMPAIGN_STATUS_STYLES[campaign.status] || 'bg-gray-100 text-gray-600'}`}>
                      {campaign.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: campaign.applicantCount ?? 0, label: 'Applicants', cardClass: 'bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200', valueClass: 'text-blue-900', labelClass: 'text-blue-500/70' },
                      {
                        value: (campaign.budgetMin > 0 || campaign.budgetMax > 0)
                          ? `₹${(campaign.budgetMin || 0).toLocaleString('en-IN')}–${(campaign.budgetMax || 0).toLocaleString('en-IN')}`
                          : 'Open',
                        label: 'Budget',
                        cardClass: 'bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200',
                        valueClass: 'text-emerald-900',
                        labelClass: 'text-emerald-600/70',
                      },
                      {
                        value: campaign.deadline
                          ? new Date(campaign.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : '—',
                        label: 'Deadline',
                        cardClass: 'bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200',
                        valueClass: 'text-amber-900',
                        labelClass: 'text-amber-600/70',
                      },
                    ].map((item, i) => (
                      <div key={i} className={`p-2.5 rounded-xl text-center ${item.cardClass}`}>
                        <p className={`text-sm font-bold truncate ${item.valueClass}`}>{item.value}</p>
                        <p className={`text-[11px] mt-0.5 ${item.labelClass}`}>{item.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Mobile hint */}
                  <p className="text-[11px] text-[#3D5087] font-medium mt-3 lg:hidden">
                    Tap to view applications →
                  </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Applications panel — desktop only */}
          <div className="hidden lg:block bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden h-fit sticky top-[72px]">
            {selectedCampaign ? (
              <>
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 truncate">{selectedCampaign.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{applications.length} applications</p>
                </div>
                <ApplicationsList applications={applications} onUpdateStatus={handleUpdateStatus} />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-[#F4F6FB] border border-gray-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Select a campaign</p>
                <p className="text-xs text-gray-400">Click any campaign to see its applications here</p>
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

  return (
    <div className="divide-y divide-gray-50 max-h-[60vh] lg:max-h-[520px] overflow-y-auto">
      {applications.map((app, i) => (
        <div key={i} className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm ${
              ['bg-gradient-to-br from-violet-500 to-purple-600','bg-gradient-to-br from-teal-500 to-cyan-600','bg-gradient-to-br from-amber-500 to-orange-500','bg-gradient-to-br from-indigo-500 to-blue-600','bg-gradient-to-br from-pink-500 to-rose-500','bg-gradient-to-br from-emerald-500 to-green-600'][(app.influencerId?.name?.charCodeAt(0) || 0) % 6]
            }`}>
              {app.influencerId?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {app.influencerId?.name}
              </p>
              <p className="text-xs text-gray-400">
                {app.influencerProfile?.platforms?.[0]?.followers
                  ? `${(app.influencerProfile.platforms[0].followers / 1000).toFixed(1)}k followers`
                  : '—'}{' '}
                {app.influencerProfile?.city ? `· ${app.influencerProfile.city}` : ''}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize flex-shrink-0 ${STATUS_STYLES[app.status]}`}>
              {app.status}
            </span>
          </div>

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
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Deal created — chat in Messages
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
