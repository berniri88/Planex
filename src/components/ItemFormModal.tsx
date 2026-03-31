import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plane, Bus as BusIcon, Train, Car, Navigation, Hotel, Map, Utensils, Box,  MapPin, 
  UploadCloud, 
  Trash2, 
  FileIcon, 
  ChevronDown, 
  CheckCircle2, 
  Lightbulb, 
  Check,
  CreditCard,
  Clock,
  Info,
  Calendar as CalendarIcon,
  Paperclip,
  MoreHorizontal,
  Copy, Download,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { useTripStore } from '../store/useTripStore';
import { type TravelItem, type TravelItemCategory, type LocationData, type Attachment } from '../lib/types';
import { cn, downloadItemInfo } from '../lib/utils';
import { hapticFeedback } from '../lib/haptics';
import { getHomeTimezone, formatForInput } from '../lib/timezone';
import { MootsTimePicker } from './MootsDatePicker';
import { GpxTrackTab } from './GpxTrackTab';
import { DeleteConfirmModal } from './ui/DeleteConfirmModal';
import { IconPickerModal, ICON_LIST } from './ui/IconPickerModal';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view' | 'duplicate';
  initialData?: TravelItem;
  initialTab?: 'info' | 'costos' | 'adjuntos' | 'gpx';
}

