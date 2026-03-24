import React, { useEffect, useRef, useState } from 'react';
import { useTripStore } from '../store/useTripStore';
import { ItemFormModal, CATEGORIES } from './ItemFormModal';
import { type TravelItem } from '../lib/mockData';
import { Navigation, Edit3, Calendar, Box, ChevronUp, ChevronDown, X, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import gpxParser from 'gpxparser';
import { renderToString } from 'react-dom/server';

// Access Leaflet from global (CDN)
const L = (window as any).L;

export const MapView = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const activeBranchId = useTripStore(state => state.activeBranchId);
  const rawItems = useTripStore(state => state.itineraryItems);
  
  // Memoize visible items for stability
  const items = React.useMemo(() => {
    return rawItems
      .filter(item => item.branchId === activeBranchId)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [rawItems, activeBranchId]);

  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [selectedMapItemId, setSelectedMapItemId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedItem, setSelectedItem] = useState<TravelItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  
  const [tracks, setTracks] = useState<Record<string, any>>({});
  
  // Ref to store current selected ID for listeners
  const selectedRef = useRef<string | null>(null);
  useEffect(() => { selectedRef.current = selectedMapItemId; }, [selectedMapItemId]);

  // Fetch GPX tracks
  useEffect(() => {
    const itemsWithGpx = items.filter(i => i.gpx_url && !tracks[i.id]);
    if (itemsWithGpx.length === 0) return;

    itemsWithGpx.forEach(async (item) => {
      try {
        const response = await fetch(item.gpx_url!);
        const gpxText = await response.text();
        
        const parser = new gpxParser();
        parser.parse(gpxText);
        
        const trackPoints = parser.tracks[0].points.map((p: any) => [p.lat, p.lon]);
        setTracks(prev => ({ ...prev, [item.id]: trackPoints }));
      } catch (err) {
        console.error(`Error loading GPX for item ${item.id}:`, err);
      }
    });
  }, [items, tracks]);

  useEffect(() => {
    if (!mapContainerRef.current || !L) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([0, 0], 2);

      const isDark = document.documentElement.classList.contains('dark');
      const tileUrl = isDark 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      
      L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(mapRef.current);

      mapRef.current.on('mousemove', (e: any) => {
        setMousePos({ x: e.containerPoint.x, y: e.containerPoint.y });
      });

      mapRef.current.on('click', () => {
        setSelectedMapItemId(null);
      });
    }

    const map = mapRef.current;
    
    // REDRAW only on items change or hoveredItemId/selectedMapItemId change
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    items.forEach((item) => {
      const isHighlighted = hoveredItemId === item.id || selectedMapItemId === item.id;
      const points: [number, number][] = [];
      const gpxPoints = tracks[item.id];
      const Icon = CATEGORIES.find(c => c.id === item.type)?.icon || Navigation;
      
      if (item.origin?.lat && item.origin?.lng) points.push([item.origin.lat as number, item.origin.lng as number]);
      if (item.destination?.lat && item.destination?.lng) points.push([item.destination.lat as number, item.destination.lng as number]);
      if (!points.length && item.location?.lat && item.location?.lng) points.push([item.location.lat as number, item.location.lng as number]);

      if (gpxPoints) {
        // Invisible wide catcher for better hover interaction
        const trackCatcher = L.polyline(gpxPoints, { color: 'transparent', weight: 25, opacity: 0 }).addTo(map);
        trackCatcher.on('mouseover', () => setHoveredItemId(item.id));
        trackCatcher.on('mouseout', () => setHoveredItemId(null));
        trackCatcher.on('click', (e: any) => {
          setSelectedMapItemId(item.id);
          L.DomEvent.stopPropagation(e);
        });

        const trackPolyline = L.polyline(gpxPoints, {
          color: isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.4)',
          weight: isHighlighted ? 6 : 4,
          opacity: isHighlighted ? 1 : 0.7,
          className: isHighlighted ? 'gpx-track-highlight' : 'gpx-track-dim'
        }).addTo(map);

        if (isHighlighted) trackPolyline.bringToFront();
        if (points.length === 0 && gpxPoints.length > 0) {
           points.push(gpxPoints[0]);
           points.push(gpxPoints[gpxPoints.length - 1]);
        }
      }

      if (points.length > 0) {
        points.forEach((p, idx) => {
          const icon = L.divIcon({
            className: 'custom-map-marker-with-label',
            html: renderToString(
              <div className="relative">
                <div className={cn(
                  "w-10 h-10 transition-all duration-400 flex items-center justify-center backdrop-blur-xl rounded-full border-2 shadow-sm relative z-20",
                  isHighlighted ? "bg-primary text-white border-primary shadow-xl shadow-primary/40 scale-125" : "bg-popover/80 text-primary border-border"
                )}>
                  <Icon size={20} />
                </div>
                
                {/* Detailed Label (CSS Transition instead of motion) */}
                {selectedMapItemId === item.id && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-10 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-background/95 backdrop-blur-2xl border border-border px-4 py-2.5 rounded-[1.2rem] shadow-2xl min-w-[200px] ring-4 ring-primary/5 flex flex-col items-center text-center">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Calendar size={12} className="text-primary" />
                        <span className="text-[10px] font-black tracking-widest uppercase">
                          {idx === 0 ? 'Salida' : 'Llegada'}
                        </span>
                      </div>
                      <p className="text-sm font-black italic tracking-tighter leading-none mb-1">
                        {new Date(idx === 0 ? item.start_time : (item.end_time || item.start_time)).toLocaleDateString([], { day: '2-digit', month: 'short' })} • {new Date(idx === 0 ? item.start_time : (item.end_time || item.start_time)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-bold truncate max-w-[220px]">
                        {(idx === 0 ? item.origin?.address : item.destination?.address) || item.location?.address || 'Sin dirección'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ),
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });

          const marker = L.marker(p, { 
            icon,
            zIndexOffset: isHighlighted ? 1000 : 0 
          }).addTo(map);
          marker.on('mouseover', () => setHoveredItemId(item.id));
          marker.on('mouseout', () => setHoveredItemId(null));
          marker.on('click', (e: any) => {
            setSelectedMapItemId(item.id);
            L.DomEvent.stopPropagation(e);
          });
        });

        if (points.length > 1 && !gpxPoints) {
          const catcher = L.polyline(points, { color: 'transparent', weight: 25, opacity: 0 }).addTo(map);
          catcher.on('mouseover', () => setHoveredItemId(item.id));
          catcher.on('mouseout', () => setHoveredItemId(null));
          catcher.on('click', (e: any) => {
            setSelectedMapItemId(item.id);
            L.DomEvent.stopPropagation(e);
          });

          const polyline = L.polyline(points, {
            color: 'hsl(var(--primary))',
            weight: isHighlighted ? 5 : 3,
            opacity: isHighlighted ? 1 : 0.6,
            dashArray: '8, 8',
            className: 'trajectory-pulse'
          }).addTo(map);

          if (isHighlighted) {
            polyline.bringToFront();
          }
        }
      }
    });

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [items, hoveredItemId, selectedMapItemId, tracks]);

  useEffect(() => {
    if (!mapRef.current || items.length === 0) return;
    const map = mapRef.current;
    
    const bounds = L.latLngBounds([]);
    items.forEach(item => {
      if (item.origin?.lat && item.origin?.lng) {
        bounds.extend([item.origin.lat as number, item.origin.lng as number]);
      }
      if (item.destination?.lat && item.destination?.lng) {
        bounds.extend([item.destination.lat as number, item.destination.lng as number]);
      }
      if (item.location?.lat && item.location?.lng) {
        bounds.extend([item.location.lat as number, item.location.lng as number]);
      }
      
      // Also extend bounds for GPX tracks
      if (tracks[item.id]) {
        tracks[item.id].forEach((p: [number, number]) => bounds.extend(p));
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [100, 100], maxZoom: 12 });
    }
  }, [items, tracks]);

  const lastHoveredItem = items.find(i => i.id === hoveredItemId) || (items.length > 0 ? items[0] : null);

  return (
    <div className="relative w-full h-[calc(100vh-140px)] rounded-[2rem] sm:rounded-[3rem] overflow-hidden border-2 border-border shadow-2xl bg-secondary/20 flex group/map">
      
      {/* Mobile Map Floating Toggle */}
      <button 
        onClick={() => setIsListCollapsed(false)}
        className={cn(
           "md:hidden absolute top-1/2 -translate-y-1/2 left-0 z-30 w-8 h-16 rounded-r-2xl border-y border-r border-border bg-popover/90 backdrop-blur-md flex items-center justify-center shadow-2xl text-primary transition-transform active:scale-95",
           !isListCollapsed && "-translate-x-full opacity-0"
        )}
      >
        <ChevronRight size={24} />
      </button>

      {/* Collapsible Sidebar */}
      <div
        className={cn(
          "h-full bg-popover/90 backdrop-blur-2xl border-r border-border flex flex-col z-40 overflow-hidden absolute md:relative left-0 top-0 transition-all duration-300 shadow-2xl md:shadow-none",
          isListCollapsed ? "-translate-x-full md:translate-x-0 md:w-[80px]" : "translate-x-0 w-[85%] sm:w-[320px] md:w-[320px]"
        )}
      >
        <div className="p-4 sm:p-6 border-b border-border bg-secondary/30 flex items-center justify-between shrink-0">
           {!isListCollapsed && (
             <div className="flex items-center gap-3">
                <Box size={16} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Journey Items</span>
             </div>
           )}
           <button 
             onClick={() => setIsListCollapsed(!isListCollapsed)}
             className={cn(
               "w-10 h-10 rounded-2xl bg-background border border-border flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm",
               isListCollapsed && "mx-auto"
             )}
           >
              {isListCollapsed ? <ChevronUp className="rotate-90 hidden md:block" size={16} /> : <ChevronDown className="rotate-90 hidden md:block" size={16} />}
              <X className="block md:hidden" size={16} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pb-8 space-y-1">
          {(isListCollapsed && lastHoveredItem ? [lastHoveredItem] : items).map((item) => {
            const isHovered = hoveredItemId === item.id;
            const isSelected = selectedMapItemId === item.id;
            const Icon = CATEGORIES.find(c => c.id === item.type)?.icon || Navigation;
            
            return (
              <motion.div 
                key={item.id}
                onMouseEnter={() => setHoveredItemId(item.id)}
                onMouseLeave={() => setHoveredItemId(null)}
                onClick={() => {
                  setSelectedMapItemId(item.id === selectedMapItemId ? null : item.id);
                  if (window.innerWidth < 768) setIsListCollapsed(true);
                  if (!mapRef.current) return;
                  const bounds = L.latLngBounds([]);
                  if (item.origin?.lat) bounds.extend([item.origin.lat as number, item.origin.lng as number]);
                  if (item.destination?.lat) bounds.extend([item.destination.lat as number, item.destination.lng as number]);
                  if (item.location?.lat) bounds.extend([item.location.lat as number, item.location.lng as number]);
                  if (tracks[item.id]) tracks[item.id].forEach((p: [number, number]) => bounds.extend(p));
                  if (bounds.isValid()) mapRef.current.fitBounds(bounds, { padding: [150, 150], maxZoom: 15, animate: true });
                }}
                className={cn(
                  "group flex items-center gap-4 p-3 rounded-[1.4rem] transition-all relative overflow-hidden ring-1 ring-transparent cursor-pointer",
                  (isHovered || isSelected) ? "bg-primary/20 ring-primary/30" : "hover:bg-secondary/50",
                  isSelected && "ring-primary/50 bg-primary/25",
                  isListCollapsed && "justify-center px-0"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300",
                  (isHovered || isSelected) ? "bg-primary text-white border-primary" : "bg-secondary text-primary border-border"
                )}>
                   <Icon size={18} />
                </div>
                {!isListCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate tracking-tighter italic leading-none">{item.name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5 flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
                        <Calendar size={10} className="shrink-0" />
                        <span>{new Date(item.start_time).toLocaleDateString([], { day: '2-digit', month: 'short' })} {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                        {item.end_time && (
                          <>
                            <span className="opacity-50 mx-0.5">{'>'}</span>
                            <span>{new Date(item.end_time).toLocaleDateString([], { day: '2-digit', month: 'short' })} {new Date(item.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <button 
                       onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setIsModalOpen(true); }}
                       className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-all absolute right-4"
                    >
                      <Edit3 size={14} />
                    </button>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative h-full">
        <div ref={mapContainerRef} className="z-0 w-full h-full" />
        
        {/* HUD Headers (Stable on Map) */}
        <div className="absolute bottom-8 left-8 sm:top-8 sm:bottom-auto z-10 pointer-events-none">
          <h4 className="text-2xl sm:text-3xl font-black tracking-tighter italic text-foreground drop-shadow-sm select-none">Planex Atlas</h4>
          <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground mt-1 sm:mt-2">Interactive Itinerary Tool</p>
        </div>

        {/* Mouse-Following Tooltip HUD (Rich Content) */}
        <AnimatePresence>
          {hoveredItemId && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1, x: mousePos.x + 20, y: mousePos.y + 20 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute pointer-events-none z-50 p-3 bg-background/95 backdrop-blur-2xl border border-primary/20 rounded-[1.4rem] shadow-2xl ring-4 ring-primary/5 min-w-[200px]"
            >
               {(() => {
                 const item = items.find(i => i.id === hoveredItemId);
                 if (!item) return null;
                 const Icon = CATEGORIES.find(c => c.id === item.type)?.icon || Navigation;
                 
                 return (
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                       <Icon size={20} />
                     </div>
                     <div className="min-w-0 pr-2">
                       <p className="text-sm font-black italic tracking-tighter truncate leading-none">{item.name}</p>
                       <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5 flex items-center gap-2">
                         <Calendar size={10} />
                         {new Date(item.start_time).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                       </p>
                     </div>
                   </div>
                 );
               })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ItemFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        mode="edit" 
        initialData={selectedItem || undefined} 
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .marker-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .trajectory-pulse {
          stroke-dasharray: 10, 10;
          animation: dashLinear 20s linear infinite;
          cursor: pointer !important;
        }
        .trajectory-pulse:hover {
          stroke-width: 6;
          opacity: 1;
          filter: drop-shadow(0 0 4px hsl(var(--primary)));
        }
        @keyframes dashLinear {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        .leaflet-container {
          background: transparent !important;
        }
        .custom-map-marker-with-label {
          background: transparent !important;
          border: none !important;
          overflow: visible !important;
        }
      `}} />
    </div>
  );
};
