import { useState, useCallback, useId, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Search, LayoutGrid, LayoutPanelLeft, Filter, PenTool, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from './ui/context-menu';

const LazyHoverVideo = ({ src, layoutId, className }: { src: string, layoutId: string, className: string }) => {
  const [isIntersecting, setIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIntersecting(true);
      }
    }, { rootMargin: '500px' });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full h-full relative font-mono text-[10px] text-white/50 flex items-center justify-center">
      {!isIntersecting && <span>Loading Video...</span>}
      {isIntersecting && (
         <motion.video 
            layoutId={layoutId} 
            src={src} 
            loop 
            muted 
            playsInline 
            className={className} 
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => e.currentTarget.pause()}
            preload="metadata"
         />
      )}
    </div>
  );
};

export default function Moodboard({ projectId, project, assets = [], addAsset, removeAsset, updateTitle, user, setView, deleteProject }: any) {
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [layout, setLayout] = useState<'grid' | 'masonry'>('masonry');
  const [activeMedia, setActiveMedia] = useState<any | null>(null);
  const navigate = useNavigate();
  const generalId = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveMedia(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    for (const file of acceptedFiles) {
      const isImage = file.type.startsWith('image/');
      
      const reader = new FileReader();
      
      const fileDataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      let width = 800;
      let height = 600;

      if (isImage) {
        const img = new Image();
        img.src = fileDataUrl;
        await new Promise((resolve) => {
          img.onload = () => resolve(true);
        });
        width = img.width;
        height = img.height;
      }

      try {
        await addAsset({
          url: fileDataUrl,
          type: isImage ? 'image' : 'video',
          width,
          height,
          addedBy: user.uid,
        });
      } catch (e) {
        console.error(e);
      }
    }
    setUploading(false);
  }, [projectId, user.uid, addAsset]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': [], 'video/*': []}, noClick: true, noKeyboard: true });

  const filteredAssets = assets.filter((a: any) => filterType === 'all' || a.type === filterType);
  
  const photos = filteredAssets.map((a: any) => ({
    src: a.url,
    width: a.width || 800,
    height: a.height || 600,
    key: a.id,
    id: a.id,
    type: a.type
  }));

  const { scrollY } = useScroll();
  const titleScale = useTransform(scrollY, [0, 400], [1, 0.2]);
  const titleColor = useTransform(scrollY, [0, 400], ['#1a1a1a', '#ffffff']);
  
  return (
    <div className="relative w-screen min-h-screen bg-[#121212] text-white font-sans flex flex-col no-scrollbar" {...getRootProps()}>
      <input {...getInputProps()} />

      {/* Red Background Gradient coming from bottom to top */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ background: 'linear-gradient(to top, #ff2300 0%, #3a0900 15%, #121212 40%, #121212 100%)' }} />

      {/* Massive Background Typography */}
      <motion.div 
        className="fixed top-0 left-0 w-full px-16 pt-8 pointer-events-none z-30 user-select-none"
        style={{ scale: titleScale, transformOrigin: 'top left', color: titleColor }}
      >
        <textarea 
          className="font-bold text-[10vw] leading-[0.8] tracking-tighter uppercase disabled:bg-transparent placeholder-[#1a1a1a]/50 w-full outline-none bg-transparent pointer-events-auto resize-none h-[40vh] overflow-hidden"
          style={{ color: 'inherit' }}
          value={project?.name || ''}
          placeholder="NOME DO PROJETO"
          onChange={(e) => updateTitle(e.target.value)}
        />
      </motion.div>

      <div className="w-full flex-1 flex flex-col pt-[35vh] relative z-10 px-16 pointer-events-auto">
        {/* Tools & Search row sticky header */}
        <div className="sticky top-6 z-40 flex items-center justify-end w-full pointer-events-none mb-8">
          <div className="flex bg-[#121212]/80 backdrop-blur-md px-6 py-3 rounded-full items-center gap-6 pointer-events-auto border border-white/5 shadow-2xl">
            <div className="flex items-center gap-4 text-[#555]">
               <LayoutGrid onClick={() => setLayout('grid')} className={`w-5 h-5 cursor-pointer transition-colors ${layout === 'grid' ? 'text-[#FF4500]' : 'hover:text-white'}`} />
               <LayoutPanelLeft onClick={() => setLayout('masonry')} className={`w-5 h-5 cursor-pointer transition-colors ${layout === 'masonry' ? 'text-[#FF4500]' : 'hover:text-white'}`} />
               <Filter 
                 onClick={() => setFilterType(prev => prev === 'all' ? 'image' : prev === 'image' ? 'video' : 'all')} 
                 className={`w-5 h-5 cursor-pointer transition-colors ${filterType !== 'all' ? 'text-[#FF4500]' : 'hover:text-white'}`} 
               />
               {filterType !== 'all' && <span className="text-[10px] uppercase font-bold text-[#FF4500] ml-[-8px]">{filterType}s</span>}
            </div>
            <div className="flex items-center bg-transparent border border-[#555] rounded-full px-3 py-1.5 w-64">
              <input 
                type="text" 
                placeholder="SEARCH"
                className="bg-transparent text-white placeholder-[#555] outline-none text-xs font-bold uppercase flex-1" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
              <Search className="w-3.5 h-3.5 ml-2 text-[#555]" />
            </div>
            
            {/* Whiteboard Toggle & Delete Project */}
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); setView('whiteboard'); }} className="border border-white/20 text-white/40 hover:text-white hover:border-white/50 h-7 px-4 rounded-full flex items-center text-[10px] uppercase tracking-widest font-bold transition-all">
                <PenTool className="w-3 h-3 mr-2" /> Draw
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteProject && deleteProject(); }} 
                className="border border-red-500/30 text-red-500/70 hover:text-red-500 hover:border-red-500 hover:bg-red-500/10 h-7 w-7 rounded-full flex items-center justify-center transition-all"
                title="Deletar Projeto"
              >
                <Trash2 className="w-3" />
              </button>
            </div>
          </div>
        </div>

        {isDragActive && (
          <div className="fixed inset-0 z-50 bg-[#ff2300]/80 backdrop-blur-sm border-4 border-dashed border-white/40 flex flex-col items-center justify-center pointer-events-none">
             <span className="font-bold text-4xl text-white tracking-widest uppercase">Drop Images Here</span>
          </div>
        )}

        {/* Center Images Area */}
        <div className="w-full pb-32">
        {filteredAssets.length === 0 && !uploading && (
           <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
             {/* Placeholders matching layout if empty */}
             {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="aspect-square bg-[#1a1a1a] transition-colors border border-transparent overflow-hidden relative"></div>
             ))}
           </div>
        )}

        {filteredAssets.length > 0 && (layout === 'masonry' ? (
           <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
             {photos.map((p: any) => (
               <ContextMenu key={p.key}>
                 <ContextMenuTrigger asChild>
                   <motion.div 
                     layoutId={`container-${generalId}-${p.key}`}
                     onClick={() => setActiveMedia(p)}
                     className="relative inline-block w-full break-inside-avoid border border-transparent hover:border-[#FF4500] group overflow-hidden cursor-pointer"
                   >
                     {p.type === 'video' ? (
                       <LazyHoverVideo layoutId={`media-${generalId}-${p.key}`} src={p.src || ''} className="w-full h-auto object-cover transition-transform hover:scale-105 duration-700" />
                     ) : (
                       <motion.img layoutId={`media-${generalId}-${p.key}`} src={p.src || undefined} loading="lazy" className="w-full h-auto object-cover transition-transform hover:scale-105 duration-700" />
                     )}
                   </motion.div>
                 </ContextMenuTrigger>
                 <ContextMenuContent className="w-40" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
                   <ContextMenuItem 
                     variant="destructive" 
                     onSelect={() => removeAsset(p.id)}
                     onClick={(e) => e.stopPropagation()}
                     onPointerDown={(e) => e.stopPropagation()}
                     onPointerUp={(e) => e.stopPropagation()}
                   >
                     Deletar
                   </ContextMenuItem>
                 </ContextMenuContent>
               </ContextMenu>
             ))}
           </div>
        ) : (
           <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
             {photos.map((p: any) => (
                <ContextMenu key={p.key}>
                  <ContextMenuTrigger asChild>
                    <motion.div 
                      layoutId={`container-${generalId}-${p.key}`}
                      onClick={() => setActiveMedia(p)}
                      className="aspect-square bg-[#1a1a1a] transition-colors overflow-hidden relative border border-transparent hover:border-[#FF4500] cursor-pointer"
                    >
                     {p.type === 'video' ? (
                       <LazyHoverVideo layoutId={`media-${generalId}-${p.key}`} src={p.src || ''} className="absolute inset-0 w-full h-full object-cover transition-transform hover:scale-105 duration-700" />
                     ) : (
                       <motion.img layoutId={`media-${generalId}-${p.key}`} src={p.src || undefined} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform hover:scale-105 duration-700" />
                     )}
                    </motion.div>
                  </ContextMenuTrigger>
                  <ContextMenuContent 
                    className="w-40"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                  >
                    <ContextMenuItem 
                      variant="destructive" 
                      onSelect={() => removeAsset(p.id)}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerUp={(e) => e.stopPropagation()}
                    >
                      Deletar
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
             ))}
           </div>
        ))}
      </div>
     </div>

      <AnimatePresence>
        {activeMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#121212]/95 backdrop-blur-md"
            onClick={() => setActiveMedia(null)}
          >
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-6 right-6 z-[110] p-3 border border-white/20 text-white/50 rounded-full hover:text-white hover:border-white/50 transition-colors bg-black/40"
              onClick={() => setActiveMedia(null)}
            >
              <X className="w-6 h-6" />
            </motion.button>
            <motion.div 
              layoutId={`container-${generalId}-${activeMedia.key}`}
              className="relative w-full max-w-6xl h-full max-h-[85vh] flex items-center justify-center p-8 overflow-hidden pointer-events-none"
            >
              {activeMedia.type === 'video' ? (
                <motion.video 
                  layoutId={`media-${generalId}-${activeMedia.key}`} 
                  src={activeMedia.src || undefined} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain pointer-events-auto shadow-[0_0_100px_rgba(255,69,0,0.1)] outline-none rounded-lg" 
                />
              ) : (
                <motion.img 
                  layoutId={`media-${generalId}-${activeMedia.key}`} 
                  src={activeMedia.src || undefined} 
                  className="max-w-full max-h-full object-contain pointer-events-auto shadow-[0_0_100px_rgba(255,69,0,0.1)] outline-none rounded-lg" 
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Left Avatar */}
      <div className="fixed bottom-10 left-16 z-20 flex items-center cursor-pointer group" onClick={() => navigate('/')}>
        {user?.photoURL ? (
          <img src={user.photoURL} alt="User" className="w-12 h-12 rounded-full border border-transparent group-hover:border-white/20 grayscale group-hover:grayscale-0 transition-all" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-transparent group-hover:border-white/20 transition-all" />
        )}
      </div>

      {/* Bottom Right Logo */}
      <div className="fixed bottom-10 right-12 z-20 opacity-60 pointer-events-none flex flex-col items-center">
        <div className="font-serif text-[#1a1a1a] text-5xl leading-none">30</div>
        <div className="text-[10px] font-bold tracking-[0.2em] font-sans uppercase mt-1 text-[#1a1a1a] relative">
          <span className="absolute -bottom-1 left-0 right-0 h-[1px] bg-[#1a1a1a] opacity-50"></span>
          Praum
        </div>
      </div>
    </div>
  );
}
