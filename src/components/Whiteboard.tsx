import React, { useState, useRef, useCallback, useEffect } from 'react';
import Konva from 'konva';
import { Stage, Layer, Line, Text, Arrow, Image as KonvaImage, Group, Rect, Transformer, Circle as KonvaCircle, RegularPolygon } from 'react-konva';
import { Pen, Highlighter, Brush, ArrowUpRight, Type, StickyNote, Search, Layout, Hand, MousePointer2, Eraser, ChevronLeft, Square, Circle, Triangle, Minus, Spline, Shapes, Trash2, Copy, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useImage from 'use-image';

// Asset renderer for Konva
const imageCache = new Map<string, ImageBitmap | HTMLImageElement>();

const useAsyncImage = (url: string | null) => {
  const [image, setImage] = useState<ImageBitmap | HTMLImageElement | null>(url && imageCache.has(url) ? imageCache.get(url)! : null);

  useEffect(() => {
    if (!url) {
      return;
    }
    if (imageCache.has(url)) {
      setImage(imageCache.get(url)!);
      return;
    }

    let active = true;

    const timeoutId = setTimeout(() => {
      const loadWithImage = () => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.decoding = 'async'; // Non-blocking decode
        img.onload = () => {
          if (active) {
            imageCache.set(url, img);
            setImage(img);
          }
        };
        img.src = url;
      };

      if (typeof window.createImageBitmap === 'function') {
        const load = async () => {
          try {
            const res = await fetch(url);
            const blob = await res.blob();
            const bitmap = await window.createImageBitmap(blob);
            if (active) {
              imageCache.set(url, bitmap);
              setImage(bitmap);
            }
          } catch (e) {
            console.warn('Failed to load image off-thread, using standard Image', e);
            loadWithImage();
          }
        };
        load();
      } else {
        loadWithImage();
      }
    }, 150); // Delay load by 150ms to allow smooth panning past items
    
    return () => { 
      active = false; 
      clearTimeout(timeoutId);
    };
  }, [url]);

  return [image];
};

const URLImage = ({ image, x, y, width, height, id, draggable, rotation, scaleX, scaleY, isVisible }: any) => {
  const [img] = useAsyncImage(isVisible ? (image.url || image.src || undefined) : null);
  if (!img) {
    return <Rect id={id} x={x} y={y} scaleX={scaleX || 1} scaleY={scaleY || 1} rotation={rotation || 0} width={width} height={height} draggable={draggable} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth={2} />;
  }
  return <KonvaImage id={id} image={img as any} x={x} y={y} scaleX={scaleX || 1} scaleY={scaleY || 1} rotation={rotation || 0} width={width} height={height} draggable={draggable} shadowColor="rgba(0,0,0,0.5)" shadowBlur={20} shadowOffset={{ x: 0, y: 10 }} />;
};

const URLVideo = ({ asset, x, y, width, height, id, draggable, rotation, scaleX, scaleY, isVisible }: any) => {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const imageRef = useRef<any>(null);
  const animRef = useRef<Konva.Animation | null>(null);

  useEffect(() => {
    if (!isVisible) {
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
        setVideo(null);
      }
      return;
    }

    if (video) return; // already loaded

    let active = true;
    let timeoutId: NodeJS.Timeout;
    let createdVid: HTMLVideoElement | null = null;
    
    timeoutId = setTimeout(() => {
      if (!active) return;
      const vid = document.createElement('video');
      createdVid = vid;
      vid.src = asset.url || asset.src;
      vid.crossOrigin = 'anonymous';
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.preload = 'auto'; // Load enough to grab the first frame
      vid.addEventListener('loadedmetadata', () => {
        if (asset.onUpdate && (vid.videoWidth !== width || vid.videoHeight !== height)) {
          asset.onUpdate(asset.id, { width: vid.videoWidth, height: vid.videoHeight });
        }
      });
      vid.addEventListener('loadeddata', () => {
        vid.currentTime = 0.001;
      });
      vid.addEventListener('seeked', () => {
        imageRef.current?.getLayer()?.batchDraw();
      });

      setVideo(vid);
    }, 150);

    return () => {
      active = false;
      clearTimeout(timeoutId);
      const v = createdVid || video;
      if (v) {
        v.pause();
        v.removeAttribute('src');
        v.load();
      }
      if (animRef.current) {
        animRef.current.stop();
      }
    };
  }, [asset.url, asset.src, isVisible]);

  const handleMouseEnter = () => {
    if (video) {
      video.play();
      const layer = imageRef.current?.getLayer();
      if (layer && !animRef.current) {
        animRef.current = new Konva.Animation(() => {
          // do nothing, just trigger redraw
        }, layer);
      }
      if (animRef.current) {
        animRef.current.start();
      }
      // Set cursor
      const stage = imageRef.current?.getStage();
      if (stage) stage.container().style.cursor = 'pointer';
    }
  };

  const handleMouseLeave = () => {
    if (video) {
      video.pause();
      if (animRef.current) {
        animRef.current.stop();
      }
      // Reset cursor
      const stage = imageRef.current?.getStage();
      if (stage) stage.container().style.cursor = 'default';
    }
  };

  if (!video) {
    return <Rect id={id} x={x} y={y} scaleX={scaleX || 1} scaleY={scaleY || 1} rotation={rotation || 0} width={width} height={height} draggable={draggable} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth={2} />;
  }
  return (
    <KonvaImage 
      id={id} 
      ref={imageRef} 
      image={video} 
      x={x} y={y} 
      scaleX={scaleX || 1} scaleY={scaleY || 1} 
      rotation={rotation || 0} 
      width={width} height={height} 
      draggable={draggable} 
      shadowColor="rgba(0,0,0,0.5)" shadowBlur={20} shadowOffset={{ x: 0, y: 10 }} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
};