export const CATEGORIES: { id: TravelItemCategory; label: string; icon: any }[] = [
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

const STATUS_OPTIONS = [
  { id: 'idea', label: 'Idea', icon: Lightbulb },
  { id: 'tentativo', label: 'Tentativo', icon: Clock },
  { id: 'confirmado', label: 'Confirmado', icon: CheckCircle2 },
];

const PAYMENT_STATUS_OPTIONS = [
  { id: 'reference', label: 'Referencia', icon: Info },
  { id: 'reserved', label: 'Reserva (Pago 0)', icon: Clock },
  { id: 'partial', label: 'Pago Parcial', icon: CreditCard },
  { id: 'paid', label: 'Pagado', icon: CheckCircle2 },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'ARS', 'BRL', 'CLP', 'MXN'];

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

const CustomDropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  disabled 
}: { 
  options: { id: string; label: string; icon?: any }[];
  value: string;
  onChange: (id: any) => void;
  placeholder: string;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.id === value);

  return (
    <div className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-secondary rounded-[var(--radius-lg)] border-2 border-border focus:border-primary/30 outline-none text-sm font-bold transition-all hover:bg-secondary/80"
      >
        <div className="flex items-center gap-3 truncate">
          {selectedOption ? (
            <>
              {selectedOption.icon && <selectedOption.icon size={18} className="text-primary flex-shrink-0" />}
              <span className="truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={16} className={cn("text-muted-foreground transition-transform flex-shrink-0 ml-2", isOpen && "rotate-180")} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[150]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-[var(--radius-lg)] shadow-2xl overflow-hidden z-[160] max-h-60 overflow-y-auto"
            >
              <div className="p-1.5 space-y-1">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-[var(--radius-md)] transition-all",
                      value === opt.id ? "bg-primary text-white" : "hover:bg-secondary text-foreground"
                    )}
                  >
                    {opt.icon && <opt.icon size={18} className={cn("flex-shrink-0", value === opt.id ? "text-white" : "text-muted-foreground")} />}
                    <span className="truncate">{opt.label}</span>
                    {value === opt.id && <Check size={14} className="ml-auto flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ItemFormModal = ({ isOpen, onClose, mode, initialData, initialTab }: ItemFormModalProps) => {
  const isView = mode === 'view';
  const { addItineraryItem, updateItineraryItem, removeItineraryItem, getActiveTrip } = useTripStore((state: any) => ({
    addItineraryItem: state.addItineraryItem,
    updateItineraryItem: state.updateItineraryItem,
    removeItineraryItem: state.removeItineraryItem,
    getActiveTrip: state.getActiveTrip
  }));

  const trip = getActiveTrip();

  const [activeTab, setActiveTab] = useState<'info' | 'costos' | 'adjuntos' | 'gpx'>('info');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
  const [paymentStatus, setPaymentStatus] = useState<'reference' | 'reserved' | 'partial' | 'paid'>('reference');
  const [nextPaymentAmount, setNextPaymentAmount] = useState('');
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  
  const [reservationRef, setReservationRef] = useState('');
  const [notes, setNotes] = useState('');
  const [gpxUrl, setGpxUrl] = useState<string | undefined>(undefined);

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Search State
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<'origin' | 'destination' | 'location' | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [customIconName, setCustomIconName] = useState<string | undefined>(undefined);

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
        setSearchResults(data.features || []);
      } catch (err) {
        console.error("Photon Search Error:", err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [origin.address, destination.address, location.address, isSearching, isView]);

  const selectAddress = (feature: any, target: 'origin' | 'destination' | 'location') => {
    const p = feature.properties;
    const currentInput = (target === 'origin' ? origin.address : (target === 'destination' ? destination.address : location.address)) || '';
    
    const inputNumber = currentInput.match(/\b\d+\b/)?.[0];
    const hasNum = p.housenumber || inputNumber;
    
    let baseAddr = p.street || p.name;
    let locationParts = [p.city, p.country].filter(Boolean).join(', ');
    
    let finalAddr = baseAddr;
    if (hasNum && !baseAddr.includes(hasNum)) {
      finalAddr = `${baseAddr} ${hasNum}`;
    }
    if (locationParts) {
      finalAddr = `${finalAddr}, ${locationParts}`;
    }

    const data = {
      address: finalAddr || p.name,
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
      if ((mode === 'edit' || mode === 'view' || mode === 'duplicate') && initialData) {
        setType(initialData.type);
        setStatus(initialData.status);
        setName(initialData.name);
        setDescription(initialData.description || '');
        setUrl(initialData.url || '');
        setStartTime(initialData.start_time ? formatForInput(initialData.start_time, initialData.timezone || getHomeTimezone()) : '');
        setEndTime(initialData.end_time ? formatForInput(initialData.end_time, initialData.timezone || getHomeTimezone()) : '');
        setOrigin(initialData.origin || { address: '' });
        setDestination(initialData.destination || { address: '' });
        setLocation(initialData.location || { address: '' });
        setEstimatedCost(initialData.estimated_cost?.toString() || '');
        setRealCost(initialData.real_cost?.toString() || '');
        setCurrency(initialData.currency || 'USD');
        setPaymentStatus(initialData.payment_status || 'reference');
        setNextPaymentAmount(initialData.next_payment_amount?.toString() || '');
        setNextPaymentDate(initialData.next_payment_date || '');
        setReservationRef(initialData.reservation_ref || '');
        setNotes(initialData.notes || '');
        setAttachments(initialData.attachments || []);
        setGpxUrl(initialData.gpx_url);
        setCustomIconName(initialData.custom_icon);
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
        setPaymentStatus('reference');
        setNextPaymentAmount('');
        setNextPaymentDate('');
        setReservationRef('');
        setNotes('');
        setAttachments([]);
        setGpxUrl(undefined);
        setCustomIconName(undefined);
      }
      setActiveTab(initialTab || 'info');
      setSearchResults([]);
    }
  }, [isOpen, mode, initialData, initialTab]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      timezone: trip?.destinationTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      origin: isTransport(type) ? origin : undefined,
      destination: isTransport(type) ? destination : undefined,
      location: (!isTransport(type) && type !== 'actividad') ? location : (type === 'actividad' ? origin : undefined),
      estimated_cost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      real_cost: realCost ? parseFloat(realCost) : undefined,
      currency,
      payment_status: paymentStatus,
      next_payment_amount: nextPaymentAmount ? parseFloat(nextPaymentAmount) : undefined,
      next_payment_date: nextPaymentDate || undefined,
      reservation_ref: reservationRef,
      notes,
      attachments,
      gpx_url: gpxUrl,
      custom_icon: type === 'otros' ? customIconName : undefined
    };

    if (type === 'actividad') {
       itemPayload.origin = origin;
       itemPayload.destination = destination;
       itemPayload.location = undefined;
    }

    if (mode === 'create' || mode === 'duplicate') {
      addItineraryItem(itemPayload as any);
    } else if (initialData && mode === 'edit') {
      if(updateItineraryItem) updateItineraryItem(initialData.id, itemPayload);
    }
    onClose();
  };

  const handleDelete = () => {
    if (initialData && removeItineraryItem) {
      removeItineraryItem(initialData.id);
      hapticFeedback('warning');
      onClose();
    }
  };

  const handleDuplicate = () => {
    if (initialData) {
       addItineraryItem({ 
         ...initialData, 
         id: undefined as any, 
         name: initialData.name + ' (Copia)',
         branchId: trip?.activeBranchId
       } as any);
       hapticFeedback('success');
       onClose();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || isView) return;

    if (attachments.length + files.length > 10) {
      alert("Máximo 10 archivos permitidos.");
      return;
    }

    setIsUploading(true);
    try {
      const newAttachments: Attachment[] = [];

      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          alert(`El archivo ${file.name} supera los 10MB.`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `attachments/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);

        newAttachments.push({
          id: Math.random().toString(36).substring(7),
          name: file.name,
          url: publicUrl,
          referenceText: ''
        });
      }

      setAttachments([...attachments, ...newAttachments]);
      hapticFeedback('success');
    } catch (error: any) {
      console.error('Error uploading attachments:', error);
      alert(`Error al subir archivos: ${error.message || 'Desconocido'}. Asegúrate de que el bucket "attachments" exista.`);
    } finally {
      setIsUploading(false);
    }
  };

  const SelectedIcon = type === 'otros' && customIconName && ICON_LIST[customIconName] 
    ? ICON_LIST[customIconName] 
    : (CATEGORIES.find(c => c.id === type)?.icon || Box);

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
            className="bg-popover rounded-[var(--radius-3xl)] shadow-2xl w-full max-w-3xl flex flex-col h-[90vh] sm:h-[85vh] max-h-[95vh] pointer-events-auto border border-border relative"
          >
            <div className="flex items-center justify-between border-b border-border bg-secondary/30 backdrop-blur-md h-16 sm:h-20 shrink-0 rounded-t-[var(--radius-3xl)] z-[120]">
              <div className="flex items-center h-full min-w-0">
                <div className="w-16 sm:w-24 h-full bg-primary/10 flex items-center justify-center relative overflow-hidden rounded-tl-[var(--radius-3xl)] shrink-0 border-r border-border/50 hidden sm:flex">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                  <SelectedIcon size={48} strokeWidth={1.5} className="text-primary relative z-10" />
                </div>

                <div className="flex overflow-x-auto no-scrollbar bg-secondary/50 p-1.5 rounded-[var(--radius-lg)] border-border/50 backdrop-blur-sm mx-2 sm:ml-6 shrink-0 max-w-full">
                  <Button variant="ghost" onClick={() => setActiveTab('info')} className={cn("text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-[var(--radius-md)] px-3 sm:px-4 py-2 transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap", activeTab === 'info' ? "bg-background shadow-sm border border-border text-primary" : "text-muted-foreground")}><Info size={14} className="shrink-0" />Información</Button>
                  <Button variant="ghost" onClick={() => setActiveTab('costos')} className={cn("text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl px-3 sm:px-4 py-2 transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap", activeTab === 'costos' ? "bg-background shadow-sm border border-border text-primary" : "text-muted-foreground")}><CreditCard size={14} className="shrink-0" />Costo</Button>
                  <Button variant="ghost" onClick={() => setActiveTab('adjuntos')} className={cn("text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl px-3 sm:px-4 py-2 transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap", activeTab === 'adjuntos' ? "bg-background shadow-sm border border-border text-primary" : "text-muted-foreground")}><Paperclip size={14} className="shrink-0" />Adjuntos {attachments.length > 0 && <span className="bg-primary text-white text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full">{attachments.length}</span>}</Button>
                  {type === 'actividad' && (
                    <Button variant="ghost" onClick={() => setActiveTab('gpx')} className={cn("text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl px-3 sm:px-4 py-2 transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap", activeTab === 'gpx' ? "bg-background shadow-sm border border-border text-primary" : "text-muted-foreground")}><Navigation size={14} className="shrink-0" />Track GPX</Button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 pr-2 sm:pr-6 shrink-0">
                {mode === 'edit' && (
                  <div className="relative">
                    <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)} className={cn("w-10 h-10 p-0 rounded-[var(--radius-lg)] border border-border transition-all", isMenuOpen ? "bg-primary text-white border-primary" : "bg-secondary hover:bg-primary hover:text-white")}><MoreHorizontal size={18} /></Button>
                    <AnimatePresence>
                      {isMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-[250]" onClick={() => setIsMenuOpen(false)} />
                          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-[var(--radius-lg)] shadow-2xl overflow-hidden z-[300] p-1.5">
                            <button type="button" onClick={() => { handleDuplicate(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-all"><Copy size={14} className="text-primary" />Duplicar</button>
                            <button type="button" onClick={() => { if(initialData) downloadItemInfo(initialData); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-foreground hover:bg-blue-500/10 hover:text-blue-500 rounded-lg transition-all"><Download size={14} className="text-blue-500" />Descargar</button>
                            <div className="h-px bg-border my-1.5 mx-1" />
                            <button type="button" onClick={() => { setIsDeleteConfirmOpen(true); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"><Trash2 size={14} />Eliminar</button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={onClose} className="w-10 h-10 p-0 rounded-[var(--radius-lg)] bg-secondary border border-border hover:bg-primary hover:text-white transition-colors"><X size={20} /></Button>
              </div>
            </div>

            <DeleteConfirmModal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} onConfirm={handleDelete} />

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {mode === 'duplicate' && (
                <div className="bg-amber-500/10 text-amber-600 p-3 text-center text-[10px] font-black uppercase tracking-[0.2em] border-b border-amber-500/20 flex items-center justify-center gap-2">
                  <Clock size={14} className="animate-pulse" />
                  Duplicando Ítem
                </div>
              )}
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="w-full"
                >
                  {activeTab === 'info' ? (
                    <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 sm:space-y-10 pb-24">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Tipo de Ítem</span>
                          <div className="flex items-center gap-2">
                            <CustomDropdown options={CATEGORIES} value={type} onChange={setType} placeholder="Seleccionar tipo" disabled={isView} />
                            {type === 'otros' && !isView && (
                              <Button type="button" variant="secondary" onClick={() => setIsIconPickerOpen(true)} className="h-[52px] px-4 rounded-[var(--radius-md)] flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/20 transition-all font-bold text-xs">
                                {customIconName && ICON_LIST[customIconName] ? React.createElement(ICON_LIST[customIconName], { size: 18 }) : <Box size={18} />}
                                Cambiar
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Estado</span>
                          <CustomDropdown options={STATUS_OPTIONS} value={status} onChange={(s) => setStatus(s as any)} placeholder="Seleccionar estado" disabled={isView} />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Título *</span>
                          <input readOnly={isView} required className="w-full px-6 py-4 bg-secondary rounded-[1.5rem] border-2 border-border focus:border-primary/30 outline-none text-base font-bold transition-all" placeholder="Ej: Vuelo Buenos Aires -> Tokyo" value={name} onChange={e => setName(e.target.value)} />
                        </div>

                        <div className="space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Horario</span>
                          <button type="button" disabled={isView} onClick={() => setIsPickerOpen(true)} className={cn("w-full group relative overflow-hidden flex flex-col sm:flex-row gap-4 p-6 sm:p-8 rounded-[var(--radius-2xl)] bg-secondary border-2 border-border hover:border-primary/30 transition-all duration-500", isPickerOpen && "ring-4 ring-primary/10 border-primary/40")}>
                            <div className="flex-1 space-y-3 text-left">
                               <div className="flex items-center gap-2 text-muted-foreground/60"><CalendarIcon size={14} /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Inicio</span></div>
                               <div className="space-y-1">
                                  <p className="text-base font-black text-foreground truncate">{new Date(startTime || Date.now()).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                  <p className="text-4xl font-black tracking-tighter text-primary">{new Date(startTime || Date.now()).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                               </div>
                            </div>
                            <div className="flex items-center justify-center opacity-20"><div className="w-px h-12 bg-foreground hidden sm:block" /><div className="h-px w-full bg-foreground sm:hidden" /></div>
                            <div className="flex-1 space-y-3 text-left">
                               <div className="flex items-center gap-2 text-muted-foreground/60"><Clock size={14} /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Fin</span></div>
                               <div className="space-y-1">
                                  <p className="text-base font-black text-foreground truncate">{endTime ? new Date(endTime).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' }) : '-'}</p>
                                  <p className="text-4xl font-black tracking-tighter text-muted-foreground/40">{endTime ? new Date(endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}</p>
                               </div>
                            </div>
                          </button>
                        </div>

                        {(isTransport(type) || type === 'actividad') ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {['origin', 'destination'].map((field: any) => (
                              <div key={field} className="space-y-3 relative">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{field === 'origin' ? 'Origen' : 'Destino'}</span>
                                <div className="relative">
                                  <MapPin size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                  <input readOnly={isView} className="w-full pl-12 pr-12 py-4 bg-secondary rounded-[var(--radius-xl)] border-2 border-border focus:border-primary/30 outline-none text-sm font-medium transition-all" placeholder={field === 'origin' ? "Ej: Aeropuerto Ezeiza 123" : "Ej: Tokyo Station"} value={field === 'origin' ? origin.address : destination.address} onChange={e => {
                                      const val = e.target.value;
                                      const parsed = parseMagicLocation(val);
                                      if (field === 'origin') setOrigin(prev => ({ ...prev, address: val, lat: parsed.lat || prev.lat, lng: parsed.lng || prev.lng }));
                                      else setDestination(prev => ({ ...prev, address: val, lat: parsed.lat || prev.lat, lng: parsed.lng || prev.lng }));
                                      if (!isView && !parsed.lat) setIsSearching(field);
                                    }} />
                                  {(field === 'origin' ? origin.lat : destination.lat) && <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-500/10 text-green-500 p-1.5 rounded-full border border-green-500/20 shadow-sm z-10 transition-all scale-110"><CheckCircle2 size={16} strokeWidth={3} /></div>}
                                  {searchResults.length > 0 && isSearching === field && (
                                    <div className="absolute top-full left-0 right-0 z-[100] mt-2 bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                                      {searchResults.map((f, i) => (
                                        <button key={i} type="button" className="w-full p-4 text-left hover:bg-secondary text-sm border-b border-border last:border-0 transition-colors font-bold group flex items-center justify-between" onClick={() => selectAddress(f, field)}>
                                          <div className="flex flex-col"><span className="text-foreground group-hover:text-primary">{f.properties.name} {f.properties.housenumber}</span><span className="text-[10px] text-muted-foreground uppercase tracking-widest">{[f.properties.city, f.properties.country].filter(Boolean).join(', ')}</span></div>
                                          <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-primary/20 group-hover:text-primary transition-all"><Check size={14} /></div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3 relative">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Ubicación</span>
                            <div className="relative">
                              <MapPin size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <input readOnly={isView} className="w-full pl-12 pr-12 py-4 bg-secondary rounded-[1.5rem] border-2 border-border focus:border-primary/30 outline-none text-sm font-medium transition-all" placeholder="Ej: Calle 123, Ciudad" value={location.address} onChange={e => {
                                  const val = e.target.value;
                                  const parsed = parseMagicLocation(val);
                                  setLocation(prev => ({ ...prev, address: val, lat: parsed.lat || prev.lat, lng: parsed.lng || prev.lng }));
                                  if (!isView && !parsed.lat) setIsSearching('location');
                                }} />
                              {location.lat && <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-500/10 text-green-500 p-1.5 rounded-full border border-green-500/20 shadow-sm z-10 transition-all scale-110"><CheckCircle2 size={16} strokeWidth={3} /></div>}
                               {searchResults.length > 0 && isSearching === 'location' && (
                                  <div className="absolute top-full left-0 right-0 z-[100] mt-2 bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                                    {searchResults.map((f, i) => (
                                      <button key={i} type="button" className="w-full p-4 text-left hover:bg-secondary text-sm border-b border-border last:border-0 transition-colors font-bold group flex items-center justify-between" onClick={() => selectAddress(f, 'location')}>
                                        <div className="flex flex-col"><span className="text-foreground group-hover:text-primary">{f.properties.name} {f.properties.housenumber}</span><span className="text-[10px] text-muted-foreground uppercase tracking-widest">{[f.properties.city, f.properties.country].filter(Boolean).join(', ')}</span></div>
                                        <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-primary/20 group-hover:text-primary transition-all"><Check size={14} /></div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Descripción</span>
                          <textarea readOnly={isView} className="w-full px-6 py-4 bg-secondary rounded-[1.5rem] border-2 border-border focus:border-primary/30 outline-none text-sm font-medium min-h-[100px] resize-none transition-all" placeholder="Notas adicionales..." value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Referencia Reserva</span>
                          <input readOnly={isView} className="w-full px-6 py-4 bg-secondary rounded-[var(--radius-lg)] border-2 border-border focus:border-primary/30 outline-none text-base font-bold transition-all uppercase" placeholder="Ej: ABC123XYZ" value={reservationRef} onChange={e => setReservationRef(e.target.value)} />
                        </div>
                        <div className="space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Notas Internas</span>
                          <textarea readOnly={isView} className="w-full px-6 py-4 bg-secondary rounded-[1.5rem] border-2 border-border focus:border-primary/30 outline-none text-sm font-medium min-h-[80px] resize-none transition-all" placeholder="Detalles privados..." value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                      </div>
                    </form>
                  ) : activeTab === 'costos' ? (
                    <div className="p-4 sm:p-8 space-y-6 sm:space-y-10 pb-24">
                      <div className="space-y-6 sm:space-y-8 p-6 sm:p-8 bg-secondary/40 rounded-[var(--radius-2xl)] border-2 border-border/50 shadow-inner">
                        <div className="flex items-center gap-4 ml-1">
                          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20"><CreditCard size={20} /></div>
                          <div><h4 className="text-sm font-black uppercase tracking-widest text-foreground">Gestión de Costos</h4><p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Presupuesto y estados de pago</p></div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Moneda</span>
                            <div className="relative">
                              <select disabled={isView} className="w-full px-6 py-4 bg-background border-2 border-border rounded-[1.5rem] focus:border-primary/30 outline-none text-base font-bold transition-all appearance-none" value={currency} onChange={e => setCurrency(e.target.value)}>{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"><ChevronDown size={16} /></div>
                            </div>
                          </div>
                          <div className="space-y-3"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Costo Estimado</span><input readOnly={isView} type="number" step="0.01" className="w-full px-6 py-4 bg-background border-2 border-border rounded-[var(--radius-lg)] focus:border-primary/30 outline-none text-base font-bold transition-all" placeholder="0.00" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} /></div>
                          <div className="space-y-3"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Costo Real</span><input readOnly={isView} type="number" step="0.01" className="w-full px-6 py-4 bg-background border-2 border-border rounded-[var(--radius-lg)] focus:border-primary/30 outline-none text-base font-bold transition-all" placeholder="0.00" value={realCost} onChange={e => setRealCost(e.target.value)} /></div>
                        </div>

                        <div className="space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Estado de Pago</span>
                          <CustomDropdown value={paymentStatus} onChange={setPaymentStatus} options={PAYMENT_STATUS_OPTIONS} placeholder="Seleccionar estado de pago..." />
                        </div>

                        <div className="pt-6 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Monto Próximo Pago</span>
                            <div className="relative">
                              <CreditCard size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <input readOnly={isView} type="number" step="0.01" className="w-full pl-12 pr-6 py-4 bg-background border-2 border-border rounded-[var(--radius-lg)] focus:border-primary/30 outline-none text-base font-bold transition-all" placeholder="0.00" value={nextPaymentAmount} onChange={e => setNextPaymentAmount(e.target.value)} />
                              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground uppercase">{currency}</div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Fecha Próximo Pago</span>
                            <div className="relative">
                              <CalendarIcon size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <input readOnly={isView} type="date" className="w-full pl-12 pr-6 py-4 bg-background border-2 border-border rounded-[1.5rem] focus:border-primary/30 outline-none text-sm font-bold transition-all" value={nextPaymentDate} onChange={e => setNextPaymentDate(e.target.value)} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : activeTab === 'adjuntos' ? (
                    <div className="p-8 space-y-8">
                      {!isView && (
                        <div className={cn("relative border-4 border-dashed border-border hover:border-primary/50 bg-secondary rounded-[var(--radius-2xl)] p-12 flex flex-col items-center justify-center text-center transition-all group overflow-hidden", isUploading && "pointer-events-none opacity-50")}>
                          <input type="file" multiple disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileUpload} />
                          <div className="w-20 h-20 rounded-[var(--radius-lg)] bg-background flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all shadow-xl">{isUploading ? <Loader2 size={32} className="animate-spin" /> : <UploadCloud size={32} />}</div>
                          <h4 className="text-xl font-black tracking-tight mb-2">{isUploading ? 'Subiendo archivos...' : 'Subir archivos'}</h4>
                          <p className="text-sm text-muted-foreground max-w-xs">PDFs, imágenes o documentos (Máx. 10MB).</p>
                        </div>
                      )}
                      {attachments.length > 0 && (
                        <div className="grid grid-cols-1 gap-4">
                          {attachments.map((att, index) => (
                            <div key={att.id} className="flex flex-col sm:flex-row gap-4 p-5 bg-secondary border border-border rounded-[var(--radius-lg)] items-start sm:items-center shadow-sm group/att">
                              <div className="w-12 h-12 rounded-[var(--radius-md)] bg-background flex items-center justify-center flex-shrink-0 shadow-inner group-hover/att:scale-110 transition-transform"><FileIcon size={20} className="text-primary" /></div>
                              <div className="flex-1 min-w-0 space-y-2 w-full">
                                 <div className="flex items-center justify-between gap-4"><p className="text-sm font-black truncate">{att.name}</p><a href={att.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1 shrink-0"><Download size={12} />Ver / Descargar</a></div>
                                 <input readOnly={isView} className="w-full text-xs px-4 py-2 bg-background border border-border rounded-xl outline-none focus:border-primary/30 transition-all" placeholder="Nota de referencia..." value={att.referenceText} onChange={(e) => { const newAtt = [...attachments]; newAtt[index].referenceText = e.target.value; setAttachments(newAtt); }} />
                              </div>
                              {!isView && <Button variant="ghost" size="sm" type="button" className="w-12 h-12 p-0 rounded-[var(--radius-md)] bg-secondary/50 border border-border text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm" onClick={() => { setAttachments(attachments.filter(a => a.id !== att.id)); hapticFeedback('warning'); }}><Trash2 size={18} /></Button>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 sm:p-8 min-h-[400px]">
                      <GpxTrackTab itemType={type} gpxUrl={gpxUrl} onGpxUrlChange={setGpxUrl} isViewOnly={isView} />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="bg-popover border-t border-border p-6 flex items-center justify-end gap-3 z-[110] shadow-2xl rounded-b-[var(--radius-3xl)]">
              <Button variant="ghost" type="button" onClick={onClose} className="rounded-[var(--radius-md)] px-8 h-12 font-black uppercase text-xs tracking-widest bg-secondary/50 hover:bg-secondary">{isView ? 'Cerrar' : 'Cancelar'}</Button>
              {!isView && <Button onClick={() => handleSubmit()} className="rounded-2xl px-12 h-12 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">{mode === 'create' ? 'Crear Ítem' : 'Guardar Cambios'}</Button>}
            </div>

            <AnimatePresence>
              {isPickerOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPickerOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-3xl" />
                  <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="relative w-full max-w-4xl bg-background rounded-[var(--radius-3xl)] shadow-2xl overflow-hidden border border-border">
                    <MootsTimePicker startDate={startTime} endDate={endTime || ''} onCancel={() => setIsPickerOpen(false)} onSave={(s, e) => { setStartTime(s); setEndTime(e); setIsPickerOpen(false); }} />
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <IconPickerModal isOpen={isIconPickerOpen} onClose={() => setIsIconPickerOpen(false)} onSelect={setCustomIconName} selectedIconName={customIconName} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
