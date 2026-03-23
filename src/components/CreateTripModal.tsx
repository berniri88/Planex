import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Map as MapIcon, Mountain, Calendar, MapPin, Loader2 } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import { hapticFeedback } from '../lib/haptics';
import { Button } from './ui/Button';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const IconOptions = [
  { id: 'Globe', icon: Globe, label: 'General' },
  { id: 'Map', icon: MapIcon, label: 'Adventure' },
  { id: 'Mountain', icon: Mountain, label: 'Nature' },
];


export const CreateTripModal = ({ isOpen, onClose }: CreateTripModalProps) => {
  const createTrip = useTripStore(state => state.createTrip);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    destination: '',
    icon: 'Globe',
    color: 'bg-primary/5',
    mainCurrency: 'USD',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.destination) return;
    
    setIsLoading(true);
    try {
      const dates = `${new Date(formData.startDate).toLocaleDateString()} • ${new Date(formData.endDate).toLocaleDateString()}`;
      await createTrip({
        ...formData,
        dates,
        destinationTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
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
          className="relative w-full max-w-lg bg-background rounded-[2.5rem] shadow-2xl overflow-hidden border border-border"
        >
          <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tighter italic">Nueva Aventura</h2>
                <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-[0.2em] mt-1">Empieza a planear tu viaje</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="rounded-2xl w-10 h-10 p-0 text-muted-foreground hover:bg-secondary">
                <X size={20} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Nombre del Viaje</label>
                  <input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-14 px-6 bg-secondary rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-lg placeholder:font-normal placeholder:opacity-40"
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
                      className="w-full h-14 pl-14 pr-6 bg-secondary rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold placeholder:font-normal placeholder:opacity-40"
                      placeholder="Ciudad o País"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Fecha Inicio</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        required
                        type="date"
                        value={formData.startDate}
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full h-14 pl-14 pr-6 bg-secondary rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold appearance-none no-scrollbar"
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
                        className="w-full h-14 pl-14 pr-6 bg-secondary rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-bold appearance-none no-scrollbar"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Icono</label>
                    <div className="flex gap-2">
                      {IconOptions.map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => { setFormData({ ...formData, icon: opt.id }); hapticFeedback('light'); }}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                            formData.icon === opt.id ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                          }`}
                        >
                          <opt.icon size={20} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Moneda Base</label>
                    <select
                      value={formData.mainCurrency}
                      onChange={e => setFormData({ ...formData, mainCurrency: e.target.value })}
                      className="w-full h-12 px-4 bg-secondary rounded-xl border-none font-bold text-sm"
                    >
                      <option value="USD">USD - Dólar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - Libra</option>
                      <option value="JPY">JPY - Yen</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <Button variant="ghost" size="lg" onClick={onClose} className="flex-1 rounded-2xl h-16 h-16 font-black bg-secondary">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 rounded-2xl h-16 h-16 shadow-xl shadow-primary/25 disabled:opacity-50">
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Crear Viaje'}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
