import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "¿Eliminar registro?", 
  description = "Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este elemento del itinerario?"
}: DeleteConfirmModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-popover rounded-[2rem] shadow-2xl w-full max-w-md p-8 border border-border relative z-10"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-[2rem] bg-destructive/10 text-destructive flex items-center justify-center shadow-inner">
                <AlertTriangle size={36} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight">{title}</h3>
                <p className="text-sm text-muted-foreground font-medium px-4">
                  {description}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
                <Button 
                  variant="ghost" 
                  onClick={onClose}
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest bg-secondary"
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest bg-red-500 text-white shadow-lg shadow-red-500/20"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
