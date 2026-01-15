import React, { useState, useRef } from 'react';
import { motion, Reorder, AnimatePresence, useDragControls } from 'framer-motion';
import { X, GripVertical, Trash2, Plus, Folder, Upload, CheckSquare, Square } from 'lucide-react';
import styles from './SettingsPanel.module.css';
import type { Gallery, SlideImage } from '../types';

interface Props {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  galleries: Gallery[];
  setGalleries: React.Dispatch<React.SetStateAction<Gallery[]>>;
  activeIdx: number;
  setActiveIdx: (idx: number) => void;
}

function ReorderItem({ img, isSelected, onToggle, onUpdate, onRemove }: { 
  img: SlideImage, isSelected: boolean, onToggle: () => void, 
  onUpdate: (key: keyof SlideImage, val: any) => void, onRemove: () => void 
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item 
      value={img} 
      dragListener={false} 
      dragControls={controls}
      className={`${styles.imageRow} ${isSelected ? styles.imageRowSelected : ''}`}
      whileDrag={{ scale: 1.02, backgroundColor: "rgba(100, 255, 170, 0.15)" }}
    >
      <div className="flex items-center gap-3">
        {/* Selection Checkbox */}
        <div onClick={onToggle} className="p-1 cursor-pointer">
          {isSelected ? <CheckSquare size={22} className="text-[#64ffaaaa]" /> : <Square size={22} className="text-gray-600" />}
        </div>

        {/* DRAG HANDLE */}
        <div 
          className="p-2 touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => controls.start(e)}
        >
          <GripVertical size={20} className="text-gray-500" />
        </div>

        <img src={img.preview} className={styles.thumbnail} alt="" />

        <div className="flex-1 min-w-0">
          <input 
            value={img.caption} 
            onChange={e => onUpdate('caption', e.target.value)} 
            className={styles.captionInput} 
          />
          <div className="flex gap-2 items-center text-[10px] text-[#64ffaaaa] font-bold mt-1">
            <span className="opacity-60">TIME:</span>
            <input 
              type="number" step="0.5" 
              value={img.duration} 
              onChange={e => onUpdate('duration', parseFloat(e.target.value))} 
              className={styles.durationInput} 
            />
            <span>SEC</span>
          </div>
        </div>

        <button onClick={onRemove} className="p-2 text-red-500/70 hover:text-red-500">
          <Trash2 size={18} />
        </button>
      </div>
    </Reorder.Item>
  );
}

