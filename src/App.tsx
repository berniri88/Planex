import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, type AuthState } from './store/useAuthStore';
import { useTripStore } from './store/useTripStore';
import { cn } from './lib/utils';
import { Login } from './components/Login';
import { Itinerary } from './components/Itinerary';
import { CreateTripModal } from './components/CreateTripModal';
import { Expenses } from './components/Expenses';
import { Button } from './components/ui/Button';
import { LogOut, ArrowLeft, Globe, Map as MapIcon, Mountain, Moon, Sun, Calendar, Landmark, MapPin } from 'lucide-react';
import { mockTrips } from './lib/mockData';
import { hapticFeedback } from './lib/haptics';
import { MapView } from './components/MapView';

const IconMap = {
  Globe,
  Map: MapIcon,
  Mountain,
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return false;
    }
    return false;
  });

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const user = useAuthStore((state: AuthState) => state.user);
  const signOut = useAuthStore((state: AuthState) => state.signOut);
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20 selection:text-primary transition-colors duration-500">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 h-[72px] bg-background flex items-center justify-between px-6 z-[100] border-b border-border shadow-none transition-colors">
        <div className="flex items-center gap-4">
          {!isHome && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="rounded-2xl w-10 h-10 p-0 hover:bg-black/5 dark:hover:bg-white/10 transition-colors border border-border dark:border-none">
               <ArrowLeft size={20} />
            </Button>
          )}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30 group-hover:scale-110 transition-transform duration-500">
              <span className="text-white text-lg font-black italic">P</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Planex</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setIsDark(!isDark); hapticFeedback('light'); }} 
            className="w-10 h-10 p-0 rounded-2xl bg-secondary text-foreground transition-all border border-border shadow-sm"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </Button>

          {user && (
            <Button variant="ghost" size="sm" onClick={signOut} className="rounded-2xl w-10 h-10 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
              <LogOut size={20} />
            </Button>
          )}
        </div>
      </header>

      {/* Content wrapper with top padding to account for fixed header */}
      <main className="flex-1 mt-[72px] relative w-full overflow-x-hidden">
         {children}
      </main>
    </div>
  );
};


const TripContainer = () => {
  const { id } = useParams();
  const trips = useTripStore(state => state.trips);
  const isLoading = useTripStore(state => state.isLoading);
  const [activeTab, setActiveTab] = React.useState<'timeline' | 'map' | 'expenses'>('timeline');
  
  const trip = trips.find(t => t.id === id);

  if (isLoading || !trip) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-[calc(100vh-72px)]">
         <motion.div 
            animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-12 h-12 border-b-2 border-primary rounded-full"
         />
      </div>
    );
  }
  const tabs = [
    { id: 'timeline', label: 'Itinerary', icon: Calendar },
    { id: 'map', label: 'Map', icon: MapIcon },
    { id: 'expenses', label: 'Expenses', icon: Landmark },
  ] as const;

  return (
    <div className="flex flex-col min-h-[calc(100vh-72px)] bg-background transition-colors">
      {/* Trip Bar Sticky below Header */}
      <div className="sticky top-0 z-40 px-6 py-4 bg-background border-b border-border flex-shrink-0 -mt-0 transition-colors">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex flex-col items-center sm:items-start">
              <h2 className="text-xl font-black tracking-tighter italic leading-none">{trip.name}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1.5">{trip.dates}</p>
           </div>

           <div className="flex gap-1 p-1 bg-secondary border border-border rounded-2xl mx-4 transition-colors">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); hapticFeedback('light'); }}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2 rounded-xl transition-all duration-300 text-[11px] font-black uppercase tracking-widest",
                      isActive 
                        ? "bg-background text-primary shadow-lg scale-[1.05]" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <tab.icon size={13} />
                    <span className="hidden md:inline">{tab.label}</span>
                  </button>
                );
              })}
           </div>
           
           <div className="hidden sm:flex items-center gap-1">
              {[1,2,3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[10px] font-black uppercase text-primary">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="min-h-full"
          >
            {activeTab === 'timeline' && <Itinerary />}
            {activeTab === 'map' && <MapView />}
            {activeTab === 'expenses' && <Expenses />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const trips = useTripStore(state => state.trips);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto px-6 py-12 space-y-16"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-foreground leading-[0.85] italic"
          >
            Your next <br/> <span className="text-primary not-italic">adventure</span> starts here.
          </motion.h2>
          <motion.p className="text-muted-foreground text-xl font-medium max-w-md">
            Planning trips made elegant and collaborative.
          </motion.p>
        </div>
        <Button 
          size="lg" 
          onClick={() => { setIsModalOpen(true); hapticFeedback('medium'); }}
          className="h-20 px-12 text-xl shadow-2xl hover:scale-105 transition-all rounded-[2.5rem]"
        >
          <span className="mr-3 font-light text-3xl">+</span> Start Planning
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {trips.map((trip) => (
          <motion.div
            key={trip.id}
             onClick={() => { navigate(`/trip/${trip.id}`); hapticFeedback('medium'); }}
             whileHover={{ scale: 1.03 }}
             transition={{ type: "spring", stiffness: 300, damping: 20 }}
             className="premium-card p-10 cursor-pointer group relative overflow-hidden flex flex-col min-h-[420px] bg-card border-border transition-colors"
          >
            <div className={`absolute top-[-20%] right-[-20%] w-[60%] h-[60%] ${trip.color} rounded-full blur-3xl opacity-30 transition-transform group-hover:scale-150 duration-1000`} />
            
            <div className="w-16 h-16 bg-secondary rounded-[2rem] flex items-center justify-center mb-10 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-sm border border-border">
               {(() => {
                 const Icon = IconMap[trip.icon as keyof typeof IconMap] || Globe;
                 return <Icon size={32} />;
               })()}
            </div>
            
            <div className="mt-auto space-y-6">
               <span className="inline-block px-5 py-2 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.3em] border border-primary/10">
                  {trip.status}
               </span>
               <div className="space-y-2">
                 <h3 className="text-4xl font-black text-foreground leading-none tracking-tighter italic">{trip.name}</h3>
                 <p className="text-sm text-muted-foreground font-bold uppercase tracking-[0.2em]">{trip.dates}</p>
               </div>
            </div>
          </motion.div>
        ))}
        
        <div 
          onClick={() => { setIsModalOpen(true); hapticFeedback('medium'); }}
          className="border-4 border-dashed border-border flex flex-col items-center justify-center p-12 rounded-[3.5rem] cursor-pointer hover:border-primary/40 transition-all group hover:bg-primary/5 min-h-[420px] bg-card"
        >
          <div className="w-24 h-24 rounded-[3.5rem] bg-secondary flex items-center justify-center text-muted-foreground mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-none border border-border">
             <span className="text-5xl font-light">+</span>
          </div>
          <span className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.4em] group-hover:text-primary transition-colors">Start Journey</span>
        </div>
      </div>

      <CreateTripModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </motion.div>
  );
};

function App() {
  const user = useAuthStore((state: AuthState) => state.user);
  const isLoading = useAuthStore((state: AuthState) => state.isLoading);
  const fetchTrips = useTripStore(state => state.fetchTrips);

  React.useEffect(() => {
    if (user) {
      fetchTrips();
    }
  }, [user, fetchTrips]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
           animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
           transition={{ repeat: Infinity, duration: 2 }}
           className="w-16 h-16 border-b-4 border-primary rounded-full"
        />
      </div>
    );
  }

  return (
    <BrowserRouter>
      {user ? (
        <Layout>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/trip/:id" element={<TripContainer />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Layout>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
