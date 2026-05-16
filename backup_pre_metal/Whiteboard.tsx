import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import Konva from 'konva';
import { Stage, Layer, Rect, Circle, Line, Text, Image as KonvaImage, Arrow, Group, Transformer } from 'react-konva';
import { MousePointer2, Hand, Pen, Eraser, Square, Circle as CircleIcon, ArrowRight, ArrowLeftRight, Type, StickyNote, LayoutGrid, Palette, Trash2, Copy, X, CheckSquare, Zap, ChevronLeft, Undo2, Redo2, ArrowUpSquare, ArrowDownSquare, Lock, Unlock, Underline, RefreshCw, MoreVertical, Plus, Minus, Map, Pipette } from 'lucide-react';
import useImage from 'use-image';
import { motion, AnimatePresence } from 'motion/react';
import { compressImage, blobToDataURL } from '../utils/media';
import { SplashScreen } from './SplashScreen';

// --- TYPES ---
export type Tool = 'select' | 'pan' | 'pen' | 'highlighter' | 'laser' | 'eraser' | 'rect' | 'ellipse' | 'arrow' | 'text' | 'sticky' | 'column' | 'color';
export type ElementType = Tool | 'image' | 'video' | 'path' | 'youtube' | 'gif';

export interface BoardElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  points?: number[];
  text?: string;
  fontSize?: number;
  url?: string;
  rotation?: number;
  align?: 'left' | 'center' | 'right';
  parentId?: string | null;
  title?: string;
  body?: string;
}

const COLORS = {
  white: '#ffffff',
  gray: '#888888',
  black: '#1a1a1a',
  orange: '#FF4500',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444'
};


// --- COMPONENTS ---
const URLImage = ({ image, x, y, width, height, id, ...props }: any) => {
  const [img] = useImage(image.url || undefined, 'anonymous');
  return (
    <KonvaImage id={`el-${id}`} image={img} x={x} y={y} width={width} height={height} {...props} />
  );
};

const KonvaVideo = ({ element, ...props }: any) => {
  const [videoObj, setVideoObj] = useState<HTMLVideoElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const imageRef = useRef<any>(null);

  useEffect(() => {
    const vid = document.createElement('video');
    vid.src = element.url;
    vid.loop = true;
    vid.muted = true;
    vid.preload = 'auto';
    vid.crossOrigin = 'Anonymous';
    vid.currentTime = 0.1; // Seek to first frame
    vid.onloadeddata = () => setVideoObj(vid);
    return () => {
      vid.pause();
      vid.src = '';
    };
  }, [element.url]);

  useEffect(() => {
    if (!videoObj) return;
    if (isHovered) videoObj.play().catch(() => { });
    else {
      videoObj.pause();
      videoObj.currentTime = 0.1;
    }
  }, [isHovered, videoObj]);

  useEffect(() => {
    if (!videoObj || !imageRef.current || !isHovered) return;
    const anim = new Konva.Animation(() => { }, imageRef.current.getLayer());
    anim.start();
    return () => { anim.stop(); };
  }, [isHovered, videoObj]);

  return (
    <Group
      id={`el-${element.id}`}
      x={element.x} y={element.y}
      rotation={element.rotation}
      scaleX={element.scaleX || 1}
      scaleY={element.scaleY || 1}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {videoObj && <KonvaImage ref={imageRef} image={videoObj} width={element.width} height={element.height} />}
    </Group>
  );
};

const KonvaGif = ({ element, ...props }: any) => {
  const [staticImg] = useImage(element.posterUrl || element.url, 'anonymous');
  const [gifImgObj, setGifImgObj] = useState<HTMLImageElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const imageRef = useRef<any>(null);

  useEffect(() => {
    const img = new Image();
    img.src = element.url;
    img.crossOrigin = 'Anonymous';
    img.onload = () => setGifImgObj(img);
  }, [element.url]);

  useEffect(() => {
    if (!isHovered || !gifImgObj || !imageRef.current) return;
    const anim = new Konva.Animation(() => { }, imageRef.current.getLayer());
    anim.start();
    return () => { anim.stop(); };
  }, [isHovered, gifImgObj]);

  return (
    <Group
      id={`el-${element.id}`}
      x={element.x} y={element.y}
      rotation={element.rotation}
      scaleX={element.scaleX || 1}
      scaleY={element.scaleY || 1}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <KonvaImage 
        ref={imageRef} 
        image={isHovered && gifImgObj ? gifImgObj : staticImg} 
        width={element.width} 
        height={element.height} 
      />
    </Group>
  );
};

const KonvaYoutube = ({ element, setPlayingYoutubeId, ...props }: any) => {
  const thumbUrl = `https://img.youtube.com/vi/${element.youtubeId}/hqdefault.jpg`;
  const [img] = useImage(thumbUrl, 'anonymous');

  return (
    <Group
      id={`el-${element.id}`}
      x={element.x} y={element.y}
      rotation={element.rotation}
      scaleX={element.scaleX || 1}
      scaleY={element.scaleY || 1}
      {...props}
    >
      {img && <KonvaImage image={img} width={element.width} height={element.height} cornerRadius={8} />}
      <Rect width={element.width} height={element.height} fill="rgba(0,0,0,0.3)" cornerRadius={8} />
      <Group
        x={element.width / 2}
        y={element.height / 2}
        onClick={() => setPlayingYoutubeId(element.id)}
        onTap={() => setPlayingYoutubeId(element.id)}
        onMouseEnter={(e: any) => { const container = e.target.getStage().container(); container.style.cursor = 'pointer'; }}
        onMouseLeave={(e: any) => { const container = e.target.getStage().container(); container.style.cursor = 'crosshair'; }}
      >
        <Circle radius={30} fill="#FF0000" />
        <Line points={[-8, -10, 12, 0, -8, 10]} fill="white" closed={true} />
      </Group>
    </Group>
  );
};

const KonvaColumn = ({ element, elements, editingTextId, ...props }: any) => {
  const children = elements.filter((e: any) => e.parentId === element.id);
  const isEditing = editingTextId === element.id;
  
  return (
    <Group
      id={`el-${element.id}`}
      x={element.x} y={element.y}
      rotation={element.rotation}
      scaleX={element.scaleX || 1}
      scaleY={element.scaleY || 1}
      {...props}
    >
      {/* Background Frame */}
      <Rect 
        width={element.width} 
        height={element.height} 
        fill="#141414" 
        stroke="#333333"
        strokeWidth={2}
        cornerRadius={12} 
        shadowColor="#000"
        shadowBlur={20}
        shadowOpacity={0.5}
        shadowOffsetY={10}
      />
      {/* Title */}
      <Text 
        text={element.title || "New Column"}
        width={element.width}
        y={16}
        align="center"
        fill="#FFFFFF"
        fontSize={16}
        fontFamily="Inter"
        fontStyle="bold"
        opacity={isEditing ? 0 : 1}
      />
      {/* Counter / Subtitle */}
      <Text 
        text={element.body || `${children.length} cards`}
        width={element.width - 32}
        x={16}
        y={38}
        align="center"
        fill="#888888"
        fontSize={11}
        fontFamily="Inter"
        opacity={isEditing ? 0 : 1}
        wrap="word"
      />
    </Group>
  );
};

const getContrastColor = (hex: string) => {
  if (!hex) return '#1a1a1a';
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#1a1a1a' : '#ffffff';
};

const KonvaColorSwatch = ({ element, updateElement, onOpenColorPicker, ...props }: any) => {
  const w = element.width || 120;
  const h = element.height || 140;
  const colorH = h * 0.65;
  const textColor = getContrastColor(element.fill || '#ffffff');
  
  const handleDoubleClick = (e: any) => {
    if (!onOpenColorPicker) return;
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    onOpenColorPicker(element.id, element.fill || '#000000', pointer.x, pointer.y);
  };

  return (
    <Group
      id={`el-${element.id}`}
      x={element.x} y={element.y}
      rotation={element.rotation}
      scaleX={element.scaleX || 1}
      scaleY={element.scaleY || 1}
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}
      {...props}
    >
      <Rect width={w} height={h} fill="#ffffff" cornerRadius={8} shadowColor="#000" shadowBlur={15} shadowOpacity={0.15} shadowOffsetY={5} />
      <Rect width={w} height={colorH} fill={element.fill} cornerRadius={[8, 8, 0, 0]} />
      <Text text={(element.fill || '').toUpperCase()} width={w} y={16} align="center" fill={textColor} fontSize={12} fontStyle="bold" fontFamily="Inter" />
      <Text text={element.title || 'Color'} width={w} y={colorH + (h - colorH) / 2 - 6} align="center" fill="#1a1a1a" fontSize={12} fontFamily="Inter" />
    </Group>
  );
};

