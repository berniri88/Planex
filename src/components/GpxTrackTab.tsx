import React, { useEffect, useRef, useState } from 'react';
import gpxParser from 'gpxparser';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { UploadCloud, Map as MapIcon, Activity, Trash2, Loader2, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Access Leaflet from global (CDN)
const L = (window as any).L;

interface GpxTrackTabProps {
  itemType: string;
  gpxUrl?: string;
  onGpxUrlChange: (url: string | undefined) => void;
  isViewOnly?: boolean;
}

interface ElevationPoint {
  distance: number;
  elevation: number;
  lat: number;
  lng: number;
  formattedDistance: string;
}

export const GpxTrackTab: React.FC<GpxTrackTabProps> = ({ 
  itemType, 
  gpxUrl, 
  onGpxUrlChange,
  isViewOnly 
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const trackLayerRef = useRef<any>(null);
  const cursorMarkerRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [elevationData, setElevationData] = useState<ElevationPoint[]>([]);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [stats, setStats] = useState<{ distance: number; gain: number; loss: number } | null>(null);

  // Parse GPX track
  const fetchAndParseGpx = async (url: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(url);
      const gpxText = await response.text();
      
      const gpx = new gpxParser();
      gpx.parse(gpxText);
      
      if (gpx.tracks.length > 0) {
        const track = gpx.tracks[0];
        const points = track.points.map((p: any, i: number) => {
          const cumul = (track.distance.cumul as any)[i];
          return {
            distance: cumul / 1000, // km
            elevation: p.ele || 0,
            lat: p.lat,
            lng: p.lon,
            formattedDistance: (cumul / 1000).toFixed(2)
          };
        });

        setElevationData(points);
        setStats({
          distance: track.distance.total / 1000,
          gain: track.elevation.pos || 0,
          loss: track.elevation.neg || 0
        });

        updateMapTrack(points);
      }
    } catch (error) {
      console.error('Error parsing GPX:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMapTrack = (points: ElevationPoint[]) => {
    if (!mapRef.current || !L || points.length === 0) return;

    // Clear existing layers
    if (trackLayerRef.current) mapRef.current.removeLayer(trackLayerRef.current);
    
    const latLngs = points.map(p => [p.lat, p.lng] as [number, number]);
    
    // Draw track with a nice gradient-like effect (glow)
    trackLayerRef.current = L.polyline(latLngs, {
      color: 'hsl(var(--primary))',
      weight: 5,
      opacity: 0.8,
      lineJoin: 'round'
    }).addTo(mapRef.current);

    // Fit bounds
    mapRef.current.fitBounds(trackLayerRef.current.getBounds(), { padding: [30, 30] });
  };

  useEffect(() => {
    if (gpxUrl) {
      fetchAndParseGpx(gpxUrl);
    } else {
      setElevationData([]);
      setStats(null);
      if (trackLayerRef.current) mapRef.current?.removeLayer(trackLayerRef.current);
      if (cursorMarkerRef.current) mapRef.current?.removeLayer(cursorMarkerRef.current);
    }
  }, [gpxUrl]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || !L || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([0, 0], 2);

    const isDark = document.documentElement.classList.contains('dark');
    const tileUrl = isDark 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    
    L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Cursor Marker
  useEffect(() => {
    if (!mapRef.current || !L || activePointIndex === null || !elevationData[activePointIndex]) {
      if (cursorMarkerRef.current) {
        mapRef.current?.removeLayer(cursorMarkerRef.current);
        cursorMarkerRef.current = null;
      }
      return;
    }

    const point = elevationData[activePointIndex];
    const latlng = [point.lat, point.lng] as [number, number];

    if (!cursorMarkerRef.current) {
      const icon = L.divIcon({
        className: 'gpx-cursor-marker',
        html: `<div class="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      cursorMarkerRef.current = L.marker(latlng, { icon }).addTo(mapRef.current);
    } else {
      cursorMarkerRef.current.setLatLng(latlng);
    }
  }, [activePointIndex, elevationData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isViewOnly) return;

    setIsLoading(true);
    try {
      // Debug: list all buckets to see what's available to the app
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      console.log('Available buckets:', buckets, 'Error:', bucketsError);
      if (buckets && !buckets.find(b => b.id === 'gpx_tracks')) {
          console.warn('Bucket "gpx_tracks" NOT found in the list:', buckets.map(b => b.id));
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `tracks/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gpx_tracks')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gpx_tracks')
        .getPublicUrl(filePath);

      onGpxUrlChange(publicUrl);
    } catch (error: any) {
      console.error('Error uploading GPX:', error);
      alert(`Error al subir el archivo: ${error.message || 'Desconocido'}. Asegúrate que exista el bucket "gpx_tracks" y tenga políticas RLS.`);
    } finally {
      setIsLoading(false);
    }
  };

  const removeGpx = () => {
    if (confirm('¿Eliminar track GPX?')) {
      onGpxUrlChange(undefined);
    }
  };

  if (itemType !== 'actividad') return null;

  return (
    <div className="space-y-6 h-full flex flex-col p-8">
      {!gpxUrl ? (
        <div className="flex-1 flex flex-col">
          <div className="relative border-4 border-dashed border-border hover:border-primary/50 bg-secondary rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center transition-all group overflow-hidden flex-1">
            <input 
              type="file" 
              accept=".gpx"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              onChange={handleFileUpload}
              disabled={isLoading || isViewOnly}
            />
            <div className="w-20 h-20 rounded-[2rem] bg-background flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all shadow-xl">
              {isLoading ? <Loader2 size={32} className="animate-spin" /> : <UploadCloud size={32} />}
            </div>
            <h4 className="text-xl font-black tracking-tight mb-2">Cargar Track GPX</h4>
            <p className="text-sm text-muted-foreground max-w-xs">Sube tu recorrido para verlo en el mapa y analizar el perfil de elevación.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 min-h-0">
          {/* Header Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-secondary/50 rounded-[1.5rem] p-4 border border-border flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <MapIcon size={18} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Distancia</p>
                    <p className="text-lg font-black italic">{stats.distance.toFixed(2)} km</p>
                 </div>
              </div>
              <div className="bg-secondary/50 rounded-[1.5rem] p-4 border border-border flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                    <Activity size={18} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ganancia</p>
                    <p className="text-lg font-black italic text-green-500">+{stats.gain.toFixed(0)}m</p>
                 </div>
              </div>
              <div className="relative">
                <div className="bg-secondary/50 rounded-[1.5rem] p-4 border border-border flex items-center gap-3 h-full">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                      <Activity size={18} className="rotate-180" />
                  </div>
                  <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pérdida</p>
                      <p className="text-lg font-black italic text-red-500">-{stats.loss.toFixed(0)}m</p>
                  </div>
                </div>
                {!isViewOnly && (
                  <button 
                    onClick={removeGpx}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Map Preview */}
          <div className="flex-[2] relative rounded-[2rem] overflow-hidden border-2 border-border shadow-inner bg-secondary/10">
             <div ref={mapContainerRef} className="w-full h-full z-0" />
             {!isViewOnly && (
               <button 
                 onClick={removeGpx}
                 className="absolute top-4 right-4 z-10 w-10 h-10 rounded-xl bg-destructive text-white flex items-center justify-center shadow-xl hover:scale-110 transition-all"
               >
                 <Trash2 size={18} />
               </button>
             )}
          </div>

          {/* Elevation Profile */}
          <div className="flex-1 bg-secondary/30 rounded-[2rem] p-6 border border-border flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Perfil de Elevación</span>
              {activePointIndex !== null && elevationData[activePointIndex] && (
                <div className="flex gap-4">
                  <span className="text-[10px] font-bold text-primary italic uppercase tracking-widest">
                    Alt: {elevationData[activePointIndex].elevation.toFixed(0)}m
                  </span>
                  <span className="text-[10px] font-bold text-primary italic uppercase tracking-widest">
                    Dist: {elevationData[activePointIndex].formattedDistance}km
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={elevationData} 
                  onMouseMove={(e: any) => {
                    if (e && e.activeTooltipIndex !== undefined) {
                      setActivePointIndex(e.activeTooltipIndex);
                    }
                  }}
                  onMouseLeave={() => setActivePointIndex(null)}
                >
                  <defs>
                    <linearGradient id="colorEle" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="distance" 
                    hide 
                  />
                  <YAxis 
                    domain={['dataMin - 50', 'dataMax + 50']} 
                    hide 
                  />
                  <Tooltip 
                    content={() => null} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="elevation" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorEle)" 
                    isAnimationActive={false}
                  />
                  {activePointIndex !== null && (
                    <ReferenceLine x={elevationData[activePointIndex]?.distance} stroke="hsl(var(--primary))" strokeDasharray="3 3" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Manual Install Hint (only if libraries might be missing) */}
      {!gpxParser && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
          <Info size={18} className="text-amber-500" />
          <p className="text-[11px] font-bold text-amber-500 uppercase">
            Instala las librerías: <code className="bg-amber-500/10 px-2 py-0.5 rounded">npm install gpxparser recharts</code>
          </p>
        </div>
      )}
    </div>
  );
};