const OrganizedAssets = ({ assets, tool, selectedIds, stageProps, updateAsset }: { assets: any[], tool: string, selectedIds: string[], stageProps: any, updateAsset: any }) => {
  const padding = 100;
  const startX = 200;
  
  let currentX = startX;
  let currentY = padding;
  let rowMaxHeight = 0;
  const maxRowWidth = Math.max(window.innerWidth * 2, 2000);

  const buffer = 1000;
  const vMinX = (-stageProps.x - buffer) / stageProps.scale;
  const vMinY = (-stageProps.y - buffer) / stageProps.scale;
  const vMaxX = (-stageProps.x + window.innerWidth + buffer) / stageProps.scale;
  const vMaxY = (-stageProps.y + window.innerHeight + buffer) / stageProps.scale;

  return (
    <>
      {assets.map((asset: any) => {
        const width = asset.width || 400;
        const height = asset.height || 400;
        
        if (currentX + width > startX + maxRowWidth) {
          currentX = startX;
          currentY += rowMaxHeight + padding;
          rowMaxHeight = 0;
        }

        const autoX = currentX;
        const autoY = currentY;

        currentX += width + padding;
        if (height > rowMaxHeight) {
          rowMaxHeight = height;
        }

        const x = asset.wb_x ?? autoX;
        const y = asset.wb_y ?? autoY;
        const scaleX = asset.wb_scaleX ?? 1;
        const scaleY = asset.wb_scaleY ?? 1;
        const rotation = asset.wb_rotation ?? 0;
        
        const id = `el-${asset.id}`;
        const draggable = tool === 'select';
        
        const finalWidth = width * scaleX;
        const finalHeight = height * scaleY;
        const isVisible = (
          x < vMaxX &&
          x + finalWidth > vMinX &&
          y < vMaxY &&
          y + finalHeight > vMinY
        );

        if (!isVisible) return null;
        
        if (asset.type === 'video') {
           asset.onUpdate = updateAsset;
           return <URLVideo key={`asset-${asset.id}`} id={id} asset={asset} x={x} y={y} width={asset.width || undefined} height={asset.height || undefined} scaleX={scaleX} scaleY={scaleY} rotation={rotation} draggable={draggable} isVisible={isVisible} onUpdate={updateAsset} />;
        }
        return <URLImage key={`asset-${asset.id}`} id={id} image={asset} x={x} y={y} width={asset.width || undefined} height={asset.height || undefined} scaleX={scaleX} scaleY={scaleY} rotation={rotation} draggable={draggable} isVisible={isVisible} />;
      })}
    </>
  );
};