// --- MEMOIZED COMPONENTS ---
const WhiteboardElement = React.memo(({ el, elements, isSelected, tool, dragProps, editableProps, editingTextId, editingItemIdx, setEditingTextId, setEditValue, setEditingItemIdx, setItemEditValue, setPlayingYoutubeId, updateElement, stageProps, stageRef, onOpenColorPicker }: any) => {
  if (el.type === 'rect') return <Rect key={el.id} id={`el-${el.id}`} x={el.x} y={el.y} width={el.width} height={el.height} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} cornerRadius={8} dash={el.dashStyle === 'dashed' ? [10, 10] : []} {...dragProps} />;
  if (el.type === 'ellipse') return <Circle key={el.id} id={`el-${el.id}`} x={el.x} y={el.y} radius={Math.abs(el.width || 0) / 2} fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} dash={el.dashStyle === 'dashed' ? [10, 10] : []} {...dragProps} />;
  if (el.type === 'image') return <URLImage key={el.id} id={el.id} image={el} x={el.x} y={el.y} width={el.width} height={el.height} {...dragProps} />;
  if (el.type === 'video') return <KonvaVideo key={el.id} element={el} {...dragProps} />;
  if (el.type === 'gif') return <KonvaGif key={el.id} element={el} {...dragProps} />;
  if (el.type === 'youtube') return <KonvaYoutube key={el.id} element={el} setPlayingYoutubeId={setPlayingYoutubeId} {...dragProps} />;
  if (el.type === 'color') return <KonvaColorSwatch key={el.id} element={el} updateElement={updateElement} onOpenColorPicker={onOpenColorPicker} {...dragProps} />;
  if (el.type === 'column') return <KonvaColumn key={el.id} element={el} elements={elements} editingTextId={editingTextId} {...dragProps} {...editableProps} />;

  if (el.type === 'arrow') {
    const pts = el.points || [el.x, el.y, el.x + (el.width || 0) / 2, el.y + (el.height || 0) / 2, el.x + (el.width || 0), el.y + (el.height || 0)];
    const arrowNodeId = `arrow-line-${el.id}`;
    const makeHandleDrag = (idx: number) => ({
      onDragMove: (e: any) => {
        const arrowNode = stageRef.current?.findOne(`#${arrowNodeId}`);
        if (arrowNode) {
          const currentPts = arrowNode.points();
          const newPts = [...currentPts];
          newPts[idx] = e.target.x();
          newPts[idx + 1] = e.target.y();
          arrowNode.points(newPts);
          arrowNode.getLayer()?.batchDraw();
        }
      },
      onDragEnd: (e: any) => {
        const arrowNode = stageRef.current?.findOne(`#${arrowNodeId}`);
        if (arrowNode) {
          // Check for nearby elements to anchor
          const pos = e.target.absolutePosition();
          const stage = e.target.getStage();
          const overEl = stage.getIntersection(pos);
          const overId = overEl?.id()?.replace('el-', '') || overEl?.parent?.id()?.replace('el-', '');

          const updates: any = { points: arrowNode.points() };
          if (idx === 0) updates.startId = overId !== el.id ? overId : null;
          if (idx === 4) updates.endId = overId !== el.id ? overId : null;

          updateElement(el.id, updates);
        }
      }
    });
    return (
      <Group key={el.id} {...dragProps}>
        <Arrow
          id={arrowNodeId}
          points={pts}
          fill={el.stroke}
          stroke={el.stroke}
          strokeWidth={el.strokeWidth || 4}
          pointerLength={(el.strokeWidth || 4) * 3}
          pointerWidth={(el.strokeWidth || 4) * 3}
          pointerAtBeginning={el.arrowHead === 'start' || el.arrowHead === 'both'}
          pointerAtEnding={el.arrowHead === 'end' || el.arrowHead === 'both' || !el.arrowHead}
          tension={0.5}
          dash={el.dashStyle === 'dashed' ? [10, 10] : (el.dashStyle === 'dotted' ? [2, 5] : [])}
          hitStrokeWidth={25}
        />
        {isSelected && tool === 'select' && pts.length === 6 && (
          <>
            <Circle name="arrow-handle" x={pts[0]} y={pts[1]} radius={6 / stageProps.scale} fill="#FF4500" stroke="#fff" strokeWidth={2 / stageProps.scale} draggable {...makeHandleDrag(0)} />
            <Circle name="arrow-handle" x={pts[2]} y={pts[3]} radius={6 / stageProps.scale} fill="#FF4500" stroke="#fff" strokeWidth={2 / stageProps.scale} draggable {...makeHandleDrag(2)} />
            <Circle name="arrow-handle" x={pts[4]} y={pts[5]} radius={6 / stageProps.scale} fill="#FF4500" stroke="#fff" strokeWidth={2 / stageProps.scale} draggable {...makeHandleDrag(4)} />
          </>
        )}
      </Group>
    );
  }

  if (el.type === 'text') return <Text key={el.id} id={`el-${el.id}`} x={el.x} y={el.y} text={el.text} fontSize={el.fontSize} fill={el.fill} fontFamily="Inter" fontStyle={el.fontStyle || 'bold'} textDecoration={el.textDecoration || ''} opacity={editingTextId === el.id ? 0 : 1} {...dragProps} {...editableProps} />;

  if (el.type === 'sticky') {
    const w = el.width || 200;
    const h = el.height || 200;
    const padding = 20;
    return (
      <Group key={el.id} id={`el-${el.id}`} x={el.x} y={el.y} {...dragProps} {...editableProps}>
        {/* Main Paper */}
        <Rect name="background-rect" width={w} height={h} fill={el.fill} cornerRadius={4} shadowColor="rgba(0,0,0,0.2)" shadowBlur={10} shadowOffsetY={5} />

        {/* Subtle Corner Fold Effect (Gradient) */}
        <Rect name="corner-fold" x={w - 20} y={h - 20} width={20} height={20} fillPriority="linear-gradient" fillLinearGradientStartPoint={{ x: 0, y: 0 }} fillLinearGradientEndPoint={{ x: 20, y: 20 }} fillLinearGradientColorStops={[0, 'rgba(0,0,0,0.1)', 1, 'rgba(0,0,0,0)']} cornerRadius={2} />

        {/* Title - Elegant top label */}
        <Text
          text={el.title?.toUpperCase() || 'TITLE'}
          width={w - padding * 2} x={padding} y={12}
          fill="rgba(0,0,0,0.4)" fontSize={10} fontFamily="Inter" fontStyle="bold" letterSpacing={1} align="center"
          opacity={editingTextId === el.id ? 0 : 1}
        />

        {/* Body Text - Centered like Miro/tldraw */}
        <Text
          text={el.body || ''}
          width={w - padding * 2} height={h - 40}
          x={padding} y={30}
          fill="#1a1a1a" fontSize={el.fontSize || 14} fontFamily="Inter"
          fontStyle={el.fontStyle || 'normal'}
          textDecoration={el.textDecoration || ''}
          align="center" verticalAlign="middle"
          opacity={editingTextId === el.id ? 0 : 1}
        />
      </Group>
    );
  }

  if (el.type === 'checklist') return (
    <Group key={el.id} id={`el-${el.id}`} x={el.x} y={el.y} {...dragProps}>
      <Rect width={el.width} height={el.height} fill="transparent" />
      <Text text={el.title || 'Checklist'} x={16} y={12} fill="#fff" fontSize={18} fontFamily="Inter" fontStyle="bold"
        opacity={(editingTextId === el.id && editingItemIdx === -1) ? 0 : 1}
        onDblClick={() => { setEditingTextId(el.id); setEditValue(el.title || ''); setEditingItemIdx(-1); }}
        onDblTap={() => { setEditingTextId(el.id); setEditValue(el.title || ''); setEditingItemIdx(-1); }}
      />
      {el.items?.map((item: any, i: number) => (
        <Group
          key={i}
          y={46 + i * 28}
          draggable={isSelected}
          onDragStart={(e) => { e.target.moveToTop(); }}
          onDragEnd={(e) => {
            e.cancelBubble = true; // Prevent parent drag
            const newY = e.target.y();
            const targetIdx = Math.max(0, Math.min(el.items.length - 1, Math.round((newY - 46) / 28)));

            e.target.y(46 + i * 28);

            if (targetIdx !== i) {
              const ni = [...el.items];
              const [removed] = ni.splice(i, 1);
              ni.splice(targetIdx, 0, removed);
              updateElement(el.id, { items: ni });
            }
          }}
          onDragMove={(e) => {
            e.cancelBubble = true; // Prevent parent drag
          }}
          dragBoundFunc={(pos) => {
            const stage = stageRef.current;
            if (!stage) return pos;
            const absX = (el.x * stage.scaleX()) + stage.x();
            return { x: absX, y: pos.y };
          }}
        >
          {/* Drag Handle */}
          <Text text="⋮⋮" x={8} y={6} fill={isSelected ? "#FF4500" : "#444"} fontSize={14} fontStyle="bold" cursor="grab" />

          <Rect name="checkbox" x={26} y={5} width={16} height={16} cornerRadius={4} stroke={item.checked ? '#22c55e' : '#fff'} strokeWidth={2} fill={item.checked ? '#22c55e' : 'transparent'}
            onClick={(e) => { e.cancelBubble = true; const ni = [...el.items]; ni[i].checked = !ni[i].checked; updateElement(el.id, { items: ni }); }}
            onTap={(e) => { e.cancelBubble = true; const ni = [...el.items]; ni[i].checked = !ni[i].checked; updateElement(el.id, { items: ni }); }}
          />
          {item.checked && <Text x={28} y={6} text="✓" fill="#fff" fontSize={13} listening={false} />}
          <Text x={50} y={5} text={item.text}
            fill={item.checked ? '#666' : '#fff'}
            textDecoration={item.checked ? 'line-through' : ''}
            fontSize={14} fontFamily="Inter"
            opacity={(editingTextId === el.id && editingItemIdx === i) ? 0 : 1}
            onClick={() => { setEditingTextId(el.id); setEditingItemIdx(i); setItemEditValue(item.text); }}
            onTap={() => { setEditingTextId(el.id); setEditingItemIdx(i); setItemEditValue(item.text); }}
          />
        </Group>
      ))}
    </Group>
  );

  return null;
});

const ColumnEditor = ({ el, stageProps, initialValue, onSave }: any) => {
  const [localTitle, setLocalTitle] = useState(() => {
    const lines = initialValue.split('\n');
    return lines[0] || '';
  });
  const [localBody, setLocalBody] = useState(() => {
    const lines = initialValue.split('\n');
    return lines.slice(1).join('\n') || '';
  });

  const screenX = el.x * stageProps.scale + stageProps.x;
  const screenY = el.y * stageProps.scale + stageProps.y;
  
  return (
    <div 
      className="absolute z-50 flex flex-col items-center" 
      style={{ left: screenX, top: screenY, width: (el.width || 350) * stageProps.scale }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          onSave(localTitle, localBody);
        }
      }}
    >
      <input
        autoFocus
        className="bg-transparent outline-none font-bold text-center w-full"
        style={{ fontSize: 16 * stageProps.scale, color: '#FFFFFF', marginTop: 16 * stageProps.scale }}
        placeholder="New Column"
        value={localTitle}
        onChange={(e) => setLocalTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSave(localTitle, localBody);
          }
        }}
      />
      <input
        className="bg-transparent outline-none text-center w-full mt-1"
        style={{ fontSize: 11 * stageProps.scale, color: '#888888' }}
        placeholder="Description..."
        value={localBody}
        onChange={(e) => setLocalBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSave(localTitle, localBody);
          }
        }}
      />
    </div>
  );
};

