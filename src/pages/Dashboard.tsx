import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, PanInfo } from 'motion/react';
import { Search, Plus, PenTool, Trash2 } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '../components/ui/context-menu';


export default function Dashboard({ user }: { user: any }) {
  const navigate = useNavigate();
  const { projects, loading, createProject, renameProject, deleteProject } = useProjects(user?.uid);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dashboardView, setDashboardView] = useState<'moodboard' | 'whiteboard'>('moodboard');

  const wheelTimeout = useRef<number | null>(null);

  const handleCreateProject = async () => {
    setCreating(true);
    try {
      const newProjectId = await createProject();
      navigate(`/project/${newProjectId}`, { state: { defaultView: dashboardView } });
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const filteredProjects = projects.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  const carouselItems = [
    { isCreate: true, id: 'create' },
    ...filteredProjects
  ];

  const getCardStyle = (index: number) => {
    const total = carouselItems.length;
    let diff = index - activeIndex;
    
    // Handle wrapping
    if (total > 2) {
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;
    }

    if (diff === 0) {
      return { y: 0, scale: 1, opacity: 1, zIndex: 5, rotateX: 0 };
    } else if (diff === -1) {
      return { y: -160, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: 8 };
    } else if (diff === -2) {
      return { y: -280, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: 15 };
    } else if (diff === 1) {
      return { y: 160, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: -8 };
    } else if (diff === 2) {
      return { y: 280, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: -15 };
    } else {
      return { y: diff > 0 ? 400 : -400, scale: 0.6, opacity: 0, zIndex: 0, rotateX: diff > 0 ? -20 : 20 };
    }
  };

  const isVisible = (index: number) => {
    const total = carouselItems.length;
    let diff = index - activeIndex;
    if (total > 2) {
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;
    }
    return Math.abs(diff) <= 2;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (wheelTimeout.current) return;
    if (e.deltaY > 20) {
      setActiveIndex(prev => (prev === carouselItems.length - 1 ? 0 : prev + 1));
      wheelTimeout.current = window.setTimeout(() => { wheelTimeout.current = null }, 400);
    } else if (e.deltaY < -20) {
      setActiveIndex(prev => (prev === 0 ? carouselItems.length - 1 : prev - 1));
      wheelTimeout.current = window.setTimeout(() => { wheelTimeout.current = null }, 400);
    }
  };

  const handleDragEnd = (e: any, info: PanInfo) => {
    if (info.offset.y < -50) {
       setActiveIndex(prev => (prev === carouselItems.length - 1 ? 0 : prev + 1));
    } else if (info.offset.y > 50) {
       setActiveIndex(prev => (prev === 0 ? carouselItems.length - 1 : prev - 1));
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#121212] text-white font-sans flex items-center justify-center">
      
      {/* Background Gradient */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none" 
        style={{ background: 'radial-gradient(ellipse 150% 150% at 50% -20%, #121212 40%, #3a0900 85%, #ff2300 150%)' }} 
      />

      {/* Massive Background Typography */}
      <div className="absolute top-0 inset-x-0 w-full flex justify-center pointer-events-none z-0 mt-[-2vh]">
        <h1 className="font-bold text-[20vw] leading-[0.8] text-[#1a1a1a]/50 tracking-tight uppercase whitespace-nowrap overflow-hidden">
          CRIATIVO
        </h1>
      </div>

      {/* Left Menu Sidebar */}
      <div className="absolute top-1/2 -translate-y-1/2 left-16 flex flex-col gap-2 z-30 pointer-events-auto">
        {[
          { label: "Moodboards", value: "moodboard" },
          { label: "Whiteboards", value: "whiteboard" }
        ].map((item, index) => {
          const isActive = dashboardView === item.value;
          return (
            <motion.div
              key={`${item.value}-${index}`}
              className="group/nav flex items-center gap-2 cursor-pointer text-white max-w-fit"
              initial="initial"
              animate={isActive ? "hover" : "initial"}
              whileHover="hover"
              onClick={() => setDashboardView(item.value as 'moodboard' | 'whiteboard')}
            >
              <motion.div
                variants={{
                  initial: { x: 0, color: "inherit" },
                  hover: { x: 10, color: "#ff4500", skewX: -10 },
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`uppercase font-semibold no-underline ${isActive ? 'text-2xl font-black' : 'text-xl'}`}
              >
                {item.label}
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Top Right Search */}
      <div className="absolute top-10 right-12 z-30 flex items-center bg-transparent border border-[#555] rounded-full px-4 py-2 w-64 pointer-events-auto">
        <input 
          type="text" 
          placeholder="SEARCH"
          className="bg-transparent text-white placeholder-[#555] outline-none text-xs font-bold uppercase flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Search className="w-4 h-4 text-[#555] ml-2" />
      </div>

      {/* Bottom Left User Info & Logout */}
      <div className="absolute bottom-10 left-16 z-30 flex items-center gap-4 cursor-pointer group pointer-events-auto">
        {user.photoURL ? (
          <img src={user.photoURL} alt="User" className="w-12 h-12 rounded-full border border-transparent group-hover:border-white/20 grayscale group-hover:grayscale-0 transition-all" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-transparent group-hover:border-white/20 transition-all" />
        )}
      </div>

      {/* Bottom Right Logo */}
      <div className="absolute bottom-10 right-12 z-10 opacity-60 pointer-events-none flex flex-col items-center">
        <div className="font-serif text-[#1a1a1a] text-5xl leading-none">30</div>
        <div className="text-[10px] font-bold tracking-[0.2em] font-sans uppercase mt-1 text-[#1a1a1a] relative">
           <span className="absolute -bottom-1 left-0 right-0 h-[1px] bg-[#1a1a1a] opacity-50"></span>
           Praum
        </div>
      </div>

      {/* Center Carousel */}
      <div 
        className="absolute inset-x-0 inset-y-20 flex justify-center items-center z-20 pointer-events-auto"
        onWheel={handleWheel}
      >
        <div className="relative w-[340px] h-[480px] flex justify-center items-center" style={{ perspective: "1200px" }}>
          {carouselItems.map((item, index) => {
            if (!isVisible(index)) return null;
            const style = getCardStyle(index);
            const isCurrent = index === activeIndex;

            if (item.isCreate) {
              return (
                <motion.div 
                  key={item.id}
                  animate={{ 
                    y: style.y,
                    scale: style.scale,
                    opacity: style.opacity,
                    rotateX: style.rotateX,
                    zIndex: style.zIndex,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 1 }}
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  onClick={() => isCurrent ? handleCreateProject() : setActiveIndex(index)}
                  className={`absolute w-[340px] h-[400px] rounded-[2.5rem] bg-[#1a1a1a] flex items-center justify-center shadow-2xl shadow-black/50 cursor-pointer hover:border hover:border-white/20`}
                  style={{
                    transformStyle: "preserve-3d",
                    zIndex: style.zIndex,
                    boxShadow: isCurrent
                      ? "0 25px 50px -12px rgba(255,255,255, 0.15), 0 0 0 1px rgba(255,255,255, 0.05)"
                      : "0 10px 30px -10px rgba(255,255,255, 0.1)",
                  }}
                >
                  {creating ? <div className="text-white/50 text-xs font-bold tracking-widest">CRIANDO...</div> : <Plus className="w-16 h-16 text-white/50" strokeWidth={1} />}
                </motion.div>
              );
            }

            return (
              <ContextMenu key={item.id}>
                <ContextMenuTrigger asChild>
                  <motion.div 
                    animate={{ 
                      y: style.y,
                      scale: style.scale,
                      opacity: style.opacity,
                      rotateX: style.rotateX,
                      zIndex: style.zIndex,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 1 }}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    onClick={() => isCurrent ? navigate(`/project/${item.id}`, { state: { defaultView: dashboardView } }) : setActiveIndex(index)}
                    className={`absolute w-[340px] h-[400px] rounded-[2.5rem] bg-black overflow-hidden group shadow-2xl cursor-pointer border border-transparent hover:border-white/10`}
                    style={{
                      transformStyle: "preserve-3d",
                      zIndex: style.zIndex,
                      boxShadow: isCurrent
                        ? "0 25px 50px -12px rgba(255,255,255, 0.15), 0 0 0 1px rgba(255,255,255, 0.05)"
                        : "0 10px 30px -10px rgba(0,0,0, 0.5)",
                    }}
                  >
                    <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-white/10 z-10 pointer-events-none" />
                    <img src={item.coverUrl || `https://picsum.photos/seed/${item.id}/800/800`} alt={item.name} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/90 via-[#121212]/20 to-transparent pointer-events-none z-0" />
                    
                    <div className="absolute bottom-8 left-8 right-8 z-20 pointer-events-none transition-transform duration-300 group-hover:translate-y-[-8px]">
                      <h2 className="text-[#FF4500] text-xs uppercase leading-tight font-bold tracking-tight drop-shadow-md">
                        PROJETO<br/>
                        <span className="text-lg mt-1 text-white">{item.name || 'NOME DO PROJETO'}</span>
                      </h2>
                    </div>
                  </motion.div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-40 bg-[#1a1a1a] border-white/10 text-white">
                  <ContextMenuItem 
                    variant="destructive"
                    onSelect={(e) => {
                      e.preventDefault();
                      if (window.confirm('Tem certeza que deseja deletar este projeto?')) {
                        if (activeIndex >= carouselItems.length - 2) {
                          setActiveIndex(Math.max(0, activeIndex - 1));
                        }
                        deleteProject(item.id);
                      }
                    }}
                    className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
                  >
                    Deletar
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      </div>
    </div>
  );
}
