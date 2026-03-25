import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';
import { IconPicker } from './IconPicker';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  selectedIconName?: string;
}

export { ICON_LIST } from '../../lib/icons';

export const IconPickerModal = ({ isOpen, onClose, onSelect, selectedIconName }: IconPickerModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-popover rounded-[var(--radius-3xl)] shadow-2xl w-full max-w-2xl flex flex-col h-[75vh] max-h-[650px] pointer-events-auto border border-border relative overflow-hidden"
          >
            {/* Modal Header Overlay (Close button) */}
            <div className="absolute top-6 right-6 z-[310]">
              <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 p-0 rounded-full bg-secondary/80 backdrop-blur-sm border border-border hover:bg-primary hover:text-white transition-all">
                <X size={18} />
              </Button>
            </div>

            <IconPicker 
               onSelect={(name) => {
                 onSelect(name);
                 onClose();
               }}
               selectedIconName={selectedIconName}
               className="h-full"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