export default function Whiteboard({ project, elements = [], cursors = [], assets = [], addElement, updateElement, removeElement, removeAsset, updateAsset, updateCursor, updateTitle, user, setView }: any) {
  const [tool, setTool] = useState<'pen' | 'arrow' | 'text' | 'sticky' | 'select' | 'pan' | 'eraser'>('select');
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMiddlePan, setIsMiddlePan] = useState(false);
  const panStartRef = useRef<{x: number, y: number} | null>(null);
  const [currentLine, setCurrentLine] = useState<any>(null);
  const [currentArrow, setCurrentArrow] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState('#FF4500');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [penStyle, setPenStyle] = useState<'felt' | 'marker' | 'airbrush'>('felt');
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, id: string} | null>(null);

  const [stageProps, setStageProps] = useState({ scale: 1, x: 0, y: 0 });

  const COLORS = ['#FF4500', '#00C853', '#2979FF', '#FFD600', '#FFFFFF', '#1A1B1E', '#9C27B0', '#FF4081'];
  
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (trRef.current && stageRef.current) {
      const nodes = selectedIds
        .map((id) => {
          const el = elements.find((e: any) => e.id === id);
          if (el && el.type === 'curve') return null;
          return stageRef.current.findOne(`#el-${id}`);
        })
        .filter(Boolean);
      trRef.current.nodes(nodes);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedIds, elements]);

  const getRelativePointerPosition = (stage: any) => {
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return null;
    const scale = stage.scaleX();
    const x = (pointerPosition.x - stage.x()) / scale;
    const y = (pointerPosition.y - stage.y()) / scale;
    return { x, y };
  };

  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    setStageProps({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, []);

  const handleMouseMove = useCallback((e: any) => {
    if (isMiddlePan && panStartRef.current) {
      const dx = e.evt.clientX - panStartRef.current.x;
      const dy = e.evt.clientY - panStartRef.current.y;
      setStageProps(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      panStartRef.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }

    const stage = e.target.getStage();
    const point = getRelativePointerPosition(stage);
    if (!point) return;

    if (Math.random() > 0.8) {
      updateCursor({
        x: point.x,
        y: point.y,
        displayName: user.displayName || 'Anon',
        color: selectedColor
      });
    }

    if (!isDrawing) {
      if (tool === 'select' && selectionBox) {
        setSelectionBox({
          ...selectionBox,
          x: Math.min(point.x, selectionBox.startX),
          y: Math.min(point.y, selectionBox.startY),
          width: Math.abs(point.x - selectionBox.startX),
          height: Math.abs(point.y - selectionBox.startY),
        });
      } else if (tool === 'eraser' && e.evt.buttons === 1) {
        // Eraser drag to delete
        const isElement = e.target !== e.target.getStage();
        if (isElement && e.target.attrs.id) {
          const id = e.target.attrs.id.replace('el-', '');
          removeElement(id);
        }
      }
      return;
    }

    if (tool === 'pen' && currentLine) {
      setCurrentLine({ ...currentLine, points: currentLine.points.concat([point.x, point.y]) });
    } else if (tool === 'arrow' && currentArrow) {
      setCurrentArrow({ ...currentArrow, points: [currentArrow.points[0], currentArrow.points[1], point.x, point.y] });
    }
  }, [user, isDrawing, tool, currentLine, currentArrow, selectedColor, updateCursor, isMiddlePan, selectionBox]);

  const getCenterPosition = useCallback(() => {
    if (!stageRef.current) return { x: windowSize.width / 2, y: windowSize.height / 2 };
    const stage = stageRef.current;
    const scale = stage.scaleX();
    const position = stage.position();
    return {
      x: (-position.x + windowSize.width / 2) / scale,
      y: (-position.y + windowSize.height / 2) / scale,
    };
  }, [windowSize]);

  const addInstantElement = (type: string, extraParams: any = {}) => {
    const center = getCenterPosition();
    addElement({
      type,
      x: center.x - (extraParams.width ? extraParams.width/2 : 0),
      y: center.y - (extraParams.height ? extraParams.height/2 : 0),
      color: selectedColor,
      addedBy: user.uid,
      ...extraParams
    });
    setTool('select');
  };

  const organizeImages = () => {
    const targetIds = selectedIds.length > 0 ? selectedIds : [...assets.map((a:any)=>a.id), ...elements.filter((e:any)=>e.type==='image' || e.type==='video').map((e:any)=>e.id)];
    if (targetIds.length === 0) return;

    const targetItems = targetIds.map(id => {
       let asset = assets.find((a:any)=>a.id === id);
       if (asset) return { ...asset, isAsset: true };
       let el = elements.find((e:any)=>e.id === id);
       if (el) return { ...el, isAsset: false };
       return null;
    }).filter(i => i !== null);

    if (targetItems.length === 0) return;

    const padding = 50;
    const maxRowWidth = Math.max(windowSize.width, 1400);

    const center = getCenterPosition();
    const startX = center.x - (maxRowWidth / 2);
    const startY = center.y;

    let currentX = startX;
    let currentY = startY;
    let rowMaxHeight = 0;

    targetItems.forEach((item) => {
      const width = item.width ? item.width * (item.isAsset ? (item.wb_scaleX||1) : (item.scaleX||1)) : 400;
      const height = item.height ? item.height * (item.isAsset ? (item.wb_scaleY||1) : (item.scaleY||1)) : 400;

      if (currentX + width > startX + maxRowWidth && currentX !== startX) {
        currentX = startX;
        currentY += rowMaxHeight + padding;
        rowMaxHeight = 0;
      }

      if (item.isAsset) {
        updateAsset(item.id, { wb_x: currentX, wb_y: currentY });
      } else {
        updateElement(item.id, { x: currentX, y: currentY });
      }

      currentX += width + padding;
      if (height > rowMaxHeight) {
         rowMaxHeight = height;
      }
    });

    setContextMenu(null);
  };

  useEffect(() => {
    const handleGlobalPointerUp = (e: PointerEvent | MouseEvent) => {
      if (selectionBox) { // Fallback if stage missed the up event
        const stage = stageRef.current;
        if (!stage) return;
        const box = selectionBox;
        const newSelectedIds: string[] = [];
        const allItems = [...elements, ...assets];
        allItems.forEach((el: any) => {
          const node = stage.findOne(`#el-${el.id}`);
          if (node) {
            const clientRect = node.getClientRect();
            const nodeRectRelative = {
               x: (clientRect.x - stage.x()) / stage.scaleX(),
               y: (clientRect.y - stage.y()) / stage.scaleX(),
               width: clientRect.width / stage.scaleX(),
               height: clientRect.height / stage.scaleX(),
            };
            if (
              !(nodeRectRelative.x > box.x + box.width || 
                nodeRectRelative.x + nodeRectRelative.width < box.x || 
                nodeRectRelative.y > box.y + box.height || 
                nodeRectRelative.y + nodeRectRelative.height < box.y)
            ) {
              newSelectedIds.push(el.id);
            }
          }
        });
        setSelectedIds(newSelectedIds);
        setSelectionBox(null);
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [selectionBox, elements, assets, tool]);

  const handleMouseDown = (e: any) => {
    if (contextMenu) setContextMenu(null);

    // Right click (2) or Middle click (1) to pan
    if (e.evt.button === 1 || e.evt.button === 2) { 
      setIsMiddlePan(true);
      panStartRef.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }

    const stage = e.target.getStage();
    if (stage && e.evt.pointerId) {
       try { stage.container().setPointerCapture(e.evt.pointerId); } catch(err) {}
    }
    const isElement = e.target !== stage;
    
    let targetNode: any = e.target;
    let targetId = targetNode.attrs.id;
    while (!targetId && targetNode.getParent() && targetNode.getParent() !== stage) {
      targetNode = targetNode.getParent();
      targetId = targetNode.attrs.id;
    }
    const realId = targetId?.replace('el-', '');
    
    // Eraser on click
    if (tool === 'eraser') {
      if (isElement && realId) {
        removeElement(realId);
      }
      return;
    }

    if (tool === 'select') {
      const isTransformer = e.target.getParent()?.className === 'Transformer';
      if (isTransformer) return;

      const point = getRelativePointerPosition(stage);
      if (!point) return;

      if (!isElement && e.evt.button === 0) {
        // start selection box
        setSelectionBox({
          startX: point.x,
          startY: point.y,
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
        });
        setSelectedIds([]);
      } else if (isElement) {
        if (realId) {
          const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
          const isSelected = selectedIds.indexOf(realId) >= 0;
          if (!metaPressed && !isSelected) {
            setSelectedIds([realId]);
          } else if (metaPressed && isSelected) {
            setSelectedIds(selectedIds.filter((elId) => elId !== realId));
          } else if (metaPressed && !isSelected) {
            setSelectedIds([...selectedIds, realId]);
          }
        }
      }
      return;
    }

    // Allow panning if clicking on background, or tool is pan
    if (tool === 'pan') {
       return;
    }

    const point = getRelativePointerPosition(stage);
    if (!point) return;

    if (tool === 'pen') {
      setIsDrawing(true);
      setCurrentLine({ type: 'path', points: [point.x, point.y], color: selectedColor, penStyle });
    } else if (tool === 'arrow') {
      setIsDrawing(true);
      setCurrentArrow({ type: 'arrow', points: [point.x, point.y, point.x, point.y], color: selectedColor });
    } else if (tool === 'text') {
      addElement({
        type: 'text',
        x: point.x,
        y: point.y,
        text: 'New Text',
        color: selectedColor,
        addedBy: user.uid,
      });
      setTool('select');
    } else if (tool === 'sticky') {
      addElement({
        type: 'sticky',
        x: point.x,
        y: point.y,
        title: 'New Note',
        text: 'Note content...',
        color: selectedColor,
        addedBy: user.uid,
        width: 250,
        height: 250,
      });
      setTool('select');
    }
  };

  const handleMouseUp = async (e: any) => {
    const stage = e.target.getStage();
    if (stage && e.evt.pointerId) {
       try { stage.container().releasePointerCapture(e.evt.pointerId); } catch(err) {}
    }

    if (e.evt.button === 1 || e.evt.button === 2) { // Middle or right click release
      setIsMiddlePan(false);
      panStartRef.current = null;
      return;
    }

    if (tool === 'select' && selectionBox) {
      const box = selectionBox;
      const stage = e.target.getStage();
      
      const newSelectedIds: string[] = [];
      const allItems = [...elements, ...assets];
      allItems.forEach((el: any) => {
        const node = stage.findOne(`#el-${el.id}`);
        if (node) {
          const clientRect = node.getClientRect();
          const nodeRectRelative = {
             x: (clientRect.x - stage.x()) / stage.scaleX(),
             y: (clientRect.y - stage.y()) / stage.scaleX(),
             width: clientRect.width / stage.scaleX(),
             height: clientRect.height / stage.scaleX(),
          };
          
          if (
            !(nodeRectRelative.x > box.x + box.width || 
              nodeRectRelative.x + nodeRectRelative.width < box.x || 
              nodeRectRelative.y > box.y + box.height || 
              nodeRectRelative.y + nodeRectRelative.height < box.y)
          ) {
            newSelectedIds.push(el.id);
          }
        }
      });
      setSelectedIds(newSelectedIds);
      setSelectionBox(null);
      return;
    }

    if (tool === 'pen' && isDrawing && currentLine) {
      setIsDrawing(false);
      await addElement({
        ...currentLine,
        addedBy: user.uid,
      });
      setCurrentLine(null);
    } else if (tool === 'arrow' && isDrawing && currentArrow) {
      setIsDrawing(false);
      await addElement({
        ...currentArrow,
        addedBy: user.uid,
      });
      setCurrentArrow(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const assetData = e.dataTransfer.getData('asset');
    if (assetData && stageRef.current) {
      const asset = JSON.parse(assetData);
      
      stageRef.current.setPointersPositions(e);
      const pos = getRelativePointerPosition(stageRef.current);
      
      if (pos) {
        addElement({
          type: 'image',
          x: pos.x,
          y: pos.y,
          url: asset.url,
          width: 300,
          height: asset.height ? (300 * asset.height) / asset.width : 200,
          addedBy: user.uid,
        });
      }
    }
  };

  return (
    <div className="absolute inset-0 z-0 bg-[#121212] overflow-hidden flex font-sans text-white" ref={containerRef}>
       
       {/* Dot Grid Background */}
       <div 
         className="absolute inset-0 z-0 pointer-events-none" 
         style={{ 
           backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.08) ${1.5 * stageProps.scale}px, transparent ${1.5 * stageProps.scale}px)`, 
           backgroundSize: `${40 * stageProps.scale}px ${40 * stageProps.scale}px`,
           backgroundPosition: `${stageProps.x}px ${stageProps.y}px`
         }} 
       />

       <div className="flex-1 relative"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
       >
         <Stage 
            width={windowSize.width} 
            height={windowSize.height}
            onPointerDown={handleMouseDown}
            onPointerMove={handleMouseMove}
            onPointerUp={handleMouseUp}
            onDragStart={(e) => {
              if (e.evt && e.evt.button !== 0) {
                e.target.stopDrag();
              }
            }}
            onWheel={handleWheel}
            onContextMenu={(e) => {
              e.evt.preventDefault();
              const target = e.target;
              const stage = e.target.getStage();
              if (target !== stage) {
                let node: any = target;
                let id = node.attrs.id;
                while (!id && node.getParent() && node.getParent() !== stage) {
                  node = node.getParent();
                  id = node.attrs.id;
                }
                const actualId = id?.replace('el-', '');
                if (actualId) {
                  setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, id: actualId });
                }
              } else {
                setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, id: 'stage' });
              }
            }}
            draggable={tool === 'pan'}
            onDragEnd={(e) => {
              // Update stage pos if stage itself was dragged
              if (e.target === e.target.getStage()) {
                 setStageProps(prev => ({ ...prev, x: e.target.x(), y: e.target.y() }));
              } else if (tool === 'select') {
                const id = e.target.attrs.id?.replace('el-', '');
                if (id) {
                  const isSelected = selectedIds.includes(id);
                  let dx = 0;
                  let dy = 0;

                  const isAsset = assets.some((a: any) => a.id === id);
                  if (isAsset) {
                    const asset = assets.find((a: any) => a.id === id);
                    dx = e.target.x() - (asset.wb_x || 0);
                    dy = e.target.y() - (asset.wb_y || 0);
                  } else {
                    const el = elements.find((e: any) => e.id === id);
                    dx = e.target.x() - (el.x || 0);
                    dy = e.target.y() - (el.y || 0);
                  }

                  if (isSelected && selectedIds.length > 1) {
                    // Update all selected
                    selectedIds.forEach((selId) => {
                      const selAsset = assets.find((a: any) => a.id === selId);
                      if (selAsset) {
                        updateAsset(selId, { wb_x: (selAsset.wb_x || 0) + dx, wb_y: (selAsset.wb_y || 0) + dy });
                      } else {
                        const selEl = elements.find((e: any) => e.id === selId);
                        if (selEl) {
                          updateElement(selId, { x: (selEl.x || 0) + dx, y: (selEl.y || 0) + dy });
                        }
                      }
                    });
                  } else {
                    if (isAsset) {
                      updateAsset(id, { wb_x: e.target.x(), wb_y: e.target.y() });
                    } else {
                      updateElement(id, { x: e.target.x(), y: e.target.y() });
                    }
                  }
                }
              }
            }}
            scaleX={stageProps.scale}
            scaleY={stageProps.scale}
            x={stageProps.x}
            y={stageProps.y}
            ref={stageRef}
            style={{ cursor: tool === 'pen' ? 'crosshair' : tool === 'text' ? 'text' : tool === 'pan' ? 'grab' : tool === 'eraser' ? 'crosshair' : 'default', position: 'absolute', top:0, left:0, zIndex: 10 }}
            onClick={(e) => {
              if (tool === 'select' && e.target === e.target.getStage()) {
                setSelectedIds([]);
              }
            }}
         >
            <Layer>
               {/* Automatically Organized Assets */}
               <OrganizedAssets assets={assets} tool={tool} selectedIds={selectedIds} stageProps={stageProps} updateAsset={updateAsset} />

               {(() => {
                 const buffer = 1000;
                 const vMinX = (-stageProps.x - buffer) / stageProps.scale;
                 const vMinY = (-stageProps.y - buffer) / stageProps.scale;
                 const vMaxX = (-stageProps.x + windowSize.width + buffer) / stageProps.scale;
                 const vMaxY = (-stageProps.y + windowSize.height + buffer) / stageProps.scale;

                 return elements.map((el: any) => {
                   const draggable = tool === 'select';
                   const x = el.x || 0;
                   const y = el.y || 0;
                   const width = el.width || 400; // rough default
                   const height = el.height || 400;
                   const scaleX = el.scaleX || 1;
                   const scaleY = el.scaleY || 1;
                   
                   const finalWidth = width * scaleX;
                   const finalHeight = height * scaleY;
                   const isVisible = (
                     x < vMaxX &&
                     x + finalWidth > vMinX &&
                     y < vMaxY &&
                     y + finalHeight > vMinY
                   );

                   const isCullable = ['image', 'video', 'sticky'].includes(el.type);
                   if (isCullable && !isVisible) return null;

                   if (el.type === 'path') {
                     const styleProps = el.penStyle === 'marker' ? { strokeWidth: 12 / stageProps.scale, opacity: 0.5 } : 
                                        el.penStyle === 'airbrush' ? { strokeWidth: 20 / stageProps.scale, opacity: 0.15 } :
                                        { strokeWidth: 4 / stageProps.scale, opacity: 1 };
                     return <Line key={el.id} id={`el-${el.id}`} points={el.points} stroke={el.color || '#fff'} tension={0.5} lineCap="round" lineJoin="round" x={x} y={y} scaleX={scaleX} scaleY={scaleY} rotation={el.rotation || 0} draggable={draggable} {...styleProps} />;
                   }
                   if (el.type === 'line') {
                     return <Line key={el.id} id={`el-${el.id}`} points={el.points} stroke={el.color || '#fff'} strokeWidth={4 / stageProps.scale} x={x} y={y} scaleX={scaleX} scaleY={scaleY} rotation={el.rotation || 0} draggable={draggable} />;
                   }
                   if (el.type === 'curve') {
                     const isSelected = selectedIds.includes(el.id);
                     return (
                       <Group key={el.id} x={x} y={y} scaleX={scaleX} scaleY={scaleY} rotation={el.rotation || 0} draggable={draggable && tool === 'select'}
                         onDragEnd={(e) => {
                           if (e.target.name() === 'control-point') return;
                           const dx = e.target.x() - x;
                           const dy = e.target.y() - y;
                           if (dx !== 0 || dy !== 0) {
                             const newPoints = [...el.points];
                             for (let i = 0; i < newPoints.length; i += 2) {
                               newPoints[i] += dx / scaleX;
                               newPoints[i+1] += dy / scaleY;
                             }
                             e.target.x(x);
                             e.target.y(y);
                             updateElement(el.id, { points: newPoints });
                           }
                         }}
                       >
                         <Arrow id={`el-${el.id}`} points={el.points} stroke={el.color || '#fff'} fill={el.color || '#fff'} strokeWidth={4 / stageProps.scale} tension={0.5} pointerLength={10 / stageProps.scale} pointerWidth={10 / stageProps.scale} />
                         {isSelected && tool === 'select' && (
                           <>
                             <KonvaCircle
                               x={el.points[0]}
                               y={el.points[1]}
                               name="control-point"
                               radius={8 / stageProps.scale}
                               fill="#fff"
                               stroke="#007AFF"
                               strokeWidth={2 / stageProps.scale}
                               draggable
                               onDragStart={(e) => { e.cancelBubble = true; }}
                               onDragMove={(e) => {
                                 const newPoints = [...el.points];
                                 newPoints[0] = e.target.x();
                                 newPoints[1] = e.target.y();
                                 updateElement(el.id, { points: newPoints });
                               }}
                             />
                             <KonvaCircle
                               x={el.points[2]}
                               y={el.points[3]}
                               name="control-point"
                               radius={8 / stageProps.scale}
                               fill="#007AFF"
                               stroke="#fff"
                               strokeWidth={2 / stageProps.scale}
                               draggable
                               onDragStart={(e) => { e.cancelBubble = true; }}
                               onDragMove={(e) => {
                                 const newPoints = [...el.points];
                                 newPoints[2] = e.target.x();
                                 newPoints[3] = e.target.y();
                                 updateElement(el.id, { points: newPoints });
                               }}
                             />
                             <KonvaCircle
                               x={el.points[4]}
                               y={el.points[5]}
                               name="control-point"
                               radius={8 / stageProps.scale}
                               fill="#fff"
                               stroke="#007AFF"
                               strokeWidth={2 / stageProps.scale}
                               draggable
                               onDragStart={(e) => { e.cancelBubble = true; }}
                               onDragMove={(e) => {
                                 const newPoints = [...el.points];
                                 newPoints[4] = e.target.x();
                                 newPoints[5] = e.target.y();
                                 updateElement(el.id, { points: newPoints });
                               }}
                             />
                           </>
                         )}
                       </Group>
                     );
                   }
                   if (el.type === 'square') {
                     return <Rect key={el.id} id={`el-${el.id}`} width={el.width} height={el.height} fill={el.shapeFill || 'transparent'} stroke={el.color || '#fff'} strokeWidth={(el.strokeWidth || 4) / stageProps.scale} x={x} y={y} scaleX={scaleX} scaleY={scaleY} rotation={el.rotation || 0} draggable={draggable} offsetX={el.width/2} offsetY={el.height/2} />;
                   }
                   if (el.type === 'circle') {
                     return <KonvaCircle key={el.id} id={`el-${el.id}`} radius={el.radius} fill={el.shapeFill || 'transparent'} stroke={el.color || '#fff'} strokeWidth={(el.strokeWidth || 4) / stageProps.scale} x={x} y={y} scaleX={scaleX} scaleY={scaleY} rotation={el.rotation || 0} draggable={draggable} />;
                   }
                   if (el.type === 'triangle') {
                     return <RegularPolygon key={el.id} id={`el-${el.id}`} sides={3} radius={el.radius} fill={el.shapeFill || 'transparent'} stroke={el.color || '#fff'} strokeWidth={(el.strokeWidth || 4) / stageProps.scale} x={x} y={y} scaleX={scaleX} scaleY={scaleY} rotation={el.rotation || 0} draggable={draggable} />;
                   }
                   if (el.type === 'text') {
                     return <Text key={el.id} id={`el-${el.id}`} x={x} y={y} scaleX={scaleX} scaleY={scaleY} rotation={el.rotation || 0} text={el.text} fontSize={el.fontSize || 16} fill={el.color || '#fff'} fontFamily="Helvetica Neue" fontStyle="bold" draggable={draggable} />;
                   }
                   if (el.type === 'image') {
                     return <URLImage key={el.id} id={`el-${el.id}`} image={el} x={x} y={y} scaleX={scaleX} scaleY={scaleY} rotation={el.rotation || 0} width={el.width} height={el.height} draggable={draggable} isVisible={isVisible} />;
                   }
                   if (el.type === 'arrow') {
                     return <Arrow key={el.id} id={`el-${el.id}`} points={el.points} x={x} y={y} scaleX={scaleX} scaleY={scaleY} rotation={el.rotation || 0} fill={el.color || '#fff'} stroke={el.color || '#fff'} strokeWidth={4 / stageProps.scale} pointerLength={10 / stageProps.scale} pointerWidth={10 / stageProps.scale} draggable={draggable} />;
                   }
                  if (el.type === 'sticky') {
                     return (
                       <Group key={el.id} id={`el-${el.id}`} x={x} y={y} scaleX={scaleX} scaleY={scaleY} rotation={el.rotation || 0} draggable={draggable}>
                         <Rect width={el.width} height={el.height} fill={el.color || '#FDE68A'} shadowColor="rgba(0,0,0,0.2)" shadowBlur={10} shadowOffset={{ x: 5, y: 5 }} cornerRadius={4} />
                         {el.title && <Text width={el.width - 20} x={10} y={10} text={el.title} fill={el.fontColor || '#000'} fontSize={(el.fontSize || 16) * 1.2} fontStyle="bold" fontFamily="Helvetica Neue" wrap="word" />}
                         <Text width={el.width - 20} height={el.height - (el.title ? 40 : 20)} x={10} y={el.title ? 35 : 10} text={el.text} fill={el.fontColor || '#000'} fontSize={el.fontSize || 16} fontFamily="Helvetica Neue" wrap="word" />
                       </Group>
                     );
                   }
                   return null;
                 });
               })()}

               {currentLine && (() => {
                 const styleProps = currentLine.penStyle === 'marker' ? { strokeWidth: 12 / stageProps.scale, opacity: 0.5 } : 
                                    currentLine.penStyle === 'airbrush' ? { strokeWidth: 20 / stageProps.scale, opacity: 0.15 } :
                                    { strokeWidth: 4 / stageProps.scale, opacity: 1 };
                 return <Line points={currentLine.points} stroke={currentLine.color} tension={0.5} lineCap="round" lineJoin="round" {...styleProps} />;
               })()}
               {currentArrow && (
                 <Arrow points={currentArrow.points} fill={currentArrow.color} stroke={currentArrow.color} strokeWidth={4 / stageProps.scale} pointerLength={10 / stageProps.scale} pointerWidth={10 / stageProps.scale} />
               )}

               {selectionBox && (
                 <Rect 
                   x={selectionBox.x} 
                   y={selectionBox.y} 
                   width={selectionBox.width} 
                   height={selectionBox.height} 
                   fill="rgba(0,161,255,0.3)" 
                   stroke="#00A1FF" 
                   strokeWidth={1 / stageProps.scale} 
                 />
               )}

               {tool === 'select' && (
                 <Transformer 
                   ref={trRef} 
                   boundBoxFunc={(oldBox, newBox) => {
                     if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) return oldBox;
                     return newBox;
                   }}
                   onTransformEnd={(e) => {
                     trRef.current.nodes().forEach((n: any) => {
                       const id = n.attrs.id?.replace('el-', '');
                       if (id) {
                         const isAsset = assets.some((a: any) => a.id === id);
                         if (isAsset) {
                           updateAsset(id, { wb_x: n.x(), wb_y: n.y(), wb_scaleX: n.scaleX(), wb_scaleY: n.scaleY(), wb_rotation: n.rotation() });
                         } else {
                           const el = elements.find((e: any) => e.id === id);
                           if (el && (el.type === 'sticky' || el.type === 'square')) {
                             updateElement(id, {
                               x: n.x(),
                               y: n.y(),
                               width: Math.max(20, (el.width || 100) * n.scaleX()),
                               height: Math.max(20, (el.height || 100) * n.scaleY()),
                               scaleX: 1,
                               scaleY: 1,
                               rotation: n.rotation()
                             });
                             n.scaleX(1);
                             n.scaleY(1);
                           } else if (el && (el.type === 'circle' || el.type === 'triangle')) {
                             updateElement(id, {
                               x: n.x(),
                               y: n.y(),
                               radius: Math.max(10, (el.radius || 50) * Math.max(n.scaleX(), n.scaleY())),
                               scaleX: 1,
                               scaleY: 1,
                               rotation: n.rotation()
                             });
                             n.scaleX(1);
                             n.scaleY(1);
                           } else {
                             updateElement(id, {
                               x: n.x(),
                               y: n.y(),
                               scaleX: n.scaleX(),
                               scaleY: n.scaleY(),
                               rotation: n.rotation(),
                             });
                           }
                         }
                       }
                     });
                   }}
                 />
               )}

               {cursors.map((cursor: any) => (
                  <React.Fragment key={cursor.id}>
                    <Arrow points={[cursor.x, cursor.y, cursor.x + 12 / stageProps.scale, cursor.y + 16 / stageProps.scale]} fill={cursor.color} stroke={cursor.color} strokeWidth={2 / stageProps.scale} pointerLength={4 / stageProps.scale} pointerWidth={4 / stageProps.scale} />
                    <Text x={cursor.x + 15 / stageProps.scale} y={cursor.y + 15 / stageProps.scale} text={cursor.displayName} fill="#fff" fontSize={10 / stageProps.scale} padding={2} />
                  </React.Fragment>
               ))}
            </Layer>
         </Stage>

         {/* Top UI Layer */}
         <div className="absolute top-0 w-full px-6 py-4 flex justify-between items-center pointer-events-none z-50">
            {/* Top Left: Back & Title */}
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/')} className="pointer-events-auto flex items-center text-[#0A84FF] hover:opacity-80 transition-opacity">
                <ChevronLeft className="w-6 h-6" />
                <span className="text-lg font-medium pr-2 border-r border-white/10">Projetos</span>
              </button>
              <input 
                 className="pointer-events-auto bg-transparent text-white font-medium text-lg outline-none hover:bg-white/5 px-2 py-1 rounded-lg transition-colors w-64 placeholder-white/50"
                 value={project?.name || ''}
                 onChange={(e) => updateTitle(e.target.value)}
                 placeholder="Nome do Projeto"
              />
            </div>

            {/* Top Right: Asset Sidebar Toggle / User */}
            <div className="flex items-center justify-end gap-3">
               <button onClick={() => setView('moodboard')} className="pointer-events-auto h-9 px-4 rounded-full bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] transition-colors font-medium text-sm border border-white/10 flex items-center">
                 <Layout className="w-4 h-4 mr-2" /> Moodboard
               </button>
               <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="User" className="pointer-events-auto w-9 h-9 rounded-full border border-white/10 cursor-pointer" onClick={() => navigate('/')} />
            </div>
         </div>

         {/* Bottom Right Logo */}
         <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#1c1c1e]/90 backdrop-blur-xl border border-white/10 px-3 py-3 rounded-[24px] pointer-events-auto shadow-2xl">
            <ToolbarButton icon={<MousePointer2 className="w-5 h-5" />} active={tool === 'select'} onClick={() => {setTool('select'); setActivePopover(null);}} />
            <ToolbarButton icon={<Hand className="w-5 h-5" />} active={tool === 'pan'} onClick={() => {setTool('pan'); setActivePopover(null);}} />
            <div className="w-[1px] h-6 bg-white/10 mx-1" />
            <div className="relative">
              <ToolbarButton icon={<Pen className="w-5 h-5" />} active={tool === 'pen'} onClick={() => {setTool('pen'); setActivePopover('pen');}} />
              {activePopover === 'pen' && (
                <div className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/10 p-3 rounded-[20px] shadow-2xl flex gap-3">
                  <div className="flex flex-col gap-2">
                     <span className="text-white/60 text-xs font-medium px-1">Pen Tools</span>
                     <div className="flex gap-2">
                        <ToolbarButton icon={<Pen className="w-5 h-5" />} active={penStyle === 'felt'} onClick={() => {setTool('pen'); setPenStyle('felt'); setActivePopover(null)}} />
                        <ToolbarButton icon={<Highlighter className="w-5 h-5" />} active={penStyle === 'marker'} onClick={() => {setTool('pen'); setPenStyle('marker'); setActivePopover(null)}} />
                        <ToolbarButton icon={<Brush className="w-5 h-5" />} active={penStyle === 'airbrush'} onClick={() => {setTool('pen'); setPenStyle('airbrush'); setActivePopover(null)}} />
                        <div className="w-[1px] h-6 bg-white/10 mx-1 self-center" />
                        <div className="flex gap-1 items-center">
                           {COLORS.map(c => (
                             <div 
                               key={c}
                               onClick={() => { setSelectedColor(c); setActivePopover(null); setTool('pen'); }}
                               className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${selectedColor === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#1c1c1e]' : 'hover:scale-110'}`}
                               style={{ backgroundColor: c }}
                             />
                           ))}
                           <div className="relative w-6 h-6 rounded-full overflow-hidden cursor-pointer hover:scale-110 transition-transform ml-1">
                             <div className="absolute inset-0" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} />
                             <input type="color" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" value={selectedColor} onChange={(e) => { setSelectedColor(e.target.value); setTool('pen'); }} />
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
               <ToolbarButton icon={<Shapes className="w-5 h-5" />} active={activePopover === 'shapes'} onClick={() => setActivePopover(activePopover === 'shapes' ? null : 'shapes')} />
               {activePopover === 'shapes' && (
                  <div className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/10 p-3 rounded-[20px] shadow-2xl flex gap-3">
                     <div className="flex flex-col gap-2">
                        <span className="text-white/60 text-xs font-medium px-1">Shapes</span>
                        <div className="flex gap-2">
                           <ToolbarButton icon={<Square className="w-5 h-5" />} onClick={() => {addInstantElement('square', { width: 100, height: 100 }); setActivePopover(null);}} />
                           <ToolbarButton icon={<Circle className="w-5 h-5" />} onClick={() => {addInstantElement('circle', { radius: 50 }); setActivePopover(null);}} />
                           <ToolbarButton icon={<Triangle className="w-5 h-5" />} onClick={() => {addInstantElement('triangle', { radius: 50 }); setActivePopover(null);}} />
                           <div className="w-[1px] h-6 bg-white/10 mx-1 self-center" />
                           <ToolbarButton icon={<Minus className="w-5 h-5" />} onClick={() => {addInstantElement('line', { points: [-50, 0, 50, 0] }); setActivePopover(null);}} />
                           <ToolbarButton icon={<ArrowUpRight className="w-5 h-5" />} onClick={() => {addInstantElement('arrow', { points: [-50, 50, 50, -50] }); setActivePopover(null);}} />
                           <ToolbarButton icon={<Spline className="w-5 h-5" />} onClick={() => {addInstantElement('curve', { points: [-50, 50, 0, -50, 50, 50] }); setActivePopover(null);}} />
                        </div>
                     </div>
                  </div>
               )}
            </div>
            
            <ToolbarButton icon={<StickyNote className="w-5 h-5" />} active={tool === 'sticky'} onClick={() => {
              setActivePopover(null);
              setTool('sticky');
            }} />
            
            <ToolbarButton icon={<Type className="w-5 h-5" />} active={tool === 'text'} onClick={() => {
              setActivePopover(null);
              setTool('text');
            }} />
            
            <ToolbarButton icon={<Eraser className="w-5 h-5" />} active={tool === 'eraser'} onClick={() => {setTool('eraser'); setActivePopover(null);}} />
            <div className="w-[1px] h-6 bg-white/10 mx-1" />
            
            <div className="relative flex items-center justify-center px-2">
            <div 
                className="w-7 h-7 rounded-full border-[3px] transition-transform cursor-pointer shadow-sm hover:scale-105 relative" 
                style={{ backgroundColor: selectedColor, borderColor: activePopover === 'color' ? '#fff' : 'rgba(255,255,255,0.2)' }}
                onClick={() => setActivePopover(activePopover === 'color' ? null : 'color')}
              >
                {/* Rainbow border for color wheel hint */}
                <div className="absolute -inset-1 rounded-full border-2 border-transparent mix-blend-overlay" style={{ background: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)', maskImage: 'linear-gradient(#fff 0 0)', maskComposite: 'exclude', WebkitMaskImage: 'linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', padding: '2px', pointerEvents: 'none', opacity: 0.5 }}></div>
              </div>
              {activePopover === 'color' && (
                <div className="absolute bottom-[calc(100%+16px)] right-0 bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/10 p-3 rounded-[20px] shadow-2xl flex gap-3">
                  {COLORS.map(c => (
                    <div 
                      key={c}
                      onClick={() => { setSelectedColor(c); setActivePopover(null); }}
                      className={`w-8 h-8 rounded-full cursor-pointer transition-transform ${selectedColor === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#1c1c1e]' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  {/* Additional input type color for color wheel */}
                  <div className="relative w-8 h-8 rounded-full overflow-hidden cursor-pointer hover:scale-110 transition-transform">
                     <div className="absolute inset-0" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} />
                     <input type="color" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
         </div>

         {/* Bottom Right Logo */}
         <div className="absolute bottom-10 right-10 z-20 pointer-events-none text-right opacity-40 flex flex-col items-end">
           <div className="font-bold text-3xl leading-none tracking-tighter text-white">{Math.round(stageProps.scale * 100)}%</div>
         </div>

         {contextMenu && (() => {
             const activeEl = elements.find((el: any) => el.id === contextMenu.id);
             const isShape = activeEl && (activeEl.type === 'square' || activeEl.type === 'circle' || activeEl.type === 'triangle');
             const hasStroke = activeEl && (isShape || activeEl.type === 'line' || activeEl.type === 'curve' || activeEl.type === 'arrow');
             const isSticky = activeEl && activeEl.type === 'sticky';
             
             return (
             <div 
                className="absolute z-[100] bg-[#1e1e1e] border border-white/10 rounded-md shadow-2xl py-1 flex flex-col pointer-events-auto"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onMouseDown={(e) => e.stopPropagation()} // Prevent stage click from closing
             >
                {/* Organize Images - shown when multiple items selected or clicking on stage */}
                {(contextMenu.id === 'stage' || selectedIds.length > 1) && (
                  <button 
                     className="w-full min-w-[120px] text-left px-4 py-2 hover:bg-white/5 text-white font-medium text-sm flex items-center border-b border-white/10"
                     onClick={(e) => {
                        e.stopPropagation();
                        organizeImages();
                     }}
                  >
                     <LayoutGrid className="w-4 h-4 mr-2" /> Organizar Imagens
                  </button>
                )}

                {/* Copy / Duplicate */}
                {activeEl && (
                  <button 
                     className="w-full min-w-[120px] text-left px-4 py-2 hover:bg-white/5 text-white font-medium text-sm flex items-center"
                     onClick={(e) => {
                        e.stopPropagation();
                        // duplication logic
                        const isAsset = assets.some((a: any) => a.id === contextMenu.id);
                        if (!isAsset) {
                           const newEl = { ...activeEl, id: Date.now().toString(), x: (activeEl.x || 0) + 20, y: (activeEl.y || 0) + 20 };
                           addElement(newEl);
                        }
                        setContextMenu(null);
                     }}
                  >
                     <Copy className="w-4 h-4 mr-2" /> Duplicar
                  </button>
                )}
                
                {/* General Color */}
                {activeEl && !isSticky && (
                    <div className="px-4 py-2 flex flex-col gap-2 border-b border-white/10">
                       <label className="text-white text-xs opacity-60">Color</label>
                       <div className="flex gap-1 flex-wrap w-48">
                          {COLORS.map(c => (
                            <div 
                              key={c}
                              onClick={() => updateElement(activeEl.id, { color: c, shapeFill: activeEl.shapeFill && activeEl.shapeFill !== 'transparent' ? c : activeEl.shapeFill })}
                              className={`w-5 h-5 rounded-full cursor-pointer transition-transform border border-white/20 ${activeEl.color === c ? 'scale-110 ring-1 ring-white' : 'hover:scale-110'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                       </div>
                    </div>
                )}
                {/* Text editing */}
                {activeEl && activeEl.type === 'text' && (
                    <>
                       <div className="px-4 py-2 flex flex-col gap-2 border-b border-white/10">
                          <label className="text-white text-xs opacity-60">Text</label>
                          <input
                             type="text"
                             value={activeEl.text || ''}
                             onChange={(e) => updateElement(activeEl.id, { text: e.target.value })}
                             className="bg-black/20 text-white text-sm px-2 rounded h-8 border border-white/10 outline-none w-full"
                          />
                       </div>
                       <div className="px-4 py-2 flex flex-col gap-2 border-b border-white/10">
                          <label className="text-white text-xs opacity-60">Font Size</label>
                          <input
                             type="number"
                             value={activeEl.fontSize || 24}
                             onChange={(e) => updateElement(activeEl.id, { fontSize: Number(e.target.value) })}
                             className="bg-black/20 text-white text-xs px-2 rounded h-7 border border-white/10 outline-none"
                          />
                       </div>
                    </>
                )}
                {isSticky && (
                   <>
                     <div className="px-4 py-2 flex flex-col gap-2 border-b border-white/10">
                        <label className="text-white text-xs opacity-60">Title</label>
                        <input
                           type="text"
                           value={activeEl.title || ''}
                           onChange={(e) => updateElement(activeEl.id, { title: e.target.value })}
                           className="bg-black/20 text-white text-sm px-2 rounded h-8 border border-white/10 outline-none w-full font-bold"
                           placeholder="Title..."
                        />
                     </div>
                     <div className="px-4 py-2 flex flex-col gap-2 border-b border-white/10">
                        <label className="text-white text-xs opacity-60">Content</label>
                        <textarea
                           value={activeEl.text || ''}
                           onChange={(e) => updateElement(activeEl.id, { text: e.target.value })}
                           className="bg-black/20 text-white text-sm p-2 rounded border border-white/10 outline-none w-56 h-32 resize-none"
                           placeholder="Note content..."
                        />
                     </div>
                     <div className="px-4 py-2 flex flex-col gap-2 border-b border-white/10">
                        <label className="text-white text-xs opacity-60">Font Size</label>
                        <input
                           type="number"
                           value={activeEl.fontSize || 16}
                           onChange={(e) => updateElement(activeEl.id, { fontSize: Number(e.target.value) })}
                           className="bg-black/20 text-white text-xs px-2 rounded h-7 border border-white/10 outline-none"
                        />
                     </div>
                     <div className="px-4 py-2 flex flex-col gap-2 border-b border-white/10">
                        <label className="text-white text-xs opacity-60">Note Color</label>
                        <div className="flex gap-1 flex-wrap w-48">
                           {COLORS.map(c => (
                             <div 
                               key={c}
                               onClick={() => updateElement(activeEl.id, { color: c })}
                               className={`w-5 h-5 rounded-full cursor-pointer transition-transform ${activeEl.color === c ? 'scale-110 ring-1 ring-white' : 'hover:scale-110'}`}
                               style={{ backgroundColor: c }}
                             />
                           ))}
                        </div>
                     </div>
                   </>
                )}
                {hasStroke && (
                   <>
                     <div className="px-4 py-2 flex flex-col gap-2 border-b border-white/10">
                        <label className="text-white text-xs opacity-60">Line Thickness</label>
                        <input
                           type="range"
                           min="1"
                           max="20"
                           value={activeEl.strokeWidth || 4}
                           onChange={(e) => updateElement(activeEl.id, { strokeWidth: Number(e.target.value) })}
                           className="w-full"
                        />
                     </div>
                   </>
                )}
                {isShape && (
                    <div className="px-4 py-2 flex flex-col gap-2 border-b border-white/10">
                        <label className="text-white text-xs opacity-60">Fill Color</label>
                        <div className="flex gap-1 flex-wrap w-32">
                           {COLORS.map(c => (
                             <div 
                               key={c}
                               onClick={() => updateElement(activeEl.id, { shapeFill: c })}
                               className={`w-5 h-5 rounded-full cursor-pointer transition-transform border border-white/20 ${activeEl.shapeFill === c ? 'scale-110 ring-1 ring-white' : 'hover:scale-110'}`}
                               style={{ backgroundColor: c }}
                             />
                           ))}
                           <div 
                             onClick={() => updateElement(activeEl.id, { shapeFill: 'transparent' })}
                             className={`w-5 h-5 rounded-full cursor-pointer transition-transform border border-white/20 flex items-center justify-center ${activeEl.shapeFill === 'transparent' ? 'scale-110 ring-1 ring-white' : 'hover:scale-110'}`}
                             title="Transparent"
                           >
                             <div className="w-full h-[1px] bg-red-500 rotate-45" />
                           </div>
                        </div>
                     </div>
                )}
                {contextMenu.id !== 'stage' && (
                <button 
                   className="w-full min-w-[120px] text-left px-4 py-2 hover:bg-white/5 text-red-500 font-medium text-sm flex items-center"
                   onClick={(e) => {
                      e.stopPropagation();
                      const isAsset = assets.some((a: any) => a.id === contextMenu.id);
                      if (isAsset) {
                        removeAsset(contextMenu.id);
                      } else {
                        removeElement(contextMenu.id);
                      }
                      setContextMenu(null);
                   }}
                >
                   <Eraser className="w-4 h-4 mr-2" /> Deletar
                </button>
                )}
             </div>
             );
         })()}
       </div>
    </div>
  );
}

function ToolbarButton({ icon, active, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`p-[10px] rounded-[14px] cursor-pointer transition-colors ${active ? 'bg-[#0A84FF] text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
    >
      {icon}
    </div>
  );
}