export default function Whiteboard({ project, elements = [], addElement, addElements, updateElement, removeElement, undo, redo, canUndo, canRedo, setView, addAsset, removeAsset, assets = [], user, updateTitle, updateProject, bringToFront, sendToBack }: any) {
  const navigate = useNavigate();
  const [tool, setTool] = useState<Tool>('select');
  const [activeColor, setActiveColor] = useState(COLORS.white);
  const [activeStrokeWidth, setActiveStrokeWidth] = useState(4);
  const [activeFontSize, setActiveFontSize] = useState(16);
  const [activeFill, setActiveFill] = useState<'none' | 'semi' | 'solid'>('none');
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<any>(null);
  const [stageProps, setStageProps] = useState({ scale: 1, x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, stageX?: number, stageY?: number, type?: 'element' | 'canvas' } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [itemEditValue, setItemEditValue] = useState<string>('');
  const [playingYoutubeId, setPlayingYoutubeId] = useState<string | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<any>(null);
  const [currentShape, setCurrentShape] = useState<any>(null);
  const [laserTrail, setLaserTrail] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [floatingColorPicker, setFloatingColorPicker] = useState<{ id: string; color: string; x: number; y: number } | null>(null);

  // --- MINIMAP CALCS ---
  const minimapSize = 180;
  const boardBounds = useMemo(() => {
    if (elements.length === 0) return { x: -1000, y: -1000, width: 2000, height: 2000 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const e of elements) {
      const ex = e.x || 0, ey = e.y || 0, ew = e.width || 100, eh = e.height || 100;
      if (ex < minX) minX = ex;
      if (ex + ew > maxX) maxX = ex + ew;
      if (ey < minY) minY = ey;
      if (ey + eh > maxY) maxY = ey + eh;
    }
    const padding = 500;
    return { x: minX - padding, y: minY - padding, width: (maxX - minX) + padding * 2, height: (maxY - minY) + padding * 2 };
  }, [elements]);

  const minimapScale = useMemo(() => Math.min(minimapSize / boardBounds.width, minimapSize / boardBounds.height), [boardBounds]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const processedAssetsRef = useRef<Set<string>>(new Set());

  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const [showDrawMenu, setShowDrawMenu] = useState(false);
  const [showStickyMenu, setShowStickyMenu] = useState(false);

  const handleSpawnElement = useCallback((type: 'sticky' | 'checklist') => {
    const stage = stageRef.current;
    if (!stage) return;
    const stageX = (window.innerWidth / 2 - stageProps.x) / stageProps.scale;
    const stageY = (window.innerHeight / 2 - stageProps.y) / stageProps.scale;
    const newId = Date.now().toString();
    let newEl: any = { id: newId, type };

    if (type === 'sticky') {
      newEl = { ...newEl, x: stageX - 100, y: stageY - 100, title: 'Title', body: '', fill: COLORS.yellow, fontSize: activeFontSize, width: 200, height: 200 };
    } else if (type === 'checklist') {
      newEl = { ...newEl, x: stageX - 150, y: stageY - 60, title: 'To Do', items: [{ text: '', checked: false }], fill: 'transparent', width: 300, height: 200 };
    }

    addElement(newEl);
    setSelectedIds([newId]);
    setTool('select');
    setShowStickyMenu(false);

    if (type === 'sticky') {
      setEditingTextId(newId);
      setEditValue(newEl.title + '\n' + newEl.body);
    } else if (type === 'checklist') {
      setEditingTextId(newId);
      setEditingItemIdx(0);
      setItemEditValue('');
    }
  }, [stageProps, activeFontSize, addElement]);

  // Laser Pointer Fade Effect (Trail)
  useEffect(() => {
    if (laserTrail.length === 0) return;
    const interval = setInterval(() => {
      setLaserTrail(prev => prev.slice(2));
    }, 40);
    return () => clearInterval(interval);
  }, [laserTrail]);

  // Global Konva Drag Buttons (Only Left Click = 0)
  useEffect(() => {
    Konva.dragButtons = [0];
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedIds.forEach((id) => {
          const el = elements.find((e: any) => e.id === id);
          removeElement(id);
          if (el && el.assetId && removeAsset) {
            removeAsset(el.assetId);
          }
        });
        setSelectedIds([]);
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            redo();
            e.preventDefault();
          } else {
            undo();
            e.preventDefault();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, elements, editingTextId, removeElement, removeAsset, undo, redo]);

  // Direct Import Support
  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: any[], event: any) => {
    // 1. External Media and Links
    if (acceptedFiles.length === 0 && event && event.dataTransfer) {
      const html = event.dataTransfer.getData('text/html');
      const uri = event.dataTransfer.getData('text/uri-list');
      
      // Check for YouTube links first
      const youtubeMatch = uri && uri.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?\s]+)/);
      if (youtubeMatch && youtubeMatch[1]) {
        const youtubeId = youtubeMatch[1];
        await addAsset({
          url: `https://www.youtube.com/watch?v=${youtubeId}`,
          youtubeId: youtubeId,
          type: 'youtube',
          width: 640,
          height: 360,
          addedBy: user?.uid,
        });
        return;
      }

      let externalUrl = null;
      let mediaType = 'image';

      if (html) {
        // 1. Aggressive search for ANY video URL (.mp4, .webm, .ogg) in the entire HTML payload
        // This catches href="...", data-video-url="...", etc.
        let videoMatch = html.match(/(https?:\/\/[^\s"'<>]+\.(?:mp4|webm|ogg)(?:\?[^\s"'<>]*)?)/i);
        
        if (videoMatch && videoMatch[1]) {
          externalUrl = videoMatch[1];
          mediaType = 'video';
        } else {
          // 2. Fallback to standard <video> or <source> src attribute just in case
          let srcMatch = html.match(/<(?:video|source).*?src=["'](.*?)["']/i);
          if (srcMatch && srcMatch[1]) {
            externalUrl = srcMatch[1];
            mediaType = 'video';
          } else {
            // 3. Ultimate fallback: look for an image
            let imgMatch = html.match(/<img.*?src=["'](.*?)["']/i);
            if (imgMatch && imgMatch[1]) {
              externalUrl = imgMatch[1];
            }
          }
        }
      }
      
      if (!externalUrl && uri && (uri.startsWith('http') || uri.startsWith('data:'))) {
        externalUrl = uri;
        if (uri.match(/\.(mp4|webm|ogg)$/i)) {
          mediaType = 'video';
        }
      }

      if (externalUrl) {
        try {
          if (mediaType === 'image') {
            const isGif = externalUrl.toLowerCase().match(/\.gif(?:\?.*)?$/) !== null;
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = externalUrl;
            
            await new Promise((resolve, reject) => {
              img.onload = () => resolve(true);
              img.onerror = () => {
                img.removeAttribute("crossOrigin");
                img.src = externalUrl as string;
                img.onload = () => resolve(true);
                img.onerror = reject;
              };
            });

            let posterUrl = undefined;
            if (isGif) {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                posterUrl = canvas.toDataURL('image/webp', 0.8);
              }
            }
            
            await addAsset({
              url: img.src,
              posterUrl,
              type: isGif ? 'gif' : 'image',
              width: img.width || 400,
              height: img.height || 300,
              addedBy: user?.uid,
            });
          } else {
            // It's a video
            const vid = document.createElement('video');
            vid.crossOrigin = "anonymous";
            vid.src = externalUrl;
            
            await new Promise((resolve, reject) => {
              vid.onloadedmetadata = () => resolve(true);
              vid.onerror = () => {
                vid.removeAttribute("crossOrigin");
                vid.src = externalUrl as string;
                vid.onloadedmetadata = () => resolve(true);
                vid.onerror = reject;
              };
            });

            // Optimização: Tentar baixar o vídeo se possível para cache local, ou usar a URL original.
            // Devido a limites de CORS e tamanho de DataURL, manteremos a URL original para vídeos externos
            // se o fetch falhar, ou baixaremos e converteremos para blob se der certo.
            let finalUrl = vid.src;
            try {
              const response = await fetch(vid.src);
              const blob = await response.blob();
              const reader = new FileReader();
              finalUrl = await new Promise((resolve) => {
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
            } catch (fetchError) {
              console.warn("Could not download video blob, using external URL directly", fetchError);
            }

            await addAsset({
              url: finalUrl,
              type: 'video',
              width: vid.videoWidth || 640,
              height: vid.videoHeight || 360,
              addedBy: user?.uid,
            });
          }
          return;
        } catch (e) {
          console.error("Failed to load dragged external media", e);
        }
      }
    }

    // 2. Local Files
    for (const file of acceptedFiles) {
      const isImage = file.type.startsWith('image/') && file.type !== 'image/gif';
      const isGif = file.type === 'image/gif';

      let fileDataUrl: string;
      let posterUrl: string | undefined = undefined;

      if (isGif) {
        // Read original animated GIF
        fileDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        // Create static WebP poster from first frame
        const compressedBlob = await compressImage(file);
        posterUrl = await blobToDataURL(compressedBlob);
      } else if (isImage) {
        const compressedBlob = await compressImage(file);
        fileDataUrl = await blobToDataURL(compressedBlob);
      } else {
        fileDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      let width = 400;
      let height = 300;

      if (isImage || isGif) {
        const img = new Image();
        img.src = posterUrl || fileDataUrl;
        await new Promise((resolve) => { img.onload = () => resolve(true); });
        width = img.width;
        height = img.height;
      } else {
        const vid = document.createElement('video');
        vid.src = fileDataUrl;
        await new Promise((resolve) => {
          vid.onloadedmetadata = () => {
            width = vid.videoWidth;
            height = vid.videoHeight;
            resolve(true);
          };
        });
      }

      await addAsset({
        url: fileDataUrl,
        posterUrl,
        type: isGif ? 'gif' : isImage ? 'image' : 'video',
        width,
        height,
        addedBy: user?.uid,
      });
    }
  }, [addAsset, user]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: { 'image/*': [], 'video/*': [] }
  });

  // Global Paste Support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (editingTextId) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        onDrop(Array.from(e.clipboardData.files), [], e);
      } else if (e.clipboardData) {
        const html = e.clipboardData.getData('text/html');
        const text = e.clipboardData.getData('text/plain');
        if (html || text) {
          const mockEvent = {
            dataTransfer: {
              getData: (type: string) => type === 'text/html' ? html : (type === 'text/uri-list' ? text : '')
            }
          };
          onDrop([], [], mockEvent);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onDrop, editingTextId]);

  // Auto-Sync Assets (Batch)
  useEffect(() => {
    if (assets.length === 0) return;
    const newAssets = assets.filter((a: any) => !elements.some((e: any) => e.assetId === a.id) && !processedAssetsRef.current.has(a.id));
    if (newAssets.length > 0) {
      const newEls: any[] = [];
      newAssets.forEach((asset: any, idx: number) => {
        processedAssetsRef.current.add(asset.id);
        const centerPos = {
          x: (window.innerWidth / 2 - stageProps.x) / stageProps.scale,
          y: (window.innerHeight / 2 - stageProps.y) / stageProps.scale
        };
        newEls.push({
          id: Date.now().toString() + Math.random().toString(36).substring(7) + idx,
          type: asset.type || 'image',
          youtubeId: asset.youtubeId,
          posterUrl: asset.posterUrl,
          assetId: asset.id,
          url: asset.url,
          x: centerPos.x + (idx * 20),
          y: centerPos.y + (idx * 20),
          width: 400,
          height: asset.height ? (400 * asset.height) / asset.width : 300,
          addedBy: user?.uid,
        });
      });
      if (newEls.length > 0) addElements(newEls);
    }
  }, [assets, elements, addElements, user, stageProps]);

  // Sync Transformer
  useEffect(() => {
    if (trRef.current && stageRef.current) {
      const nodes = selectedIds
        .map((id) => {
          const el = elements.find((e: any) => e.id === id);
          if (el && el.type === 'arrow') return null;
          return stageRef.current.findOne(`#el-${id}`);
        })
        .filter(Boolean);
      trRef.current.nodes(nodes);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedIds, elements]);

  const getRelativePointerPosition = (stage: any) => {
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = stage.getPointerPosition();
    return pos ? transform.point(pos) : null;
  };

  // --- MOUSE EVENTS ---
  const handleMouseDown = (e: any) => {
    if (contextMenu) setContextMenu(null);
    const stage = e.target.getStage();
    const pos = getRelativePointerPosition(stage);
    if (!pos) return;

    const isElement = e.target !== stage;
    const isTransformer = e.target.getParent()?.className === 'Transformer';
    const isArrowHandle = e.target.name() === 'arrow-handle';

    if (tool === 'select') {
      if (isTransformer || isArrowHandle) return;
      if (!isElement) {
        setSelectionBox({ startX: pos.x, startY: pos.y, x: pos.x, y: pos.y, width: 0, height: 0 });
        setSelectedIds([]);
      } else {
        const id = e.target.id()?.replace('el-', '') || e.target.parent?.id()?.replace('el-', '');
        if (id) {
          const el = elements.find(e => e.id === id);
          // NEW: Prevent selecting checklist on direct click (must use selection box)
          if (el?.type === 'checklist' && !selectedIds.includes(id)) {
            return;
          }
          const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
          const isSelected = selectedIds.includes(id);
          if (!metaPressed && !isSelected) setSelectedIds([id]);
          else if (metaPressed && isSelected) setSelectedIds(selectedIds.filter(i => i !== id));
          else if (metaPressed && !isSelected) setSelectedIds([...selectedIds, id]);
        }
      }
      return;
    }

    if (tool === 'eraser') {
      if (isElement) {
        const id = e.target.id()?.replace('el-', '') || e.target.parent?.id()?.replace('el-', '');
        if (id) removeElement(id);
      }
      return;
    }

    if (tool === 'pen' || tool === 'highlighter') {
      setIsDrawing(true);
      setCurrentLine({
        type: tool === 'highlighter' ? 'highlighter' : 'path',
        points: [pos.x, pos.y],
        stroke: activeColor,
        strokeWidth: tool === 'highlighter' ? 30 : activeStrokeWidth
      });
    } else if (tool === 'laser') {
      setIsDrawing(true);
      setLaserTrail([pos.x, pos.y]);
    } else if (tool === 'arrow') {
      setIsDrawing(true);
      setCurrentShape({ type: 'arrow', x: pos.x, y: pos.y, width: 0, height: 0, stroke: activeColor, strokeWidth: activeStrokeWidth, points: [pos.x, pos.y, pos.x, pos.y, pos.x, pos.y] });
    } else if (['rect', 'ellipse'].includes(tool)) {
      setIsDrawing(true);
      setCurrentShape({ type: tool, x: pos.x, y: pos.y, width: 0, height: 0, stroke: activeColor, strokeWidth: activeStrokeWidth, fill: activeFill === 'solid' ? activeColor : (activeFill === 'semi' ? activeColor + '40' : 'transparent') });
    } else if (tool === 'text' || tool === 'sticky') {
      const newEl = { id: Date.now().toString(), type: tool, x: pos.x, y: pos.y, text: '', fill: tool === 'sticky' ? COLORS.yellow : activeColor, fontSize: activeFontSize, width: 200, height: 100 };
      addElement(newEl);
      setEditingTextId(newEl.id);
      setTool('select');
    }
  };

  const handleMouseMove = (e: any) => {
    if (e.evt.buttons === 4) { // Middle mouse button pan
      setStageProps(prev => ({
        ...prev,
        x: prev.x + e.evt.movementX,
        y: prev.y + e.evt.movementY,
      }));
      return;
    }

    if (!isDrawing && !selectionBox) return;
    const stage = e.target.getStage();
    const pos = getRelativePointerPosition(stage);
    if (!pos) return;

    if (selectionBox) {
      setSelectionBox({ ...selectionBox, width: pos.x - selectionBox.startX, height: pos.y - selectionBox.startY });
    } else if (currentLine) {
      setCurrentLine({ ...currentLine, points: [...currentLine.points, pos.x, pos.y] });
    } else if (tool === 'laser' && isDrawing) {
      setLaserTrail(prev => [...prev, pos.x, pos.y].slice(-60)); // Keep a trail of 30 points
    } else if (currentShape && currentShape.type === 'arrow') {
      const cpX = currentShape.x + (pos.x - currentShape.x) / 2;
      const cpY = currentShape.y + (pos.y - currentShape.y) / 2;
      setCurrentShape({ ...currentShape, width: pos.x - currentShape.x, height: pos.y - currentShape.y, points: [currentShape.x, currentShape.y, cpX, cpY, pos.x, pos.y] });
    } else if (currentShape) {
      setCurrentShape({ ...currentShape, width: pos.x - currentShape.x, height: pos.y - currentShape.y });
    }
  };

  const handleMouseUp = (e: any) => {
    if (selectionBox) {
      const stage = e.target.getStage();
      const newSelectedIds: string[] = [];

      const boxRect = {
        x: Math.min(selectionBox.startX, selectionBox.startX + selectionBox.width) * stage.scaleX() + stage.x(),
        y: Math.min(selectionBox.startY, selectionBox.startY + selectionBox.height) * stage.scaleY() + stage.y(),
        width: Math.abs(selectionBox.width) * stage.scaleX(),
        height: Math.abs(selectionBox.height) * stage.scaleY(),
      };

      elements.forEach((el: any) => {
        const node = stage.findOne(`#el-${el.id}`);
        if (node) {
          const nodeRect = node.getClientRect();
          if (
            nodeRect.x < boxRect.x + boxRect.width &&
            nodeRect.x + nodeRect.width > boxRect.x &&
            nodeRect.y < boxRect.y + boxRect.height &&
            nodeRect.y + nodeRect.height > boxRect.y
          ) {
            newSelectedIds.push(el.id);
          }
        }
      });
      setSelectedIds(newSelectedIds);
      setSelectionBox(null);
    }
    if (currentLine) {
      addElement({ id: Date.now().toString(), type: 'path', ...currentLine });
      setCurrentLine(null);
    }
    if (currentShape) {
      addElement({ id: Date.now().toString(), ...currentShape });
      setCurrentShape(null);
    }
    setIsDrawing(false);
  };

  const handleZoom = (delta: number, centerX?: number, centerY?: number) => {
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = {
      x: centerX ?? stage.getPointerPosition()?.x ?? stage.width() / 2,
      y: centerY ?? stage.getPointerPosition()?.y ?? stage.height() / 2,
    };

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = delta > 0 ? oldScale * 1.1 : oldScale / 1.1;
    const clampedScale = Math.max(0.05, Math.min(5, newScale));

    setStageProps({
      scale: clampedScale,
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    if (e.evt.ctrlKey) {
      handleZoom(-e.evt.deltaY);
    } else {
      setStageProps(prev => ({
        ...prev,
        x: prev.x - e.evt.deltaX,
        y: prev.y - e.evt.deltaY
      }));
    }
  };

  return (
    <div
      className="absolute inset-0 bg-[#121212] overflow-hidden flex flex-col"
      ref={containerRef}
      {...getRootProps()}
      style={{
        backgroundImage: showGrid ? `radial-gradient(circle, #ffffff25 1px, transparent 1px)` : 'none',
        backgroundSize: `${48 * stageProps.scale}px ${48 * stageProps.scale}px`,
        backgroundPosition: `${stageProps.x}px ${stageProps.y}px`
      }}
    >
      <input {...getInputProps()} />
      {isDragActive && (
        <div className="absolute inset-0 z-[100] bg-[#FF4500]/20 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-[#FF4500]">
          <h2 className="text-white text-4xl font-black uppercase tracking-tighter">DROP TO IMPORT</h2>
        </div>
      )}
      <div className="absolute top-6 left-8 right-8 z-50 flex items-center justify-between pointer-events-none">
        {/* Left: Empty space where projects was */}
        <div className="w-40" />

        {/* Center: Project Title (Editable) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center pointer-events-auto">
          <input
            type="text"
            value={project?.name || ''}
            onChange={(e) => updateTitle(e.target.value)}
            className="bg-transparent border-none text-white font-black text-2xl tracking-tighter uppercase whitespace-nowrap outline-none text-center focus:text-[#FF4500] transition-colors"
            placeholder="PROJETO"
          />
        </div>

        {/* Right: Switch to Moodboard */}
        <button
          onClick={() => setView('moodboard')}
          className="pointer-events-auto bg-[#1a1a1a]/95 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 hover:border-[#FF4500]/50 hover:bg-white/5 transition-all flex items-center gap-3 text-white font-bold shadow-2xl"
        >
          <LayoutGrid className="w-5 h-5 text-white/70" />
          <span>Moodboard</span>
        </button>
      </div>

      <div className="flex-1 w-full h-full cursor-crosshair">
        <Stage
          width={window.innerWidth}
          height={window.innerHeight}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={(e) => {
            e.evt.preventDefault();
            const stage = e.target.getStage();
            const pointer = stage.getPointerPosition();
            const stageX = (pointer.x - stage.x()) / stage.scaleX();
            const stageY = (pointer.y - stage.y()) / stage.scaleY();

            const isElement = e.target !== stage;

            setContextMenu({
              x: e.evt.clientX,
              y: e.evt.clientY,
              stageX,
              stageY,
              type: (isElement || selectedIds.length > 0) ? 'element' : 'canvas'
            });
          }}
          scaleX={stageProps.scale}
          scaleY={stageProps.scale}
          x={stageProps.x}
          y={stageProps.y}
          ref={stageRef}
          draggable={tool === 'pan'}
          onDragEnd={(e) => {
            if (e.target === e.target.getStage()) {
              setStageProps({ ...stageProps, x: e.target.x(), y: e.target.y() });
            } else if (tool === 'select') {
              const id = e.target.id()?.replace('el-', '') || e.target.parent?.id()?.replace('el-', '');
              if (id) {
                const el = elements.find((e: any) => e.id === id);
                if (!el) return;
                
                const snap = (v: number) => snapToGrid ? Math.round(v / 20) * 20 : v;
                const newX = snap(e.target.x());
                const newY = snap(e.target.y());
                const dx = newX - el.x;
                const dy = newY - el.y;

                if (el.type === 'column') {
                  // Move column
                  updateElement(id, { x: newX, y: newY });
                  // Move all children
                  elements.forEach((child: any) => {
                    if (child.parentId === id) {
                      updateElement(child.id, { x: child.x + dx, y: child.y + dy }, true);
                    }
                  });
                } else {
                  // Find if dropped inside a column
                  let newParentId = null;
                  let finalX = newX;
                  let finalY = newY;
                  
                  const centerX = newX + (el.width || 0) / 2;
                  const centerY = newY + (el.height || 0) / 2;
                  
                  const columns = elements.filter((e: any) => e.type === 'column' && e.id !== id);
                  for (const col of columns) {
                    if (
                      centerX >= col.x && 
                      centerX <= col.x + (col.width || 350) &&
                      centerY >= col.y && 
                      centerY <= col.y + (col.height || 100)
                    ) {
                      newParentId = col.id;
                      
                      // Auto-snap logic (Organizar em Pilha behavior)
                      const children = elements.filter((e: any) => e.parentId === col.id && e.id !== id);
                      let currentY = col.y + 110; // increased space for longer descriptions
                      const marginX = 20;
                      const spacing = 20;
                      const colWidth = col.width || 350;

                      children.forEach((child: any) => {
                        currentY += (child.height || 100) + spacing;
                      });

                      const w = el.width || 100;
                      const h = el.height || 100;
                      const ratio = h / w;
                      const newWidth = colWidth - marginX * 2;
                      const newHeight = newWidth * ratio;
                      
                      finalX = col.x + marginX;
                      finalY = currentY;
                      
                      const itemBottom = finalY + newHeight;
                      updateElement(col.id, { height: itemBottom - col.y + spacing }, true);
                      
                      updateElement(id, { x: finalX, y: finalY, width: newWidth, height: newHeight, parentId: newParentId });
                      break;
                    }
                  }
                  
                  if (!newParentId) {
                    updateElement(id, { x: newX, y: newY, parentId: null });
                  }
                }

                // Update connected arrows
                elements.forEach((arrow: any) => {
                  if (arrow.type === 'arrow' && (arrow.startId === id || arrow.endId === id)) {
                    const pts = [...(arrow.points || [])];
                    if (arrow.startId === id) { pts[0] = newX + (el?.width || 0) / 2; pts[1] = newY + (el?.height || 0) / 2; }
                    if (arrow.endId === id) { pts[4] = newX + (el?.width || 0) / 2; pts[5] = newY + (el?.height || 0) / 2; }
                    updateElement(arrow.id, { points: pts }, true);
                  }
                });
              }
            }
          }}
        >
          <Layer>
            {(() => {
              const sorted = [...elements].sort((a: any, b: any) => {
                if (a.type === 'column' && b.type !== 'column') return -1;
                if (a.type !== 'column' && b.type === 'column') return 1;
                return 0;
              });
              return sorted;
            })().map((el: any) => {
              const isSelected = selectedIds.includes(el.id);
              const dragProps = {
                draggable: tool === 'select' && !el.locked,
                onDragStart: () => {
                  if (tool === 'select' && !isSelected) {
                    setSelectedIds([el.id]);
                  }
                }
              };

              const editableProps = {
                onDblClick: () => {
                  if (['text', 'sticky', 'column'].includes(el.type)) {
                    setEditingTextId(el.id);
                    setEditValue(['sticky', 'column'].includes(el.type) ? (el.title || '') + '\n' + (el.body || '') : el.text);
                  }
                },
                onDblTap: () => {
                  if (['text', 'sticky', 'column'].includes(el.type)) {
                    setEditingTextId(el.id);
                    setEditValue(['sticky', 'column'].includes(el.type) ? (el.title || '') + '\n' + (el.body || '') : el.text);
                  }
                },
              };

              if (el.type === 'path') return <Line key={el.id} id={`el-${el.id}`} points={el.points} stroke={el.stroke} strokeWidth={el.strokeWidth} tension={0.5} lineCap="round" lineJoin="round" {...dragProps} />;
              if (el.type === 'highlighter') return <Line key={el.id} id={`el-${el.id}`} points={el.points} stroke={el.stroke} strokeWidth={el.strokeWidth || 30} tension={0.5} lineCap="square" lineJoin="round" opacity={0.4} {...dragProps} />;

              return (
                <WhiteboardElement
                  key={el.id}
                  el={el}
                  elements={elements}
                  isSelected={isSelected}
                  tool={tool}
                  dragProps={dragProps}
                  editableProps={editableProps}
                  editingTextId={editingTextId}
                  editingItemIdx={editingItemIdx}
                  setEditingTextId={setEditingTextId}
                  setEditValue={setEditValue}
                  setEditingItemIdx={setEditingItemIdx}
                  setItemEditValue={setItemEditValue}
                  setPlayingYoutubeId={setPlayingYoutubeId}
                  updateElement={updateElement}
                  stageProps={stageProps}
                  stageRef={stageRef}
                  onOpenColorPicker={(id: string, color: string, x: number, y: number) => setFloatingColorPicker({ id, color, x, y })}
                />
              );
            })}

            {currentLine && currentLine.type === 'path' && <Line points={currentLine.points} stroke={currentLine.stroke} strokeWidth={currentLine.strokeWidth} tension={0.5} lineCap="round" lineJoin="round" />}
            {currentLine && currentLine.type === 'highlighter' && <Line points={currentLine.points} stroke={currentLine.stroke} strokeWidth={currentLine.strokeWidth} tension={0.5} lineCap="square" lineJoin="round" opacity={0.4} />}
            {currentShape && currentShape.type === 'rect' && <Rect x={currentShape.x} y={currentShape.y} width={currentShape.width} height={currentShape.height} fill={currentShape.fill} stroke={currentShape.stroke} strokeWidth={currentShape.strokeWidth} cornerRadius={8} />}
            {currentShape && currentShape.type === 'ellipse' && <Circle x={currentShape.x} y={currentShape.y} radius={Math.abs(currentShape.width) / 2} fill={currentShape.fill} stroke={currentShape.stroke} strokeWidth={currentShape.strokeWidth} />}
            {currentShape && currentShape.type === 'arrow' && <Arrow points={currentShape.points} fill={currentShape.stroke} stroke={currentShape.stroke} strokeWidth={currentShape.strokeWidth || 4} pointerLength={(currentShape.strokeWidth || 4) * 3} pointerWidth={(currentShape.strokeWidth || 4) * 3} tension={0.5} />}

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

            {/* Laser Trail Rendering */}
            {laserTrail.length > 2 && (
              <Line
                points={laserTrail}
                stroke="#FF4500"
                strokeWidth={4}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                shadowColor="#FF4500"
                shadowBlur={15}
                opacity={0.8}
              />
            )}

            {tool === 'select' && (
              <Transformer
                ref={trRef}
                keepRatio={selectedIds.some(id => {
                  const el = elements.find((e: any) => e.id === id);
                  return el && ['image', 'video'].includes(el.type);
                })}
                enabledAnchors={selectedIds.some(id => elements.find(e => e.id === id)?.locked) ? [] : ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'middle-left', 'middle-right']}
                boundBoxFunc={(oldBox, newBox) => {
                  // Minimum size constraint (Miro style)
                  const minSize = 60;
                  if (Math.abs(newBox.width) < minSize || Math.abs(newBox.height) < minSize) return oldBox;
                  return newBox;
                }}
                onTransform={() => {
                  trRef.current.nodes().forEach((n: any) => {
                    const idAttr = n.id() || n.attrs.id;
                    const id = idAttr?.replace('el-', '') || n.parent?.id()?.replace('el-', '');

                    const scaleX = n.scaleX();
                    const scaleY = n.scaleY();
                    const newW = Math.max(60, n.width() * scaleX);
                    const newH = Math.max(60, n.height() * scaleY);

                    // Reset scale and apply dimensions directly
                    n.scaleX(1); n.scaleY(1);
                    n.width(newW); n.height(newH);

                    // Update Konva children visuals
                    n.find('.background-rect').forEach((r: any) => { r.width(newW); r.height(newH); });
                    n.find('.corner-fold').forEach((r: any) => { r.x(newW - 20); r.y(newH - 20); });
                    n.find('Text').forEach((t: any) => {
                      const xOffset = t.x();
                      t.width(Math.max(10, newW - xOffset - 20));
                    });

                    // Sync to React state (skipHistory=true to avoid flooding undo stack)
                    if (id) {
                      updateElement(id, { x: n.x(), y: n.y(), width: newW, height: newH }, true);
                    }
                  });
                }}
                onTransformEnd={() => {
                  trRef.current.nodes().forEach((n: any) => {
                    const idAttr = n.id() || n.attrs.id;
                    const id = idAttr?.replace('el-', '') || n.parent?.id()?.replace('el-', '');
                    if (id) {
                      const snap = (v: number) => snapToGrid ? Math.round(v / 20) * 20 : v;
                      const finalX = snap(n.x());
                      const finalY = snap(n.y());
                      const finalW = snap(n.width());
                      const finalH = snap(n.height());

                      updateElement(id, {
                        x: finalX, y: finalY,
                        width: finalW, height: finalH,
                        rotation: n.rotation(),
                        scaleX: 1, scaleY: 1
                      });

                      // Reflow children if this is a column
                      const el = elements.find((e: any) => e.id === id);
                      if (el?.type === 'column') {
                        const children = elements.filter((e: any) => e.parentId === id);
                        if (children.length > 0) {
                          const marginX = 20;
                          const spacing = 20;
                          let currentY = finalY + 110;

                          children.forEach((child: any) => {
                            const w = child.width || 100;
                            const h = child.height || 100;
                            const ratio = h / w;
                            const newWidth = finalW - marginX * 2;
                            const newHeight = newWidth * ratio;

                            updateElement(child.id, {
                              x: finalX + marginX,
                              y: currentY,
                              width: newWidth,
                              height: newHeight
                            }, true);
                            currentY += newHeight + spacing;
                          });

                          // Adjust column height to fit children
                          const totalH = currentY - finalY;
                          if (totalH > finalH) {
                            updateElement(id, { height: totalH }, true);
                          }
                        }
                      }
                    }
                  });
                }}
              />
            )}
          </Layer>
        </Stage>
      </div>

      {/* HTML Overlays (Text/Sticky/Checklist Editing) */}
      {editingTextId && (() => {
        const el = elements.find((e: any) => e.id === editingTextId);
        if (!el) return null;
        const screenX = el.x * stageProps.scale + stageProps.x;
        const screenY = el.y * stageProps.scale + stageProps.y;

        // --- Checklist: editing title (editingItemIdx === -1) ---
        if (el.type === 'checklist' && editingItemIdx === -1) {
          return (
            <input
              autoFocus
              className="absolute z-50 bg-transparent outline-none text-white font-bold"
              style={{
                left: screenX + 16 * stageProps.scale,
                top: screenY + 10 * stageProps.scale,
                fontSize: 18 * stageProps.scale,
                width: (el.width || 300) * stageProps.scale - 32 * stageProps.scale,
              }}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => { updateElement(editingTextId, { title: editValue }); setEditingTextId(null); setEditingItemIdx(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); updateElement(editingTextId, { title: editValue }); setEditingTextId(null); setEditingItemIdx(null); } }}
            />
          );
        }

        // --- Checklist: editing a specific item ---
        if (el.type === 'checklist' && editingItemIdx !== null && editingItemIdx >= 0) {
          const itemY = screenY + (46 + editingItemIdx * 28 + 2) * stageProps.scale;
          return (
            <>
              <input
                autoFocus
                className="absolute z-50 bg-transparent outline-none text-white"
                style={{
                  left: screenX + 40 * stageProps.scale,
                  top: itemY,
                  fontSize: 14 * stageProps.scale,
                  width: (el.width || 300) * stageProps.scale - 80 * stageProps.scale,
                }}
                value={itemEditValue}
                onChange={(e) => setItemEditValue(e.target.value)}
                onBlur={() => {
                  const ni = [...(el.items || [])];
                  if (itemEditValue.trim() === '') { ni.splice(editingItemIdx, 1); } else { ni[editingItemIdx] = { ...ni[editingItemIdx], text: itemEditValue }; }
                  updateElement(editingTextId, { items: ni });
                  setEditingTextId(null); setEditingItemIdx(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const ni = [...(el.items || [])];
                    ni[editingItemIdx] = { ...ni[editingItemIdx], text: itemEditValue };
                    const newItem = { text: '', checked: false };
                    ni.splice(editingItemIdx + 1, 0, newItem);
                    updateElement(editingTextId, { items: ni });
                    setEditingItemIdx(editingItemIdx + 1);
                    setItemEditValue('');
                  }
                }}
              />
            </>
          );
        }

        // --- Sticky: separate title + body ---
        if (el.type === 'sticky') {
          const lines = editValue.split('\n');
          const titleVal = lines[0] || '';
          const bodyVal = lines.slice(1).join('\n');
          return (
            <div className="absolute z-50 flex flex-col" style={{ left: screenX + 12 * stageProps.scale, top: screenY + 12 * stageProps.scale, width: (el.width || 200) * stageProps.scale - 24 * stageProps.scale }}>
              <input
                autoFocus
                className="bg-transparent outline-none font-bold"
                style={{ fontSize: ((el.fontSize || 16) + 4) * stageProps.scale, color: '#1a1a1a' }}
                placeholder="Title"
                value={titleVal}
                onChange={(e) => setEditValue(e.target.value.toUpperCase() + '\n' + bodyVal)}
              />
              <textarea
                className="bg-transparent outline-none resize-none mt-1"
                style={{ fontSize: (el.fontSize || 14) * stageProps.scale, height: (el.height || 200) * stageProps.scale - 56 * stageProps.scale, color: '#333' }}
                placeholder="Notes..."
                value={bodyVal}
                onChange={(e) => setEditValue(titleVal + '\n' + e.target.value)}
                onBlur={() => {
                  const finalLines = editValue.split('\n');
                  updateElement(editingTextId, { title: finalLines[0] || '', body: finalLines.slice(1).join('\n') });
                  setEditingTextId(null);
                }}
              />
            </div>
          );
        }
        // --- Column: editing title and body ---
        if (el.type === 'column') {
          return <ColumnEditor key={el.id} el={el} stageProps={stageProps} initialValue={editValue} 
            onSave={(titleVal: string, bodyVal: string) => {
              updateElement(editingTextId, { title: titleVal, body: bodyVal });
              setEditingTextId(null);
            }} 
          />;
        }

        // --- Default: plain text ---
        return (
          <textarea
            autoFocus
            className="absolute z-50 bg-transparent outline-none resize-none text-white"
            style={{ left: screenX, top: screenY, fontSize: (el.fontSize || 16) * stageProps.scale, width: el.width ? el.width * stageProps.scale : 300, height: el.height ? el.height * stageProps.scale : 100, color: el.fill }}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => { updateElement(editingTextId, { text: editValue }); setEditingTextId(null); }}
          />
        );
      })()}

      {/* YouTube Player Overlay */}
      {playingYoutubeId && (() => {
        const el = elements.find((e: any) => e.id === playingYoutubeId);
        if (!el || el.type !== 'youtube') return null;
        const screenX = el.x * stageProps.scale + stageProps.x;
        const screenY = el.y * stageProps.scale + stageProps.y;
        const w = (el.width || 640) * stageProps.scale;
        const h = (el.height || 360) * stageProps.scale;
        return (
          <div 
            className="absolute z-[100] shadow-2xl rounded-xl overflow-hidden bg-black flex flex-col"
            style={{ left: screenX, top: screenY, width: w, height: h }}
          >
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              <button 
                onClick={() => setPlayingYoutubeId(null)}
                className="bg-black/60 hover:bg-red-500 text-white rounded-full p-2 backdrop-blur-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <iframe 
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${el.youtubeId}?autoplay=1&rel=0`} 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          </div>
        );
      })()}

      {/* Bottom Main Toolbar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex bg-[#1a1a1a]/95 backdrop-blur-xl rounded-2xl border border-white/10 p-2 shadow-2xl gap-1 items-center">
        <button
          onClick={() => navigate('/')}
          className="p-3 rounded-xl text-[#00A1FF] hover:bg-[#00A1FF]/10 transition-all flex items-center justify-center mr-1"
          title="PÁGINA INICIAL"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-px h-8 bg-white/10 mr-1" />
        {[
          { id: 'select', icon: MousePointer2, label: 'SELECT' },
          { id: 'pan', icon: Hand, label: 'PAN' },
          { id: 'draw', icon: Pen, label: 'DRAW' },
          { id: 'shapes', icon: Square, label: 'SHAPES' },
          { id: 'arrow', icon: ArrowRight, label: 'ARROW' },
          { id: 'text', icon: Type, label: 'TEXT' },
          { id: 'sticky', icon: StickyNote, label: 'STICKY' },
          { id: 'column', icon: LayoutGrid, label: 'COLUMN' },
          { id: 'color', icon: Pipette, label: 'COLOR PALETTE' },
        ].map((t) => (
          <div key={t.id} className="relative">
            <button
              onClick={() => {
                if (t.id === 'shapes') {
                  setShowShapesMenu(!showShapesMenu);
                  setShowDrawMenu(false); setShowStickyMenu(false);
                  if (tool !== 'rect' && tool !== 'ellipse') setTool('rect');
                } else if (t.id === 'draw') {
                  setShowDrawMenu(!showDrawMenu);
                  setShowShapesMenu(false); setShowStickyMenu(false);
                  if (!['pen', 'highlighter', 'laser', 'eraser'].includes(tool)) setTool('pen');
                } else if (t.id === 'sticky') {
                  setShowStickyMenu(!showStickyMenu);
                  setShowShapesMenu(false); setShowDrawMenu(false);
                } else if (t.id === 'color') {
                  setShowShapesMenu(false); setShowDrawMenu(false); setShowStickyMenu(false);
                  
                  const handleColorPicked = async (hex: string) => {
                    const stageX = (window.innerWidth / 2 - stageProps.x) / stageProps.scale;
                    const stageY = (window.innerHeight / 2 - stageProps.y) / stageProps.scale;
                    try {
                      const res = await fetch(`https://www.thecolorapi.com/id?hex=${hex.replace('#', '')}`);
                      const data = await res.json();
                      addElement({ id: Date.now().toString(), type: 'color', x: stageX - 60, y: stageY - 70, fill: hex, title: data.name.value, width: 120, height: 140 });
                    } catch (e) {
                      addElement({ id: Date.now().toString(), type: 'color', x: stageX - 60, y: stageY - 70, fill: hex, title: 'Color', width: 120, height: 140 });
                    }
                  };

                  if (!(window as any).EyeDropper) {
                    const input = document.createElement('input');
                    input.type = 'color';
                    input.oninput = (e: any) => handleColorPicked(e.target.value);
                    input.click();
                    return;
                  }
                  
                  const eyeDropper = new (window as any).EyeDropper();
                  eyeDropper.open()
                    .then((result: any) => handleColorPicked(result.sRGBHex))
                    .catch((e: any) => console.log("User canceled eyedropper"));

                } else if (['arrow', 'text', 'column'].includes(t.id)) {
                  setShowShapesMenu(false); setShowDrawMenu(false); setShowStickyMenu(false);
                  const stageX = (window.innerWidth / 2 - stageProps.x) / stageProps.scale;
                  const stageY = (window.innerHeight / 2 - stageProps.y) / stageProps.scale;
                  const newId = Date.now().toString();
                  let newEl: any = { id: newId, type: t.id };

                  if (t.id === 'arrow') {
                    newEl = { ...newEl, stroke: activeColor, strokeWidth: activeStrokeWidth, points: [stageX - 100, stageY + 50, stageX, stageY - 50, stageX + 100, stageY + 50] };
                  } else if (t.id === 'text') {
                    newEl = { ...newEl, x: stageX - 100, y: stageY - 20, text: 'New Text', fill: activeColor, fontSize: activeFontSize, width: 200, height: 40 };
                  } else if (t.id === 'column') {
                    newEl = { ...newEl, x: stageX - 175, y: stageY - 50, title: 'New Column', body: '', width: 350, height: 100 };
                  }

                  addElement(newEl);
                  setSelectedIds([newId]);
                  setTool('select');

                  if (t.id === 'text') {
                    setEditingTextId(newId);
                    setEditValue(newEl.text);
                  }
                } else {
                  setTool(t.id as Tool);
                  setShowShapesMenu(false); setShowDrawMenu(false); setShowStickyMenu(false);
                }
              }}
              className={`p-3 rounded-xl transition-all ${(tool === t.id || 
                (t.id === 'shapes' && (tool === 'rect' || tool === 'ellipse')) ||
                (t.id === 'draw' && (tool === 'pen' || tool === 'highlighter' || tool === 'laser' || tool === 'eraser')) ||
                (t.id === 'sticky' && false) // sticky isn't a tool
                )
                ? 'bg-[#FF4500]/20 text-[#FF4500]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              title={t.label}
            >
              {t.id === 'shapes' && tool === 'ellipse' ? <CircleIcon className="w-5 h-5" /> :
               t.id === 'draw' && tool === 'highlighter' ? <Palette className="w-5 h-5" /> :
               t.id === 'draw' && tool === 'laser' ? <Zap className="w-5 h-5" /> :
               t.id === 'draw' && tool === 'eraser' ? <Eraser className="w-5 h-5" /> :
               <t.icon className="w-5 h-5" />}
            </button>

            {t.id === 'shapes' && showShapesMenu && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1a1a1a]/95 backdrop-blur-xl rounded-xl border border-white/10 p-2 flex gap-1 shadow-2xl">
                <button onClick={() => { setTool('rect'); setShowShapesMenu(false); }} className={`p-2 rounded-lg ${tool === 'rect' ? 'bg-[#FF4500]/20 text-[#FF4500]' : 'text-white/60 hover:bg-white/5'}`}><Square className="w-5 h-5" /></button>
                <button onClick={() => { setTool('ellipse'); setShowShapesMenu(false); }} className={`p-2 rounded-lg ${tool === 'ellipse' ? 'bg-[#FF4500]/20 text-[#FF4500]' : 'text-white/60 hover:bg-white/5'}`}><CircleIcon className="w-5 h-5" /></button>
              </div>
            )}
            {t.id === 'draw' && showDrawMenu && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1a1a1a]/95 backdrop-blur-xl rounded-xl border border-white/10 p-2 flex gap-1 shadow-2xl">
                <button onClick={() => { setTool('pen'); setShowDrawMenu(false); }} className={`p-2 rounded-lg ${tool === 'pen' ? 'bg-[#FF4500]/20 text-[#FF4500]' : 'text-white/60 hover:bg-white/5'}`}><Pen className="w-5 h-5" /></button>
                <button onClick={() => { setTool('highlighter'); setShowDrawMenu(false); }} className={`p-2 rounded-lg ${tool === 'highlighter' ? 'bg-[#FF4500]/20 text-[#FF4500]' : 'text-white/60 hover:bg-white/5'}`}><Palette className="w-5 h-5" /></button>
                <button onClick={() => { setTool('laser'); setShowDrawMenu(false); }} className={`p-2 rounded-lg ${tool === 'laser' ? 'bg-[#FF4500]/20 text-[#FF4500]' : 'text-white/60 hover:bg-white/5'}`}><Zap className="w-5 h-5" /></button>
                <button onClick={() => { setTool('eraser'); setShowDrawMenu(false); }} className={`p-2 rounded-lg ${tool === 'eraser' ? 'bg-[#FF4500]/20 text-[#FF4500]' : 'text-white/60 hover:bg-white/5'}`}><Eraser className="w-5 h-5" /></button>
              </div>
            )}
            {t.id === 'sticky' && showStickyMenu && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1a1a1a]/95 backdrop-blur-xl rounded-xl border border-white/10 p-2 flex gap-1 shadow-2xl">
                <button onClick={() => handleSpawnElement('sticky')} className={`p-2 rounded-lg text-white/60 hover:bg-white/5`}><StickyNote className="w-5 h-5" /></button>
                <button onClick={() => handleSpawnElement('checklist')} className={`p-2 rounded-lg text-white/60 hover:bg-white/5`}><CheckSquare className="w-5 h-5" /></button>
              </div>
            )}
          </div>
        ))}

        <div className="w-px h-8 bg-white/10 mx-1" />

        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-3 rounded-xl transition-all ${canUndo ? 'text-white/60 hover:text-white hover:bg-white/5' : 'text-white/20 cursor-not-allowed'}`}
          title="DESFAZER (CTRL+Z)"
        >
          <Undo2 className="w-5 h-5" />
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-3 rounded-xl transition-all ${canRedo ? 'text-white/60 hover:text-white hover:bg-white/5' : 'text-white/20 cursor-not-allowed'}`}
          title="REFAZER (CTRL+SHIFT+Z)"
        >
          <Redo2 className="w-5 h-5" />
        </button>
      </div>

      {/* Contextual Floating Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (() => {
          const els = elements.filter(el => selectedIds.includes(el.id));
          if (els.length === 0) return null;

          let minX = Infinity;
          let maxX = -Infinity;
          let minY = Infinity;

          els.forEach(el => {
            if (['arrow', 'path'].includes(el.type) && el.points) {
              const xs = el.points.filter((_: any, i: number) => i % 2 === 0);
              const ys = el.points.filter((_: any, i: number) => i % 2 === 1);
              minX = Math.min(minX, ...xs);
              maxX = Math.max(maxX, ...xs);
              minY = Math.min(minY, ...ys);
            } else {
              minX = Math.min(minX, el.x || 0);
              maxX = Math.max(maxX, (el.x || 0) + (el.width || 0));
              minY = Math.min(minY, el.y || 0);
            }
          });

          const centerX = (minX + maxX) / 2;
          const menuLeft = centerX * stageProps.scale + stageProps.x;
          const menuTop = minY * stageProps.scale + stageProps.y - 60;

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2, ease: "easeInOut" } }}
              transition={{
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1]
              }}
              style={{ left: menuLeft, top: menuTop }}
              className="fixed -translate-x-1/2 z-50 bg-[#f8f9fa] rounded-xl border border-black/5 p-1 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-1 min-h-[48px]"
            >
              {/* Contextual Sections */}
              {(() => {
                const firstEl = elements.find(el => el.id === selectedIds[0]);
                const allSameType = selectedIds.every(id => elements.find(el => el.id === id)?.type === firstEl?.type);

                if (!allSameType) return <div className="px-3 text-[10px] font-bold text-gray-400 uppercase">Multiple Selection</div>;

                if (['text', 'sticky', 'checklist'].includes(firstEl?.type)) {
                  return (
                    <div className="flex items-center gap-1 px-1 border-r border-gray-200">
                      <div className="flex items-center bg-gray-100 rounded-lg px-2 mr-1">
                        <input
                          type="number" value={activeFontSize}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 8;
                            setActiveFontSize(val);
                            selectedIds.forEach(id => updateElement(id, { fontSize: val }));
                          }}
                          className="w-10 bg-transparent border-none text-[13px] font-bold text-gray-700 outline-none py-1"
                        />
                      </div>
                      <button
                        onClick={() => {
                          selectedIds.forEach(id => {
                            const el = elements.find(e => e.id === id);
                            updateElement(id, { fontStyle: el.fontStyle === 'bold' ? 'normal' : 'bold' });
                          });
                        }}
                        className={`p-2 rounded-lg transition-colors font-bold ${firstEl.fontStyle === 'bold' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                      >
                        B
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                        onClick={() => {
                          selectedIds.forEach(id => {
                            const el = elements.find(e => e.id === id);
                            updateElement(id, { textDecoration: el.textDecoration === 'underline' ? '' : 'underline' });
                          });
                        }}
                      >
                        <Underline className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1 px-1">
                        {['#000000', '#FF4500', '#00A1FF', '#22c55e'].map(c => (
                          <button
                            key={c}
                            onClick={() => selectedIds.forEach(id => updateElement(id, { fill: c }))}
                            className="w-4 h-4 rounded-full border border-black/5"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                }

                if (['rect', 'ellipse', 'path', 'arrow', 'highlighter'].includes(firstEl?.type)) {
                  return (
                    <div className="flex items-center gap-1 px-1 border-r border-gray-200">
                      <div className="flex items-center gap-1 px-1">
                        {Object.values(COLORS).slice(0, 5).map(c => (
                          <button
                            key={c}
                            onClick={() => selectedIds.forEach(id => updateElement(id, { fill: c, stroke: c }))}
                            className="w-5 h-5 rounded-full border border-black/5"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <div className="w-px h-6 bg-gray-200 mx-1" />
                      
                      <button
                        onClick={() => {
                          selectedIds.forEach(id => {
                            const el = elements.find(e => e.id === id);
                            const current = el.strokeWidth || 4;
                            const next = current === 4 ? 8 : current === 8 ? 16 : 4;
                            updateElement(id, { strokeWidth: next });
                          });
                        }}
                        className="p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-600 flex flex-col justify-center items-center h-8 w-8"
                        title="Espessura"
                      >
                         <div className="w-4 bg-gray-600 rounded-full" style={{ height: firstEl.strokeWidth === 16 ? '6px' : firstEl.strokeWidth === 8 ? '4px' : '2px' }} />
                      </button>

                      <button
                        onClick={() => {
                          selectedIds.forEach(id => {
                            const el = elements.find(e => e.id === id);
                            updateElement(id, { dashStyle: el.dashStyle === 'dashed' ? 'solid' : 'dashed' });
                          });
                        }}
                        className={`p-2 rounded-lg transition-colors ${firstEl.dashStyle === 'dashed' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                        title="Estilo da Linha"
                      >
                        <div className={`w-4 h-0.5 ${firstEl.dashStyle === 'dashed' ? 'bg-white' : 'bg-gray-400'} border-b border-dashed border-white`} />
                      </button>

                      {firstEl?.type === 'arrow' && (
                        <>
                          <div className="w-px h-6 bg-gray-200 mx-1" />
                          <button
                            onClick={() => {
                              selectedIds.forEach(id => {
                                const el = elements.find(e => e.id === id);
                                const current = el.arrowHead || 'end';
                                const next = current === 'end' ? 'both' : current === 'both' ? 'none' : current === 'none' ? 'start' : 'end';
                                updateElement(id, { arrowHead: next });
                              });
                            }}
                            className={`p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-600 flex items-center justify-center h-8 w-8`}
                            title="Pontas da Seta"
                          >
                            {(firstEl.arrowHead || 'end') === 'end' && <ArrowRight className="w-4 h-4" />}
                            {firstEl.arrowHead === 'start' && <ArrowRight className="w-4 h-4 rotate-180" />}
                            {firstEl.arrowHead === 'both' && <ArrowLeftRight className="w-4 h-4" />}
                            {firstEl.arrowHead === 'none' && <Minus className="w-4 h-4" />}
                          </button>
                        </>
                      )}
                    </div>
                  );
                }

                if (['image', 'video'].includes(firstEl?.type)) {
                  return (
                    <div className="flex items-center gap-1 px-1 border-r border-gray-200">
                      <button
                        onClick={() => open()}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 flex items-center gap-2 text-[12px] font-bold"
                      >
                        <RefreshCw className="w-4 h-4" /> REPLACE
                      </button>
                    </div>
                  );
                }
              })()}

              {/* Common Actions */}
              <div className="flex items-center gap-1 px-1">
                <button
                  onClick={() => {
                    selectedIds.forEach(id => updateElement(id, { locked: !elements.find(e => e.id === id)?.locked }));
                  }}
                  className={`p-2 rounded-lg transition-colors ${selectedIds.some(id => elements.find(e => e.id === id)?.locked) ? 'text-[#00A1FF] bg-[#00A1FF]/10' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {selectedIds.some(id => elements.find(e => e.id === id)?.locked) ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    selectedIds.forEach(id => removeElement(id));
                    setSelectedIds([]);
                  }}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <button
                  onClick={(e) => {
                    setContextMenu({ x: e.clientX, y: e.clientY, type: 'element' });
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[999] bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl w-60 py-2 flex flex-col text-[13px] text-white/90"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.type === 'element' ? (
              <>
                <button className="px-4 py-2 hover:bg-white/5 text-left flex items-center gap-3 font-bold text-[11px] tracking-wider uppercase opacity-50 cursor-not-allowed">
                  <Copy className="w-4 h-4" /> COPIAR
                </button>
                <button
                  onClick={() => { bringToFront(selectedIds); setContextMenu(null); }}
                  className="px-4 py-2 hover:bg-white/5 text-left flex items-center gap-3 font-bold text-[11px] tracking-wider uppercase"
                >
                  <ArrowUpSquare className="w-4 h-4" /> TRAZER PARA FRENTE
                </button>
                <button
                  onClick={() => { sendToBack(selectedIds); setContextMenu(null); }}
                  className="px-4 py-2 hover:bg-white/5 text-left flex items-center gap-3 font-bold text-[11px] tracking-wider uppercase"
                >
                  <ArrowDownSquare className="w-4 h-4" /> ENVIAR PARA TRÁS
                </button>

                {selectedIds.length > 1 && (
                  <>
                    <div className="h-px bg-white/5 my-1 mx-2" />
                    <button
                      onClick={() => {
                        const selectedEls = elements.filter(el => selectedIds.includes(el.id));
                        const startX = Math.min(...selectedEls.map(el => el.x));
                        const startY = Math.min(...selectedEls.map(el => el.y));
                        const cols = Math.ceil(Math.sqrt(selectedEls.length));
                        const spacing = 40;
                        const cellW = Math.max(...selectedEls.map(el => el.width || 200)) + spacing;
                        const cellH = Math.max(...selectedEls.map(el => el.height || 200)) + spacing;

                        selectedEls.forEach((el, i) => {
                          const row = Math.floor(i / cols);
                          const col = i % cols;
                          updateElement(el.id, { x: startX + col * cellW, y: startY + row * cellH });
                        });
                        setContextMenu(null);
                      }}
                      className="px-4 py-2 hover:bg-[#FF4500]/10 hover:text-[#FF4500] text-left flex items-center gap-3 font-bold text-[11px] tracking-wider uppercase"
                    >
                      <LayoutGrid className="w-4 h-4" /> ORGANIZAR EM GRID
                    </button>
                  </>
                )}

                {selectedIds.length === 1 && elements.find((el: any) => el.id === selectedIds[0])?.type === 'column' && (
                  <>
                    <div className="h-px bg-white/5 my-1 mx-2" />
                    <button
                      onClick={() => {
                        const colEl = elements.find((el: any) => el.id === selectedIds[0]);
                        const children = elements.filter((el: any) => el.parentId === colEl.id);
                        if (children.length === 0) return;
                        
                        let currentY = colEl.y + 110; // increased space for longer descriptions
                        const marginX = 20;
                        const spacing = 20;
                        const colWidth = colEl.width || 350;

                        children.forEach((child: any) => {
                          const w = child.width || 100;
                          const h = child.height || 100;
                          const ratio = h / w;
                          const newWidth = colWidth - marginX * 2;
                          const newHeight = newWidth * ratio;
                          
                          updateElement(child.id, { x: colEl.x + marginX, y: currentY, width: newWidth, height: newHeight }, true);
                          currentY += newHeight + spacing;
                        });
                        
                        updateElement(colEl.id, { height: currentY - colEl.y });
                        setContextMenu(null);
                      }}
                      className="px-4 py-2 hover:bg-[#FF4500]/10 hover:text-[#FF4500] text-left flex items-center gap-3 font-bold text-[11px] tracking-wider uppercase"
                    >
                      <LayoutGrid className="w-4 h-4" /> ORGANIZAR EM PILHA
                    </button>
                    <button
                      onClick={() => {
                        const colEl = elements.find((el: any) => el.id === selectedIds[0]);
                        const children = elements.filter((el: any) => el.parentId === colEl.id);
                        if (children.length === 0) return;
                        
                        let currentY = colEl.y + 110; // increased space for longer descriptions
                        const marginX = 20;
                        const spacing = 20;
                        const colWidth = colEl.width || 350;
                        const usableWidth = colWidth - marginX * 2 - spacing;
                        const cols = 2;
                        const cellWidth = usableWidth / cols;
                        
                        let maxRowHeight = 0;
                        
                        children.forEach((child: any, i: number) => {
                          const col = i % cols;
                          if (col === 0 && i !== 0) {
                            currentY += maxRowHeight + spacing;
                            maxRowHeight = 0;
                          }
                          const w = child.width || 100;
                          const h = child.height || 100;
                          const ratio = h / w;
                          const newHeight = cellWidth * ratio;
                          
                          const x = colEl.x + marginX + col * (cellWidth + spacing);
                          updateElement(child.id, { x, y: currentY, width: cellWidth, height: newHeight }, true);
                          
                          if (newHeight > maxRowHeight) maxRowHeight = newHeight;
                        });
                        currentY += maxRowHeight + spacing;
                        updateElement(colEl.id, { height: currentY - colEl.y });
                        setContextMenu(null);
                      }}
                      className="px-4 py-2 hover:bg-[#FF4500]/10 hover:text-[#FF4500] text-left flex items-center gap-3 font-bold text-[11px] tracking-wider uppercase"
                    >
                      <LayoutGrid className="w-4 h-4" /> ORGANIZAR EM GRID
                    </button>
                  </>
                )}

                <div className="h-px bg-white/5 my-1 mx-2" />
                
                {selectedIds.length === 1 && elements.find(el => el.id === selectedIds[0])?.type === 'image' && (
                  <button
                    onClick={() => {
                      const imgEl = elements.find(el => el.id === selectedIds[0]);
                      if (imgEl) updateProject({ coverUrl: imgEl.url });
                      setContextMenu(null);
                    }}
                    className="px-4 py-2 hover:bg-white/5 text-left flex items-center gap-3 font-bold text-[11px] tracking-wider uppercase"
                  >
                    <LayoutGrid className="w-4 h-4" /> USAR COMO CAPA
                  </button>
                )}

                <div className="h-px bg-white/5 my-1 mx-2" />
                <button
                  onClick={() => {
                    selectedIds.forEach(id => removeElement(id));
                    setContextMenu(null);
                  }}
                  className="px-4 py-2 hover:bg-red-500/10 text-red-500 text-left flex items-center gap-3 font-bold text-[11px] tracking-wider uppercase"
                >
                  <Trash2 className="w-4 h-4" /> DELETAR
                </button>
              </>
            ) : (
              <div className="flex flex-col">
                <button
                  onClick={() => {
                    elements.forEach((el: any) => { if (el.locked) updateElement(el.id, { locked: false }); });
                    setContextMenu(null);
                  }}
                  className="flex items-center px-4 py-2 hover:bg-white/5"
                >
                  <span>Desbloquear todos</span>
                </button>

                <div className="h-px bg-white/5 my-1 mx-2" />

                <button
                  onClick={() => {
                    const id = Date.now().toString();
                    addElement({ id, type: 'text', x: contextMenu.stageX, y: contextMenu.stageY, text: 'Novo Texto', fill: activeColor, fontSize: activeFontSize, width: 200, height: 40 });
                    setEditingTextId(id);
                    setEditValue('Novo Texto');
                    setContextMenu(null);
                  }}
                  className="flex items-center px-4 py-2 hover:bg-white/5"
                >
                  <span>Adicionar texto</span>
                </button>
                <button
                  onClick={() => {
                    const id = Date.now().toString();
                    addElement({ id, type: 'sticky', x: contextMenu.stageX, y: contextMenu.stageY, title: 'Título', body: '', fill: COLORS.yellow, fontSize: activeFontSize, width: 200, height: 200 });
                    setEditingTextId(id);
                    setEditValue('Título\n');
                    setContextMenu(null);
                  }}
                  className="flex items-center px-4 py-2 hover:bg-white/5"
                >
                  <span>Adicionar nota adesiva</span>
                </button>

                <div className="h-px bg-white/5 my-1 mx-2" />

                <button
                  onClick={() => { setShowGrid(!showGrid); setContextMenu(null); }}
                  className="flex items-center justify-between px-4 py-2 hover:bg-white/5"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 flex items-center justify-center">
                      {showGrid && <div className="w-2 h-2 bg-[#00A1FF] rounded-full" />}
                    </div>
                    <span>Mostrar grade</span>
                  </div>
                  <span className="text-[10px] opacity-40">G</span>
                </button>
                <button
                  onClick={() => { setSnapToGrid(!snapToGrid); setContextMenu(null); }}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-white/5"
                >
                  <div className="w-3.5 h-3.5 flex items-center justify-center">
                    {snapToGrid && <div className="w-2 h-2 bg-[#00A1FF] rounded-full" />}
                  </div>
                  <span>Ajustar à grade</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-[#00A1FF] hover:bg-white/5">
                  <div className="w-3.5 h-3.5 flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#00A1FF] rounded-full" />
                  </div>
                  <span>Ajustar objetos</span>
                </button>

                <div className="h-px bg-white/5 my-1 mx-2" />

                <button
                  onClick={() => { setStageProps({ scale: 1, x: 0, y: 0 }); setContextMenu(null); }}
                  className="flex items-center justify-between px-4 py-2 hover:bg-white/5"
                >
                  <span>Mostrar tudo</span>
                  <span className="text-[10px] opacity-40">Alt + 1</span>
                </button>
              </div>
            )}

            {/* Close context menu overlay helper */}
            <div className="fixed inset-0 z-[-1]" onClick={(e) => { e.stopPropagation(); setContextMenu(null); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Color Picker */}
      <AnimatePresence>
        {floatingColorPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed z-[200] bg-[#1e1e1e] rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-4 flex flex-col items-center gap-3"
            style={{ left: floatingColorPicker.x + 20, top: floatingColorPicker.y - 80 }}
          >
            {/* Color Preview */}
            <div className="w-full h-24 rounded-xl border border-white/10 overflow-hidden relative">
              <div className="w-full h-full" style={{ backgroundColor: floatingColorPicker.color }} />
              <span className="absolute top-2 left-3 text-xs font-bold" style={{ color: getContrastColor(floatingColorPicker.color) }}>
                {floatingColorPicker.color.toUpperCase()}
              </span>
            </div>

            {/* Native Color Input (styled) */}
            <input
              type="color"
              value={floatingColorPicker.color}
              onChange={(e) => {
                const hex = e.target.value;
                setFloatingColorPicker(prev => prev ? { ...prev, color: hex } : null);
                updateElement(floatingColorPicker.id, { fill: hex }, true);
              }}
              className="w-full h-10 rounded-lg cursor-pointer border border-white/10 bg-transparent"
              style={{ padding: 0 }}
            />

            {/* Hex Input */}
            <input
              type="text"
              value={floatingColorPicker.color.toUpperCase()}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                  setFloatingColorPicker(prev => prev ? { ...prev, color: val } : null);
                  if (val.length === 7) updateElement(floatingColorPicker.id, { fill: val }, true);
                }
              }}
              className="w-full bg-[#2a2a2a] border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono text-center outline-none focus:border-[#FF4500]/50 transition-colors"
            />

            {/* Eyedropper button */}
            {(window as any).EyeDropper && (
              <button
                onClick={async () => {
                  try {
                    const eyeDropper = new (window as any).EyeDropper();
                    const result = await eyeDropper.open();
                    const hex = result.sRGBHex;
                    setFloatingColorPicker(prev => prev ? { ...prev, color: hex } : null);
                    updateElement(floatingColorPicker.id, { fill: hex }, true);
                  } catch (e) { /* user cancelled */ }
                }}
                className="w-full flex items-center justify-center gap-2 bg-[#2a2a2a] hover:bg-[#333] border border-white/10 rounded-lg px-3 py-2 text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider transition-all"
              >
                <Pipette className="w-4 h-4" /> Conta-gotas
              </button>
            )}

            {/* Confirm */}
            <button
              onClick={async () => {
                const hex = floatingColorPicker.color;
                try {
                  const res = await fetch(`https://www.thecolorapi.com/id?hex=${hex.replace('#', '')}`);
                  const data = await res.json();
                  updateElement(floatingColorPicker.id, { fill: hex, title: data.name.value });
                } catch (e) {
                  updateElement(floatingColorPicker.id, { fill: hex });
                }
                setFloatingColorPicker(null);
              }}
              className="w-full bg-[#FF4500] hover:bg-[#FF5722] rounded-lg px-4 py-2 text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              Confirmar
            </button>

            {/* Close overlay */}
            <div className="fixed inset-0 z-[-1]" onClick={() => setFloatingColorPicker(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimap & Toggle */}
      <div className="absolute bottom-24 right-6 z-40 flex flex-col items-end gap-2 pointer-events-auto">
        <AnimatePresence>
          {showMinimap && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#1a1a1a]/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-2xl pointer-events-none"
              style={{ width: minimapSize, height: minimapSize }}
            >
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:10px_10px]" />
              {elements.map(el => (
                <div
                  key={el.id}
                  className="absolute bg-white/40 rounded-sm"
                  style={{
                    left: ((el.x || 0) - boardBounds.x) * minimapScale,
                    top: ((el.y || 0) - boardBounds.y) * minimapScale,
                    width: Math.max(2, (el.width || 100) * minimapScale),
                    height: Math.max(2, (el.height || 100) * minimapScale),
                  }}
                />
              ))}
              {/* Viewport indicator */}
              <div
                className="absolute border-2 border-[#FF4500] bg-[#FF4500]/10 rounded-sm shadow-[0_0_10px_rgba(255,69,0,0.3)]"
                style={{
                  left: (-stageProps.x / stageProps.scale - boardBounds.x) * minimapScale,
                  top: (-stageProps.y / stageProps.scale - boardBounds.y) * minimapScale,
                  width: (window.innerWidth / stageProps.scale) * minimapScale,
                  height: (window.innerHeight / stageProps.scale) * minimapScale,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setShowMinimap(!showMinimap)}
          className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 p-2.5 rounded-xl shadow-2xl text-white/60 hover:text-white transition-all flex items-center justify-center hover:bg-white/5"
          title={showMinimap ? "Ocultar Minimap" : "Mostrar Minimap"}
        >
          <Map className="w-5 h-5" />
        </button>
      </div>

      {/* Zoom Controls Panel */}
      <div className="absolute bottom-8 left-8 z-40 flex items-center gap-3 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl shadow-2xl">
        <button onClick={() => handleZoom(-1)} className="text-white/60 hover:text-white transition-colors p-1">
          <Minus className="w-4 h-4" />
        </button>
        <div className="text-[12px] font-bold text-white/90 min-w-[45px] text-center">
          {Math.round(stageProps.scale * 100)}%
        </div>
        <button onClick={() => handleZoom(1)} className="text-white/60 hover:text-white transition-colors p-1">
          <Plus className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button
          onClick={() => setStageProps({ scale: 1, x: 0, y: 0 })}
          className="text-[10px] font-bold text-white/40 hover:text-white/80 transition-colors uppercase tracking-tight"
        >
          Reset
        </button>
      </div>

      {/* Premium Splash Screen */}
      <SplashScreen isLoading={isLoading} />
    </div>
  );
}
