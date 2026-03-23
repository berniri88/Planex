import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plane, Bus as BusIcon, Train, Car, Navigation, Hotel, Map, Utensils, Box,
  UploadCloud, File as FileIcon, Trash2, MapPin
} from 'lucide-react';
import { Button } from './ui/Button';
import { useTripStore } from '../store/useTripStore';
import { type TravelItem, type TravelItemCategory, type LocationData, type Attachment } from '../lib/mockData';
import { cn } from '../lib/utils';
import { hapticFeedback } from '../lib/haptics';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  initialData?: TravelItem;
}

const CATEGORIES: { id: TravelItemCategory; label: string; icon: any }[] = [
  { id: 'vuelo', label: 'Vuelo', icon: Plane },
  { id: 'bus', label: 'Bus', icon: BusIcon },
  { id: 'tren', label: 'Tren', icon: Train },
  { id: 'taxi', label: 'Taxi', icon: Car },
  { id: 'otro_transporte', label: 'Transporte', icon: Navigation },
  { id: 'alojamiento', label: 'Hotel', icon: Hotel },
  { id: 'actividad', label: 'Actividad', icon: Map },
  { id: 'restaurante', label: 'Restaurante', icon: Utensils },
  { id: 'otros', label: 'Otros', icon: Box },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'ARS', 'BRL'];

// Magic Coordinate Parser
const parseMagicLocation = (input: string): LocationData => {
  const coordRegex = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;
  if (coordRegex.test(input.trim())) {
    const parts = input.split(',');
    return { 
      address: input, 
      lat: parseFloat(parts[0].trim()), 
      lng: parseFloat(parts[1].trim()) 
    };
  }
  return { address: input };
};

const isTransport = (type: TravelItemCategory) => 
  ['vuelo', 'bus', 'tren', 'taxi', 'otro_transporte'].includes(type);

