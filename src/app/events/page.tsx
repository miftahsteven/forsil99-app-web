'use client';

import React, { useState, useEffect } from 'react';
import { fetchEvents, rsvpEvent } from '@/services/eventService';
import { AlumniEvent } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { Calendar, MapPin, Users, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function EventsPage() {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<AlumniEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  return (
    <div className="w-full px-3 py-3">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-2xl p-4 text-white mb-3.5 shadow-card">
        <div className="flex items-center gap-1.5">
          <Calendar size={18} className="text-amber-300" />
          <h1 className="text-lg font-bold">Agenda & Reuni Alumni</h1>
        </div>
        <p className="text-xs text-blue-100 mt-1 max-w-sm">
          Informasi pertemuan, reuni perak, dan kegiatan temu kangen alumni SMAN 59 Jakarta.
        </p>
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
        <EmptyState
          icon={<Calendar size={28} />}
          title="Belum ada agenda terdekat"
          description="Nantikan pengumuman acara reuni dan kumpul alumni berikutnya di sini!"
        />
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const startDate = new Date(event.startAt).toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-subtle hover:border-slate-200 transition-all"
              >
                {event.coverUrl && (
                  <div className="w-full h-48 bg-slate-100 overflow-hidden relative">
                    <img
                      src={event.coverUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Users size={12} />
                      <span>{event.attendeeCount || 0} Konfirmasi</span>
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {event.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-brand-primary flex-shrink-0" />
                      <span>{startDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-emerald-600 flex-shrink-0" />
                      <span className="font-medium text-slate-800">{event.locationName}</span>
                    </div>
                    {event.address && (
                      <p className="text-[11px] text-slate-400 pl-5.5">{event.address}</p>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line border-t border-slate-50 pt-2">
                    {event.description}
                  </p>

                  {/* RSVP Action Bar */}
                  <div className="pt-3 border-t border-slate-100">
                    <span className="block text-[11px] font-semibold text-slate-500 mb-2">
                      Konfirmasi Kehadiran Anda:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleRsvp(event.id, 'hadir')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                          event.userRsvp === 'hadir'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        ✓ Hadir
                      </button>
                      <button
                        onClick={() => handleRsvp(event.id, 'mungkin')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                          event.userRsvp === 'mungkin'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        ? Mungkin
                      </button>
                      <button
                        onClick={() => handleRsvp(event.id, 'tidak')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                          event.userRsvp === 'tidak'
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
    </div>
  );
}
