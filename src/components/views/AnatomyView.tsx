import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, 
  Search, 
  Layers, 
  PersonStanding,
  Sparkles, 
  ChevronRight, 
  ChevronDown,
  BookOpen, 
  AlertTriangle, 
  ShieldAlert, 
  Filter, 
  RotateCcw,
  Eye,
  Stethoscope,
  CheckCircle2,
  X,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { 
  ORGAN_SYSTEMS_LIST, 
  ALL_ANATOMY_PARTS, 
  AnatomyPartData, 
  OrganSystemMeta 
} from '../../data/anatomyData';
import AnatomyCardModal from '../anatomy/AnatomyCardModal';
import InteractiveBodyMap from '../anatomy/InteractiveBodyMap';
import VitalsSensoryDashboard from '../VitalsSensoryDashboard';

import { registerModal } from '../../utils/modalManager';

interface AnatomyViewProps {
  setActiveView?: (view: any) => void;
}

// Helper: normalize Vietnamese accents for fast diacritic-free searching
function stripVietnamese(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// Quick popular search tags
const POPULAR_SEARCH_TAGS = [
  { label: 'Tim mạch', query: 'Tim', emoji: '🫀' },
  { label: 'Phổi & Hô hấp', query: 'Phổi', emoji: '🫁' },
  { label: 'Não & Thần kinh', query: 'Não', emoji: '🧠' },
  { label: 'Cột sống', query: 'Cột sống', emoji: '🦴' },
  { label: 'Dạ dày', query: 'Dạ dày', emoji: '🩺' },
  { label: 'Gan mật', query: 'Gan', emoji: '🧬' },
  { label: 'Thận & Tiết niệu', query: 'Thận', emoji: '🩸' },
  { label: 'Khó thở', query: 'Khó thở', emoji: '💨' },
  { label: 'Đau tức ngực', query: 'Đau ngực', emoji: '⚡' },
];

export default function AnatomyView({ setActiveView }: AnatomyViewProps) {
  const [subTab, setSubTab] = useState<'map' | 'vitals'>('map');
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [isSystemDropdownOpen, setIsSystemDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPart, setSelectedPart] = useState<AnatomyPartData | null>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSystemDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keyboard shortcut: '/' focuses search input, Escape clears/closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        // Only trigger if not already typing in another input
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          searchInputRef.current?.focus();
          setIsSearchFocused(true);
        }
      } else if (e.key === 'Escape') {
        if (isSearchFocused) {
          setIsSearchFocused(false);
          searchInputRef.current?.blur();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchFocused]);

  // Listen for root menu reset to return to top of root Anatomy view
  useEffect(() => {
    const handleResetToRoot = (e: any) => {
      if (e.detail?.view === 'anatomy') {
        setSubTab('map');
        setSelectedPart(null);
        setIsSystemDropdownOpen(false);
        setSearchTerm('');
        setSelectedSystemId('all');
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        document.getElementById('top-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    window.addEventListener('app-reset-to-root', handleResetToRoot);
    return () => window.removeEventListener('app-reset-to-root', handleResetToRoot);
  }, []);

  // Listen for back gesture when a body part modal, system dropdown, or search is active
  useEffect(() => {
    if (!selectedPart && !isSystemDropdownOpen && !isSearchFocused) return;
    const closeFn = () => {
      if (selectedPart) setSelectedPart(null);
      else if (isSystemDropdownOpen) setIsSystemDropdownOpen(false);
      else if (isSearchFocused) setIsSearchFocused(false);
    };
    const unregister = registerModal('anatomy-active-subview', closeFn);
    const handleBackGesture = (e: Event) => {
      e.preventDefault();
      closeFn();
    };
    window.addEventListener('app-back-press', handleBackGesture);
    return () => {
      unregister();
      window.removeEventListener('app-back-press', handleBackGesture);
    };
  }, [selectedPart, isSystemDropdownOpen, isSearchFocused]);

  // Find currently selected system
  const currentSystem = useMemo(() => {
    return ORGAN_SYSTEMS_LIST.find(s => s.id === selectedSystemId) || null;
  }, [selectedSystemId]);

  // Filter parts based on search, system, and gender with Vietnamese unaccented search
  const filteredParts = useMemo(() => {
    return ALL_ANATOMY_PARTS.filter(part => {
      // 1. Enhanced Search filter (Diacritic-insensitive + Latin + English + Symptoms + Diseases)
      if (searchTerm.trim()) {
        const rawQuery = searchTerm.toLowerCase().trim();
        const normQuery = stripVietnamese(searchTerm);

        const matchNameVi = 
          part.name_vi.toLowerCase().includes(rawQuery) || 
          stripVietnamese(part.name_vi).includes(normQuery);

        const matchNameLatin = 
          part.name_latin?.toLowerCase().includes(rawQuery) || 
          stripVietnamese(part.name_latin || '').includes(normQuery);

        const matchNameEn = 
          part.name_en?.toLowerCase().includes(rawQuery) || 
          stripVietnamese(part.name_en || '').includes(normQuery);

        const matchSymptoms = part.commonSymptoms.some(s => 
          s.toLowerCase().includes(rawQuery) || 
          stripVietnamese(s).includes(normQuery)
        );

        const matchDiseases = part.commonDiseases.some(d => 
          d.toLowerCase().includes(rawQuery) || 
          stripVietnamese(d).includes(normQuery)
        );

        const matchDefinition = 
          part.definition.toLowerCase().includes(rawQuery) || 
          stripVietnamese(part.definition).includes(normQuery);

        if (!matchNameVi && !matchNameLatin && !matchNameEn && !matchSymptoms && !matchDiseases && !matchDefinition) {
          return false;
        }
      }

      // 2. System filter
      if (selectedSystemId && part.systemId !== selectedSystemId) {
        return false;
      }

      // 3. Gender filter
      if (part.gender && part.gender !== 'both' && part.gender !== gender) {
        return false;
      }

      return true;
    });
  }, [searchTerm, selectedSystemId, gender]);

  const handleAskAIAboutSystem = (systemName: string) => {
    const prompt = `Tôi muốn tìm hiểu tổng quan về ${systemName}, các cơ quan chính trong hệ thống này, các dấu hiệu cảnh báo bệnh lý và phương pháp chăm sóc bảo vệ sức khỏe toàn diện.`;
    window.dispatchEvent(new CustomEvent('app-open-ai-chat', { detail: { prompt } }));
  };

  const handleAskAIAboutSymptom = (query: string) => {
    const prompt = `Tôi đang tra cứu về triệu chứng/cơ quan "${query}" trong giải phẫu học. Bác sĩ hãy giải thích các nguyên nhân thường gặp, mức độ nguy hiểm và khi nào cần đi khám y tế?`;
    window.dispatchEvent(new CustomEvent('app-open-ai-chat', { detail: { prompt } }));
  };

  return (
    <div className="p-3 sm:p-5 space-y-3 sm:space-y-4 min-h-full pb-28">
      {/* 1. Page Header (Đưa lên đầu trang) */}
      <section className="bg-white rounded-2xl p-3.5 sm:p-4 text-slate-900 shadow-xs border border-slate-200 relative overflow-hidden">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-teal-700 font-bold text-[11px] uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>Hệ thống Khám phá Y khoa</span>
          </div>
          <h1 className="font-serif text-base sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis sm:whitespace-normal">
            Bản đồ Sinh học & Khám phá Cơ thể
          </h1>
        </div>
      </section>

      {/* Top Sub-tabs Switcher */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1 sm:p-1.5 flex items-center gap-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => setSubTab('map')}
          className={cn(
            "flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap",
            subTab === 'map'
              ? "bg-teal-600 text-pure-white shadow-sm shadow-teal-600/25"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <PersonStanding className="w-4 h-4 shrink-0" />
          <span>Bản đồ Giải phẫu 3D</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('vitals')}
          className={cn(
            "flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap",
            subTab === 'vitals'
              ? "bg-teal-600 text-pure-white shadow-sm shadow-teal-600/25"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <Activity className="w-3.5 h-3.5 shrink-0" />
          <span>Sinh hiệu & Cảm quan</span>
        </button>
      </div>

      {subTab === 'vitals' ? (
        <VitalsSensoryDashboard />
      ) : (
        <>
      {/* 2. Interactive Body Map (Đưa lên đầu trang theo yêu cầu) */}
      <div className="w-full">
        <InteractiveBodyMap
          gender={gender}
          setGender={setGender}
          parts={ALL_ANATOMY_PARTS}
          selectedPart={selectedPart}
          onSelectPart={(part) => setSelectedPart(part)}
          selectedSystemId={selectedSystemId}
        />
      </div>

      {/* 3. Compact Search & Dropdown Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Optimized Search input with autocomplete & instant results */}
        <div className="relative flex-1" ref={searchContainerRef}>
          <div className="relative flex items-center">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none ${
              isSearchFocused ? 'text-teal-600' : 'text-slate-400'
            }`} />
            
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!isSearchFocused) setIsSearchFocused(true);
              }}
              placeholder="Tìm cơ quan, tiếng La-tinh, bệnh lý, triệu chứng..."
              className="w-full pl-10 pr-24 py-2.5 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 shadow-xs transition-all"
            />

            {/* Right side controls: Result count badge & Clear button */}
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchTerm ? (
                <>
                  <span className="hidden xs:inline-flex px-2 py-0.5 text-[10px] font-semibold bg-teal-50 text-teal-700 rounded-md border border-teal-200 shrink-0 select-none">
                    {filteredParts.length} kết quả
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Xóa tìm kiếm (Esc)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200 select-none" title="Phím tắt tìm kiếm">
                  /
                </span>
              )}
            </div>
          </div>

          {/* Autocomplete & Quick Suggestion Popover */}
          <AnimatePresence>
            {isSearchFocused && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.99 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden max-h-96 flex flex-col"
              >
                {/* Case A: When user is typing -> Show instant matched parts */}
                {searchTerm.trim() ? (
                  <div className="flex flex-col">
                    <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                      <span>KẾT QUẢ TÌM KIẾM NHANH ({filteredParts.length})</span>
                      <span className="text-[10px] text-slate-400">Bấm để mở chi tiết giải phẫu</span>
                    </div>

                    {filteredParts.length > 0 ? (
                      <div className="overflow-y-auto max-h-64 p-1.5 divide-y divide-slate-100">
                        {filteredParts.slice(0, 6).map((part) => {
                          const systemMeta = ORGAN_SYSTEMS_LIST.find(s => s.id === part.systemId);
                          return (
                            <button
                              key={part.id}
                              type="button"
                              onClick={() => {
                                setSelectedPart(part);
                                setIsSearchFocused(false);
                              }}
                              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-teal-50/70 text-left transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                                  {part.illustrationUrl ? (
                                    <img
                                      src={part.illustrationUrl}
                                      alt={part.name_vi}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <Eye className="w-4 h-4 text-teal-600" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-900 group-hover:text-teal-900 truncate">
                                      {part.name_vi}
                                    </span>
                                    {part.name_latin && (
                                      <span className="text-[10px] italic text-slate-400 font-serif truncate hidden xs:inline">
                                        ({part.name_latin})
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-500 line-clamp-1">
                                    {part.definition}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 pl-2">
                                {systemMeta && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-600 border border-slate-200 hidden sm:inline">
                                    {systemMeta.name.split('. ')[1] || systemMeta.name}
                                  </span>
                                )}
                                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition-colors" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center space-y-2">
                        <p className="text-xs text-slate-500">
                          Không tìm thấy cơ quan hoặc bộ phận nào khớp với "<span className="font-semibold text-slate-800">{searchTerm}</span>"
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            handleAskAIAboutSymptom(searchTerm);
                            setIsSearchFocused(false);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl border border-teal-200 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                          <span>Hỏi Bác sĩ AI về "{searchTerm}"</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Case B: When input is empty -> Show popular search chips */
                  <div className="p-3 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>Từ khóa tra cứu nhanh</span>
                      <span className="text-[10px] font-normal text-slate-400">Bấm để lọc</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_SEARCH_TAGS.map((tag) => (
                        <button
                          key={tag.label}
                          type="button"
                          onClick={() => {
                            setSearchTerm(tag.query);
                            searchInputRef.current?.focus();
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-teal-50 hover:text-teal-900 hover:border-teal-200 border border-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <span>{tag.emoji}</span>
                          <span>{tag.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer in Popover */}
                <div className="px-3.5 py-1.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 select-none">
                  <span>Hỗ trợ gõ tiếng Việt có dấu & không dấu</span>
                  <span>Nhấn <kbd className="font-mono bg-white px-1 py-0.2 rounded border border-slate-200 text-slate-600">Esc</kbd> để đóng</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 12 Organ Systems Dropdown Menu */}
        <div className="relative w-full sm:w-72 md:w-80" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsSystemDropdownOpen(prev => !prev)}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white rounded-xl border text-xs font-semibold shadow-xs transition-all cursor-pointer ${
              selectedSystemId
                ? 'border-teal-500 bg-teal-50/50 text-teal-950 ring-2 ring-teal-500/10'
                : 'border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-teal-50/30'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {currentSystem ? (
                <>
                  <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                    <currentSystem.Icon className={`w-3.5 h-3.5 ${currentSystem.color}`} />
                  </div>
                  <span className="truncate font-bold text-slate-900">{currentSystem.name}</span>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Layers className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <span className="truncate font-medium text-slate-700">Tất cả Hệ cơ quan (12 hệ)</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {selectedSystemId && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSystemId(null);
                    setIsSystemDropdownOpen(false);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                  title="Xóa bộ lọc hệ"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isSystemDropdownOpen ? 'rotate-180 text-teal-600' : ''}`} />
            </div>
          </button>

          {/* Dropdown Popover List */}
          <AnimatePresence>
            {isSystemDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden max-h-80 flex flex-col"
              >
                {/* Header in popover */}
                <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Chọn Hệ Cơ Quan (12 Hệ)
                  </span>
                  {selectedSystemId && (
                    <button
                      onClick={() => {
                        setSelectedSystemId(null);
                        setIsSystemDropdownOpen(false);
                      }}
                      className="text-[11px] text-teal-600 hover:underline font-semibold cursor-pointer"
                    >
                      Đặt lại
                    </button>
                  )}
                </div>

                {/* Dropdown Scrollable Options */}
                <div className="overflow-y-auto p-1.5 space-y-0.5">
                  {/* Option: All Systems */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSystemId(null);
                      setIsSystemDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedSystemId === null
                        ? 'bg-teal-600 text-white shadow-xs font-bold'
                        : 'text-slate-700 hover:bg-teal-50/70 hover:text-teal-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers className={`w-4 h-4 ${selectedSystemId === null ? 'text-white' : 'text-teal-600'}`} />
                      <span>Tất cả Hệ cơ quan (12 hệ)</span>
                    </div>
                    {selectedSystemId === null && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                  </button>

                  {/* 12 Standard Systems Options */}
                  {ORGAN_SYSTEMS_LIST.map((system) => {
                    const isSelected = selectedSystemId === system.id;
                    const partsCount = ALL_ANATOMY_PARTS.filter(p => p.systemId === system.id).length;

                    return (
                      <button
                        key={system.id}
                        type="button"
                        onClick={() => {
                          setSelectedSystemId(system.id);
                          setIsSystemDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-xs font-bold'
                            : 'text-slate-700 hover:bg-teal-50/70 hover:text-teal-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <system.Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : system.color}`} />
                          <span className="truncate">{system.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                            isSelected ? 'bg-teal-700/60 text-teal-100' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {partsCount} bộ phận
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 4. Anatomy Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>Danh Sách Bộ Phận Giải Phẫu ({filteredParts.length})</span>
          </h3>
          <span className="text-[11px] text-slate-500">
            Nhấp vào bộ phận để xem chi tiết 10 cấp & mô hình 3D
          </span>
        </div>

        {filteredParts.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">Không tìm thấy bộ phận phù hợp</h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để xem toàn bộ danh mục giải phẫu.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSystemId(null);
              }}
              className="px-3.5 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-teal-700 transition-all cursor-pointer"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[720px] overflow-y-auto pr-1">
            {filteredParts.map((part) => {
              const systemMeta = ORGAN_SYSTEMS_LIST.find(s => s.id === part.systemId) || ORGAN_SYSTEMS_LIST[0];
              const isSelected = selectedPart?.id === part.id;

              return (
                <motion.div
                  key={part.id}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setSelectedPart(part)}
                  className={`rounded-xl p-3.5 border shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2.5 group ${
                    isSelected
                      ? 'bg-teal-50/90 border-teal-500 shadow-md ring-2 ring-teal-500/30'
                      : 'bg-white hover:bg-teal-50/60 border-slate-200 hover:border-teal-400 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-1.5">
                    {/* Top System Tag */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${systemMeta.bgLight}`}>
                        {systemMeta.name}
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-all ${
                        isSelected ? 'text-teal-600 translate-x-0.5 font-bold' : 'text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5'
                      }`} />
                    </div>

                    {/* Title & Latin */}
                    <div>
                      <h4 className={`text-xs sm:text-sm font-bold transition-colors ${
                        isSelected ? 'text-teal-800' : 'text-slate-900 group-hover:text-teal-700'
                      }`}>
                        {part.name_vi}
                      </h4>
                      {part.name_latin && (
                        <p className={`text-[10px] font-mono italic truncate ${
                          isSelected ? 'text-teal-700/80 font-medium' : 'text-slate-500'
                        }`}>
                          {part.name_latin}
                        </p>
                      )}
                    </div>

                    {/* Brief Definition */}
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {part.definition}
                    </p>
                  </div>

                  {/* Symptoms & Red flag indicators */}
                  <div className={`pt-2 border-t flex items-center justify-between text-[10px] ${
                    isSelected ? 'border-teal-200/80' : 'border-slate-100 group-hover:border-teal-100'
                  }`}>
                    <span className={`font-medium truncate ${
                      isSelected ? 'text-teal-800' : 'text-slate-500'
                    }`}>
                      {part.commonSymptoms.length} triệu chứng • {part.commonDiseases.length} bệnh
                    </span>
                    <span className="text-teal-600 font-semibold group-hover:underline flex items-center gap-0.5">
                      Chi tiết
                      <ChevronRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}

      {/* 5. Standardized 10-Point Anatomy Card Modal (Pop-up Dialog) */}
      <AnimatePresence>
        {selectedPart && (
          <AnatomyCardModal
            part={selectedPart}
            onClose={() => setSelectedPart(null)}
            onNavigateToDisease={(diseaseName) => {
              if (setActiveView) {
                setActiveView('diseases');
              }
            }}
            onAskAIDoctor={(promptText) => {
              window.dispatchEvent(new CustomEvent('app-open-ai-chat', { detail: { prompt: promptText } }));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
