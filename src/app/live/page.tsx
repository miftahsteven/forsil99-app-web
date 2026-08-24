'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  fetchLiveLocations,
  updateLiveLocation,
  subscribeLiveLocations,
  calculateDistanceKm,
  formatDistance,
  reverseGeocodeCoords,
} from '@/services/liveLocationService';
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
  Crosshair,
  School,
  List,
  Map as MapIcon,
  X,
  Search,
  User,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// Default Center: SMAN 59 Jakarta (Duren Sawit, Jakarta Timur)
const SMAN_59_COORDS = { lat: -6.235, lng: 106.885 };

const RADIUS_OPTIONS = [
  { label: 'Semua', value: null },
  { label: '1 km', value: 1 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
  { label: '50 km', value: 50 },
];

export default function RadarAlumniPage() {
  const { user, profile, isAuthenticated } = useAuth();
  const [locations, setLocations] = useState<LiveLocation[]>([]);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedAlumni, setSelectedAlumni] = useState<LiveLocation | null>(null);
  const [mapReady, setMapReady] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeRadiusKm, setActiveRadiusKm] = useState<number | null>(null);
  const [classFilter, setClassFilter] = useState<'all' | 'same_class'>('all');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const userCircleRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const schoolMarkerRef = useRef<any>(null);
  const leafletLibRef = useRef<any>(null);

  // 1. Subscribe to Live Locations from Firebase Realtime Database
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeLiveLocations((updatedLocs) => {
      setLocations(updatedLocs);
      setIsLoading(false);

      const me = updatedLocs.find((l) => l.userId === user?.id || l.userId === profile?.uid);
      if (me) {
        setIsSharing(true);
        setUserCoords({ lat: me.lat, lng: me.lng });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id, profile?.uid]);

  // 2. Initialize Leaflet Map Engine
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;
      leafletLibRef.current = L;

      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const centerPos: [number, number] = userCoords
          ? [userCoords.lat, userCoords.lng]
          : [SMAN_59_COORDS.lat, SMAN_59_COORDS.lng];

        const map = L.map(mapContainerRef.current, {
          center: centerPos,
          zoom: 13,
          zoomControl: false,
        });

        // Add High-DPI CartoDB Positron clean modern tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        // Zoom control on top right
        L.control.zoom({ position: 'topright' }).addTo(map);

        // Add Markers Layer Group
        const markersGroup = L.layerGroup().addTo(map);
        markersLayerRef.current = markersGroup;

        // Add Landmark SMAN 59 Jakarta
        const schoolIcon = L.divIcon({
          className: 'custom-school-pin',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; items: center; cursor: pointer; transform: translate(-50%, -100%);">
              <div style="background: linear-gradient(135deg, #F59E0B, #D97706); color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 800; box-shadow: 0 4px 12px rgba(217,119,6,0.4); display: flex; align-items: center; gap: 4px; white-space: nowrap; border: 2px solid white;">
                <span>🏫 SMAN 59</span>
              </div>
              <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #D97706; margin: 0 auto;"></div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const schoolMarker = L.marker([SMAN_59_COORDS.lat, SMAN_59_COORDS.lng], { icon: schoolIcon }).addTo(map);
        schoolMarker.on('click', () => {
          toast.info('🏫 SMAN 59 Jakarta — Pusat Forum Silaturahmi Angkatan 1999');
        });
        schoolMarkerRef.current = schoolMarker;

        mapInstanceRef.current = map;
        setMapReady(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Compute filtered alumni list
  const filteredAlumni = useMemo(() => {
    const baseCoords = userCoords || SMAN_59_COORDS;

    return locations
      .map((loc) => {
        let distanceKm: number | undefined;
        let distanceText: string | undefined;

        if (baseCoords && loc.lat && loc.lng) {
          distanceKm = calculateDistanceKm(baseCoords.lat, baseCoords.lng, loc.lat, loc.lng);
          distanceText = formatDistance(distanceKm);
        }

        return {
          ...loc,
          distanceKm,
          distanceText,
        };
      })
      .filter((loc) => {
        if (loc.userId === user?.id || loc.userId === profile?.uid) return false;

        if (activeRadiusKm !== null && loc.distanceKm !== undefined) {
          if (loc.distanceKm > activeRadiusKm) return false;
        }

        if (classFilter === 'same_class' && profile?.className) {
          if (loc.className?.toLowerCase() !== profile.className.toLowerCase()) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = loc.fullName?.toLowerCase().includes(q);
          const matchNick = loc.nickname?.toLowerCase().includes(q);
          const matchClass = loc.className?.toLowerCase().includes(q);
          const matchCity = loc.cityName?.toLowerCase().includes(q);
          if (!matchName && !matchNick && !matchClass && !matchCity) return false;
        }

        return true;
      })
      .sort((a, b) => (a.distanceKm || 9999) - (b.distanceKm || 9999));
  }, [locations, userCoords, activeRadiusKm, classFilter, searchQuery, user?.id, profile?.uid, profile?.className]);

  // 4. Update Leaflet Markers whenever filtered alumni or userCoords change
  useEffect(() => {
    const L = leafletLibRef.current;
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;

    if (!L || !map || !markersGroup) return;

    // Clear old alumni markers
    markersGroup.clearLayers();

    // A. Update Current User Marker & Pulse Circle
    if (userCoords && isSharing) {
      if (!userMarkerRef.current) {
        const userIcon = L.divIcon({
          className: 'custom-user-pin',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -50%);">
              <div style="width: 22px; height: 22px; background: #2563EB; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 16px rgba(37,99,235,0.6); display: flex; align-items: center; justify-content: center;">
                <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
              </div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);

        userCircleRef.current = L.circle([userCoords.lat, userCoords.lng], {
          color: '#2563EB',
          fillColor: '#3B82F6',
          fillOpacity: 0.15,
          weight: 2,
          radius: 500,
        }).addTo(map);
      } else {
        userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
        userCircleRef.current.setLatLng([userCoords.lat, userCoords.lng]);
      }
    } else {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (userCircleRef.current) {
        map.removeLayer(userCircleRef.current);
        userCircleRef.current = null;
      }
    }

    // B. Add Alumni Pins
    filteredAlumni.forEach((alumni) => {
      const displayName = alumni.nickname || alumni.fullName.split(' ')[0] || 'Alumni';
      const initial = (alumni.fullName || 'A').charAt(0).toUpperCase();

      const alumniIcon = L.divIcon({
        className: 'custom-alumni-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
            <div style="background: white; padding: 3px 6px; border-radius: 20px; box-shadow: 0 4px 14px rgba(0,0,0,0.18); display: flex; align-items: center; gap: 4px; border: 1.5px solid #10B981; transition: transform 0.15s ease;">
              <div style="width: 22px; height: 22px; border-radius: 50%; background: #10B981; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; overflow: hidden;">
                ${
                  alumni.photoUrl
                    ? `<img src="${alumni.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />`
                    : initial
                }
              </div>
              <span style="font-size: 11px; font-weight: 700; color: #1E293B; max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${displayName}
              </span>
            </div>
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid #10B981;"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([alumni.lat, alumni.lng], { icon: alumniIcon });
      marker.on('click', () => {
        setSelectedAlumni(alumni);
        map.flyTo([alumni.lat, alumni.lng], 15, { animate: true, duration: 0.8 });
      });

      markersGroup.addLayer(marker);
    });
  }, [mapReady, filteredAlumni, userCoords, isSharing]);

  // Handle sharing toggle
  const handleToggleSharing = () => {
    if (!isAuthenticated) {
      toast.error('Silakan masuk ke akun Anda untuk mengaktifkan Radar Alumni.');
      return;
    }

    if (!isSharing) {
      if ('geolocation' in navigator) {
        setIsUpdatingLocation(true);
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setUserCoords({ lat, lng });

            try {
              const geocode = await reverseGeocodeCoords(lat, lng);
              await updateLiveLocation({
                userId: user?.id || profile?.uid,
                fullName: profile?.fullName || user?.email || 'Alumni 59',
                nickname: profile?.nickname,
                photoUrl: profile?.profilePhotoUrl,
                className: profile?.className || 'Alumni 99',
                lat,
                lng,
                cityName: geocode.cityName,
                areaName: geocode.areaName,
                isSharing: true,
              });

              setIsSharing(true);
              toast.success('Radar aktif! Lokasi kota Anda kini terlihat oleh rekan alumni.');

              if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([lat, lng], 14, { animate: true, duration: 1 });
              }
            } catch {
              toast.error('Gagal memperbarui lokasi radar.');
            } finally {
              setIsUpdatingLocation(false);
            }
          },
          () => {
            setIsUpdatingLocation(false);
            toast.error('Izin lokasi ditolak pada peramban web.');
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        toast.error('Geolokasi tidak didukung oleh peramban web Anda.');
      }
    } else {
      setIsUpdatingLocation(true);
      updateLiveLocation({
        userId: user?.id || profile?.uid,
        lat: 0,
        lng: 0,
        cityName: '',
        areaName: '',
        isSharing: false,
      })
        .then(() => {
          setIsSharing(false);
          toast.success('Berbagi lokasi radar telah dimatikan.');
        })
        .catch(() => toast.error('Gagal mematikan radar.'))
        .finally(() => setIsUpdatingLocation(false));
    }
  };

  const centerOnUser = () => {
    if (userCoords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 15, { animate: true });
    } else {
      handleToggleSharing();
    }
  };

  const centerOnSchool = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([SMAN_59_COORDS.lat, SMAN_59_COORDS.lng], 14, { animate: true });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 py-3 space-y-3 pb-16">
      {/* 1. Header Banner & Radar HUD */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden border border-blue-800/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                Live Radar Alumni 99
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full">
                  SMAN 59
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-300 mt-1.5 max-w-lg leading-relaxed">
              Pantau dan temukan rekan seangkatan yang sedang berada di kota atau area yang sama secara sukarela dan real-time.
            </p>
          </div>

          {/* Toggle Sharing Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleSharing}
              disabled={isUpdatingLocation}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer ${
                isSharing
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
              }`}
            >
              <Radio size={14} className={isSharing ? 'animate-pulse' : ''} />
              <span>
                {isUpdatingLocation
                  ? 'Memproses...'
                  : isSharing
                  ? 'Matikan Radar Saya'
                  : 'Bagikan Lokasi Saya'}
              </span>
            </button>
          </div>
        </div>

        {/* View Mode Bar */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <MapIcon size={14} />
              <span>Peta Interaktif</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <List size={14} />
              <span>Daftar Alumni ({filteredAlumni.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <Shield size={13} className="text-amber-400" />
            <span>{isSharing ? 'Lokasi kota Anda terlihat' : 'Lokasi Anda disembunyikan'}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-subtle space-y-2.5">
        {/* Search and class filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama alumni atau kota di radar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setClassFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                classFilter === 'all'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Kelas
            </button>
            {profile?.className && (
              <button
                onClick={() => setClassFilter('same_class')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  classFilter === 'same_class'
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Kelas Saya ({profile.className})
              </button>
            )}
          </div>
        </div>

        {/* Radius filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">Radius:</span>
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setActiveRadiusKm(opt.value)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                activeRadiusKm === opt.value
                  ? 'bg-blue-50 text-brand-primary border border-blue-200 font-bold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interactive Map Container */}
      {viewMode === 'map' && (
        <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-card bg-slate-100 h-[520px]">
          {/* Leaflet Map Target */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {!mapReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-xs gap-3 z-10">
              <Loader2 size={28} className="animate-spin text-brand-primary" />
              <span className="text-xs font-bold text-slate-600">Menyiapkan Radar Peta...</span>
            </div>
          )}

          {/* Map Floating Actions */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <button
              onClick={centerOnUser}
              className="p-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 text-slate-700 hover:text-brand-primary hover:bg-white transition-all active:scale-95 cursor-pointer"
              title="Pusatkan ke Lokasi Saya"
            >
              <Crosshair size={18} />
            </button>
            <button
              onClick={centerOnSchool}
              className="p-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 text-amber-600 hover:text-amber-700 hover:bg-white transition-all active:scale-95 cursor-pointer"
              title="Pusatkan ke SMAN 59 Jakarta"
            >
              <School size={18} />
            </button>
          </div>

          {/* Quick Counter Badge */}
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-md flex items-center gap-2 text-xs font-bold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{filteredAlumni.length} Alumni di Radar</span>
            </div>
          </div>

          {/* Selected Alumni Floating Bottom Card */}
          {selectedAlumni && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-20 bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-slate-200 shadow-2xl animate-fadeIn">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AppAvatar
                    src={selectedAlumni.photoUrl}
                    name={selectedAlumni.fullName}
                    size="md"
                    isOnline={true}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-black text-sm text-slate-900">
                        {selectedAlumni.fullName}
                      </h4>
                      {selectedAlumni.className && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-brand-primary rounded-md">
                          {selectedAlumni.className}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <MapPin size={12} className="text-emerald-600" />
                      <span>{selectedAlumni.cityName || selectedAlumni.areaName || 'Jakarta'}</span>
                      {selectedAlumni.distanceText && (
                        <span className="font-semibold text-brand-primary">
                          • {selectedAlumni.distanceText}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAlumni(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-slate-100">
                <Link
                  href={`/chat/${selectedAlumni.userId}`}
                  className="flex items-center justify-center gap-1 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <MessageSquare size={13} />
                  <span>Sapa Chat</span>
                </Link>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedAlumni.lat},${selectedAlumni.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Navigation size={13} />
                  <span>Rute</span>
                </a>

                <Link
                  href={`/profile/${selectedAlumni.userId}`}
                  className="flex items-center justify-center gap-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <User size={13} />
                  <span>Profil</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Alumni List View */}
      {viewMode === 'list' && (
        <div className="space-y-2.5">
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
          ) : filteredAlumni.length === 0 ? (
            <EmptyState
              icon={<Compass size={28} />}
              title="Belum ada alumni yang membagikan lokasi"
              description="Jadilah yang pertama mengaktifkan Radar Alumni agar rekan sekelas di kota Anda bisa menyapa!"
              actionText={isSharing ? undefined : 'Aktifkan Radar Saya'}
              onAction={handleToggleSharing}
            />
          ) : (
            filteredAlumni.map((loc) => (
              <div
                key={loc.userId}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 hover:border-slate-200 shadow-subtle flex items-center justify-between gap-3 transition-all"
              >
                <Link
                  href={`/profile/${loc.userId}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <AppAvatar src={loc.photoUrl} name={loc.fullName} size="md" isOnline={true} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{loc.fullName}</h4>
                      {loc.className && (
                        <span className="text-[10px] font-semibold text-brand-primary bg-blue-50 px-1.5 py-0.5 rounded">
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
                        <span className="text-[11px] font-semibold text-brand-primary">
                          • {loc.distanceText}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Petunjuk Arah Maps"
                  >
                    <Navigation size={15} />
                  </a>

                  <Link
                    href={`/chat/${loc.userId}`}
                    className="p-2 rounded-xl bg-blue-50 text-brand-primary hover:bg-blue-100 transition-colors cursor-pointer"
                    title="Sapa Alumni"
                  >
                    <MessageSquare size={15} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
