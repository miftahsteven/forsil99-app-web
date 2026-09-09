'use client';

import React, { useState, useEffect } from 'react';
import { fetchEvents, rsvpEvent, deleteEvent } from '@/services/eventService';
import { AlumniEvent } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { EventFormModal } from '@/components/events/EventFormModal';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  CalendarCheck,
} from 'lucide-react';
import { toast } from 'sonner';

// Specific list of designated alumni admins for Event & Agenda
const DESIGNATED_ADMIN_IDS = [
  'admin_miftah_99', // Miftahuddin Syarief (saya)
  'd82620ac-4b03-4b02-a8d3-e105c16e838c', // Rika Oktavia
  'd82ee3ff-5144-462c-b1df-74dfc15e5609', // INTO
  'aca782f7-7a46-4ee2-b5b7-5f18e5e3a5ec', // Antonio Primagrandi
];

export default function EventsPage() {
  const { isAuthenticated, user, profile, isAdmin } = useAuth();
  const [events, setEvents] = useState<AlumniEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states for creating and editing events
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AlumniEvent | null>(null);

  // Check if current user is an Event Admin
  const isEventAdmin = Boolean(
    isAdmin ||
    (user?.id && DESIGNATED_ADMIN_IDS.includes(user.id)) ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('super_admin')
  );

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch {
      toast.error('Gagal memuat agenda acara alumni.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRsvp = async (eventId: string, status: 'hadir' | 'mungkin' | 'tidak') => {
    if (!isAuthenticated) {
      toast.error('Silakan masuk terlebih dahulu untuk konfirmasi kehadiran.');
      return;
    }

    try {
      await rsvpEvent(eventId, status);
      toast.success(`Konfirmasi kehadiran "${status}" tercatat!`);
      loadEvents();
    } catch {
      toast.error('Gagal memperbarui status kehadiran.');
    }
  };

  const handleDeleteEvent = async (event: AlumniEvent) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus agenda "${event.title}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    const toastId = toast.loading('Menghapus agenda acara...');
    try {
      await deleteEvent(event.id);
      toast.success('Agenda acara berhasil dihapus.', { id: toastId });
      loadEvents();
    } catch (err: any) {
      console.error('Delete event error:', err);
      toast.error(err?.response?.data?.message || 'Gagal menghapus agenda acara.', { id: toastId });
    }
  };

  return (
    <div className="w-full px-3 py-3">
      {/* Header Banner with Admin Action */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 text-white mb-3.5 shadow-card border border-indigo-800/60 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300">
              <Calendar size={18} />
            </div>
            <h1 className="text-lg font-bold">Agenda Acara</h1>
          </div>

          {isEventAdmin && (
            <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 shadow-sm">
              <ShieldCheck size={13} />
              <span>Admin Agenda</span>
            </span>
          )}
        </div>

        <p className="text-xs text-blue-100 mt-1.5 max-w-md leading-relaxed">
          Informasi agenda acara alumni SMAN 59 Jakarta.
        </p>

        {/* Prominent Admin Action Button requested by user */}
        {isEventAdmin && (
          <div className="mt-3.5 pt-3 border-t border-white/15 flex items-center justify-between flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingEvent(null);
                setIsFormModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Sparkles size={16} className="text-amber-900" />
              <span>Anda Admin, Buat Agenda</span>
            </button>
            <span className="text-[11px] text-amber-200 font-medium hidden sm:inline">
              Klik untuk mempublikasikan acara baru
            </span>
          </div>
        )}
      </div>

      {/* Event List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-subtle animate-pulse space-y-3"
            >
              <div className="w-full h-40 bg-slate-200 rounded-xl" />
              <div className="w-2/3 h-4 bg-slate-200 rounded" />
              <div className="w-full h-12 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="space-y-3">
          <EmptyState
            icon={<Calendar size={28} />}
            title="Belum ada agenda terdekat"
            description="Nantikan pengumuman acara reuni dan kumpul alumni berikutnya di sini!"
          />
          {isEventAdmin && (
            <div className="flex justify-center mt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingEvent(null);
                  setIsFormModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-brand-primary hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={16} />
                <span>Anda Admin, Buat Agenda</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const startDate = new Date(event.startAt).toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-subtle hover:border-slate-300 transition-all group"
              >
                {/* Event Cover Banner */}
                {event.coverUrl ? (
                  <div className="w-full h-48 sm:h-56 bg-slate-100 overflow-hidden relative">
                    <img
                      src={event.coverUrl}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow">
                      <Users size={12} className="text-amber-400" />
                      <span>{event.attendeeCount || 0} Hadir</span>
                    </div>

                    {/* Admin Action Badge on image */}
                    {isEventAdmin && (
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-amber-300 text-[11px] font-bold border border-white/10 shadow">
                        <ShieldCheck size={12} />
                        <span>Kelola Agenda</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-24 bg-gradient-to-r from-slate-800 to-indigo-950 p-4 flex items-center justify-between text-white relative">
                    <div className="flex items-center gap-2">
                      <CalendarCheck size={24} className="text-amber-300" />
                      <span className="font-bold text-sm tracking-wide">SMAN 59 JAKARTA '99</span>
                    </div>
                    <div className="bg-black/40 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Users size={12} className="text-amber-400" />
                      <span>{event.attendeeCount || 0} Hadir</span>
                    </div>
                  </div>
                )}

                <div className="p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
                      {event.title}
                    </h3>
                  </div>

                  {/* Metadata Row */}
                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-brand-primary flex-shrink-0" />
                      <span className="font-semibold text-slate-800">{startDate} WIB</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900">{event.locationName}</span>
                        {event.address && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{event.address}</p>
                        )}
                      </div>
                    </div>
                    {event.organizerName && (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                        <Users size={13} className="text-blue-600 flex-shrink-0" />
                        <span>Penyelenggara: <strong className="text-slate-700">{event.organizerName}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line border-t border-slate-100 pt-3">
                    {event.description}
                  </p>

                  {/* Admin Edit / Delete Actions */}
                  {isEventAdmin && (
                    <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-amber-900 font-bold">
                        <ShieldCheck size={14} />
                        <span>Aksi Admin</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEvent(event);
                            setIsFormModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit2 size={13} className="text-blue-600" />
                          <span>Ubah</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(event)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 size={13} />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* RSVP Action Bar */}
                  <div className="pt-3 border-t border-slate-100">
                    <span className="block text-[11px] font-semibold text-slate-500 mb-2">
                      Konfirmasi Kehadiran Anda:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleRsvp(event.id, 'hadir')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${event.userRsvp === 'hadir'
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                      >
                        ✓ Hadir
                      </button>
                      <button
                        onClick={() => handleRsvp(event.id, 'mungkin')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${event.userRsvp === 'mungkin'
                          ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm ring-2 ring-amber-500/20'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                          }`}
                      >
                        ? Mungkin
                      </button>
                      <button
                        onClick={() => handleRsvp(event.id, 'tidak')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${event.userRsvp === 'tidak'
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        ✕ Tidak
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Event Modal (Create & Edit) */}
      <EventFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingEvent(null);
        }}
        onSuccess={loadEvents}
        initialData={editingEvent}
      />
    </div>
  );
}
