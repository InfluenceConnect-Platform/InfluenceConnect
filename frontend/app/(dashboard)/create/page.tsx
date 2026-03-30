'use client';

import { useState, useRef } from 'react';
import { Upload, Image, Video, Layers, Package, CheckCircle, XCircle } from 'lucide-react';

type ContentType = 'Photo' | 'Reel/Video' | 'Story' | 'Product';

const CONTENT_TYPES: { label: ContentType; icon: React.ReactNode }[] = [
  { label: 'Photo',      icon: <Image size={16} />     },
  { label: 'Reel/Video', icon: <Video size={16} />     },
  { label: 'Story',      icon: <Layers size={16} />    },
  { label: 'Product',    icon: <Package size={16} />   },
];

const PLATFORMS = [
  { name: 'Instagram', color: 'bg-pink-500',   connected: true  },
  { name: 'YouTube',   color: 'bg-red-500',    connected: true  },
  { name: 'Facebook',  color: 'bg-blue-600',   connected: false },
  { name: 'Twitter',   color: 'bg-sky-400',    connected: true  },
];

export default function CreatePage() {
  const [activeType, setActiveType] = useState<ContentType>('Photo');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Instagram']);
  const [dragging, setDragging] = useState(false);
  const [caption, setCaption] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const togglePlatform = (name: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create & Import Content</h1>
          <p className="text-sm text-gray-400 mt-1">
            Create new content or import from your social media platforms
          </p>
        </div>
        <button className="px-4 py-2.5 bg-brand-400 text-white text-sm font-medium rounded-xl hover:bg-brand-500 transition-colors">
          + Create
        </button>
      </div>

      {/* Connected platforms */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Connected Platforms</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Connect your social media accounts to import content
            </p>
          </div>
          <button className="text-xs text-brand-400 font-medium hover:underline">
            ↺ Refresh
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PLATFORMS.map(p => (
            <div key={p.name} className="border border-gray-100 rounded-xl p-4 text-center relative">
              {p.connected && (
                <CheckCircle
                  size={16}
                  className="absolute top-2 right-2 text-green-500"
                />
              )}
              <div className={`w-10 h-10 ${p.color} rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto mb-2`}>
                {p.name[0]}
              </div>
              <p className="text-xs font-medium text-gray-700 mb-2">{p.name}</p>
              <button
                className={`w-full py-1 rounded-lg text-xs font-medium transition-colors ${
                  p.connected
                    ? 'bg-red-50 text-danger hover:bg-red-100'
                    : 'bg-brand-400 text-white hover:bg-brand-500'
                }`}
              >
                {p.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Create section */}
      <div className="grid grid-cols-3 gap-5">
        {/* Upload area */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          {/* Content type tabs */}
          <div className="flex gap-2">
            {CONTENT_TYPES.map(ct => (
              <button
                key={ct.label}
                onClick={() => setActiveType(ct.label)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeType === ct.label
                    ? 'bg-brand-50 text-brand-400 border border-brand-200'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {ct.icon}
                {ct.label}
              </button>
            ))}
          </div>

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); }}
            className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              dragging
                ? 'border-brand-400 bg-brand-50'
                : 'border-brand-200 hover:border-brand-400 hover:bg-brand-50'
            }`}
          >
            <div className="w-14 h-14 bg-brand-400 rounded-2xl flex items-center justify-center mb-4">
              <Upload size={24} className="text-white" />
            </div>
            <p className="text-sm font-semibold text-gray-700">
              Drop your files here or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Support for JPG, PNG, GIF (Max 10MB)
            </p>
            <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*" />
          </div>

          {/* Caption */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={3}
              placeholder="Write your caption here..."
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-400/20 focus:border-brand-400 placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-400 text-right mt-1">
              {caption.length} / 2200
            </p>
          </div>

          <button className="w-full py-3 bg-brand-400 text-white font-medium rounded-xl hover:bg-brand-500 transition-colors">
            Publish Now
          </button>
        </div>

        {/* Post To */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Post To</h3>
          <p className="text-xs text-gray-400 mb-4">
            Select platforms to publish your content
          </p>
          <div className="space-y-3">
            {PLATFORMS.map(p => (
              <button
                key={p.name}
                onClick={() => p.connected && togglePlatform(p.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                  selectedPlatforms.includes(p.name)
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!p.connected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className={`w-8 h-8 ${p.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                  {p.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{p.name}</p>
                  {!p.connected && (
                    <p className="text-xs text-gray-400">Not connected</p>
                  )}
                </div>
                {selectedPlatforms.includes(p.name) && p.connected && (
                  <CheckCircle size={16} className="text-brand-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}