export default function SettingsPanel({ setIsOpen, galleries, setGalleries, activeIdx, setActiveIdx }: Props) {
  const [activeTab, setActiveTab] = useState<'library' | 'playlist' | 'global'>('playlist');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDuration, setBulkDuration] = useState<number>(3);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const activeGallery = galleries[activeIdx];

  const toggleSelectAll = () => {
    if (selectedIds.length === activeGallery.images.length) setSelectedIds([]);
    else setSelectedIds(activeGallery.images.map(img => img.id));
  };

  const applyBulkDuration = () => {
    const updated = [...galleries];
    updated[activeIdx].images = updated[activeIdx].images.map(img => 
      selectedIds.includes(img.id) ? { ...img, duration: bulkDuration } : img
    );
    setGalleries(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && activeGallery) {
      const newImgs = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        blob: file, preview: URL.createObjectURL(file), duration: 3, caption: file.name.split('.')[0], filter: 'none'
      }));
      const updated = [...galleries];
      updated[activeIdx].images.push(...newImgs);
      setGalleries(updated);
    }
  };

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: 'spring', damping: 25 }} className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.tabGroup}>
          {['library', 'playlist', 'global'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`${styles.tabButton} ${activeTab === t ? styles.tabButtonActive : ''}`}>
              {t === 'playlist' ? 'IMAGES' : t.toUpperCase()}
            </button>
          ))}
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/40"><X /></button>
      </div>

      <div className={styles.scrollArea}>
        <AnimatePresence>
          {activeTab === 'playlist' && selectedIds.length > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={styles.selectionBar}>
              <span className="text-[10px] font-black uppercase">{selectedIds.length} Selected</span>
              <div className={styles.bulkActions}>
                <input type="number" step="0.5" value={bulkDuration} onChange={(e) => setBulkDuration(parseFloat(e.target.value))} className={styles.bulkInput} />
                <button onClick={applyBulkDuration} className={styles.applyButton}>SET DURATION</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'library' && (
          <div className="space-y-4">
            <button onClick={() => {
              const newG = { id: Math.random().toString(36).substr(2, 9), name: `Gallery ${galleries.length + 1}`, images: [], settings: { ...galleries[0].settings, autoplay: false } };
              setGalleries([...galleries, newG]);
              setActiveIdx(galleries.length);
              setActiveTab('playlist');
            }} className="w-full p-4 bg-[#64ffaaaa] text-black rounded-2xl flex items-center justify-center gap-2 font-black">
              <Plus size={20} /> NEW GALLERY
            </button>
            {galleries.map((g, idx) => (
              <div key={g.id} onClick={() => { setActiveIdx(idx); setSelectedIds([]); }} className={`${styles.imageRow} ${activeIdx === idx ? styles.imageRowSelected : ''}`} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="flex items-center gap-3">
                  <Folder className={activeIdx === idx ? 'text-[#64ffaaaa]' : 'text-gray-500'} />
                  <input className="bg-transparent border-none outline-none text-white font-bold" value={g.name} onClick={e => e.stopPropagation()} onChange={e => {
                    const updated = [...galleries]; updated[idx].name = e.target.value; setGalleries(updated);
                  }} />
                </div>
                {galleries.length > 1 && <button onClick={e => { e.stopPropagation(); setGalleries(galleries.filter(item => item.id !== g.id)); setActiveIdx(0); }} className="text-red-500"><Trash2 size={18} /></button>}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'playlist' && activeGallery && (
          <div className="space-y-6">
            <button onClick={() => fileInputRef.current?.click()} className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-black text-[#64ffaaaa] active:bg-[#64ffaaaa]/10">
              <Upload size={20} /> ADD IMAGES <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
            </button>
            
            {activeGallery.images.length > 0 && (
              <div className={styles.selectAllContainer} onClick={toggleSelectAll}>
                {selectedIds.length === activeGallery.images.length ? <CheckSquare size={20} className="text-[#64ffaaaa]" /> : <Square size={20} />}
                <span className="text-[10px] font-black uppercase tracking-widest">Select All</span>
              </div>
            )}

            <Reorder.Group axis="y" values={activeGallery.images} onReorder={newOrder => { 
              const updated = [...galleries]; 
              updated[activeIdx].images = newOrder; 
              setGalleries(updated); 
            }}>
              {activeGallery.images.map(img => (
                <ReorderItem 
                  key={img.id} 
                  img={img} 
                  isSelected={selectedIds.includes(img.id)}
                  onToggle={() => setSelectedIds(prev => prev.includes(img.id) ? prev.filter(i => i !== img.id) : [...prev, img.id])}
                  onUpdate={(key, val) => {
                    const updated = [...galleries];
                    updated[activeIdx].images = updated[activeIdx].images.map(i => i.id === img.id ? {...i, [key]: val} : i);
                    setGalleries(updated);
                  }}
                  onRemove={() => {
                    const updated = [...galleries];
                    updated[activeIdx].images = updated[activeIdx].images.filter(i => i.id !== img.id);
                    setGalleries(updated);
                    setSelectedIds(prev => prev.filter(i => i !== img.id));
                  }}
                />
              ))}
            </Reorder.Group>
          </div>
        )}

        {activeTab === 'global' && (
          <div className="space-y-8">
            <div className={styles.section}>
              <label className={styles.label}>Transitions</label>
              <div className={styles.grid}>
                {['slide', 'fade', 'zoom', 'flip', 'slideUp'].map(t => (
                  <button key={t} onClick={() => {
                    const updated = [...galleries];
                    updated[activeIdx].settings.globalTransitionType = t as any;
                    setGalleries(updated);
                  }} className={`${styles.optionCard} ${activeGallery.settings.globalTransitionType === t ? styles.optionCardActive : ''}`}>
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.section}>
               <label className={styles.label}>Settings</label>
               <div className="space-y-4">
                 <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl"><span>Loop Playlist</span><input type="checkbox" checked={activeGallery.settings.loop} onChange={e => { const updated = [...galleries]; updated[activeIdx].settings.loop = e.target.checked; setGalleries(updated); }} className={styles.checkbox} /></div>
                 <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl"><span>Autoplay</span><input type="checkbox" checked={activeGallery.settings.autoplay} onChange={e => { const updated = [...galleries]; updated[activeIdx].settings.autoplay = e.target.checked; setGalleries(updated); }} className={styles.checkbox} /></div>
                 <div className="bg-white/5 p-4 rounded-2xl">
                    <div className="flex justify-between mb-2 text-xs font-bold uppercase"><span>Background Blur</span><span className="text-[#64ffaaaa]">{activeGallery.settings.bgBlur}px</span></div>
                    <input type="range" min="0" max="40" value={activeGallery.settings.bgBlur} onChange={e => { const updated = [...galleries]; updated[activeIdx].settings.bgBlur = parseInt(e.target.value); setGalleries(updated); }} className="w-full accent-[#64ffaaaa]" />
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}