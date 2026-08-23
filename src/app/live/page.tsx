'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw,
  Crosshair,
  School,
  List,
  Map as MapIcon,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

// Default Center: SMAN 59 Jakarta (Duren Sawit, Jakarta Timur)
const SMAN_59_COORDS = { lat: -6.235, lng: 106.885 };

const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  'AIzaSyBNIsV54DlAmXrKGfeNivuqCRPPt3vD7ZI';

// Custom Map Style for clean modern look
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'poi',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ lightness: 20 }],
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#cde2fe' }],
  },
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
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const schoolMarkerRef = useRef<google.maps.Marker | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const userCircleRef = useRef<google.maps.Circle | null>(null);

  // 1. Subscribe to Firebase Realtime Database
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

  // 2. Load Google Maps Script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).google && (window as any).google.maps) {
      setMapLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => setMapLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapLoaded(true);
    };
    script.onerror = () => {
      console.warn('Google Maps script load error. Checking API configuration.');
    };
    document.head.appendChild(script);
  }, []);

  // 3. Initialize Google Map Instance
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const center = userCoords || SMAN_59_COORDS;
      const map = new google.maps.Map(mapContainerRef.current, {
        center,
        zoom: 13,
        styles: MAP_STYLES,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER,
        },
      });

      mapInstanceRef.current = map;

      // Add SMAN 59 School Landmark Marker
      const schoolPin = new google.maps.Marker({
        position: SMAN_59_COORDS,
        map,
        title: 'SMAN 59 Jakarta (Pusat Alumni 99)',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
          scaledSize: new google.maps.Size(42, 42),
        },
      });
      schoolMarkerRef.current = schoolPin;

      schoolPin.addListener('click', () => {
        toast.info('🏫 SMAN 59 Jakarta — Pusat Forum Silaturahmi Angkatan 1999');
      });
    } catch (e) {
      console.warn('Map initialization error:', e);
    }
  }, [mapLoaded]);

  // 4. Update Markers on Map when Locations or UserCoords change
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // A. Update Current User Marker
    if (userCoords && isSharing) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = new google.maps.Marker({
          position: userCoords,
          map,
          title: 'Lokasi Anda (Aktif Dibagikan)',
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new google.maps.Size(46, 46),
          },
          zIndex: 999,
        });

        userCircleRef.current = new google.maps.Circle({
          strokeColor: '#2563EB',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#3B82F6',
          fillOpacity: 0.18,
          map,
          center: userCoords,
          radius: 600,
        });
      } else {
        userMarkerRef.current.setPosition(userCoords);
        userCircleRef.current?.setCenter(userCoords);
      }
    } else {
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
        userMarkerRef.current = null;
      }
      if (userCircleRef.current) {
        userCircleRef.current.setMap(null);
        userCircleRef.current = null;
      }
    }

    // B. Update Alumni Markers
    const currentLocIds = new Set<string>();

    locations.forEach((loc) => {
      if (loc.userId === user?.id || loc.userId === profile?.uid) return;
      currentLocIds.add(loc.userId);

      let marker = markersRef.current.get(loc.userId);
      const position = { lat: loc.lat, lng: loc.lng };

      if (!marker) {
        marker = new google.maps.Marker({
          position,
          map,
          title: `${loc.fullName} (${loc.className || 'Alumni 99'})`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new google.maps.Size(38, 38),
          },
        });

        marker.addListener('click', () => {
          setSelectedAlumni(loc);
          map.panTo(position);
        });

        markersRef.current.set(loc.userId, marker);
      } else {
        marker.setPosition(position);
      }
    });

    // Remove old markers that stopped sharing
    markersRef.current.forEach((marker, id) => {
      if (!currentLocIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });
  }, [mapLoaded, locations, userCoords, isSharing, user?.id, profile?.uid]);

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
                mapInstanceRef.current.panTo({ lat, lng });
                mapInstanceRef.current.setZoom(14);
              }
            } catch {
              toast.error('Gagal memperbarui lokasi radar.');
            } finally {
              setIsUpdatingLocation(false);
            }
          },
          (err) => {
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
      mapInstanceRef.current.panTo(userCoords);
      mapInstanceRef.current.setZoom(15);
    } else {
      handleToggleSharing();
    }
  };

  const centerOnSchool = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(SMAN_59_COORDS);
      mapInstanceRef.current.setZoom(14);
    }
  };

  // Enhance locations with computed distance
  const enhancedLocations = locations.map((loc) => {
    let distanceKm: number | undefined;
    let distanceText: string | undefined;

    const baseCoords = userCoords || SMAN_59_COORDS;
    if (baseCoords && loc.lat && loc.lng) {
      distanceKm = calculateDistanceKm(baseCoords.lat, baseCoords.lng, loc.lat, loc.lng);
      distanceText = formatDistance(distanceKm);
    }

    return {
      ...loc,
      distanceKm,
      distanceText,
    };
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-3 py-3 space-y-3">
      {/* 1. Header Banner */}
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
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 ${
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
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <List size={14} />
              <span>Daftar Alumni ({locations.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-300">
            <Shield size={13} className="text-amber-400" />
            <span>{isSharing ? 'Lokasi kota Anda terlihat' : 'Lokasi Anda disembunyikan'}</span>
          </div>
        </div>
      </div>

      {/* 2. Map Container & Interactive Radar */}
      {viewMode === 'map' && (
        <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-card bg-slate-100 h-[520px]">
          {/* Map Target Canvas */}
          <div ref={mapContainerRef} className="w-full h-full" />

          {!mapLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-xs gap-3">
              <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-slate-600">Memuat Google Maps...</span>
            </div>
          )}

          {/* Map Floating Actions */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <button
              onClick={centerOnUser}
              className="p-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 text-slate-700 hover:text-brand-primary hover:bg-white transition-all active:scale-95"
              title="Pusatkan ke Lokasi Saya"
            >
              <Crosshair size={18} />
            </button>
            <button
              onClick={centerOnSchool}
              className="p-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 text-amber-600 hover:text-amber-700 hover:bg-white transition-all active:scale-95"
              title="Pusatkan ke SMAN 59"
            >
              <School size={18} />
            </button>
          </div>

          {/* Quick Counter Badge */}
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-md flex items-center gap-2 text-xs font-bold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{locations.length} Alumni Aktif</span>
            </div>
          </div>

          {/* Selected Alumni Floating Bottom Card */}
          {selectedAlumni && (
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-20 bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-slate-200 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
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
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-slate-100">
                <Link
                  href={`/chat/${selectedAlumni.userId}`}
                  className="flex items-center justify-center gap-1.5 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <MessageSquare size={13} />
                  <span>Sapa Chat</span>
                </Link>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedAlumni.lat},${selectedAlumni.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  <Navigation size={13} />
                  <span>Rute Maps</span>
                </a>
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
          ) : enhancedLocations.length === 0 ? (
            <EmptyState
              icon={<Compass size={28} />}
              title="Belum ada alumni yang membagikan lokasi"
              description="Jadilah yang pertama mengaktifkan Radar Alumni agar rekan sekelas di kota Anda bisa menyapa!"
              actionText={isSharing ? undefined : 'Aktifkan Radar Saya'}
              onAction={handleToggleSharing}
            />
          ) : (
            enhancedLocations.map((loc) => (
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
                    className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Petunjuk Arah Maps"
                  >
                    <Navigation size={15} />
                  </a>

                  <Link
                    href={`/chat/${loc.userId}`}
                    className="p-2 rounded-xl bg-blue-50 text-brand-primary hover:bg-blue-100 transition-colors"
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
