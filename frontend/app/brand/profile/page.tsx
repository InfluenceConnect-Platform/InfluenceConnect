'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import BrandNav from '@/components/shared/BrandNav';

const INDUSTRIES = ['beauty', 'fashion', 'food', 'fitness', 'lifestyle', 'travel', 'tech', 'books', 'other'];

const INDUSTRY_COLORS: Record<string, string> = {
  beauty:    'bg-pink-50   dark:bg-pink-900/30   text-pink-700   dark:text-pink-300   border-pink-200   dark:border-pink-800/40',
  fashion:   'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
  food:      'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/40',
  fitness:   'bg-amber-50  dark:bg-amber-900/30  text-amber-700  dark:text-amber-300  border-amber-200  dark:border-amber-800/40',
  lifestyle: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/40',
  travel:    'bg-teal-50   dark:bg-teal-900/30   text-teal-700   dark:text-teal-300   border-teal-200   dark:border-teal-800/40',
  tech:      'bg-blue-50   dark:bg-blue-900/30   text-blue-700   dark:text-blue-300   border-blue-200   dark:border-blue-800/40',
  books:     'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40',
  other:     'bg-gray-100  dark:bg-gray-700/40   text-gray-600   dark:text-gray-300   border-gray-200   dark:border-gray-600/40',
};

