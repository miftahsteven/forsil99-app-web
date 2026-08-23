'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchLiveLocations, updateLiveLocation } from '@/services/liveLocationService';
import { LiveLocation } from '@/types';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Radio,
  MapPin,
  MessageSquare,
  Compass,
  Navigation,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export default function RadarAlumniPage() {
  const { user, profile, isAuthenticated } = useAuth();
  const [locations, setLocations] = useState<LiveLocation[]>([]);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState<boolean>(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLiveLocations();
      setLocations(data);
      // Check if current user is in sharing list
      const me = data.find((l) => l.userId === user?.id || l.userId === profile?.uid);
      if (me) setIsSharing(me.isSharing);
    } catch {
      toast.error('Gagal memuat radar alumni.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSharing = () => {
    if (!isAuthenticated) {
      toast.error('Silakan masuk untuk mengaktifkan Radar Alumni.');
      return;
    }

    if (!isSharing) {
      // Request browser geolocation
      if ('geolocation' in navigator) {
        setIsUpdatingLocation(true);
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setUserCoords({ lat, lng });

            try {
              await updateLiveLocation({
                lat,
                lng,
                cityName: profile?.city || 'Jakarta',
                areaName: 'Jabodetabek',
                isSharing: true,
              });
              setIsSharing(true);
              toast.success('Radar aktif! Lokasi kota Anda terlihat oleh rekan alumni.');
              loadLocations();
            } catch {
              toast.error('Gagal memperbarui lokasi radar.');
            } finally {
              setIsUpdatingLocation(false);
            }
          },
          (err) => {
            setIsUpdatingLocation(false);
            toast.error('Izin lokasi ditolak pada browser.');
          }
        );
      } else {
        toast.error('Geolokasi tidak didukung oleh browser Anda.');
      }
    } else {
      // Turn off sharing
      setIsUpdatingLocation(true);
      updateLiveLocation({
        lat: 0,
        lng: 0,
        cityName: '',
        areaName: '',
        isSharing: false,
      })
        .then(() => {
          setIsSharing(false);
          toast.success('Berbagi lokasi dimatikan.');
          loadLocations();
        })
        .finally(() => setIsUpdatingLocation(false));
    }
  };

  return (
    <div className="w-full px-3 py-3">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl p-4 text-white mb-3.5 shadow-card relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Radio size={18} className="text-emerald-400 animate-pulse" />
              <h1 className="text-lg font-bold">Radar Alumni SMAN 59</h1>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-sm">
              Ketahui rekan alumni yang sedang berada di kota atau area yang sama secara sukarela.
            </p>
          </div>
        </div>

        {/* Sharing Toggle Bar */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-amber-400" />
            <span className="text-[11px] text-slate-300">
              {isSharing ? 'Lokasi Anda sedang aktif dibagikan' : 'Lokasi Anda saat ini disembunyikan'}
            </span>
          </div>

          <button
            onClick={handleToggleSharing}
            disabled={isUpdatingLocation}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
              isSharing
                ? 'bg-rose-500/90 hover:bg-rose-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
            }`}
          >
            {isUpdatingLocation ? 'Memproses...' : isSharing ? 'Matikan Radar' : 'Bagikan Lokasi'}
          </button>
        </div>
      </div>

      {/* Sharing Alumni List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Alumni di Sekitar Anda ({locations.length})
          </h3>
          <button
            onClick={loadLocations}
            className="text-xs text-brand-primary font-semibold flex items-center gap-1 hover:underline"
          >
            <RefreshCw size={12} /> Segarkan
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-subtle animate-pulse flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="w-28 h-3.5 bg-slate-200 rounded" />
                    <div className="w-20 h-2.5 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        ) : locations.length === 0 ? (
          <EmptyState
            icon={<Compass size={28} />}
            title="Belum ada alumni yang membagikan lokasi"
            description="Jadilah yang pertama mengaktifkan Radar Alumni agar rekan sekelas di kota Anda bisa menyapa!"
            actionText={isSharing ? undefined : 'Aktifkan Radar Saya'}
            onAction={handleToggleSharing}
          />
        ) : (
          locations.map((loc) => (
            <div
              key={loc.userId}
              className="bg-white rounded-2xl p-3.5 border border-slate-100/90 shadow-subtle flex items-center justify-between gap-3"
            >
              <Link href={`/profile/${loc.userId}`} className="flex items-center gap-3 flex-1 min-w-0">
                <AppAvatar
                  src={loc.photoUrl}
                  name={loc.fullName}
                  size="md"
                  isOnline={true}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-slate-900 truncate">{loc.fullName}</h4>
                    {loc.className && (
                      <span className="text-[10px] font-semibold text-brand-primary bg-blue-50 px-1.5 py-0.2 rounded">
                        {loc.className}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                    <MapPin size={13} className="text-emerald-600 flex-shrink-0" />
                    <span className="font-medium text-slate-700 truncate">
                      {loc.cityName || loc.areaName || 'Jabodetabek'}
                    </span>
                    {loc.distanceText && (
                      <span className="text-[11px] text-slate-400">• {loc.distanceText}</span>
                    )}
                  </div>
                </div>
              </Link>

              <Link
                href={`/chat/${loc.userId}`}
                className="p-2 rounded-xl bg-blue-50 text-brand-primary hover:bg-blue-100 transition-colors flex-shrink-0"
                title="Sapa Alumni"
              >
                <MessageSquare size={16} />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
