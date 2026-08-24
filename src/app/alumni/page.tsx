'use client';

import React, { useState, useEffect } from 'react';
import { AlumniCard } from '@/components/alumni/AlumniCard';
import { MemorialCard } from '@/components/alumni/MemorialCard';
import { AddDeceasedModal } from '@/components/alumni/AddDeceasedModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchProfiles } from '@/services/authService';
import { fetchDeceasedAlumni } from '@/services/memorialService';
import { AlumniProfile, DeceasedAlumni } from '@/types';
import { Search, Users, Sparkles, Heart, Flame, Plus, UserPlus } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'directory' | 'memorial'>('directory');
  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [deceasedList, setDeceasedList] = useState<DeceasedAlumni[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('Semua');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profilesData, deceasedData] = await Promise.all([
        fetchProfiles(),
        fetchDeceasedAlumni(),
      ]);
      setProfiles(profilesData);
      setDeceasedList(deceasedData);
    } catch {
      toast.error('Gagal memuat direktori alumni.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter regular alumni profiles
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

  // Filter deceased alumni
  const filteredDeceased = deceasedList.filter((d) => {
    const matchesClass =
      selectedClass === 'Semua' || d.className?.toLowerCase() === selectedClass.toLowerCase();

    if (!searchQuery.trim()) return matchesClass;

    const query = searchQuery.toLowerCase();
    const matchesName = d.fullName?.toLowerCase().includes(query);
    const matchesNickname = d.nickname?.toLowerCase().includes(query);
    const matchesBio = d.bio?.toLowerCase().includes(query);
    const matchesYear = d.passedAwayYear?.toString().includes(query);

    return matchesClass && (matchesName || matchesNickname || matchesBio || matchesYear);
  });

  return (
    <div className="w-full px-3 py-3 space-y-3.5 pb-16">
      {/* 1. Header Banner */}
      {activeTab === 'directory' ? (
        <div className="bg-gradient-to-r from-brand-primary via-blue-900 to-brand-primaryDeep rounded-3xl p-5 text-white shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight">Direktori Alumni ’99</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full">
                  SMAN 59
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-1 max-w-md leading-relaxed">
                Temukan kembali teman sekelas dan jalin silaturahmi sesama alumni SMAN 59 Jakarta.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl font-black text-white">{profiles.length}</span>
              <p className="text-[10px] text-blue-200">Alumni Terdaftar</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/70 rounded-3xl p-5 text-white shadow-card border border-amber-500/20 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">🕯️</span>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-amber-200">
                  Yang Telah Pergi — In Memoriam
                </h1>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-md leading-relaxed">
                Mengenang sahabat-sahabat seangkatan tercinta yang telah mendahului kita. Doa tulus selalu mengiringi.
              </p>
            </div>

            {/* Add Deceased Button */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-left sm:text-right hidden sm:block">
                <span className="text-xl font-black text-amber-300">{deceasedList.length}</span>
                <p className="text-[10px] text-amber-200/70">Sahabat Dikenang</p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Tambah Data Sahabat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Tab Switcher */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-subtle flex items-center gap-1.5">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'directory'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users size={15} />
          <span>Direktori Alumni ({profiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('memorial')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'memorial'
              ? 'bg-gradient-to-r from-slate-900 to-amber-950 text-amber-200 border border-amber-500/30 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="text-sm">🕊️</span>
          <span>Yang Telah Pergi ({deceasedList.length})</span>
        </button>
      </div>

      {/* 3. Search & Class Filter */}
      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-subtle space-y-2.5">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'directory'
                ? 'Cari nama, panggilan, profesi, atau kota...'
                : 'Cari nama sahabat atau tahun wafat...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
          />
        </div>

        {/* Class Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">Kelas:</span>
          {CLASS_FILTERS.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedClass(c)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedClass === c
                  ? activeTab === 'directory'
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Content Area */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-subtle animate-pulse flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-slate-200" />
                <div className="space-y-2">
                  <div className="w-36 h-4 bg-slate-200 rounded" />
                  <div className="w-24 h-3 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="w-20 h-9 bg-slate-100 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : activeTab === 'directory' ? (
        /* Regular Alumni Directory Tab */
        filteredProfiles.length === 0 ? (
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
        )
      ) : (
        /* In Memoriam Tab (Yang Telah Pergi) */
        filteredDeceased.length === 0 ? (
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 text-center text-slate-300 space-y-3">
            <span className="text-4xl">🕊️</span>
            <h3 className="font-bold text-sm text-slate-100">
              Belum ada data sahabat in memoriam yang cocok
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Anda dapat menambahkan nama rekan seangkatan yang telah mendahului kita untuk dikenang bersama.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Tambah Data Sahabat Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredDeceased.map((item) => (
              <MemorialCard
                key={item.id}
                deceased={item}
                onFlowerGiven={(id, count) => {
                  setDeceasedList((prev) =>
                    prev.map((d) =>
                      d.id === id ? { ...d, flowerCount: count, hasGivenFlower: true } : d
                    )
                  );
                }}
                onDeleted={(id) => {
                  setDeceasedList((prev) => prev.filter((d) => d.id !== id));
                }}
              />
            ))}
          </div>
        )
      )}

      {/* Add Deceased Modal */}
      {showAddModal && (
        <AddDeceasedModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdded={(newItem) => {
            setDeceasedList((prev) => [newItem, ...prev]);
          }}
        />
      )}
    </div>
  );
}