export default function BrandProfile() {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<{ id: string; name: string; plan: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    try { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [profile, setProfile]       = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState('');
  const [isEditing, setIsEditing]   = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry]       = useState('');
  const [website, setWebsite]         = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token || !stored) { router.push('/auth/login'); return; }
    if (!user) setUser(JSON.parse(stored));
    fetchProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/brand/profile/me');
      const p = res.data.profile;
      setProfile(p);
      setCompanyName(p.companyName || '');
      setDescription(p.description || '');
      setIndustry(p.industry || '');
      setWebsite(p.website || '');
    } catch {
      try {
        await api.post('/api/brand/profile');
        fetchProfile();
      } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await api.put('/api/brand/profile', { companyName, description, industry, website });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setIsEditing(false);
      await fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setCompanyName(profile?.companyName || '');
    setDescription(profile?.description || '');
    setIndustry(profile?.industry || '');
    setWebsite(profile?.website || '');
    setIsEditing(false); setError('');
  };

  const handleRemoveLogo = async () => {
    setUploadingLogo(true);
    try {
      await api.delete('/api/upload/brand-logo');
      setProfile((prev: any) => prev ? { ...prev, logoUrl: '' } : prev);
    } catch (err: any) {
      setError(err.message || 'Failed to remove logo.');
    } finally { setUploadingLogo(false); }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Logo must be an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Logo must be under 5 MB.'); return; }
    setUploadingLogo(true); setError('');
    try {
      const sigRes = await api.get('/api/upload/signature?context=brand-logo');
      const { signature, timestamp, apiKey, cloudName, folder } = sigRes.data;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp.toString());
      formData.append('api_key', apiKey);
      formData.append('folder', folder);
      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await uploadRes.json();
      if (data.error) throw new Error(data.error.message);
      await api.post('/api/upload/brand-logo', { logoUrl: data.secure_url });
      setProfile((prev: any) => prev ? { ...prev, logoUrl: data.secure_url } : prev);
    } catch (err: any) {
      setError(err.message || 'Logo upload failed.');
    } finally { setUploadingLogo(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F4F6FB] dark:bg-[#060D1A] flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-[#3D5087] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const displayName = profile?.companyName || user?.name || 'Your Brand';
  const isPremium   = user?.plan === 'premium';
  const industryChip = profile?.industry ? (INDUSTRY_COLORS[profile.industry] ?? INDUSTRY_COLORS.other) : null;

  const fieldClass = 'w-full px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D5087]/25 focus:border-[#3D5087] transition-all bg-white';

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      <BrandNav user={user} logoUrl={profile?.logoUrl} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2.5">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* ═══════════════════════════════
            HERO PROFILE CARD
            ═══════════════════════════════ */}
        <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm mb-5">

          {/* Cover banner */}
          <div className="h-28 sm:h-36 bg-gradient-to-br from-[#1e2f5c] via-[#3D5087] to-[#4a5fa0] relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" style={{opacity:0.04}} aria-hidden="true">
              <defs><pattern id="bp-dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="white"/></pattern></defs>
              <rect width="100%" height="100%" fill="url(#bp-dots)"/>
            </svg>
            <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/5 rounded-full" />
            <div className="absolute -bottom-10 -left-8 w-44 h-44 bg-white/5 rounded-full" />
            {/* Edit / Save buttons in top-right */}
            <div className="absolute top-3 right-4 flex items-center gap-2">
              {saved && (
                <span className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-500 text-white px-3 py-1.5 rounded-lg shadow-sm">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Saved
                </span>
              )}
              {isEditing ? (
                <>
                  <button onClick={handleCancel}
                    className="text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="text-xs font-semibold text-[#1e2d56] dark:text-white bg-white dark:bg-white/20 hover:bg-blue-50 dark:hover:bg-white/30 px-4 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5">
                    {saving ? (
                      <><svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving…</>
                    ) : 'Save changes'}
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer backdrop-blur-sm">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit profile
                </button>
              )}
            </div>
          </div>

          {/* Logo + identity row */}
          <div className="px-5 sm:px-7 pb-6">
            <div className="flex items-end gap-4 -mt-10 mb-4">
              {/* Logo */}
              <div
                className={`relative z-10 w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl border-4 border-white dark:border-[#0E1B2E] shadow-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#EAEDF6] to-[#c8ceea] dark:from-[#1e2a4a] dark:to-[#2d3d6a] flex items-center justify-center ${isEditing ? 'cursor-pointer group' : ''}`}
                onClick={() => isEditing && logoInputRef.current?.click()}
              >
                {profile?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.logoUrl} alt="Brand logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#3D5087] font-black text-2xl select-none">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-[12px]">
                    {uploadingLogo ? (
                      <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                        </svg>
                        <span className="text-[10px] text-white font-semibold mt-0.5">Change</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Plan badge — push to right */}
              <div className="flex-1" />
              <span className={`self-start mt-11 text-xs font-bold px-2.5 py-1 rounded-full border ${
                isPremium ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-[#EAEDF6] dark:bg-[#1e2a4a] text-[#3D5087] dark:text-blue-300 border-[#3D5087]/20 dark:border-blue-800/40'
              }`}>
                {isPremium ? '★ Premium' : 'Freemium'}
              </span>
            </div>

            {/* Name + meta */}
            <div className="mb-1.5">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">{displayName}</h2>
              {user?.name && profile?.companyName && profile.companyName !== user.name && (
                <p className="text-xs text-gray-400 mt-0.5">{user.name}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-sm">
              {industryChip && (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize border ${industryChip}`}>
                  {profile.industry}
                </span>
              )}
              {profile?.website && (
                <a href={/^https?:\/\//i.test(profile.website) ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-[#3D5087] dark:text-blue-400 hover:underline">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              )}
              {!industryChip && !profile?.website && !isEditing && (
                <p className="text-xs text-gray-400 italic">No details added yet — click Edit profile to get started.</p>
              )}
            </div>

            {/* Logo upload actions — edit mode only */}
            {isEditing && (
              <div className="mt-4 flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-[#3D5087] hover:bg-[#2B3B68] text-white rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                  {uploadingLogo ? 'Uploading…' : profile?.logoUrl ? 'Replace logo' : 'Upload logo'}
                </button>
                <span className="text-xs text-gray-400">PNG, JPG or WebP · Max 5 MB</span>
                {profile?.logoUrl && (
                  <button onClick={handleRemoveLogo} disabled={uploadingLogo}
                    className="ml-auto text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 cursor-pointer transition-colors">
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleLogoUpload(file);
            e.target.value = '';
          }}
        />

        {/* ═══════════════════════════════
            BRAND INFO CARD
            ═══════════════════════════════ */}
        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm mb-5 overflow-hidden">
          <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-[#3D5087] dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Brand Information</h3>
              <p className="text-xs text-gray-400">Visible to influencers on your campaigns</p>
            </div>
          </div>

          <div className="px-5 sm:px-6 py-5">
            {isEditing ? (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Company name</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                    placeholder="Your company or brand name" className={fieldClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    About your brand <span className="text-gray-400 font-normal">({description.length}/500)</span>
                  </label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Describe your brand, products, and what you're looking for in an influencer partnership…"
                    rows={4} maxLength={500}
                    className={`${fieldClass} resize-none`} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Industry</label>
                    <div className="relative">
                      <select value={industry} onChange={e => setIndustry(e.target.value)}
                        className={`${fieldClass} appearance-none cursor-pointer pr-9 ${!industry ? 'text-gray-400' : 'text-gray-900'}`}>
                        <option value="">Select industry</option>
                        {INDUSTRIES.map(i => (
                          <option key={i} value={i} className="capitalize">{i.charAt(0).toUpperCase() + i.slice(1)}</option>
                        ))}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Website</label>
                    <input type="url" value={website} onChange={e => setWebsite(e.target.value)}
                      placeholder="https://yourbrand.com" className={fieldClass} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Company name + description */}
                {profile?.description ? (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{profile.description}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No description added yet.</p>
                )}

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Company</p>
                    <p className="text-sm font-semibold text-gray-800">{profile?.companyName || <span className="font-normal italic text-gray-400">Not set</span>}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Industry</p>
                    {profile?.industry ? (
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize border ${INDUSTRY_COLORS[profile.industry] ?? INDUSTRY_COLORS.other}`}>
                        {profile.industry}
                      </span>
                    ) : (
                      <p className="text-sm italic text-gray-400">Not set</p>
                    )}
                  </div>
                  {profile?.website && (
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Website</p>
                      <a href={/^https?:\/\//i.test(profile.website) ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm font-medium text-[#3D5087] dark:text-blue-400 hover:underline w-fit">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════
            GST VERIFICATION CARD
            ═══════════════════════════════ */}
        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">GST Verification</h3>
              <p className="text-xs text-gray-400">Required for invoicing and compliance</p>
            </div>
          </div>

          <div className="px-5 sm:px-6 py-5">
            <div className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl border ${
              profile?.gstinStatus === 'verified' ? 'bg-emerald-50 border-emerald-200' :
              profile?.gstinStatus === 'pending'  ? 'bg-amber-50  border-amber-200'  :
                                                    'bg-gray-50   border-gray-200'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                profile?.gstinStatus === 'verified' ? 'bg-emerald-100' :
                profile?.gstinStatus === 'pending'  ? 'bg-amber-100'  : 'bg-gray-100'
              }`}>
                {profile?.gstinStatus === 'verified' ? (
                  <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : profile?.gstinStatus === 'pending' ? (
                  <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-sm font-semibold ${
                  profile?.gstinStatus === 'verified' ? 'text-emerald-800' :
                  profile?.gstinStatus === 'pending'  ? 'text-amber-800'  : 'text-gray-700'
                }`}>
                  {profile?.gstinStatus === 'verified' ? 'GSTIN verified' :
                   profile?.gstinStatus === 'pending'  ? 'Verification in progress' :
                   profile?.gstin ? 'GSTIN submitted — awaiting review' : 'No GSTIN submitted yet'}
                </p>
                {profile?.gstin && (
                  <p className="text-xs text-gray-500 font-mono mt-0.5 tracking-wider">{profile.gstin}</p>
                )}
                {!profile?.gstin && (
                  <p className="text-xs text-gray-400 mt-0.5">Contact support to submit your GSTIN for verification.</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
