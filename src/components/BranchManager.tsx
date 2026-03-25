import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Plus, Check, ChevronDown, GitMerge, X, GitCompare } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { hapticFeedback } from '../lib/haptics';

interface BranchManagerProps {
  onCompareClick?: () => void;
}

export const BranchManager = ({ onCompareClick }: BranchManagerProps) => {
  const { branches, activeBranchId, setActiveBranch, createBranch } = useTripStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  const activeBranch = branches.find(b => b.id === activeBranchId);

  const handleCreate = () => {
    if (!newBranchName) return;
    createBranch(newBranchName, 'Alternative plan branch', '#3B82F6');
    setNewBranchName('');
    setIsCreating(false);
    hapticFeedback('success');
  };

  return (
    <div className="relative inline-block">
      {/* Trigger Button */}
      <Button
        variant="glass"
        size="sm"
        onClick={() => { setIsOpen(!isOpen); hapticFeedback('light'); }}
        className="flex items-center gap-3 px-5 h-11 rounded-[var(--radius-lg)] border-border border shadow-none group bg-secondary"
      >
        <GitBranch size={16} className="text-primary group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-black uppercase tracking-widest">{activeBranch?.name ?? 'Branches'}</span>
        <ChevronDown size={14} className={cn("transition-transform duration-300", isOpen && "rotate-180")} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsOpen(false)}
               className="fixed inset-0 z-40" 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 mt-3 w-72 glass rounded-[var(--radius-2xl)] shadow-2xl z-50 overflow-hidden border border-white/20 p-2"
            >
              {!isCreating ? (
                <div className="space-y-1">
                  <div className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex justify-between items-center">
                    Plan Branches
                    <div className="w-6 h-6 rounded-full bg-primary/5 flex items-center justify-center"><GitBranch size={10} className="text-primary" /></div>
                  </div>
                  
                  {branches.map(branch => {
                    const isActive = branch.id === activeBranchId;
                    return (
                      <button
                        key={branch.id}
                        onClick={() => { setActiveBranch(branch.id); setIsOpen(false); }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3.5 rounded-[var(--radius-md)] text-left transition-all group",
                          isActive ? "bg-primary text-primary-foreground" : "hover:bg-white/10 text-foreground/80 hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-white" : "bg-primary/40")} />
                          <span className="text-sm font-bold tracking-tight">{branch.name}</span>
                        </div>
                        {isActive ? <Check size={16} /> : <div className="opacity-0 group-hover:opacity-40"><GitMerge size={16} /></div>}
                      </button>
                    );
                  })}

                  <div className="p-2 pt-4 space-y-2">
                    {onCompareClick && (
                      <Button 
                        variant="ghost"
                        onClick={() => { onCompareClick(); setIsOpen(false); }}
                        className="w-full h-11 rounded-[var(--radius-md)] border border-primary/20 text-primary hover:bg-primary/10 transition-all duration-300"
                      >
                        <GitCompare size={16} className="mr-2" />
                        Compare Branches
                      </Button>
                    )}
                    <Button 
                      onClick={() => setIsCreating(true)}
                      className="w-full h-11 rounded-2xl bg-primary/5 text-primary border-primary/10 hover:bg-primary hover:text-white transition-all duration-500"
                    >
                      <Plus size={16} className="mr-2" />
                      New Plan Branch
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                   <div className="flex items-center justify-between">
                     <h4 className="text-xs font-black uppercase tracking-[0.2em]">New Branch</h4>
                     <button onClick={() => setIsCreating(false)}><X size={16} className="text-muted-foreground" /></button>
                   </div>
                   <input
                     autoFocus
                     className="w-full px-4 py-3 bg-white/10 rounded-[var(--radius-md)] border-none outline-none text-sm font-bold placeholder:text-muted-foreground/30"
                     placeholder="Branch Name..."
                     value={newBranchName}
                     onChange={(e) => setNewBranchName(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                   />
                   <Button onClick={handleCreate} className="w-full h-12 rounded-[var(--radius-md)]">Create Branch</Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
