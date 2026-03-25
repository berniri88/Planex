import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plane, Hotel, Utensils } from 'lucide-react';
import { Button } from './ui/Button';
import { useTripStore } from '../store/useTripStore';
import { hapticFeedback } from '../lib/haptics';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
}

export const AddItemModal = ({ isOpen, onClose }: Omit<AddItemModalProps, 'tripId'>) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'flight' | 'accommodation' | 'food' | 'attraction'>('flight');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  
  const addItineraryItem = useTripStore((state) => state.addItineraryItem);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addItineraryItem({
      name,
      type: type as any,
      start_time: date,
      description: notes,
      status: 'confirmado',
      timezone: 'UTC', // Default
      location: { address: '' }
    });
    hapticFeedback('success');
    onClose();
    // Reset form
    setName('');
    setDate('');
    setNotes('');
  };

  const types = [
    { id: 'flight', label: 'Flight', icon: Plane },
    { id: 'hotel', label: 'Hotel', icon: Hotel },
    { id: 'food', label: 'Food', icon: Utensils },
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[101] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-popover rounded-[var(--radius-3xl)] shadow-2xl w-full max-w-xl p-10 relative overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto border border-border"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
              
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black tracking-tighter italic text-foreground">Add to Trip</h2>
                <Button variant="ghost" size="sm" onClick={onClose} className="w-10 h-10 p-0 rounded-[var(--radius-md)] bg-secondary border border-border">
                  <X size={20} />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8 overflow-y-auto no-scrollbar pr-2">
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Type</span>
                  <div className="grid grid-cols-3 gap-3">
                    {types.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => { setType(t.id as any); hapticFeedback('light'); }}
                        className={`flex flex-col items-center justify-center p-6 rounded-[var(--radius-lg)] border-2 transition-all duration-300 ${
                          type === t.id 
                            ? 'border-primary bg-primary/5 text-primary scale-[1.05] shadow-lg shadow-primary/10' 
                            : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        <t.icon size={24} className="mb-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">Details</span>
                    <input
                      required
                      className="w-full px-8 py-5 bg-secondary rounded-[var(--radius-lg)] border-2 border-border focus:border-primary/30 outline-none text-sm font-bold placeholder:text-muted-foreground/30 transition-all"
                      placeholder="Where to?"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  
                  <input
                    required
                    type="datetime-local"
                    className="w-full px-8 py-5 bg-secondary rounded-[2rem] border-2 border-border focus:border-primary/30 outline-none text-sm font-bold text-foreground transition-all"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />

                  <textarea
                    className="w-full px-8 py-6 bg-secondary rounded-[var(--radius-lg)] border-2 border-border focus:border-primary/30 outline-none text-sm font-medium placeholder:text-muted-foreground/30 min-h-[120px] resize-none transition-all"
                    placeholder="Notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-16 text-lg font-black tracking-widest uppercase rounded-[var(--radius-lg)] shadow-xl shadow-primary/30"
                >
                  Add to Itinerary
                </Button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
