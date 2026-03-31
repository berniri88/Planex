import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Calendar, MapPin, Loader2, UploadCloud, CheckCircle2, Users, Plus, Trash2, Mail, User } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import { hapticFeedback } from '../lib/haptics';
import { Button } from './ui/Button';
import { IconPickerModal, ICON_LIST } from './ui/IconPickerModal';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { type Trip } from '../lib/types';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrip?: Trip;
}

const CURRENCIES = [
  { code: 'USD', label: 'USD - Dólar' },
  { code: 'EUR', label: 'EUR - Euro' },
  { code: 'GBP', label: 'GBP - Libra' },
  { code: 'JPY', label: 'JPY - Yen' },
  { code: 'ARS', label: 'ARS - Peso Argentino' },
  { code: 'BRL', label: 'BRL - Real' },
  { code: 'CLP', label: 'CLP - Peso Chileno' },
  { code: 'MXN', label: 'MXN - Peso Mexicano' },
  { code: 'COP', label: 'COP - Peso Colombiano' },
  { code: 'PEN', label: 'PEN - Sol Peruano' },
  { code: 'UYU', label: 'UYU - Peso Uruguayo' },
];

export const CreateTripModal = ({ isOpen, onClose, initialTrip }: CreateTripModalProps) => {
  const { createTrip, updateTrip, addParticipant } = useTripStore(state => ({
    createTrip: state.createTrip,
    updateTrip: state.updateTrip,
    addParticipant: state.addParticipant
  }));
  
  const [isLoading, setIsLoading] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    destination: '',
    icon: 'Globe',
    color: 'bg-primary/5',
    mainCurrency: 'USD',
    background_url: '',
  });

  const [participants, setParticipants] = useState<any[]>([]);
  const [newParticipant, setNewParticipant] = useState({ name: '', email: '', is_companion: true });

  React.useEffect(() => {
    if (initialTrip && isOpen) {
      setFormData({
        name: initialTrip.name,
        startDate: initialTrip.startDate,
        endDate: initialTrip.endDate,
        destination: initialTrip.destination,
        icon: initialTrip.icon,
        color: initialTrip.color,
        mainCurrency: initialTrip.mainCurrency,
        background_url: initialTrip.background_url || '',
      });
      setParticipants(initialTrip.participants || []);
    } else if (isOpen) {
      setFormData({
        name: '',
        startDate: '',
        endDate: '',
        destination: '',
        icon: 'Globe',
        color: 'bg-primary/5',
        mainCurrency: 'USD',
        background_url: '',
      });
      setParticipants([]);
    }
  }, [initialTrip, isOpen]);

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen debe ser menor a 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `backgrounds/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('trip_backgrounds').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('trip_backgrounds').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, background_url: publicUrl }));
      hapticFeedback('success');
    } catch (error) {
      console.error('Error uploading background:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddParticipant = () => {
    if (!newParticipant.name) return;
    setParticipants([...participants, { ...newParticipant, id: `local-${Date.now()}` }]);
    setNewParticipant({ name: '', email: '', is_companion: true });
    hapticFeedback('light');
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
    hapticFeedback('warning');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.destination) return;
    
    setIsLoading(true);
    try {
      const dates = `${new Date(formData.startDate).toLocaleDateString()} • ${new Date(formData.endDate).toLocaleDateString()}`;
      
      let tripId = initialTrip?.id;
      if (initialTrip) {
        await updateTrip(initialTrip.id, { ...formData, dates } as any);
      } else {
        const trip = await createTrip({
          ...formData,
          dates,
          destinationTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        } as any);
        tripId = trip?.id;
      }

      if (tripId) {
        // Sync participants
        const existingParticipants = initialTrip?.participants || [];
        
        // 1. Remove participants that are no longer in the list
        for (const ep of existingParticipants) {
          if (!participants.some(p => p.id === ep.id)) {
            await useTripStore.getState().removeParticipant(ep.id);
          }
        }
        
        // 2. Add new ones or update existing ones
        for (const p of participants) {
          if (p.id?.startsWith('local-')) {
            await addParticipant({
              trip_id: tripId,
              name: p.name,
              email: p.email,
              is_companion: p.is_companion
            });
          } else {
            // Check if is_companion changed for existing ones
            const ep = existingParticipants.find(e => e.id === p.id);
            if (ep && ep.is_companion !== p.is_companion) {
              await useTripStore.getState().updateParticipant(p.id, { is_companion: p.is_companion });
            }
          }
        }
      }

      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const SelectedIcon = (ICON_LIST as any)[formData.icon] || Globe;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-background rounded-[var(--radius-3xl)] shadow-2xl overflow-hidden border border-border max-h-[90vh] flex flex-col"
          >
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter italic">
                    {initialTrip ? 'Editar Aventura' : 'Nueva Aventura'}
                  </h2>
                  <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-[0.2em] mt-1">
                    {initialTrip ? 'Actualiza los detalles' : 'Empieza a planear'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl w-10 h-10 p-0 hover:bg-secondary">
                  <X size={20} />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Nombre</label>
                      <input
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full h-14 px-6 bg-secondary rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-lg"
                        placeholder="Ej: Verano en Italia 🇮🇹"
                      />
                   </div>

                   <div className="relative group">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-2 block">Destino</label>
                      <div className="relative">
                        <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          required
                          value={formData.destination}
                          onChange={e => setFormData({ ...formData, destination: e.target.value })}
                          className="w-full h-14 pl-14 pr-6 bg-secondary rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                          placeholder="Ciudad o País"
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Inicio</label>
                        <input
                          required
                          type="date"
                          value={formData.startDate}
                          onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full h-14 px-6 bg-secondary rounded-2xl border-none font-bold text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Fin</label>
                        <input
                          required
                          type="date"
                          value={formData.endDate}
                          onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full h-14 px-6 bg-secondary rounded-2xl border-none font-bold text-sm"
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Icono</label>
                        <button
                          type="button"
                          onClick={() => setIsIconPickerOpen(true)}
                          className="w-full h-14 bg-secondary rounded-2xl flex items-center gap-4 px-6 hover:bg-secondary/80 transition-all"
                        >
                          <SelectedIcon size={20} className="text-primary" />
                          <span className="font-bold text-sm truncate">{formData.icon}</span>
                        </button>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Portada</label>
                        <label className="relative flex items-center justify-center w-full h-14 bg-secondary rounded-2xl border-2 border-dashed border-border hover:border-primary/40 transition-all cursor-pointer group">
                           <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" disabled={isUploading} />
                           {formData.background_url ? (
                             <img src={formData.background_url} className="absolute inset-0 w-full h-full object-cover opacity-40 rounded-2xl" alt="BG" />
                           ) : (
                             isUploading ? <Loader2 className="animate-spin text-primary" size={16} /> : <UploadCloud size={16} className="text-muted-foreground" />
                           )}
                           <span className="relative z-10 text-[8px] font-black uppercase tracking-widest ml-2">{formData.background_url ? 'Cambiar' : 'Subir'}</span>
                        </label>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Moneda Principal</label>
                      <select
                        value={formData.mainCurrency}
                        onChange={e => setFormData({ ...formData, mainCurrency: e.target.value })}
                        className="w-full h-14 px-6 bg-secondary rounded-2xl border-none font-bold text-base focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        {CURRENCIES.map(curr => (
                          <option key={curr.code} value={curr.code}>{curr.label}</option>
                        ))}
                      </select>
                   </div>

                   {/* Members */}
                   <div className="space-y-4 pt-6 border-t border-border">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                          <Users size={12} /> Miembros del Viaje
                        </label>
                        <span className="text-[10px] font-black text-primary uppercase">{participants.length} Añadidos</span>
                      </div>
                      
                      <div className="space-y-3">
                         <div className="flex gap-2">
                            <div className="relative flex-1">
                               <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                               <input 
                                 value={newParticipant.name}
                                 onChange={e => setNewParticipant({...newParticipant, name: e.target.value})}
                                 placeholder="Nombre..."
                                 className="w-full h-12 pl-12 pr-4 bg-secondary rounded-xl border-none font-bold text-sm"
                               />
                            </div>
                            <Button type="button" onClick={handleAddParticipant} className="h-12 w-12 p-0 shrink-0 rounded-xl">
                               <Plus size={20} />
                            </Button>
                         </div>
                         
                         {/* Companion Toggle for New Participant */}
                         <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 rounded-xl border border-border/50">
                            <div className="flex items-center gap-2">
                               <CheckCircle2 size={12} className={cn(newParticipant.is_companion ? "text-primary scale-110" : "text-muted-foreground/30")} />
                               <span className="text-[9px] font-black uppercase tracking-widest leading-none">Compañero de viaje</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewParticipant(prev => ({ ...prev, is_companion: !prev.is_companion }))}
                              className={cn(
                                "w-10 h-5 rounded-full relative transition-colors duration-300",
                                newParticipant.is_companion ? "bg-primary" : "bg-muted"
                              )}
                            >
                               <motion.div 
                                 animate={{ x: newParticipant.is_companion ? 22 : 2 }}
                                 className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm" 
                               />
                            </button>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar py-1">
                         {participants.map((p, idx) => (
                           <div key={p.id || idx} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl border border-border group gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                 <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase", p.is_companion ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground border border-border")}>
                                    {p.name.charAt(0)}
                                 </div>
                                 <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-black truncate italic">{p.name}</span>
                                    <span className={cn("text-[7px] font-black uppercase tracking-tighter opacity-70", p.is_companion ? "text-primary" : "text-muted-foreground")}>
                                       {p.is_companion ? 'Compañero' : 'Invitado'}
                                    </span>
                                 </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                 {/* Individual Toggle */}
                                 <button
                                   type="button"
                                   onClick={() => {
                                     const newParts = [...participants];
                                     newParts[idx].is_companion = !newParts[idx].is_companion;
                                     setParticipants(newParts);
                                     hapticFeedback('light');
                                   }}
                                   className={cn(
                                     "w-7 h-4 rounded-full relative transition-colors border border-border/50",
                                     p.is_companion ? "bg-primary/20 border-primary/30" : "bg-muted"
                                   )}
                                 >
                                    <motion.div 
                                      animate={{ x: p.is_companion ? 14 : 2 }}
                                      className={cn("absolute top-0.5 w-2.5 h-2.5 rounded-full shadow-sm", p.is_companion ? "bg-primary" : "bg-muted-foreground")} 
                                    />
                                 </button>

                                 <button type="button" onClick={() => removeParticipant(p.id)} className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={12} />
                                 </button>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <Button variant="ghost" size="lg" onClick={onClose} className="flex-1 rounded-2xl h-16 font-black bg-secondary">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-2 rounded-2xl h-16 shadow-xl shadow-primary/25 disabled:opacity-50 min-w-[200px]">
                    {isLoading ? <Loader2 className="animate-spin" /> : (initialTrip ? 'Guardar Cambios' : 'Crear Viaje')}
                  </Button>
                </div>
              </form>
            </div>
            
            <IconPickerModal
              isOpen={isIconPickerOpen}
              onClose={() => setIsIconPickerOpen(false)}
              onSelect={(name) => setFormData(prev => ({ ...prev, icon: name }))}
              selectedIconName={formData.icon}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
