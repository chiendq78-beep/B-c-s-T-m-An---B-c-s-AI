import React, { useState, useEffect, useRef } from 'react';
import { 
  Rotate3d, 
  RotateCcw, 
  Play, 
  Pause, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Sparkles, 
  Eye, 
  Crosshair, 
  Sliders, 
  Maximize2,
  Minimize2,
  X,
  Compass,
  Zap,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { AnatomyPartData } from '../../data/anatomyData';

interface Anatomy3DViewerProps {
  part: AnatomyPartData;
  onAskAI?: (prompt: string) => void;
}

export default function Anatomy3DViewer({
  part,
  onAskAI
}: Anatomy3DViewerProps) {
  // 3D Orbit Angles (Xoay 360° quanh trục đứng, bỏ chế độ xoay nghiêng)
  const [rotY, setRotY] = useState<number>(0);
  const rotX = 0; // Cố định góc thẳng đứng chính diện, không xoay nghiêng
  const [zoom, setZoom] = useState<number>(1.1);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, rY: 0 });
  const [renderMode, setRenderMode] = useState<'volumetric' | 'wireframe' | 'xray' | 'heatmap'>('volumetric');
  const [crossSectionDepth, setCrossSectionDepth] = useState<number>(100);
  const [activeLandmark, setActiveLandmark] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close fullscreen on Escape key press or back navigation
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    const handleBackPress = (e: Event) => {
      e.preventDefault();
      setIsFullscreen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('app-back-press', handleBackPress);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('app-back-press', handleBackPress);
    };
  }, [isFullscreen]);

  // Auto-rotation effect
  useEffect(() => {
    if (!autoRotate || isDragging) return;
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      setRotY(prev => (prev + delta * 25) % 360);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [autoRotate, isDragging]);

  // Mouse & Touch Drag Controls (Chỉ xoay ngang 360°, bỏ xoay nghiêng)
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setAutoRotate(false);
    setDragStart({
      x: clientX,
      y: clientY,
      rY: rotY
    });
  };

  const handlePointerMove = (clientX: number, _clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragStart.x;
    setRotY((dragStart.rY + dx * 0.7) % 360);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handlePresetView = (type: 'front' | 'back' | 'left' | 'right' | 'top') => {
    setAutoRotate(false);
    switch (type) {
      case 'front':
        setRotY(0);
        break;
      case 'back':
        setRotY(180);
        break;
      case 'left':
        setRotY(-90);
        break;
      case 'right':
        setRotY(90);
        break;
      case 'top':
        setRotY(0);
        break;
    }
  };

  // Convert 3D spherical coordinates to 2D projected points for interactive pins
  const calculate3DProjectedPin = (baseX: number, baseY: number, baseZ: number) => {
    const radY = (rotY * Math.PI) / 180;
    const radX = (rotX * Math.PI) / 180;

    // Rotate Y
    const x1 = baseX * Math.cos(radY) + baseZ * Math.sin(radY);
    const z1 = -baseX * Math.sin(radY) + baseZ * Math.cos(radY);

    // Rotate X
    const y2 = baseY * Math.cos(radX) - z1 * Math.sin(radX);
    const z2 = baseY * Math.sin(radX) + z1 * Math.cos(radX);

    // Perspective projection
    const distance = 400;
    const fov = distance / (distance + z2);
    const projX = x1 * fov;
    const projY = y2 * fov;

    return {
      x: projX,
      y: projY,
      isFront: z2 > -120,
      scale: fov,
      opacity: Math.max(0.2, (z2 + 200) / 400)
    };
  };

  // Predefined 3D anatomical landmarks
  const landmarks = part.structures.map((st, i) => {
    const angle = (i / Math.max(1, part.structures.length)) * Math.PI * 2;
    const radius = 80;
    const baseX = Math.cos(angle) * radius;
    const baseY = (i - (part.structures.length - 1) / 2) * 45;
    const baseZ = Math.sin(angle) * radius;
    return {
      name: st.name,
      detail: st.detail,
      baseX,
      baseY,
      baseZ
    };
  });

  return (
    <div className={cn(
      "bg-slate-950 overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none transition-all",
      isFullscreen 
        ? "fixed inset-0 z-[100] w-screen h-screen rounded-none p-2 sm:p-4" 
        : "rounded-2xl"
    )}>
      {/* 3D Viewer Header Controls */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2.5">
        {/* Render Shader Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap">
          <button
            type="button"
            onClick={() => setRenderMode('volumetric')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              renderMode === 'volumetric'
                ? 'bg-teal-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3D Thể Tích</span>
          </button>

          <button
            type="button"
            onClick={() => setRenderMode('wireframe')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              renderMode === 'wireframe'
                ? 'bg-teal-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Khung Dây (Wireframe)</span>
          </button>

          <button
            type="button"
            onClick={() => setRenderMode('xray')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              renderMode === 'xray'
                ? 'bg-teal-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>X-Ray Chiếu Sâu</span>
          </button>

          <button
            type="button"
            onClick={() => setRenderMode('heatmap')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              renderMode === 'heatmap'
                ? 'bg-teal-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Thần Kinh / Áp Lực</span>
          </button>
        </div>

        {/* Play / Pause Rotation & Presets */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              autoRotate
                ? 'bg-teal-950 text-teal-300 border-teal-700'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{autoRotate ? 'Dừng xoay' : 'Tự động xoay'}</span>
          </button>

          <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setZoom(prev => Math.max(0.6, prev - 0.15))}
              className="p-1.5 text-slate-400 hover:text-white rounded-md cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(prev => Math.min(2.2, prev + 0.15))}
              className="p-1.5 text-slate-400 hover:text-white rounded-md cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setRotY(0);
                setZoom(1.1);
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-md cursor-pointer"
              title="Đặt lại góc xoay"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-teal-400 hover:text-white hover:bg-teal-900/50 rounded-md cursor-pointer transition-colors"
              title={isFullscreen ? "Đóng toàn màn hình (Esc)" : "Xem toàn màn hình 3D"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isFullscreen && (
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer ring-2 ring-rose-500/30"
              title="Đóng chế độ toàn màn hình (Esc)"
            >
              <X className="w-4 h-4" />
              <span>Đóng</span>
              <span className="hidden sm:inline text-rose-200 text-xs font-mono font-normal">(Esc)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 3D Spatial Canvas Stage */}
      <div 
        ref={containerRef}
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={(e) => e.touches[0] && handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => e.touches[0] && handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handlePointerUp}
        className={cn(
          "relative w-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing bg-radial from-slate-900 via-slate-950 to-black transition-all",
          isFullscreen ? "flex-1 min-h-[450px]" : "h-80 sm:h-96 md:h-[430px]"
        )}
        style={{ perspective: '1200px' }}
      >
        {/* Subtle 3D Spatial Rings & Coordinate Grid in background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div 
            className="w-80 h-80 rounded-full border border-teal-500/40"
            style={{
              transform: `rotateX(${rotX * 0.3 + 70}deg) rotateZ(${rotY * 0.5}deg)`
            }}
          />
          <div 
            className="w-96 h-96 rounded-full border border-teal-500/20"
            style={{
              transform: `rotateX(${rotX * 0.3 + 70}deg) rotateZ(${-rotY * 0.5}deg)`
            }}
          />
        </div>

        {/* 3D Render Body Component */}
        <div
          className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center transition-transform duration-75"
          style={{
            transformStyle: 'preserve-3d',
            transform: `scale(${zoom}) rotateX(${-rotX}deg) rotateY(${rotY}deg)`
          }}
        >
          {/* Central 3D Volumetric Mesh / Sphere / Organ Form */}
          <div 
            className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center transition-all duration-300 ${
              renderMode === 'volumetric'
                ? 'bg-gradient-to-tr from-teal-950 via-teal-800 to-emerald-600 shadow-[0_0_60px_rgba(20,184,166,0.45)] border-2 border-teal-400/50'
                : renderMode === 'wireframe'
                ? 'bg-transparent border-2 border-teal-400 shadow-[0_0_40px_rgba(45,212,191,0.6)]'
                : renderMode === 'xray'
                ? 'bg-radial from-cyan-400/20 via-blue-900/40 to-transparent border-2 border-cyan-300 shadow-[0_0_60px_rgba(34,211,238,0.5)]'
                : 'bg-gradient-to-tr from-blue-700 via-amber-500 to-rose-600 shadow-[0_0_50px_rgba(244,63,94,0.4)] border-2 border-rose-400/60'
            }`}
            style={{
              opacity: crossSectionDepth / 100
            }}
          >
            {/* Inner volumetric anatomical rings */}
            <div 
              className="absolute inset-2 rounded-full border border-white/20"
              style={{ transform: 'rotateY(45deg)' }}
            />
            <div 
              className="absolute inset-4 rounded-full border border-teal-300/30"
              style={{ transform: 'rotateX(60deg)' }}
            />
            <div 
              className="absolute inset-6 rounded-full border border-teal-400/40"
              style={{ transform: 'rotateY(-45deg)' }}
            />

            {/* Organ Icon / Silhouette Center */}
            <div className="text-center p-4 z-10">
              <Rotate3d className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 drop-shadow-lg ${
                renderMode === 'xray' ? 'text-cyan-300 animate-pulse' :
                renderMode === 'heatmap' ? 'text-amber-200' :
                'text-white'
              }`} />
              <span className="text-xs font-bold text-white tracking-wider block drop-shadow-md">
                {part.name_vi}
              </span>
              <span className="text-[10px] text-teal-200 font-mono">
                {part.name_latin || part.code}
              </span>
            </div>
          </div>

          {/* 3D Dynamic Anatomical Pins Floating around the 3D model */}
          {landmarks.map((lm, idx) => {
            const proj = calculate3DProjectedPin(lm.baseX, lm.baseY, lm.baseZ);
            const isSelected = activeLandmark === lm.name;

            return (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLandmark(isSelected ? null : lm.name);
                }}
                className={`absolute transition-transform duration-75 cursor-pointer z-30 ${
                  proj.isFront ? 'opacity-100' : 'opacity-30 pointer-events-none'
                }`}
                style={{
                  transform: `translate3d(${proj.x}px, ${proj.y}px, 0) scale(${proj.scale})`,
                  left: '50%',
                  top: '50%',
                  marginLeft: '-14px',
                  marginTop: '-14px'
                }}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-lg ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-300/50 scale-125'
                    : 'bg-teal-500 text-white hover:bg-teal-400 ring-2 ring-white/50'
                }`}>
                  <span className="text-[11px] font-bold">{idx + 1}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* View Angle Presets Toolbar */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 z-20">
          <span className="text-[9px] font-bold text-slate-400 uppercase text-center px-1">Góc nhìn</span>
          <button
            type="button"
            onClick={() => handlePresetView('front')}
            className="px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded font-medium text-left"
          >
            Trước (Anterior)
          </button>
          <button
            type="button"
            onClick={() => handlePresetView('back')}
            className="px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded font-medium text-left"
          >
            Sau (Posterior)
          </button>
          <button
            type="button"
            onClick={() => handlePresetView('left')}
            className="px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded font-medium text-left"
          >
            Bên Trái (Lateral L)
          </button>
          <button
            type="button"
            onClick={() => handlePresetView('right')}
            className="px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded font-medium text-left"
          >
            Bên Phải (Lateral R)
          </button>
          <button
            type="button"
            onClick={() => handlePresetView('top')}
            className="px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded font-medium text-left"
          >
            Trên đỉnh (Superior)
          </button>
        </div>

        {/* Floating Landmark Detail Card on Selection */}
        <AnimatePresence>
          {activeLandmark && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute bottom-4 left-4 right-4 sm:left-4 sm:right-auto sm:max-w-sm bg-slate-900/95 backdrop-blur-md border border-teal-500/60 rounded-xl p-3.5 shadow-2xl text-white z-30 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{activeLandmark}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveLandmark(null)}
                  className="text-slate-400 hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {part.structures.find(s => s.name === activeLandmark)?.detail || 'Cấu trúc giải phẫu 3D quan trọng liên kết chức năng.'}
              </p>
              {onAskAI && (
                <button
                  type="button"
                  onClick={() => onAskAI(`Tư vấn bệnh lý và giải phẫu 3D của "${activeLandmark}" ở ${part.name_vi}`)}
                  className="text-[10px] text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 pt-0.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Hỏi Bác sĩ AI phân tích vị trí này</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Orientation & Drag Hint */}
        <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs px-3 py-1 rounded-lg border border-slate-800 text-[10px] text-slate-400 flex items-center gap-2 pointer-events-none">
          <Compass className="w-3.5 h-3.5 text-teal-400" />
          <span>Kéo chuột / vuốt để xoay tròn 360° • Góc: {Math.round(((rotY % 360) + 360) % 360)}°</span>
        </div>
      </div>

      {/* Depth / Cross-Section Slicer Slider */}
      <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Sliders className="w-3.5 h-3.5 text-teal-400" />
          <span>Độ sâu lớp cắt giải phẫu (Cross-Section):</span>
        </div>
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <input
            type="range"
            min="20"
            max="100"
            value={crossSectionDepth}
            onChange={(e) => setCrossSectionDepth(Number(e.target.value))}
            className="w-full accent-teal-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <span className="text-[11px] font-mono text-teal-400 font-bold w-10 text-right">
            {crossSectionDepth}%
          </span>
        </div>
      </div>
    </div>
  );
}
