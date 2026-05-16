import React, { useRef, useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { X, Download, Layout, Type, Palette, ChevronRight, ChevronLeft, Save, Maximize2, Minimize2, GripVertical, Printer, Info, Maximize, Smartphone, Edit3, Eye, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const getContrastColor = (hexcolor: string) => {
  let r, g, b;
  if (hexcolor.length === 4) {
    r = parseInt(hexcolor[1] + hexcolor[1], 16);
    g = parseInt(hexcolor[2] + hexcolor[2], 16);
    b = parseInt(hexcolor[3] + hexcolor[3], 16);
  } else {
    r = parseInt(hexcolor.substring(1, 3), 16);
    g = parseInt(hexcolor.substring(3, 5), 16);
    b = parseInt(hexcolor.substring(5, 7), 16);
  }
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#050505' : '#ffffff';
};

const LogoSVG = ({ color }: { color: string }) => (
  <svg width="220" height="120" viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="858.65" y="763.78" width="219.49" height="3.14" fill={color}/>
    <g fill={color}>
      <path d="M1136.89,478.99c0,32.62-9.52,73.63-31.23,98.56-29.16,33.48-81.62,33.36-110.44-.49-12.12-14.23-19.89-30.95-24.34-49.63-9.2-38.64-9.24-79.33.09-117.94,10-41.42,36.99-76.09,82.18-74.66,17.4.55,33.23,6.61,46.22,18.46,26.5,24.16,37.5,69.45,37.51,104.61v21.09ZM1097.53,544.46c6.23-17.14,9.12-34.55,10.38-53.02,2.67-39.2-.01-95.12-25.32-125.26-8.39-9.99-20.23-15.44-32.76-15.21s-23.33,5.88-31.51,15.65c-22.25,26.55-26.2,72.76-25.7,107.57.32,22.5,2.65,44.17,9.45,65.43,7.56,23.62,22.43,46.08,47.84,46.58,24.08.47,39.49-19.32,47.63-41.73Z"/>
      <path d="M887.05,565.28c19-19.25,27.19-46.4,21.3-72.83-3.79-16.96-15.25-29.66-31.23-36.14-13.09-5.24-26.52-7.14-40.93-6.97l-1.68-2.54c-.37-.56,2.1-1.47,2.67-1.49,19.36-.67,37.27-7.43,50.93-20.91,15.35-16.55,19.14-40.22,9.73-60.82-12.12-26.55-52.01-29.82-73.25-10.28-8.69,9.26-13.07,21.58-12.18,34.59l-.99,2.54c-.29.74-3.04-.13-2.81-.45-1.63-12.08-3.74-22.46-6.7-34.21,9.83-11.46,23-20.02,38.21-23.45,27.53-6.2,59.36-2.88,78.23,18.44,24.38,27.54,10.6,69.46-20.35,88.32l-15.07,5.92c15.36,2.62,28.53,10.4,39.1,22.14,24.93,27.7,18.6,71.61-6.68,99.75-28.23,31.43-72.05,41.73-113.59,33.96l.07-3.88c31.41.63,63.05-9.22,85.22-31.69Z"/>
      <path d="M1166.06,663.18l-28.22,60.77c-.54,1.17-3.24,3.72-3.85,2.46l-29.11-60.83-.23,54.22,6.09,5.13-16.24.65-.07-2.28c-.02-.73,5.07-1.28,5.07-5.28l.03-57.8c0-1.78-2.09-4.39-3.37-5.16l-1.74-1.05c-.48-.29.48-2.19.62-2.04l14.39.17,28.32,57.99,27.44-58,16.7.03-5.88,5.59.04,62.47c2.48,1.73,3.33,2.27,5.78,4.88l-21.84-.14,6.3-5.43-.23-56.32Z"/>
      <path d="M845.42,691.06l-8.54-.31.02,29.12,5.8,5.07h-21.55s5.82-5.23,5.82-5.23v-62.12s-5.68-5.38-5.68-5.38l35.01-.09c5.06-.01,11.49,2.2,14.88,5.62,5.8,5.86,6.7,14.04,3.85,21.34-2.6,6.65-9.31,10.36-17.58,11.66l23.77,30.96c2.31.92,3.26,1.32,5.65,3.13l-16.53.35-24.89-34.11ZM852.1,686.29c9.17-.19,14.57-7.96,14.1-15.85s-6.53-13.54-14.86-13.7l-14.43-.28-.02,30.14,15.22-.32Z"/>
      <path d="M1068.67,652.19l-6.2,5.32-.14,40.25-1.74,12.23c-1.27,8.93-8.8,15.42-17.87,16.68-15,2.09-32.43.2-36.79-14.43-1.22-4.11-2.35-9.15-2.36-13.46l-.03-39.6c0-4.27-5.82-3.5-5.43-7.18l20.98.22-5.55,4.7.09,43.76c.01,5.04,1.9,12.19,5.88,15.32,7.69,6.04,19.84,6.12,27.9,1.07,6.04-3.79,8.88-11.24,8.99-18.16l.63-41.1-6.1-5.69,17.74.08Z"/>
      <path d="M759.67,721.89l2.72,1.53c.64.36-.97,2.14-1.81,2.12l-18.87-.56,5.42-4.72.51-18.15.42-38.94c.05-5.04-1.72-6.93-6.59-10.96l37.46.13c12.18.04,19.89,10.65,17.92,22.6-1.45,8.79-9.52,15.23-18.79,15.45l-20.83.49-.02,27.09c0,.97,1.53,3.39,2.47,3.92ZM773.29,686.21c9.08-.23,13.89-8.2,13.45-15.79s-6.56-13.64-15.1-13.69l-14.45-.08.04,29.96,16.06-.4Z"/>
      <path d="M956.63,699.85l-30.27-.15-7.62,18.35c-.56,1.34.34,4.65.85,6.94-5.67.38-10.61.62-16.64-.48l8.11-4.91,29.95-67.67,3.19-1.44c.7-.32,1.41,1.81,1.83,2.79l28.6,66.2,8.24,5.34-21.54.24,3.44-5.53-8.15-19.69ZM954.38,695.11l-13.24-30.7-12.99,30.77,26.22-.07Z"/>
    </g>
  </svg>
);

interface PDFExportProps {
  project: any;
  elements: any[];
  user: any;
  updateProject?: (data: any) => Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
  triggerExport?: boolean;
  onExportComplete?: () => void;
  setView?: (view: 'moodboard' | 'whiteboard') => void;
}

export function PDFExport({ 
  project, 
  elements, 
  user, 
  updateProject, 
  isOpen, 
  onClose, 
  triggerExport, 
  onExportComplete,
  setView
}: PDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Customization State
  const [pdfTitle, setPdfTitle] = useState(project?.name || 'MOODBOARD CREATIVE');
  const [activeFormat, setActiveFormat] = useState<'16:9' | '9:16' | 'A4'>('16:9');
  const [layoutMode, setLayoutMode] = useState<'masonry' | 'grid-4-3'>('masonry');
  const [imagesPerPage, setImagesPerPage] = useState(20);
  const [columnsCount, setColumnsCount] = useState(5);
  const [bgColor, setBgColor] = useState('#050505');
  const [customTextColor, setCustomTextColor] = useState('#ffffff');
  const [titleFontSize, setTitleFontSize] = useState(135);
  const [titlePos, setTitlePos] = useState({ top: 0, left: 0 });
  const [logoPos, setLogoPos] = useState({ bottom: -5, right: -25 });
  const [creativePos, setCreativePos] = useState({ bottom: 5, left: 5 });
  const [imageGap, setImageGap] = useState(20);

  // Style State (for Backup)
  const [titleWeight, setTitleWeight] = useState(650);
  const [titleSpacing, setTitleSpacing] = useState('-0.04em');
  const [creativeFontSize, setCreativeFontSize] = useState(34);
  const [creativeWeight, setCreativeWeight] = useState(500);
  const [creativeSpacing, setCreativeSpacing] = useState('-0.02em');

  // Drag State
  const [draggingElement, setDraggingElement] = useState<'title' | 'logo' | 'creative' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, initialPos: { top: 0, left: 0, bottom: 0, right: 0, last: '' } });

  const templateRef = useRef<HTMLDivElement>(null);

  // Trigger export from parent
  useEffect(() => {
    if (triggerExport && !isGenerating) {
      handleExport();
    }
  }, [triggerExport]);

  // Load Defaults
  useEffect(() => {
    const savedDefaults = localStorage.getItem('pdf_export_defaults');
    const projectSettings = project?.pdfSettings;
    
    const settings = projectSettings || (savedDefaults ? JSON.parse(savedDefaults) : null);

    if (settings) {
      if (settings.pdfTitle !== undefined) setPdfTitle(settings.pdfTitle);
      if (settings.activeFormat) setActiveFormat(settings.activeFormat);
      if (settings.layoutMode) setLayoutMode(settings.layoutMode);
      if (settings.imagesPerPage) setImagesPerPage(settings.imagesPerPage);
      if (settings.columnsCount) setColumnsCount(settings.columnsCount);
      if (settings.bgColor) setBgColor(settings.bgColor);
      if (settings.customTextColor) setCustomTextColor(settings.customTextColor);
      if (settings.titleFontSize) setTitleFontSize(settings.titleFontSize);
      if (settings.titlePos) setTitlePos(settings.titlePos);
      if (settings.logoPos) setLogoPos(settings.logoPos);
      if (settings.creativePos) setCreativePos(settings.creativePos);
      if (settings.imageGap !== undefined) setImageGap(settings.imageGap);
      
      // Load styles if present
      if (settings.titleWeight) setTitleWeight(settings.titleWeight);
      if (settings.titleSpacing) setTitleSpacing(settings.titleSpacing);
      if (settings.creativeFontSize) setCreativeFontSize(settings.creativeFontSize);
      if (settings.creativeWeight) setCreativeWeight(settings.creativeWeight);
      if (settings.creativeSpacing) setCreativeSpacing(settings.creativeSpacing);
    }
  }, [project?.pdfSettings]);

  const saveDefaults = () => {
    const defaults = {
      activeFormat, layoutMode, imagesPerPage, columnsCount, 
      bgColor, customTextColor, titleFontSize, titlePos, logoPos, creativePos, imageGap, pdfTitle,
      titleWeight, titleSpacing, creativeFontSize, creativeWeight, creativeSpacing
    };
    localStorage.setItem('pdf_export_defaults', JSON.stringify(defaults));
    alert('Configurações salvas localmente.');
  };

  const handleSaveBackup = () => {
    const backup = {
      titleFontSize, titlePos, logoPos, creativePos, titleWeight, titleSpacing, 
      creativeFontSize, creativeWeight, creativeSpacing
    };
    localStorage.setItem('pdf_cover_backup', JSON.stringify(backup));
    alert('Backup do look da capa realizado!');
  };

  const handleRestoreBackup = () => {
    const saved = localStorage.getItem('pdf_cover_backup');
    if (saved) {
      const b = JSON.parse(saved);
      applyLook(b);
      alert('Look restaurado com sucesso!');
    } else {
      alert('Nenhum backup encontrado.');
    }
  };

  const handleRestoreStandard = () => {
    const standard = {
      titleFontSize: 135,
      titlePos: { top: 0, left: 0 },
      logoPos: { bottom: -5, right: -25 },
      creativePos: { bottom: 5, left: 5 },
      titleWeight: 650,
      titleSpacing: '-0.04em',
      creativeFontSize: 34,
      creativeWeight: 500,
      creativeSpacing: '-0.02em'
    };
    applyLook(standard);
    alert('Layout restaurado para o Padrão Hub!');
  };

  const applyLook = (b: any) => {
    setTitleFontSize(b.titleFontSize);
    setTitlePos(b.titlePos);
    setLogoPos(b.logoPos);
    setCreativePos(b.creativePos);
    setTitleWeight(b.titleWeight);
    setTitleSpacing(b.titleSpacing);
    setCreativeFontSize(b.creativeFontSize);
    setCreativeWeight(b.creativeWeight);
    setCreativeSpacing(b.creativeSpacing);
  };

  useEffect(() => {
    if (activeFormat === '9:16') {
      setColumnsCount(3);
      setImagesPerPage(15);
      setTitleFontSize(prev => prev === 135 ? 110 : prev);
    } else if (activeFormat === '16:9') {
      setColumnsCount(5);
      setImagesPerPage(20);
      setTitleFontSize(prev => prev === 110 ? 135 : prev);
    }

    const isLandscape = activeFormat === '16:9';
    const pageWidth = isLandscape ? '297mm' : '210mm';
    const pageHeight = isLandscape ? '167mm' : activeFormat === '9:16' ? '373mm' : '297mm';
    
    const styleId = 'pdf-print-styles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
      @media print {
        @page { size: ${pageWidth} ${pageHeight}; margin: 0; }
      }
    `;

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [activeFormat]);

  const chunkArray = (array: any[], size: number) => {
    const results = [];
    while (array.length) {
      results.push(array.splice(0, size));
    }
    return results;
  };

  const preparePages = () => {
    const pages: { title: string; images: any[] }[] = [];
    const isValidElement = (el: any) => el.type === 'image' || el.type === 'gif';

    const columns = elements.filter(el => el.type === 'column');
    columns.forEach(col => {
      const colImages = elements.filter(el => 
        el.parentId === col.id && isValidElement(el)
      );
      if (colImages.length > 0) {
        const chunks = chunkArray([...colImages], imagesPerPage);
        chunks.forEach((chunk, idx) => {
          pages.push({
            title: chunks.length > 1 ? `${col.title} (${idx + 1}/${chunks.length})` : col.title,
            images: chunk
          });
        });
      }
    });

    const looseImages = elements.filter(el => 
      !el.parentId && isValidElement(el)
    );
    
    if (looseImages.length > 0) {
      const chunks = chunkArray([...looseImages], imagesPerPage);
      chunks.forEach((chunk, idx) => {
        pages.push({
          title: chunks.length > 1 ? `OUTROS (${idx + 1}/${chunks.length})` : 'OUTROS',
          images: chunk
        });
      });
    }

    return pages;
  };

  const handleExport = async () => {
    if (!templateRef.current) return;
    setIsGenerating(true);
    setProgress(0);

    const isLandscape = activeFormat === '16:9';
    const pageWidthMM = isLandscape ? 297 : 210;
    const pageHeightMM = isLandscape ? 167 : (activeFormat === '9:16' ? 373 : 297);
    
    const pxWidth = pageWidthMM * 3.78;
    const pxHeight = pageHeightMM * 3.78;

    const safeTitle = (pdfTitle || 'Moodboard').replace(/[/\\?%*:|"<>]/g, '-');
    let errorCount = 0;

    try {
      const allImages = Array.from(templateRef.current.querySelectorAll('img'));
      for (let i = 0; i < allImages.length; i++) {
        setProgress(Math.round((i / allImages.length) * 20));
        const img = allImages[i];
        if (!img.complete) {
          await new Promise(r => { img.onload = r; img.onerror = r; setTimeout(r, 2000); });
        }
      }

      const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', [pageWidthMM, pageHeightMM]);
      const pages = templateRef.current.querySelectorAll('.pdf-page');
      
      for (let i = 0; i < pages.length; i++) {
        const currentProgress = 20 + Math.round(((i + 1) / pages.length) * 80);
        setProgress(currentProgress);
        
        const page = pages[i] as HTMLElement;
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
          const canvas = await html2canvas(page, {
            scale: 1,
            useCORS: true,
            allowTaint: false,
            backgroundColor: bgColor,
            width: pxWidth,
            height: pxHeight,
            windowWidth: pxWidth,
            windowHeight: pxHeight,
          });
          
          const imgData = canvas.toDataURL('image/jpeg', 0.8);
          if (i > 0 || errorCount > 0) pdf.addPage([pageWidthMM, pageHeightMM], isLandscape ? 'l' : 'p');
          pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthMM, pageHeightMM, undefined, 'FAST');
        } catch (pageError) {
          errorCount++;
        }
      }

      if (errorCount < pages.length) {
        pdf.save(`${safeTitle}.pdf`);
      }
    } catch (error) {
      console.error('Final Error:', error);
      alert('Erro crítico na geração. Tente usar o formato Retrato (A4) ou use a opção IMPRIMIR.');
    } finally {
      setIsGenerating(false);
      setProgress(0);
      if (onExportComplete) onExportComplete();
    }
  };

  const handleSaveToProject = async () => {
    if (!updateProject) return;
    setIsSaving(true);
    try {
      await updateProject({
        pdfSettings: {
          pdfTitle,
          activeFormat,
          layoutMode,
          imagesPerPage,
          columnsCount,
          bgColor,
          customTextColor,
          titleFontSize,
          titlePos,
          logoPos,
          creativePos,
          imageGap,
          titleWeight,
          titleSpacing,
          creativeFontSize,
          creativeWeight,
          creativeSpacing
        }
      });
      
      if (setView) setView('whiteboard');
      if (onClose) onClose();
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar no projeto.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleElementMouseDown = (e: React.MouseEvent, type: 'title' | 'logo' | 'creative') => {
    const currentPos = type === 'title' ? titlePos : type === 'logo' ? logoPos : creativePos;
    setDraggingElement(type);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      initialPos: { 
        top: 'top' in currentPos ? (currentPos as any).top : 0, 
        left: 'left' in currentPos ? (currentPos as any).left : 0,
        bottom: 'bottom' in currentPos ? (currentPos as any).bottom : 0,
        right: 'right' in currentPos ? (currentPos as any).right : 0,
        last: type
      }
    });
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingElement) return;
      
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      const container = templateRef.current?.querySelector('.pdf-page') as HTMLElement;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const dxPercent = (dx / rect.width) * 100;
      const dyPercent = (dy / rect.height) * 100;
      
      if (draggingElement === 'title') {
        setTitlePos({
          top: dragStart.initialPos.top + dyPercent,
          left: dragStart.initialPos.left + dxPercent
        });
      } else if (draggingElement === 'logo') {
        setLogoPos({
          bottom: dragStart.initialPos.bottom - dyPercent,
          right: dragStart.initialPos.right - dxPercent
        });
      } else if (draggingElement === 'creative') {
        setCreativePos({
          bottom: dragStart.initialPos.bottom - dyPercent,
          left: dragStart.initialPos.left + dxPercent
        });
      }
    };

    const handleMouseUp = () => setDraggingElement(null);

    if (draggingElement) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingElement, dragStart]);

  const paginatedContent = preparePages();
  const safeZone = '40px';

  const getPageStyle = () => {
    const isLandscape = activeFormat === '16:9';
    return {
      width: isLandscape ? '297mm' : '210mm',
      height: isLandscape ? '167mm' : activeFormat === '9:16' ? '373mm' : '297mm',
    };
  };

  return (
    <>
      {/* Background Progress Indicator */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 right-10 z-[10001] bg-[#1a1a1a] border border-white/10 p-6 rounded-2xl shadow-2xl flex flex-col gap-3 min-w-[300px]"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Gerando PDF em segundo plano...</span>
              <span className="text-[12px] font-black text-[#FF4500]">{progress}%</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#FF4500]" 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Render Area for Background Export */}
      <div 
        style={{ 
          position: 'fixed', 
          left: '-9999px', 
          top: '-9999px', 
          zIndex: -1,
          pointerEvents: 'none'
        }}
      >
        <div 
          ref={templateRef} 
          className="flex flex-col gap-20 pdf-print-area"
          style={{ background: bgColor, color: customTextColor, fontFamily: '"Helvetica Neue", Helvetica, sans-serif' }}
        >
          {/* Cover Page */}
          <div className="pdf-page" style={{ 
            ...getPageStyle(), 
            position: 'relative', 
            padding: '0px', 
            boxSizing: 'border-box', 
            background: bgColor, 
            color: customTextColor,
            overflow: 'hidden'
          }}>
            {/* Logo */}
            <div style={{ position: 'absolute', bottom: `${logoPos.bottom}px`, right: `${logoPos.right}px`, opacity: 0.8 }}>
              <LogoSVG color={customTextColor} />
            </div>

            <motion.h1 
              style={{ 
                position: 'absolute', 
                top: `${titlePos.top}%`, 
                left: `${titlePos.left}%`, 
                fontSize: `${titleFontSize}px`, 
                margin: 0, 
                fontWeight: titleWeight, 
                lineHeight: 0.8, 
                letterSpacing: titleSpacing, 
                zIndex: 10,
                whiteSpace: 'nowrap'
              }}
            >
              {pdfTitle}
            </motion.h1>

            {/* "CRIATIVO" Text */}
            <div style={{ 
              position: 'absolute', 
              bottom: `${creativePos.bottom}px`, 
              left: `${creativePos.left}px`, 
              fontSize: `${creativeFontSize}px`, 
              fontWeight: creativeWeight, 
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', 
              opacity: 0.7, 
              textTransform: 'uppercase', 
              letterSpacing: creativeSpacing 
            }}>
              CRIATIVO
            </div>
          </div>

          {/* Paginated Content */}
          {paginatedContent.map((page, pIdx) => {
            const columnsCountLocal = columnsCount;
            return (
              <div key={pIdx} className="pdf-page" style={{ 
                ...getPageStyle(), 
                position: 'relative', 
                padding: safeZone, 
                boxSizing: 'border-box', 
                background: bgColor, 
                color: customTextColor,
                overflow: 'hidden'
              }}>
                <div style={{ marginBottom: '30px', borderBottom: `1px solid ${customTextColor}33`, paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{page.title}</h2>
                  <span style={{ fontSize: '10px', opacity: 0.5 }}>{pIdx + 1} / {paginatedContent.length}</span>
                </div>
                
                {layoutMode === 'masonry' ? (
                  <div style={{ columnCount: columnsCountLocal, columnGap: `${imageGap}px` }}>
                    {page.images.map((img: any, i: number) => (
                      <div key={i} style={{ breakInside: 'avoid', marginBottom: `${imageGap}px` }}>
                        <img 
                          src={img.type === 'video' || img.type === 'youtube' ? (img.posterUrl || img.url) : img.url} 
                          alt="" 
                          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px', objectFit: 'contain' }}
                          crossOrigin="anonymous"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columnsCountLocal}, 1fr)`, gap: `${imageGap}px` }}>
                    {page.images.map((img: any, i: number) => (
                      <div key={i} style={{ aspectRatio: '4/3', overflow: 'hidden', borderRadius: '4px' }}>
                        <img 
                          src={img.type === 'video' || img.type === 'youtube' ? (img.posterUrl || img.url) : img.url} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          crossOrigin="anonymous"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Studio UI Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-[#050505] flex flex-col"
          >
            <div className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-[#0a0a0a]">
              <div className="flex items-center gap-8">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-[#FF4500] uppercase tracking-[0.2em]">Estúdio de PDF</span>
                  <span className="text-white text-sm font-bold uppercase tracking-tight">{project?.name}</span>
                </div>
                
                <div className="h-8 w-px bg-white/5" />

                <div className="flex items-center gap-4">
                  <div className="flex bg-white/5 p-1 rounded-lg">
                    <button 
                      onClick={() => setActiveFormat('16:9')}
                      className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${activeFormat === '16:9' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                    >
                      <Maximize className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">16:9</span>
                    </button>
                    <button 
                      onClick={() => setActiveFormat('9:16')}
                      className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${activeFormat === '9:16' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">9:16</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={onClose}
                  className="px-6 py-2 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  CANCELAR
                </button>
                
                <button 
                  onClick={handleSaveToProject}
                  disabled={isSaving}
                  className="px-8 py-2 bg-[#FF4500] text-white rounded-lg flex items-center gap-2 hover:bg-[#FF4500]/80 transition-all text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#FF4500]/20 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-4 h-4" />} 
                  {isSaving ? 'Salvando...' : 'Salvar no Projeto'}
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
              <div className="w-[320px] border-r border-white/5 bg-[#0a0a0a] overflow-y-auto no-scrollbar">
                <div className="p-8 flex flex-col gap-8 min-w-[320px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black text-[#FF4500] tracking-widest uppercase">
                      <Layout className="w-3 h-3" /> Configurações
                    </div>
                  </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black text-white/40 tracking-widest uppercase">
                      Título do PDF
                    </div>
                  </div>
                  <input 
                    type="text" 
                    value={pdfTitle}
                    onChange={(e) => setPdfTitle(e.target.value.toUpperCase())}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-xs font-bold outline-none focus:border-[#FF4500]/50 transition-all"
                    placeholder="NOME DO PROJETO"
                  />
                  
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white/20 text-[9px] font-black uppercase tracking-widest">Tamanho do Título</span>
                      <span className="text-white/40 text-[10px] font-bold">{titleFontSize}px</span>
                    </div>
                    <input 
                      type="range" min="40" max="300" value={titleFontSize}
                      onChange={(e) => setTitleFontSize(parseInt(e.target.value))}
                      className="premium-slider"
                    />
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Imagens por Página</span>
                    <span className="text-white/60 text-[10px] font-bold">{imagesPerPage}</span>
                  </div>
                  <input 
                    type="range" min="4" max="60" value={imagesPerPage}
                    onChange={(e) => setImagesPerPage(parseInt(e.target.value))}
                    className="premium-slider"
                  />
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Colunas</span>
                    <span className="text-white/60 text-[10px] font-bold">{columnsCount}</span>
                  </div>
                  <input 
                    type="range" min="2" max="12" value={columnsCount}
                    onChange={(e) => setColumnsCount(parseInt(e.target.value))}
                    className="premium-slider"
                  />
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Espaçamento</span>
                    <span className="text-white/60 text-[10px] font-bold">{imageGap}px</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={imageGap}
                    onChange={(e) => setImageGap(parseInt(e.target.value))}
                    className="premium-slider"
                  />
                </div>

                <div className="h-px bg-white/5" />

                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-3">
                    <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Fundo</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-8 h-8 rounded-full border-none outline-none cursor-pointer bg-transparent"
                      />
                      <span className="text-[10px] font-bold text-white/60 uppercase">{bgColor}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Texto</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={customTextColor}
                        onChange={(e) => setCustomTextColor(e.target.value)}
                        className="w-8 h-8 rounded-full border-none outline-none cursor-pointer bg-transparent"
                      />
                      <span className="text-[10px] font-bold text-white/60 uppercase">{customTextColor}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={handleSaveBackup}
                      className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/40 hover:text-white transition-all text-[9px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2"
                    >
                      Backup Look
                    </button>
                    <button 
                      onClick={handleRestoreBackup}
                      className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/40 hover:text-white transition-all text-[9px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2"
                    >
                      Restaurar Look
                    </button>
                  </div>

                  <button 
                    onClick={handleRestoreStandard}
                    className="w-full py-3 bg-[#FF4500]/10 hover:bg-[#FF4500]/20 border border-[#FF4500]/20 rounded-xl text-[#FF4500] transition-all text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                  >
                    Reset Padrão Hub
                  </button>

                  <button 
                    onClick={saveDefaults}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                  >
                    <Save className="w-3 h-3" /> Salvar como Padrão
                  </button>

                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex gap-3">
                    <Info className="w-5 h-5 text-white/40 shrink-0" />
                    <p className="text-[11px] text-white/30 leading-relaxed">
                      Clique em <strong>Salvar no Projeto</strong> para aplicar as mudanças de layout e voltar ao Moodboard.
                    </p>
                  </div>
                </div>
                </div>
              </div>

              {/* Preview Area (Visible only in Studio) */}
              <div className="flex-1 bg-[#111] overflow-y-auto p-20 flex flex-col items-center gap-20 no-scrollbar">
                <div 
                  className="flex flex-col gap-20"
                  style={{ background: bgColor, color: customTextColor, fontFamily: '"Helvetica Neue", Helvetica, sans-serif' }}
                >
                  <div className="pdf-page" style={{ 
                    ...getPageStyle(), 
                    position: 'relative', 
                    padding: '0px', 
                    boxSizing: 'border-box', 
                    background: bgColor, 
                    color: customTextColor,
                    overflow: 'hidden'
                  }}>
                    {/* Logo Draggable */}
                    <div 
                      onMouseDown={(e) => handleElementMouseDown(e, 'logo')}
                      style={{ 
                        position: 'absolute', 
                        bottom: `${logoPos.bottom}px`, 
                        right: `${logoPos.right}px`, 
                        opacity: 0.8,
                        cursor: 'grab'
                      }}
                      className="active:cursor-grabbing"
                    >
                      <LogoSVG color={customTextColor} />
                    </div>

                    <motion.h1 
                      onMouseDown={(e) => handleElementMouseDown(e, 'title')}
                      style={{ 
                        position: 'absolute', 
                        top: `${titlePos.top}%`, 
                        left: `${titlePos.left}%`, 
                        fontSize: `${titleFontSize}px`, 
                        margin: 0, 
                        fontWeight: titleWeight, 
                        lineHeight: 0.8, 
                        letterSpacing: titleSpacing, 
                        cursor: 'grab', 
                        userSelect: 'none',
                        zIndex: 10,
                        whiteSpace: 'nowrap'
                      }}
                      className="active:cursor-grabbing"
                    >
                      {pdfTitle}
                    </motion.h1>

                    {/* "CRIATIVO" Draggable */}
                    <div 
                      onMouseDown={(e) => handleElementMouseDown(e, 'creative')}
                      style={{ 
                        position: 'absolute', 
                        bottom: `${creativePos.bottom}px`, 
                        left: `${creativePos.left}px`, 
                        fontSize: `${creativeFontSize}px`, 
                        fontWeight: creativeWeight, 
                        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', 
                        opacity: 0.7, 
                        textTransform: 'uppercase', 
                        letterSpacing: creativeSpacing,
                        cursor: 'grab',
                        userSelect: 'none'
                      }}
                      className="active:cursor-grabbing"
                    >
                      CRIATIVO
                    </div>
                  </div>

                  {paginatedContent.map((page, pIdx) => {
                    const columnsCountLocal = columnsCount;
                    return (
                      <React.Fragment key={pIdx}>
                        <div className="pdf-page" style={{ 
                          ...getPageStyle(), 
                          position: 'relative', 
                          padding: safeZone, 
                          boxSizing: 'border-box', 
                          background: bgColor, 
                          color: customTextColor,
                          overflow: 'hidden'
                        }}>
                          <div style={{ marginBottom: '30px', borderBottom: `1px solid ${customTextColor}33`, paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{page.title}</h2>
                            <span style={{ fontSize: '10px', opacity: 0.5 }}>{pIdx + 1} / {paginatedContent.length}</span>
                          </div>
                          
                          {layoutMode === 'masonry' ? (
                            <div style={{ columnCount: columnsCountLocal, columnGap: `${imageGap}px` }}>
                              {page.images.map((img: any, i: number) => (
                                <div key={i} style={{ breakInside: 'avoid', marginBottom: `${imageGap}px` }}>
                                  <img 
                                    src={img.type === 'video' || img.type === 'youtube' ? (img.posterUrl || img.url) : img.url} 
                                    alt="" 
                                    style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '4px', objectFit: 'contain' }}
                                    crossOrigin="anonymous"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columnsCountLocal}, 1fr)`, gap: `${imageGap}px` }}>
                              {page.images.map((img: any, i: number) => (
                                <div key={i} style={{ aspectRatio: '4/3', overflow: 'hidden', borderRadius: '4px' }}>
                                  <img 
                                    src={img.type === 'video' || img.type === 'youtube' ? (img.posterUrl || img.url) : img.url} 
                                    alt="" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    crossOrigin="anonymous"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Page Divider Label */}
                        <div className="w-full flex items-center gap-4 py-10 opacity-20">
                          <div className="flex-1 h-px bg-white border-t border-dashed border-white/40" />
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white">Quebra de Página</span>
                          <div className="flex-1 h-px bg-white border-t border-dashed border-white/40" />
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
