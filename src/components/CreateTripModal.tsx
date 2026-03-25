import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Calendar, MapPin, Loader2, UploadCloud, CheckCircle2 } from 'lucide-react';
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
  const { createTrip, updateTrip } = useTripStore(state => ({
    createTrip: state.createTrip,
    updateTrip: state.updateTrip
  }));
  const [isLoading, setIsLoading] = useState(false);
  
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
    }
  }, [initialTrip, isOpen]);

  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

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

      const { error: uploadError } = await supabase.storage
        .from('trip_backgrounds')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('trip_backgrounds')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, background_url: publicUrl }));
      hapticFeedback('success');
    } catch (error: any) {
      console.error('Error uploading background:', error);
      alert('Error al subir la imagen. Verifica el bucket trip_backgrounds.');
    } finally {
      setIsUploading(false);
    }
  };

  const SelectedIcon = (ICON_LIST as any)[formData.icon] || Globe;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.destination) return;
    
    setIsLoading(true);
    try {
      const dates = `${new Date(formData.startDate).toLocaleDateString()} • ${new Date(formData.endDate).toLocaleDateString()}`;
      
      if (initialTrip) {
        await updateTrip(initialTrip.id, {
          ...formData,
          dates,
        } as any);
      } else {
        await createTrip({
          ...formData,
          dates,
          destinationTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        } as any);
      }
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
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
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tighter italic">
                  {initialTrip ? 'Editar Aventura' : 'Nueva Aventura'}
                </h2>
                <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-[0.2em] mt-1">
                  {initialTrip ? 'Actualiza los detalles de tu viaje' : 'Empieza a planear tu viaje'}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="rounded-[var(--radius-lg)] w-10 h-10 p-0 text-muted-foreground hover:bg-secondary shrink-0">
                <X size={20} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 flex flex-col min-h-full">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Nombre del Viaje</label>
                  <input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-14 px-6 bg-secondary rounded-[var(--radius-lg)] border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-lg placeholder:font-normal placeholder:opacity-40"
                    placeholder="Ej: Verano en Italia 🇮🇹"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Destino Principal</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      required
                      value={formData.destination}
                      onChange={e => setFormData({ ...formData, destination: e.target.value })}
                      className="w-full h-14 pl-14 pr-6 bg-secondary rounded-[var(--radius-lg)] border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold placeholder:font-normal placeholder:opacity-40"
                      placeholder="Ciudad o País"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Fecha Inicio</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        required
                        type="date"
                        value={formData.startDate}
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full h-14 pl-14 pr-4 bg-secondary rounded-[var(--radius-lg)] border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold appearance-none no-scrollbar text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Fecha Fin</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        required
                        type="date"
                        value={formData.endDate}
                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full h-14 pl-14 pr-4 bg-secondary rounded-[var(--radius-lg)] border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold appearance-none no-scrollbar text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Icono</label>
                    <button
                      type="button"
                      onClick={() => setIsIconPickerOpen(true)}
                      className="w-full h-14 bg-secondary rounded-[var(--radius-lg)] flex items-center gap-4 px-6 hover:bg-secondary/80 transition-all border-2 border-transparent focus:border-primary/20"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <SelectedIcon size={20} />
                      </div>
                      <span className="font-bold text-sm">{formData.icon}</span>
                      <div className="ml-auto text-muted-foreground">
                        <Loader2 size={16} className={cn("animate-spin", !isIconPickerOpen && "hidden")} />
                      </div>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Imagen de Fondo</label>
                    <label className="relative flex items-center justify-center w-full h-14 bg-secondary rounded-[var(--radius-lg)] border-2 border-dashed border-border hover:border-primary/40 transition-all cursor-pointer group overflow-hidden">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBackgroundUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      {formData.background_url ? (
                        <>
                          <img src={formData.background_url} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                          <div className="relative z-10 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-green-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Cambiar Imagen</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                          <span className="text-[10px] font-black uppercase tracking-widest">{isUploading ? 'Subiendo...' : 'Subir Portada'}</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Moneda Base</label>
                  <select
                    value={formData.mainCurrency}
                    onChange={e => setFormData({ ...formData, mainCurrency: e.target.value })}
                    className="w-full h-14 px-6 bg-secondary rounded-[var(--radius-lg)] border-none font-bold text-base focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    {CURRENCIES.map(curr => (
                      <option key={curr.code} value={curr.code}>{curr.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 shrink-0 mt-auto">
                <Button variant="ghost" size="lg" onClick={onClose} className="flex-1 rounded-[var(--radius-lg)] h-14 sm:h-16 font-black bg-secondary">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 rounded-[var(--radius-lg)] h-14 sm:h-16 shadow-xl shadow-primary/25 disabled:opacity-50">
                  {isLoading ? <Loader2 className="animate-spin" /> : (initialTrip ? 'Guardar Cambios' : 'Crear Viaje')}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>

        <IconPickerModal
          isOpen={isIconPickerOpen}
          onClose={() => setIsIconPickerOpen(false)}
          onSelect={(name) => setFormData(prev => ({ ...prev, icon: name }))}
          selectedIconName={formData.icon}
        />
      </div>
    </AnimatePresence>
  );
};
