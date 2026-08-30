import { useState, useEffect } from 'react';
import { 
  Rotate3d, 
  Layers, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Play, 
  Pause,
  Move,
  Info,
  MapPin
} from 'lucide-react';
import { motion } from 'motion/react';
import { AnatomyPartData } from '../../data/anatomyData';

const maleAnatomyImg = new URL('../../assets/images/male_anatomy_figure_1788081873538.jpg', import.meta.url).href;
const femaleAnatomyImg = new URL('../../assets/images/female_anatomy_figure_1788081894873.jpg', import.meta.url).href;

interface InteractiveBodyMapProps {
  gender: 'male' | 'female';
  setGender: (g: 'male' | 'female') => void;
  parts: AnatomyPartData[];
  selectedPart: AnatomyPartData | null;
  onSelectPart: (part: AnatomyPartData) => void;
  selectedSystemId: string | null;
}

export default function InteractiveBodyMap({
  gender,
  setGender,
  parts,
  selectedPart,
  onSelectPart,
  selectedSystemId
}: InteractiveBodyMapProps) {
  const [depthMode, setDepthMode] = useState<'composite' | 'xray' | 'thermal'>('composite');
  const [rotateY, setRotateY] = useState<number>(0);
  const [rotateX, setRotateX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, rotY: 0, rotX: 0 });
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Auto-rotation harmonic effect
  useEffect(() => {
    if (!autoRotate) return;
    let frameId: number;
    const startTime = Date.now();

    const update = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const angle = Math.sin(elapsed * 0.7) * 22;
      setRotateY(angle);
      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [autoRotate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setAutoRotate(false);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      rotY: rotateY,
      rotX: rotateX
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const newRotY = Math.max(-75, Math.min(75, dragStart.rotY + dx * 0.45));
    const newRotX = Math.max(-25, Math.min(25, dragStart.rotX - dy * 0.45));
    setRotateY(newRotY);
    setRotateX(newRotX);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    setIsDragging(true);
    setAutoRotate(false);
    setDragStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      rotY: rotateY,
      rotX: rotateX
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;
    const newRotY = Math.max(-75, Math.min(75, dragStart.rotY + dx * 0.45));
    const newRotX = Math.max(-25, Math.min(25, dragStart.rotX - dy * 0.45));
    setRotateY(newRotY);
    setRotateX(newRotX);
  };

  // Filter parts with hotspot that match current gender and system filter
  const visibleHotspots = parts.filter(p => {
    if (!p.hotspot) return false;
    if (selectedSystemId && p.systemId !== selectedSystemId) return false;
    if (p.gender && p.gender !== 'both' && p.gender !== gender) return false;
    return true;
  });

  return (
    <div className={`bg-white rounded-2xl p-1.5 sm:p-2 border border-slate-200 shadow-xs transition-all ${
      isFullscreen ? 'fixed inset-4 z-50 rounded-2xl p-2' : 'w-full'
    }`}>
      <div className={`relative bg-gradient-to-b from-slate-50 via-teal-50/25 to-slate-100/60 rounded-xl overflow-hidden border border-slate-200 shadow-inner ${
        isFullscreen ? 'h-full w-full' : 'h-[460px] sm:h-[540px] w-full'
      }`}>
      {/* Top Floating Controls */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between gap-1.5 pointer-events-auto">
        {/* Gender Toggle */}
        <div className="flex items-center bg-white/90 backdrop-blur-md rounded-xl p-0.5 border border-slate-200 shadow-xs">
          <button
            onClick={() => setGender('male')}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              gender === 'male' 
                ? 'bg-teal-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Nam Giới
          </button>
          <button
            onClick={() => setGender('female')}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              gender === 'female' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Nữ Giới
          </button>
        </div>

        {/* Optical Depth Filters */}
        <div className="flex items-center bg-white/90 backdrop-blur-md rounded-xl p-0.5 border border-slate-200 shadow-xs">
          {[
            { id: 'composite', label: 'Chuẩn' },
            { id: 'xray', label: 'X-Quang' },
            { id: 'thermal', label: 'Nhiệt Sinh Học' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setDepthMode(f.id as any)}
              className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                depthMode === f.id ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D Canvas Stage */}
      <div 
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none relative overflow-hidden bg-radial from-teal-50/40 via-transparent to-slate-100/50"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUpOrLeave}
      >
        {/* Subtle Anatomical Axis Grid (Light Mode) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f766e08_1px,transparent_1px),linear-gradient(to_bottom,#0f766e08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Interactive 3D Transformed Layer */}
        <div 
          className="relative w-[340px] sm:w-[380px] h-[460px] sm:h-[530px] flex items-center justify-center transition-transform duration-75 ease-out"
          style={{
            transform: `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Base Anatomy Render */}
          <img 
            src={gender === 'male' ? maleAnatomyImg : femaleAnatomyImg}
            alt="3D Anatomy Model"
            className="w-full h-full object-contain pointer-events-none drop-shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition-all duration-300"
            style={{
              filter: 
                depthMode === 'xray' ? 'invert(0.85) hue-rotate(185deg) contrast(1.4) grayscale(0.3)' :
                depthMode === 'thermal' ? 'hue-rotate(300deg) saturate(2.5) contrast(1.2)' : 'none'
            }}
            referrerPolicy="no-referrer"
          />

          {/* Interactive Hotspot Pins overlaying body parts */}
          {visibleHotspots.map((part) => {
            const isSelected = selectedPart?.id === part.id;
            const top = part.hotspot?.top || '50%';
            const left = part.hotspot?.left || '50%';

            return (
              <div
                key={part.id}
                style={{ top, left }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPart(part);
                  }}
                  className={`group relative flex items-center justify-center transition-transform active:scale-95 cursor-pointer ${
                    isSelected ? 'scale-125 z-40' : 'hover:scale-115'
                  }`}
                  title={part.name_vi}
                >
                  <span className="relative flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${
                      isSelected ? 'bg-teal-500' : 'bg-teal-400/50'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-white shadow-md ${
                      isSelected ? 'bg-teal-600 ring-2 ring-teal-300' : 'bg-teal-600 group-hover:bg-teal-500'
                    }`}></span>
                  </span>

                  {/* Hotspot Floating Tooltip Label */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:flex items-center px-2.5 py-1 rounded-lg bg-white text-slate-800 text-[11px] font-bold whitespace-nowrap shadow-lg border border-slate-200 pointer-events-none z-50">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                      <span>{part.name_vi}</span>
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-auto">
        {/* Rotation tools */}
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md rounded-xl p-1 border border-slate-200 shadow-xs">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              autoRotate ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Tự động xoay 3D"
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{autoRotate ? 'Dừng Xoay' : 'Xoay 3D'}</span>
          </button>

          <button
            onClick={() => {
              setRotateX(0);
              setRotateY(0);
              setAutoRotate(false);
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đặt lại góc nhìn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Fullscreen button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-white/90 backdrop-blur-md text-slate-700 rounded-xl border border-slate-200 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
            title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
