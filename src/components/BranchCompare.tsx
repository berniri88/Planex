import { motion, AnimatePresence } from 'framer-motion';
import { X, GitCompare, ArrowRight, GitBranch, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { useTripStore } from '../store/useTripStore';
import { TravelerClock } from './TravelerClock';

interface BranchCompareProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BranchCompare = ({ isOpen, onClose }: BranchCompareProps) => {
  const { branches, activeBranchId, itineraryItems } = useTripStore();
  
  // For comparison, we compare Active with Main or another branch
  const mainBranch = branches.find(b => b.id === 'main') || branches[0];
  const activeBranch = branches.find(b => b.id === activeBranchId);

  const mainItems = itineraryItems.filter(item => item.branchId === mainBranch.id);
  const activeItems = itineraryItems.filter(item => item.branchId === activeBranchId);

  if (activeBranchId === mainBranch.id) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl"
          >
            <div className="glass p-12 rounded-[var(--radius-3xl)] max-w-md text-center space-y-8 border-white/20">
               <div className="w-20 h-20 rounded-[var(--radius-2xl)] bg-amber-500/10 flex items-center justify-center mx-auto">
                  <AlertCircle size={40} className="text-amber-500" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-3xl font-black tracking-tight">Nothing to compare</h3>
                 <p className="text-muted-foreground font-bold">You are currently on the Main branch. Create a new branch to compare alternative plans.</p>
               </div>
               <Button onClick={onClose} className="w-full h-16 rounded-[var(--radius-lg)]">Got it</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] glass flex flex-col backdrop-blur-3xl bg-black/80"
        >
          <header className="px-8 py-6 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[var(--radius-md)] bg-primary flex items-center justify-center shadow-xl shadow-primary/30">
                <GitCompare size={24} className="text-white" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-2xl font-black tracking-tight text-white italic">Plan Comparison</h2>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                  <GitBranch size={10} />
                  <span>{mainBranch.name}</span>
                  <ArrowRight size={10} />
                  <span>{activeBranch?.name}</span>
                </div>
              </div>
            </div>
            <Button variant="glass" onClick={onClose} className="w-12 h-12 rounded-[var(--radius-md)] border-white/10 text-white">
              <X size={24} />
            </Button>
          </header>

          <main className="flex-1 flex overflow-hidden">
            {/* Left Column: Main Branch */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 border-r border-white/5 no-scrollbar">
              <div className="flex items-center justify-between sticky top-0 bg-transparent backdrop-blur-lg py-2 z-10">
                <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Baseline: {mainBranch.name}</span>
              </div>
              
              {mainItems.map(item => (
                <div key={item.id} className="glass p-6 rounded-[var(--radius-2xl)] border-white/5 opacity-60">
                  <h4 className="text-lg font-black text-white/80 mb-2">{item.name}</h4>
                  <TravelerClock dateString={item.start_time} timezone={item.timezone} variant="compact" />
                </div>
              ))}
            </div>

            {/* Right Column: Active Branch */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-white/5 no-scrollbar">
              <div className="flex items-center justify-between sticky top-0 bg-transparent backdrop-blur-lg py-2 z-10">
                <span className="px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Current: {activeBranch?.name}</span>
              </div>
              
              {activeItems.map(item => (
                <motion.div 
                  key={item.id} 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="premium-card p-6 border-primary/20 bg-primary/5"
                >
                  <h4 className="text-xl font-black text-white mb-2">{item.name}</h4>
                  <p className="text-white/40 text-sm mb-4 line-clamp-2">{item.description}</p>
                  <TravelerClock dateString={item.start_time} timezone={item.timezone} variant="compact" />
                </motion.div>
              ))}
            </div>
          </main>

          <footer className="p-8 border-t border-white/10 flex justify-center bg-transparent backdrop-blur-xl">
            <Button 
               size="lg" 
               className="h-16 px-12 rounded-[var(--radius-lg)] bg-primary text-white font-black text-xl shadow-2xl"
               onClick={() => {
                 if (activeBranch) {
                   useTripStore.getState().mergeBranch(activeBranch.id, mainBranch.id);
                   onClose();
                 }
               }}
            >
              Merge & Keep Active Branch
            </Button>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
