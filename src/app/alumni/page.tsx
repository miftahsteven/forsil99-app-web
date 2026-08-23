'use client';

import React, { useState, useEffect } from 'react';
import { AlumniCard } from '@/components/alumni/AlumniCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchProfiles } from '@/services/authService';
import { AlumniProfile } from '@/types';
import { Search, Users, Filter, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const CLASS_FILTERS = [
  'Semua',
  '3 IPA 1',
  '3 IPA 2',
  '3 IPA 3',
  '3 IPS 1',
  '3 IPS 2',
  '3 IPS 3',
  '3 IPS 4',
  '3 Bahasa',
];

export default function AlumniDirectoryPage() {
  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('Semua');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAlumni();
  }, []);

  const loadAlumni = async () => {
    setIsLoading(true);
    try {
      const data = await fetchProfiles();
      setProfiles(data);
    } catch {
      toast.error('Gagal memuat direktori alumni.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter profiles based on search and selected class
  const filteredProfiles = profiles.filter((p) => {
    const matchesClass =
      selectedClass === 'Semua' || p.className?.toLowerCase() === selectedClass.toLowerCase();

    if (!searchQuery.trim()) return matchesClass;

    const query = searchQuery.toLowerCase();
    const matchesName = p.fullName?.toLowerCase().includes(query);
    const matchesNickname = p.nickname?.toLowerCase().includes(query);
    const matchesOccupation = p.occupation?.toLowerCase().includes(query);
    const matchesCity = p.city?.toLowerCase().includes(query);

    return matchesClass && (matchesName || matchesNickname || matchesOccupation || matchesCity);
  });

  return (
    <div className="w-full px-3 py-3">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-primaryDeep rounded-2xl p-4 text-white mb-3.5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold">Direktori Alumni ’99</h1>
              <Sparkles size={16} className="text-amber-300" />
            </div>
            <p className="text-xs text-blue-100 mt-0.5">
              Temukan kembali teman sekelas dan jalin jejaring sesama alumni SMAN 59.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-black">{profiles.length}</span>
            <p className="text-[10px] text-blue-200">Terdaftar</p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama, panggilan, profesi, atau kota..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-primary shadow-subtle"
        />
      </div>

      {/* Class Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3">
        {CLASS_FILTERS.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedClass(c)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
              selectedClass === c
                ? 'bg-brand-primary text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Alumni List */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-subtle animate-pulse flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="w-32 h-4 bg-slate-200 rounded" />
                  <div className="w-20 h-3 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="w-16 h-8 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredProfiles.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="Alumni tidak ditemukan"
          description="Coba ubah kata kunci pencarian atau pilih filter kelas yang berbeda."
          actionText="Reset Pencarian"
          onAction={() => {
            setSearchQuery('');
            setSelectedClass('Semua');
          }}
        />
      ) : (
        <div className="space-y-2.5">
          {filteredProfiles.map((alumni) => (
            <AlumniCard key={alumni.uid || alumni.id} alumni={alumni} />
          ))}
        </div>
      )}
    </div>
  );
}
