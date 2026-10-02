import { useState, useEffect } from 'react';
import { 
  Maximize2, 
  Minimize2,
  X,
  Sparkles,
  Info,
  ChevronRight,
  Activity,
  Layers,
  RotateCcw
} from 'lucide-react';
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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

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

  // Filter parts with hotspot that match current gender and system filter
  const visibleHotspots = parts.filter(p => {
    if (!p.hotspot) return false;
    if (selectedSystemId && p.systemId !== selectedSystemId) return false;
    if (p.gender && p.gender !== 'both' && p.gender !== gender) return false;
    return true;
  });

  // Render Fullscreen View Mode
  if (isFullscreen) {
    return (
      <div 
        className="fixed inset-0 z-[100] w-screen h-screen bg-slate-950/95 backdrop-blur-xl flex flex-col p-3 sm:p-5 select-none animate-in fade-in duration-200"
      >
        {/* Fullscreen Top Navigation Bar */}
        <div className="shrink-0 flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-600/30 border border-teal-500/40 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-teal-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                Mô Hình Giải Phẫu Cơ Thể Người ({gender === 'male' ? 'Nam Giới' : 'Nữ Giới'})
              </h2>
              <p className="text-[11px] text-teal-400 truncate hidden xs:block">
                Chế độ toàn màn hình • Nhấp vào điểm phát sáng để chọn cơ quan
              </p>
            </div>
          </div>

          {/* Center / Controls: Gender & Optical Depth */}
          <div className="hidden md:flex items-center gap-2">
            {/* Gender Toggle */}
            <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  gender === 'male' 
                    ? 'bg-teal-600 text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Nam Giới
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  gender === 'female' 
                    ? 'bg-rose-600 text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Nữ Giới
              </button>
            </div>

            {/* Depth Modes */}
            <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
              {[
                { id: 'composite', label: 'Chuẩn' },
                { id: 'xray', label: 'X-Quang' },
                { id: 'thermal', label: 'Nhiệt Sinh Học' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setDepthMode(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    depthMode === f.id ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Action: Nút Đóng Toàn Màn Hình */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95 cursor-pointer ring-2 ring-rose-500/30"
              title="Đóng chế độ toàn màn hình (Esc)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Đóng</span>
              <span className="hidden sm:inline text-rose-200 text-xs font-mono font-normal">(Esc)</span>
            </button>
          </div>
        </div>

        {/* Mobile controls bar inside fullscreen */}
        <div className="flex md:hidden items-center justify-between gap-1.5 py-2 border-b border-slate-800/80">
          <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setGender('male')}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-semibold transition-all ${
                gender === 'male' ? 'bg-teal-600 text-white' : 'text-slate-400'
              }`}
            >
              Nam
            </button>
            <button
              type="button"
              onClick={() => setGender('female')}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-semibold transition-all ${
                gender === 'female' ? 'bg-rose-600 text-white' : 'text-slate-400'
              }`}
            >
              Nữ
            </button>
          </div>

          <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
            {[
              { id: 'composite', label: 'Chuẩn' },
              { id: 'xray', label: 'X-Quang' },
              { id: 'thermal', label: 'Nhiệt' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDepthMode(f.id as any)}
                className={`px-2 py-0.5 rounded-lg text-[10.5px] font-semibold transition-all ${
                  depthMode === f.id ? 'bg-teal-600 text-white' : 'text-slate-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fullscreen Canvas Stage */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-radial from-teal-950/20 via-slate-950 to-slate-950 rounded-2xl border border-slate-800/60 my-2">
          {/* Subtle Anatomical Axis Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f766e12_1px,transparent_1px),linear-gradient(to_bottom,#0f766e12_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          {/* Scaled Human Body Figure */}
          <div className="relative w-[360px] sm:w-[460px] md:w-[520px] h-[480px] sm:h-[620px] md:h-[700px] flex items-center justify-center">
            <img 
              src={gender === 'male' ? maleAnatomyImg : femaleAnatomyImg}
              alt="Anatomy Model Fullscreen"
              className="w-full h-full object-contain pointer-events-none drop-shadow-[0_20px_40px_rgba(13,148,136,0.35)] transition-all duration-300"
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
                      isSelected ? 'scale-130 z-40' : 'hover:scale-120'
                    }`}
                    title={part.name_vi}
                  >
                    <span className="relative flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-70 ${
                        isSelected ? 'bg-teal-400' : 'bg-teal-400/60'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-4 w-4 sm:h-4.5 sm:w-4.5 border-2 border-white shadow-lg ${
                        isSelected ? 'bg-teal-500 ring-4 ring-teal-400/50' : 'bg-teal-600 group-hover:bg-teal-400'
                      }`}></span>
                    </span>

                    {/* Hotspot Floating Tooltip Label */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex items-center px-3 py-1.5 rounded-xl bg-slate-900/95 text-white text-xs font-bold whitespace-nowrap shadow-xl border border-teal-500/40 pointer-events-none z-50">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                        <span>{part.name_vi}</span>
                        {part.name_latin && <span className="text-teal-300 font-serif italic text-[10px]">({part.name_latin})</span>}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fullscreen Bottom Footer & Selected Part Info Card */}
        <div className="shrink-0 flex items-center justify-between gap-3 pt-2">
          {selectedPart ? (
            <div className="flex-1 flex items-center justify-between gap-3 bg-slate-900/90 border border-teal-500/30 rounded-xl px-3.5 py-2 shadow-lg">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Đang chọn:</span>
                <div className="flex items-center gap-2 truncate">
                  <span className="text-xs sm:text-sm font-bold text-white truncate">{selectedPart.name_vi}</span>
                  {selectedPart.name_latin && (
                    <span className="text-[10px] text-slate-400 italic truncate hidden sm:inline">({selectedPart.name_latin})</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFullscreen(false);
                  onSelectPart(selectedPart);
                }}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>Xem chi tiết</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Nhấp vào điểm chấm bất kỳ trên cơ thể để chọn và xem cấu trúc giải phẫu.</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 transition-colors cursor-pointer shrink-0"
            title="Thu nhỏ về giao diện thường"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Thu nhỏ</span>
          </button>
        </div>
      </div>
    );
  }

  // Regular Embedded View Mode (Embedded on the page)
  return (
    <div className="w-full bg-white rounded-2xl p-2 sm:p-3 border border-slate-200 shadow-sm transition-all">
      {/* Top Floating Controls Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-1.5 border-b border-slate-100 flex-wrap">
        {/* Gender Toggle */}
        <div className="flex items-center bg-slate-100/90 rounded-xl p-0.5 border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setGender('male')}
            className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              gender === 'male' 
                ? 'bg-teal-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            Nam Giới
          </button>
          <button
            type="button"
            onClick={() => setGender('female')}
            className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              gender === 'female' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            Nữ Giới
          </button>
        </div>

        {/* Optical Depth Filters */}
        <div className="flex items-center bg-slate-100/90 rounded-xl p-0.5 border border-slate-200 shadow-2xs">
          {[
            { id: 'composite', label: 'Chuẩn' },
            { id: 'xray', label: 'X-Quang' },
            { id: 'thermal', label: 'Nhiệt' },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setDepthMode(f.id as any)}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                depthMode === f.id ? 'bg-teal-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 hover:text-teal-900 rounded-xl border border-teal-200 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 ml-auto"
          title="Mở toàn màn hình mô hình cơ thể"
        >
          <Maximize2 className="w-3.5 h-3.5 text-teal-600" />
          <span>Toàn màn hình</span>
        </button>
      </div>

      {/* Main Canvas Stage (Chính diện, không nghiêng) */}
      <div 
        className="relative bg-gradient-to-b from-slate-50 via-teal-50/25 to-slate-100/60 rounded-xl overflow-hidden border border-slate-200 shadow-inner h-[460px] sm:h-[530px] w-full flex items-center justify-center select-none"
      >
        {/* Subtle Anatomical Axis Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f766e08_1px,transparent_1px),linear-gradient(to_bottom,#0f766e08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Anatomy Layer (Thẳng đứng, chính diện) */}
        <div 
          className="relative w-[300px] sm:w-[360px] h-[410px] sm:h-[480px] flex items-center justify-center"
        >
          {/* Base Anatomy Render */}
          <img 
            src={gender === 'male' ? maleAnatomyImg : femaleAnatomyImg}
            alt="Anatomy Model"
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
                  type="button"
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

        {/* Bottom Floating Hint & Fullscreen Action */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
          <div className="px-2.5 py-1 bg-white/85 backdrop-blur-xs rounded-lg border border-slate-200/80 text-[10.5px] text-slate-600 font-medium shadow-2xs">
            💡 Chạm vào điểm sáng để mở cơ quan
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 bg-white/90 backdrop-blur-md text-slate-700 hover:text-teal-700 hover:bg-white rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-xs pointer-events-auto"
            title="Xem toàn màn hình"
          >
            <Maximize2 className="w-4 h-4 text-teal-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

