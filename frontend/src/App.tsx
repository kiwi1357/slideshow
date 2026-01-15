import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize, 
  Settings as SettingsIcon, 
  Image as ImageIcon 
} from 'lucide-react';
import SettingsPanel from './components/SettingsPanel';
import { loadGalleriesFromDB, saveGalleriesToDB } from './services/db';
import type { Gallery, TransitionType } from './types';

export default function App() {
  //  STATE 
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [direction, setDirection] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const timerRef = useRef<number | null>(null);

  //  INITIALIZATION 
  useEffect(() => {
    // Load from IndexedDB
    loadGalleriesFromDB().then(data => {
      if (data.length > 0) {
        setGalleries(data);
      } else {
        // Default startup gallery
        setGalleries([{ 
          id: 'default', 
          name: 'Main Gallery', 
          images: [], 
          settings: { 
            globalTransitionType: 'slide', 
            globalEase: 'easeInOut', 
            objectFit: 'contain', 
            bgBlur: 15, 
            loop: true, 
            autoplay: false 
          } 
        }]);
      }
    });

    // Fullscreen Change Listener
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  //  AUTOSAVE 
  useEffect(() => { 
    if (galleries.length > 0) {
      saveGalleriesToDB(galleries); 
    }
  }, [galleries]);

  const activeGallery = galleries[activeIdx];
  const activeImage = activeGallery?.images[currentImgIdx];

  //  NAVIGATION LOGIC 
  const paginate = useCallback((dir: number) => {
    if (isAnimating || !activeGallery || activeGallery.images.length === 0) return;
    setDirection(dir);
    setIsAnimating(true);
    setCurrentImgIdx(prev => {
      const next = prev + dir;
      if (next >= activeGallery.images.length) return activeGallery.settings.loop ? 0 : prev;
      if (next < 0) return activeGallery.settings.loop ? activeGallery.images.length - 1 : prev;
      return next;
    });
  }, [isAnimating, activeGallery]);

  //  AUTOPLAY LOGIC 
  useEffect(() => {
    if (activeGallery?.settings.autoplay && activeGallery.images.length > 0 && !isSettingsOpen) {
      const currentImg = activeGallery.images[currentImgIdx];
      const dur = currentImg?.duration || 3;
      timerRef.current = window.setTimeout(() => paginate(1), dur * 1000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentImgIdx, activeGallery, isSettingsOpen, paginate]);

  //  ANIMATION VARIANTS 
  const getVariants = (type: TransitionType) => {
    const v = {
      slide: { 
        enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }), 
        center: { x: 0, opacity: 1 }, 
        exit: (d: number) => ({ x: d < 0 ? '100%' : '-100%', opacity: 0 }) 
      },
      fade: { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } },
      zoom: { enter: { scale: 0, opacity: 0 }, center: { scale: 1, opacity: 1 }, exit: { scale: 1.5, opacity: 0 } },
      flip: { enter: { rotateY: 90, opacity: 0 }, center: { rotateY: 0, opacity: 1 }, exit: { rotateY: -90, opacity: 0 } },
      slideUp: { enter: { y: '100%', opacity: 0 }, center: { y: 0, opacity: 1 }, exit: { y: '-100%', opacity: 0 } }
    };
    return v[type] || v.slide;
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (!activeGallery) return null;

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none font-sans">
      
      {/* 1. SETTINGS BUTTON (SAFE AREA AWARE) */}
      <AnimatePresence>
        {uiVisible && !isSettingsOpen && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={e => { e.stopPropagation(); setIsSettingsOpen(true); }} 
            style={{ 
              top: 'calc(var(--safe-top) + 10px)', 
              right: 'calc(var(--safe-right) + 10px)' 
            }}
            className="fixed z-[110] p-4 bg-[#64ffaaaa] text-black rounded-full shadow-2xl active:scale-75 transition-transform"
          >
            <SettingsIcon size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 2. DYNAMIC BLURRED BACKGROUND */}
      {activeImage && (
        <div 
          className="absolute inset-0 transition-all duration-1000" 
          style={{ 
            backgroundImage: `url(${activeImage.preview})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center',
            filter: `blur(${activeGallery.settings.bgBlur}px) brightness(0.3)`, 
            transform: 'scale(1.1)' 
          }} 
        />
      )}

      {/* 3. INTERACTIVE VIEWER LAYER */}
      <div 
        onClick={() => setUiVisible(!uiVisible)} 
        className="relative z-10 h-full w-full flex items-center justify-center"
      >
        {activeGallery.images.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 text-white/20 text-center px-10">
            <ImageIcon size={80} strokeWidth={1} />
            <div>
              <h2 className="text-xl font-bold text-white/50">{activeGallery.name}</h2>
              <p className="text-sm italic">Gallery is empty.<br/>Open settings to add photos.</p>
            </div>
          </div>
        ) : (
          <>
            {/* THE SLIDE */}
            <AnimatePresence initial={false} custom={direction} onExitComplete={() => setIsAnimating(false)}>
              <motion.div 
                key={activeImage?.id} 
                custom={direction} 
                variants={getVariants(activeGallery.settings.globalTransitionType)} 
                initial="enter" 
                animate="center" 
                exit="exit" 
                transition={{ 
                  type: activeGallery.settings.globalEase === 'spring' ? 'spring' : 'tween', 
                  ...(activeGallery.settings.globalEase !== 'spring' && { ease: activeGallery.settings.globalEase }), 
                  duration: 0.6 
                }} 
                className="absolute inset-0 p-4 flex items-center justify-center"
              >
                <img 
                  src={activeImage?.preview} 
                  className={`w-full h-full shadow-2xl rounded-xl ${activeGallery.settings.objectFit === 'contain' ? 'object-contain' : 'object-cover'}`} 
                  alt={activeImage?.caption}
                />
              </motion.div>
            </AnimatePresence>

            {/* 4. NAVIGATION CONTROLS (SAFE AREA AWARE) */}
            <motion.div 
              animate={{ opacity: uiVisible ? 1 : 0, y: uiVisible ? 0 : 20 }} 
              style={{ 
                bottom: 'calc(var(--safe-bottom) + 20px)', 
                paddingLeft: 'var(--safe-left)', 
                paddingRight: 'var(--safe-right)' 
              }}
              className="fixed inset-x-0 flex justify-between items-center px-8 pointer-events-none z-50"
            >
              <button 
                onClick={e => { e.stopPropagation(); paginate(-1); }} 
                className="p-5 bg-black/20 text-white rounded-full backdrop-blur-2xl border border-white/5 pointer-events-auto active:scale-75 transition-transform"
              >
                <ChevronLeft size={32} />
              </button>
              
              <button 
                onClick={toggleFullscreen} 
                className="p-5 bg-black/20 text-white rounded-full backdrop-blur-2xl border border-white/5 pointer-events-auto active:scale-75 transition-transform"
              >
                {isFullscreen ? <Minimize size={28} /> : <Maximize size={28} />}
              </button>

              <button 
                onClick={e => { e.stopPropagation(); paginate(1); }} 
                className="p-5 bg-black/20 text-white rounded-full backdrop-blur-2xl border border-white/5 pointer-events-auto active:scale-75 transition-transform"
              >
                <ChevronRight size={32} />
              </button>
            </motion.div>
          </>
        )}
      </div>

      {/* 5. SETTINGS PANEL OVERLAY */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsPanel 
            isOpen={isSettingsOpen} 
            setIsOpen={setIsSettingsOpen} 
            galleries={galleries} 
            setGalleries={setGalleries} 
            activeIdx={activeIdx} 
            setActiveIdx={setActiveIdx} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}