export const ItemFormModal = ({ isOpen, onClose, mode, initialData }: ItemFormModalProps) => {
  const isView = mode === 'view';
  const { addItineraryItem, updateItineraryItem } = useTripStore((state: any) => ({
    addItineraryItem: state.addItineraryItem,
    updateItineraryItem: state.updateItineraryItem
  }));

  const [activeTab, setActiveTab] = useState<'info' | 'adjuntos'>('info');

  // Form State
  const [type, setType] = useState<TravelItemCategory>('vuelo');
  const [status, setStatus] = useState<TravelItem['status']>('idea');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const [origin, setOrigin] = useState<LocationData>({ address: '' });
  const [destination, setDestination] = useState<LocationData>({ address: '' });
  const [location, setLocation] = useState<LocationData>({ address: '' });
  
  const [estimatedCost, setEstimatedCost] = useState('');
  const [realCost, setRealCost] = useState('');
  const [currency, setCurrency] = useState('USD');
  
  const [reservationRef, setReservationRef] = useState('');
  const [notes, setNotes] = useState('');

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Search State
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<'origin' | 'destination' | 'location' | null>(null);

  // Debounced Search Logic with Photon (More lenient than Nominatim)
  useEffect(() => {
    const query = isSearching === 'origin' ? origin.address : 
                 isSearching === 'destination' ? destination.address : 
                 location.address;

    if (!isSearching || query.length < 3 || isView) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const resp = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`);
        const data = await resp.json();
        // Photon uses GeoJSON format: data.features
        setSearchResults(data.features || []);
      } catch (err) {
        console.error("Photon Search Error:", err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [origin.address, destination.address, location.address, isSearching, isView]);

  const selectAddress = (feature: any, target: 'origin' | 'destination' | 'location') => {
    const p = feature.properties;
    const addr = [p.name, p.street, p.city, p.country].filter(Boolean).join(', ');
    const data = {
      address: addr || p.name,
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0]
    };
    if (target === 'origin') setOrigin(data);
    else if (target === 'destination') setDestination(data);
    else setLocation(data);
    
    setIsSearching(null);
    setSearchResults([]);
  };

  useEffect(() => {
    if (isOpen) {
      if ((mode === 'edit' || mode === 'view') && initialData) {
        setType(initialData.type);
        setStatus(initialData.status);
        setName(initialData.name);
        setDescription(initialData.description || '');
        setUrl(initialData.url || '');
        setStartTime(initialData.start_time ? initialData.start_time.substring(0, 16) : '');
        setEndTime(initialData.end_time ? initialData.end_time.substring(0, 16) : '');
        setOrigin(initialData.origin || { address: '' });
        setDestination(initialData.destination || { address: '' });
        setLocation(initialData.location || { address: '' });
        setEstimatedCost(initialData.estimated_cost?.toString() || '');
        setRealCost(initialData.real_cost?.toString() || '');
        setCurrency(initialData.currency || 'USD');
        setReservationRef(initialData.reservation_ref || '');
        setNotes(initialData.notes || '');
        setAttachments(initialData.attachments || []);
      } else {
        setType('vuelo');
        setStatus('idea');
        setName('');
        setDescription('');
        setUrl('');
        setStartTime('');
        setEndTime('');
        setOrigin({ address: '' });
        setDestination({ address: '' });
        setLocation({ address: '' });
        setEstimatedCost('');
        setRealCost('');
        setCurrency('USD');
        setReservationRef('');
        setNotes('');
        setAttachments([]);
      }
      setActiveTab('info');
      setSearchResults([]);
    }
  }, [isOpen, mode, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isView) return;
    hapticFeedback('success');

    const itemPayload = {
      type,
      status,
      name,
      description,
      url,
      start_time: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
      end_time: endTime ? new Date(endTime).toISOString() : undefined,
      timezone: 'UTC',
      origin: isTransport(type) ? origin : undefined,
      destination: isTransport(type) ? destination : undefined,
      location: (!isTransport(type) && type !== 'actividad') ? location : (type === 'actividad' ? origin : undefined),
      estimated_cost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      real_cost: realCost ? parseFloat(realCost) : undefined,
      currency,
      reservation_ref: reservationRef,
      notes,
      attachments
    };

    if (type === 'actividad') {
       itemPayload.origin = origin;
       itemPayload.destination = destination;
       itemPayload.location = undefined;
    }

    if (mode === 'create') {
      addItineraryItem(itemPayload as any);
    } else if (initialData) {
      if(updateItineraryItem) updateItineraryItem(initialData.id, itemPayload);
    }
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || isView) return;

    if (attachments.length + files.length > 10) {
      alert("Máximo 10 archivos permitidos.");
      return;
    }

    const newAttachments: Attachment[] = [];
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`El archivo ${file.name} supera los 10MB.`);
        return;
      }
      newAttachments.push({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        url: URL.createObjectURL(file),
        referenceText: ''
      });
    });

    setAttachments([...attachments, ...newAttachments]);
  };

  const SelectedIcon = CATEGORIES.find(c => c.id === type)?.icon || Box;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-popover rounded-[2rem] shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] pointer-events-auto border border-border overflow-hidden relative"
          >
            {/* Header Tabs Navigation */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-secondary/50">
              <div className="flex gap-4 items-center flex-1">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mr-2">
                   <SelectedIcon size={20} />
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveTab('info')}
                  className={cn("text-sm font-bold tracking-tight rounded-xl px-4 py-2 hover:bg-black/5", activeTab === 'info' ? "bg-background shadow-sm border border-border" : "text-muted-foreground")}
                >
                  Información
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveTab('adjuntos')}
                  className={cn("text-sm font-bold tracking-tight rounded-xl px-4 py-2 hover:bg-black/5 flex items-center gap-2", activeTab === 'adjuntos' ? "bg-background shadow-sm border border-border" : "text-muted-foreground")}
                >
                  Adjuntos
                  {attachments.length > 0 && <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">{attachments.length}</span>}
                </Button>
              </div>
              
              <Button variant="ghost" size="sm" onClick={onClose} className="w-10 h-10 p-0 rounded-2xl bg-secondary border border-border ml-2">
                <X size={20} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              
              {activeTab === 'info' ? (
                <>
                  {/* Category Selection */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tipo</span>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                       {CATEGORIES.map((c) => (
                         <button
                           key={c.id}
                           type="button"
                           disabled={isView}
                           onClick={() => setType(c.id)}
                           className={cn(
                             "flex flex-col items-center justify-center p-4 rounded-[1.5rem] border-2 transition-all duration-300",
                             type === c.id ? "border-primary bg-primary/5 text-primary scale-105 shadow-sm" : "border-border bg-secondary text-muted-foreground hover:border-primary/30",
                             isView && type !== c.id && "opacity-40 grayscale"
                           )}
                         >
                           <c.icon size={20} className="mb-2" />
                           <span className="text-[10px] font-black uppercase tracking-wider">{c.label}</span>
                         </button>
                       ))}
                    </div>
                  </div>

                  {/* Status Segmented Control */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Estado</span>
                    <div className="flex p-1 bg-secondary border border-border rounded-2xl">
                      {['idea', 'tentativo', 'confirmado'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          disabled={isView}
                          onClick={() => setStatus(s as any)}
                          className={cn(
                            "flex-1 py-3 px-4 rounded-xl transition-all font-black text-[11px] uppercase tracking-widest",
                            status === s ? "bg-background text-primary shadow-sm scale-[1.02]" : "text-muted-foreground hover:text-foreground",
                            isView && status !== s && "hidden"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Título *</span>
                      <input readOnly={isView} required className="w-full px-6 py-4 bg-secondary rounded-[1.5rem] border-2 border-border focus:border-primary/30 outline-none text-sm font-bold transition-all" placeholder="Ej: Vuelo Buenos Aires -> Tokyo" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Descripción</span>
                      <textarea readOnly={isView} className="w-full px-6 py-4 bg-secondary rounded-[1.5rem] border-2 border-border focus:border-primary/30 outline-none text-sm font-medium min-h-[100px] resize-none transition-all" placeholder="Notas adicionales..." value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    {(!isView || url) && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">URL Reservación / Enlace</span>
                        <input readOnly={isView} type="url" className="w-full px-6 py-4 bg-secondary rounded-[1.5rem] border-2 border-border focus:border-primary/30 outline-none text-sm font-medium transition-all" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
                      </div>
                    )}
                  </div>

                  {/* Dates in 24h format */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Inicio (Formato 24h)</span>
                      <input readOnly={isView} required type="datetime-local" className="w-full px-6 py-4 bg-secondary rounded-[1.5rem] border-2 border-border focus:border-primary/30 outline-none text-sm font-bold transition-all" value={startTime} onChange={e => setStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Fin (Formato 24h)</span>
                      <input readOnly={isView} type="datetime-local" className="w-full px-6 py-4 bg-secondary rounded-[1.5rem] border-2 border-border focus:border-primary/30 outline-none text-sm font-medium transition-all" value={endTime} onChange={e => setEndTime(e.target.value)} />
                    </div>
                  </div>

                  {/* Searchable Location Input */}
                  {(isTransport(type) || type === 'actividad') ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {['origin', 'destination'].map((field: any) => (
                        <div key={field} className="space-y-2 relative">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{field === 'origin' ? 'Origen' : 'Destino'}</span>
                          <div className="relative">
                            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input 
                              readOnly={isView}
                              className="w-full pl-12 pr-6 py-4 bg-secondary rounded-[1.5rem] border-2 border-border focus:border-primary/30 outline-none text-sm font-medium transition-all" 
                              placeholder="Buscar dirección..." 
                              value={field === 'origin' ? origin.address : destination.address} 
                              onChange={e => {
                                const val = e.target.value;
                                const parsed = parseMagicLocation(val);
                                if (field === 'origin') setOrigin(parsed);
                                else setDestination(parsed);
                                if (!isView && !parsed.lat) setIsSearching(field);
                              }} 
                            />
                            {searchResults.length > 0 && isSearching === field && (
                              <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-popover border border-border rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                                {searchResults.map((f, i) => {
                                  const p = f.properties;
                                  const display = [p.name, p.city, p.country].filter(Boolean).join(', ');
                                  return (
                                    <button key={i} type="button" className="w-full p-3 text-left hover:bg-secondary text-xs border-b border-border last:border-0" onClick={() => selectAddress(f, field)}>
                                      {display}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2 relative">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ubicación</span>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input 
                          readOnly={isView}
                          className="w-full pl-12 pr-6 py-4 bg-secondary rounded-[1.5rem] border-2 border-border focus:border-primary/30 outline-none text-sm font-medium transition-all" 
                          placeholder="Buscar lugar..." 
                          value={location.address} 
                          onChange={e => {
                            const val = e.target.value;
                            const parsed = parseMagicLocation(val);
                            setLocation(parsed);
                            if (!isView && !parsed.lat) setIsSearching('location');
                          }} 
                        />
                         {searchResults.length > 0 && isSearching === 'location' && (
                            <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-popover border border-border rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                              {searchResults.map((f, i) => {
                                const p = f.properties;
                                const display = [p.name, p.city, p.country].filter(Boolean).join(', ');
                                return (
                                  <button key={i} type="button" className="w-full p-3 text-left hover:bg-secondary text-xs border-b border-border last:border-0" onClick={() => selectAddress(f, 'location')}>
                                    {display}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Economic Data */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Estimado</span>
                      <input readOnly={isView} type="number" step="0.01" className="w-full px-6 py-4 bg-secondary rounded-[1.5rem] border-2 border-border focus:border-primary/30 outline-none text-sm font-bold transition-all" placeholder="0.00" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Costo Real</span>
                      <input readOnly={isView} type="number" step="0.01" className="w-full px-6 py-4 bg-secondary rounded-[1.5rem] border-2 border-border focus:border-primary/30 outline-none text-sm font-bold transition-all" placeholder="0.00" value={realCost} onChange={e => setRealCost(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Moneda</span>
                       <select disabled={isView} className="w-full px-6 py-4 bg-secondary rounded-[1.5rem] border-2 border-border focus:border-primary/30 outline-none text-sm font-bold transition-all appearance-none" value={currency} onChange={e => setCurrency(e.target.value)}>
                         {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                  </div>

                  {/* References & Notes */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Referencia Reserva</span>
                      <input readOnly={isView} className="w-full px-6 py-4 bg-secondary rounded-[1.5rem] border-2 border-border focus:border-primary/30 outline-none text-sm font-bold transition-all uppercase" placeholder="Ej: ABC123XYZ" value={reservationRef} onChange={e => setReservationRef(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Notas</span>
                      <textarea readOnly={isView} className="w-full px-6 py-4 bg-secondary rounded-[1.5rem] border-2 border-border focus:border-primary/30 outline-none text-sm font-medium min-h-[80px] resize-none transition-all" placeholder="Notas internas..." value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-8">
                  {!isView && (
                    <div className="relative border-2 border-dashed border-border hover:border-primary/50 bg-secondary rounded-[2rem] p-10 flex flex-col items-center justify-center text-center transition-all group overflow-hidden">
                      <input 
                        type="file" 
                        multiple 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        onChange={handleFileUpload}
                      />
                      <div className="w-16 h-16 rounded-3xl bg-background flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                        <UploadCloud size={24} />
                      </div>
                      <h4 className="text-lg font-black tracking-tight mb-2">Subir archivos</h4>
                      <p className="text-xs text-muted-foreground max-w-xs">PDFs, imágenes o documentos (Máx. 10MB).</p>
                    </div>
                  )}

                  {attachments.length > 0 && (
                    <div className="space-y-4">
                      {attachments.map((att, idx) => (
                        <div key={att.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-secondary border border-border rounded-[1.5rem] items-start sm:items-center">
                          <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center flex-shrink-0">
                             <FileIcon size={18} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-2 w-full">
                             <p className="text-sm font-bold truncate">{att.name}</p>
                             <input 
                               readOnly={isView}
                               className="w-full text-xs px-3 py-2 bg-background border border-border rounded-lg"
                               placeholder="Referencia..."
                               value={att.referenceText}
                               onChange={(e) => {
                                 const newAtt = [...attachments];
                                 newAtt[idx].referenceText = e.target.value;
                                 setAttachments(newAtt);
                               }}
                             />
                          </div>
                          {!isView && (
                            <Button variant="destructive" size="sm" type="button" className="w-10 h-10 p-0 rounded-xl" onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))}>
                               <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="sticky bottom-0 bg-popover/80 backdrop-blur-xl border-t border-border p-4 -mx-8 -mb-8 mt-12 flex items-center justify-end gap-3 z-20">
                <Button variant="ghost" type="button" onClick={onClose} className="rounded-2xl">
                  {isView ? 'Cerrar' : 'Cancelar'}
                </Button>
                {!isView && (
                  <Button type="submit" className="rounded-2xl px-8 shadow-xl">
                    {mode === 'create' ? 'Crear Ítem' : 'Guardar'}
                  </Button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
