import { useState, useMemo } from 'react';
import { Search, Check, Palette, Ghost } from 'lucide-react';
import { ICON_LIST } from '../../lib/icons';
import { cn } from '../../lib/utils';

interface IconPickerProps {
  onSelect: (iconName: string) => void;
  selectedIconName?: string;
  className?: string;
  showSearch?: boolean;
}

export const IconPicker = ({ onSelect, selectedIconName, className, showSearch = true }: IconPickerProps) => {
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    const s = search.toLowerCase();
    return Object.keys(ICON_LIST).filter(name => 
      name.toLowerCase().includes(s)
    ).sort();
  }, [search]);

  return (
    <div className={cn("flex flex-col h-full bg-popover", className)}>
      {showSearch && (
        <div className="px-6 pt-6 pb-4 border-b border-border space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              <Palette size={20} className="text-primary" />
              Elegir Icono
            </h3>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              autoFocus
              className="w-full pl-11 pr-4 py-3 bg-secondary rounded-[var(--radius-lg)] border-2 border-border focus:border-primary/30 outline-none text-sm font-bold transition-all" 
              placeholder="Buscar ícono (ej: coffee, air...)" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {filteredIcons.map((name: string) => {
            const Icon = ICON_LIST[name];
            const isSelected = selectedIconName === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => onSelect(name)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3 rounded-[var(--radius-md)] transition-all aspect-square border-2 relative",
                  isSelected 
                    ? "bg-primary border-primary text-white scale-105 shadow-lg shadow-primary/20" 
                    : "bg-secondary/50 border-transparent hover:border-primary/30 hover:bg-secondary text-muted-foreground hover:text-primary"
                )}
              >
                <Icon size={24} strokeWidth={isSelected ? 2.5 : 1.5} />
                <span className="text-[9px] font-bold truncate w-full text-center">{name}</span>
                {isSelected && (
                  <div className="absolute top-1 right-1 bg-white text-primary rounded-full p-0.5 shadow-sm">
                    <Check size={8} strokeWidth={4} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {filteredIcons.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Ghost size={48} className="mb-2 opacity-20" />
            <p className="text-sm font-bold">No se encontraron íconos</p>
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-secondary/30 border-t border-border mt-auto shrink-0">
         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            {filteredIcons.length} Íconos disponibles
         </p>
      </div>
    </div>
  );
};
