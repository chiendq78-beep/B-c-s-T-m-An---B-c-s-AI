import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  ChevronRight, 
  AlertCircle, 
  Bookmark, 
  Filter, 
  Activity, 
  Sparkles, 
  Check, 
  Wind, 
  Heart, 
  Salad, 
  Layers, 
  Bone, 
  Brain, 
  Droplets, 
  Flame, 
  Eye, 
  Users, 
  ShieldAlert,
  MessageSquare,
  X,
  Stethoscope,
  Info,
  Clock,
  RotateCcw
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import DiseaseDetailView from './DiseaseDetailView';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { registerModal } from '../../utils/modalManager';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  COMPREHENSIVE_DISEASES, 
  SPECIALTY_CATEGORIES, 
  DiseaseItem, 
  SpecialtyCategory 
} from '../../data/diseasesData';

// Map icon name to Lucide icon component
const ICON_MAP: Record<string, any> = {
  Activity,
  Wind,
  Heart,
  Salad,
  Layers,
  Bone,
  Brain,
  Droplets,
  Flame,
  Eye,
  Sparkles,
  Users,
  ShieldAlert,
  Stethoscope
};

const ITEMS_PER_PAGE = 10;

export default function DiseaseView({ setActiveView }: { setActiveView: (view: any) => void }) {
  const { language, t } = useLanguage();
  const isEn = language === 'en';
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSeverity, setActiveSeverity] = useState('all');
  const [activeAgeGroup, setActiveAgeGroup] = useState('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [sortBy, setSortBy] = useState('alphabetical');
  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<DiseaseItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [dbDiseases, setDbDiseases] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Bookmarks persistence in localStorage
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tam_an_disease_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tam_an_disease_bookmarks', JSON.stringify(bookmarkedIds));
    } catch (e) {
      console.error("Failed to save bookmarks:", e);
    }
  }, [bookmarkedIds]);

  const toggleBookmark = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setBookmarkedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch optional custom diseases from Firestore on mount
  useEffect(() => {
    const fetchLiveDiseases = async () => {
      try {
        const snap = await getDocs(collection(db, 'diseases'));
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDbDiseases(list);
      } catch (err) {
        console.error("Error loading live diseases in DiseaseView:", err);
      }
    };
    fetchLiveDiseases();
  }, []);

  // Handle back gesture and ESC key for open modals
  useEffect(() => {
    if (!selectedDisease && !showFilters && !showCategoryModal) return;
    const closeFn = () => {
      if (showCategoryModal) setShowCategoryModal(false);
      else if (showFilters) setShowFilters(false);
      else if (selectedDisease) setSelectedDisease(null);
    };
    const unregister = registerModal('disease-view-submodal', closeFn);
    const handleBackGesture = (e: Event) => {
      e.preventDefault();
      closeFn();
    };
    window.addEventListener('app-back-press', handleBackGesture);
    return () => {
      unregister();
      window.removeEventListener('app-back-press', handleBackGesture);
    };
  }, [selectedDisease, showFilters, showCategoryModal]);

  // Listen for root menu reset to return to top of root disease catalog
  useEffect(() => {
    const handleResetToRoot = (e: any) => {
      if (e.detail?.view === 'disease') {
        setSelectedDisease(null);
        setShowFilters(false);
        setShowCategoryModal(false);
        setActiveCategory('all');
        setActiveSeverity('all');
        setActiveAgeGroup('all');
        setOnlyBookmarked(false);
        setSearchTerm('');
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        document.getElementById('top-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    window.addEventListener('app-reset-to-root', handleResetToRoot);
    return () => window.removeEventListener('app-reset-to-root', handleResetToRoot);
  }, []);

  // Merge static comprehensive database with Firestore additions
  const allDiseasesList = useMemo(() => {
    const mergedMap = new Map<string, DiseaseItem>();
    
    COMPREHENSIVE_DISEASES.forEach(d => {
      mergedMap.set(d.id, d);
    });

    dbDiseases.forEach(d => {
      const match = COMPREHENSIVE_DISEASES.find(
        item => item.id === d.id || item.name_vi.toLowerCase() === (d.name_vi || '').toLowerCase()
      );
      if (match) {
        mergedMap.set(match.id, { ...match, ...d });
      } else if (d.id && d.name_vi) {
        mergedMap.set(d.id, {
          id: d.id,
          name_vi: d.name_vi,
          name_en: d.name_en || '',
          icd10: d.icd10 || 'R69',
          category: d.category || 'Khác',
          category_id: d.category_id || 'all',
          severity: d.severity || 'mild',
          description: d.description || '',
          symptoms: d.symptoms || [],
          causes: d.causes || [],
          redFlags: d.redFlags || [],
          treatment: d.treatment || [],
          prevention: d.prevention || []
        });
      }
    });

    return Array.from(mergedMap.values());
  }, [dbDiseases]);

  // Compute actual counts for specialty pills
  const categoriesWithCounts = useMemo(() => {
    return SPECIALTY_CATEGORIES.map(cat => {
      if (cat.id === 'all') {
        return { ...cat, count: allDiseasesList.length };
      }
      const count = allDiseasesList.filter(d => 
        d.category_id === cat.id || 
        d.category.toLowerCase().includes(cat.shortName.toLowerCase())
      ).length;
      return { ...cat, count };
    });
  }, [allDiseasesList]);

  // Intelligent Auto-complete suggestions based on input
  const suggestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query || query.length < 2) return [];

    const matchedSuggestions: Array<{
      type: 'disease' | 'symptom' | 'icd';
      title: string;
      subtitle: string;
      disease: DiseaseItem;
    }> = [];

    for (const d of allDiseasesList) {
      // Name match
      if (d.name_vi.toLowerCase().includes(query) || (d.name_en && d.name_en.toLowerCase().includes(query))) {
        matchedSuggestions.push({
          type: 'disease',
          title: d.name_vi,
          subtitle: `${d.category} • ICD-10: ${d.icd10}`,
          disease: d
        });
        continue;
      }

      // ICD-10 code match
      if (d.icd10.toLowerCase().includes(query)) {
        matchedSuggestions.push({
          type: 'icd',
          title: `Mã ${d.icd10}: ${d.name_vi}`,
          subtitle: d.category,
          disease: d
        });
        continue;
      }

      // Symptoms match
      const matchedSymptom = d.symptoms.find(s => s.toLowerCase().includes(query));
      if (matchedSymptom) {
        matchedSuggestions.push({
          type: 'symptom',
          title: `${matchedSymptom} → ${d.name_vi}`,
          subtitle: `Gợi ý bệnh lý cho triệu chứng "${matchedSymptom}"`,
          disease: d
        });
      }
    }

    return matchedSuggestions.slice(0, 7);
  }, [searchTerm, allDiseasesList]);

  // Filtered & Sorted Diseases
  const filteredDiseases = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return allDiseasesList.filter(d => {
      // Category filter
      if (activeCategory !== 'all') {
        const selectedCat = SPECIALTY_CATEGORIES.find(c => c.id === activeCategory);
        const matchesCategory = d.category_id === activeCategory || 
          (selectedCat && d.category.toLowerCase().includes(selectedCat.shortName.toLowerCase()));
        if (!matchesCategory) return false;
      }

      // Severity filter
      if (activeSeverity !== 'all' && d.severity !== activeSeverity) {
        return false;
      }

      // Age group filter
      if (activeAgeGroup !== 'all' && d.targetAge && d.targetAge !== 'all' && d.targetAge !== activeAgeGroup) {
        return false;
      }

      // Bookmarked filter
      if (onlyBookmarked && !bookmarkedIds.includes(d.id)) {
        return false;
      }

      // Search term filter (Matches name, english name, ICD-10, description, or symptoms)
      if (query) {
        const inNameVi = d.name_vi.toLowerCase().includes(query);
        const inNameEn = d.name_en ? d.name_en.toLowerCase().includes(query) : false;
        const inIcd = d.icd10.toLowerCase().includes(query);
        const inDesc = d.description.toLowerCase().includes(query);
        const inSymptoms = d.symptoms.some(s => s.toLowerCase().includes(query));
        if (!inNameVi && !inNameEn && !inIcd && !inDesc && !inSymptoms) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const severityRank: Record<string, number> = { 'severe': 3, 'moderate': 2, 'mild': 1 };

      if (sortBy === 'alphabetical') {
        return a.name_vi.localeCompare(b.name_vi, 'vi');
      } else if (sortBy === 'alphabetical-desc') {
        return b.name_vi.localeCompare(a.name_vi, 'vi');
      } else if (sortBy === 'severity-desc') {
        return (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
      } else if (sortBy === 'severity-asc') {
        return (severityRank[a.severity] || 0) - (severityRank[b.severity] || 0);
      } else if (sortBy === 'icd') {
        return a.icd10.localeCompare(b.icd10);
      }
      return 0;
    });
  }, [allDiseasesList, activeCategory, activeSeverity, activeAgeGroup, onlyBookmarked, searchTerm, sortBy, bookmarkedIds]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchTerm, activeCategory, activeSeverity, activeAgeGroup, onlyBookmarked, sortBy]);

  // Trigger quick consultation with AI Doctor for specific disease
  const handleChatWithAI = (e: React.MouseEvent, disease: DiseaseItem) => {
    e.stopPropagation();
    const prompt = `Chào Bác sĩ Tâm An, tôi đang tra cứu về bệnh lý: ${disease.name_vi} (${disease.category}, Mã ICD-10: ${disease.icd10}). Xin bác sĩ tư vấn chi tiết về nguyên nhân khởi phát, các dấu hiệu cảnh báo nguy hiểm (red flags), phác đồ chăm sóc/điều trị y khoa và các biện pháp phòng ngừa bệnh này.`;
    window.dispatchEvent(new CustomEvent('app-open-ai-chat', { detail: { prompt } }));
  };

  // Quick reset filters
  const resetFilters = () => {
    setActiveCategory('all');
    setActiveSeverity('all');
    setActiveAgeGroup('all');
    setOnlyBookmarked(false);
    setSortBy('alphabetical');
    setSearchTerm('');
  };

  const handleSelectDisease = (disease: DiseaseItem) => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
    setSelectedDisease(disease);
  };

  const hasActiveFilters = activeCategory !== 'all' || activeSeverity !== 'all' || activeAgeGroup !== 'all' || onlyBookmarked || searchTerm !== '';

  const activeCategoryObj = SPECIALTY_CATEGORIES.find(c => c.id === activeCategory) || SPECIALTY_CATEGORIES[0];

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-bg min-h-full pb-28">
      {/* Full-Screen Disease Detail View Modal / Overlay */}
      <AnimatePresence>
        {selectedDisease && (
          <DiseaseDetailView 
            disease={selectedDisease as any} 
            onBack={() => setSelectedDisease(null)} 
            onHerbClick={() => {
              setSelectedDisease(null);
              setActiveView('herb');
            }}
            onExerciseClick={() => {
              setSelectedDisease(null);
              setActiveView('health');
            }}
          />
        )}
      </AnimatePresence>

      {/* Header & Title */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {isEn ? 'Disease & Clinical Library' : 'Thư viện Bệnh lý'}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
                <Stethoscope className="w-3 h-3 text-teal-600" />
                {isEn ? 'ICD-10 Clinical Standard' : 'Chuẩn Y Khoa ICD-10'}
              </span>
            </div>
          </div>
        </div>

        {/* Smart Search Bar with Auto-complete */}
        <div ref={searchContainerRef} className="relative z-30">
          <div className="flex gap-2">
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={isEn ? "Search disease name, symptoms (headache, cough, fever) or ICD-10..." : "Tra cứu tên bệnh, triệu chứng (ví dụ: đau đầu, ho, sốt)..."}
                className="w-full h-9 sm:h-10 bg-white/5 border border-border focus:border-primary/50 rounded-xl pr-9 pl-9 text-xs sm:text-[13px] text-white placeholder:text-text-dim/80 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-light shadow-inner"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 flex items-center justify-center text-text-dim hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-2.5 sm:px-3 h-9 sm:h-10 rounded-xl border flex items-center gap-1.5 transition-all shadow-xs cursor-pointer",
                showFilters || (hasActiveFilters && (activeSeverity !== 'all' || activeAgeGroup !== 'all' || onlyBookmarked))
                  ? "bg-primary text-bg border-primary shadow-[0_0_12px_rgba(45,212,191,0.25)] font-bold" 
                  : "bg-white/5 text-text-dim border-white/10 hover:text-white hover:border-primary/30"
              )}
              title={isEn ? "Advanced filters" : "Bộ lọc nâng cao"}
            >
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs hidden sm:inline">{isEn ? 'Filters' : 'Bộ lọc'}</span>
              {(activeSeverity !== 'all' || activeAgeGroup !== 'all' || onlyBookmarked) && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              )}
            </button>
          </div>

          {/* Auto-complete Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute left-0 right-0 top-full mt-2 bg-panel/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-40"
              >
                <div className="p-2 border-b border-white/5 flex items-center justify-between text-[10px] text-text-dim uppercase tracking-wider font-bold px-3">
                  <span>{isEn ? `Medical Suggestions (${suggestions.length})` : `Gợi ý y khoa (${suggestions.length})`}</span>
                  <span>{isEn ? 'Click to open details' : 'Bấm để mở chi tiết'}</span>
                </div>
                <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        handleSelectDisease(sug.disease);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider",
                            sug.type === 'symptom' ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                            sug.type === 'icd' ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" :
                            "bg-primary/20 text-primary border border-primary/30"
                          )}>
                            {sug.type === 'symptom' ? (isEn ? 'Symptom' : 'Triệu chứng') : sug.type === 'icd' ? 'ICD' : (isEn ? 'Disease' : 'Bệnh lý')}
                          </span>
                          <h5 className="text-sm font-medium text-white group-hover:text-primary transition-colors truncate">
                            {isEn ? (sug.disease.name_en || sug.title) : sug.title}
                          </h5>
                        </div>
                        <p className="text-[11px] text-text-dim mt-0.5 truncate">{sug.subtitle}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-dim group-hover:text-primary transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-panel/70 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Bộ lọc & Phân loại nâng cao</h4>
                </div>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="text-text-dim hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Severity Filter */}
              <div className="space-y-2.5">
                <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Mức độ nguy cơ</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Tất cả mức độ', value: 'all' },
                    { label: '● Nhẹ', value: 'mild', color: 'text-emerald-400' },
                    { label: '● Cần theo dõi', value: 'moderate', color: 'text-amber-400' },
                    { label: '● Nguy hiểm - Cần khám ngay', value: 'severe', color: 'text-rose-400' },
                  ].map(s => (
                    <button
                      key={s.value}
                      onClick={() => setActiveSeverity(s.value)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all border cursor-pointer",
                        activeSeverity === s.value
                          ? "bg-primary/20 text-primary border-primary/40 shadow-xs"
                          : "bg-white/5 text-text-dim border-transparent hover:border-white/15"
                      )}
                    >
                      <span className={s.color}>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Group Filter */}
              <div className="space-y-2.5">
                <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Độ tuổi phổ biến</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Mọi lứa tuổi', value: 'all' },
                    { label: 'Trẻ em', value: 'child' },
                    { label: 'Người trưởng thành', value: 'adult' },
                    { label: 'Người cao tuổi', value: 'elderly' },
                  ].map(a => (
                    <button
                      key={a.value}
                      onClick={() => setActiveAgeGroup(a.value)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all border cursor-pointer",
                        activeAgeGroup === a.value
                          ? "bg-primary/20 text-primary border-primary/40 shadow-xs"
                          : "bg-white/5 text-text-dim border-transparent hover:border-white/15"
                      )}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bookmarked Filter & Sorting */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
                    {isEn ? 'Bookmarks & Favorites' : 'Đã lưu & Yêu thích'}
                  </p>
                  <button
                    onClick={() => setOnlyBookmarked(!onlyBookmarked)}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                      onlyBookmarked 
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
                        : "bg-white/5 text-text-dim border-white/5 hover:border-white/15"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Bookmark className={cn("w-4 h-4", onlyBookmarked && "fill-amber-400 text-amber-400")} />
                      <span>{isEn ? `Bookmarked only (${bookmarkedIds.length})` : `Chỉ xem bệnh đã lưu (${bookmarkedIds.length})`}</span>
                    </div>
                    {onlyBookmarked && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
                    {isEn ? 'Sort Disease List' : 'Sắp xếp danh sách'}
                  </p>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary/50 cursor-pointer"
                  >
                    <option value="alphabetical" className="bg-slate-900 text-white">{isEn ? 'Disease Name (A → Z)' : 'Tên bệnh (A → Z)'}</option>
                    <option value="alphabetical-desc" className="bg-slate-900 text-white">{isEn ? 'Disease Name (Z → A)' : 'Tên bệnh (Z → A)'}</option>
                    <option value="severity-desc" className="bg-slate-900 text-white">{isEn ? 'Severity (High → Low)' : 'Mức độ nguy cơ (Cao → Thấp)'}</option>
                    <option value="severity-asc" className="bg-slate-900 text-white">{isEn ? 'Severity (Low → High)' : 'Mức độ nguy cơ (Thấp → Cao)'}</option>
                    <option value="icd" className="bg-slate-900 text-white">{isEn ? 'ICD-10 Code' : 'Mã chuẩn ICD-10'}</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <button 
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 text-xs text-text-dim hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Reset all filters' : 'Xóa tất cả bộ lọc'}</span>
                </button>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-1.5 rounded-xl bg-primary text-bg font-bold text-xs uppercase tracking-wider shadow-sm hover:brightness-110 transition-all cursor-pointer"
                >
                  {isEn ? `Apply (${filteredDiseases.length})` : `Áp dụng (${filteredDiseases.length})`}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Specialty Category Pills (Scrollable Horizontal Pills) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
            {isEn ? '12 SPECIALTY DEPARTMENTS:' : '12 NHÓM CHUYÊN KHOA:'}
          </p>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>{isEn ? 'View all' : 'Xem danh sách'}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1.5 pt-0.5 scroll-smooth">
          {categoriesWithCounts.map(cat => {
            const Icon = ICON_MAP[cat.iconName] || Activity;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all flex-shrink-0 border cursor-pointer group select-none",
                  isActive
                    ? "bg-primary text-bg border-primary shadow-[0_0_15px_rgba(45,212,191,0.25)] font-bold scale-[1.02]" 
                    : "bg-white/5 text-text-dim border-white/5 hover:border-white/20 hover:text-white hover:bg-white/[0.08]"
                )}
              >
                <Icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", isActive ? "text-bg" : "text-primary")} />
                <span>{isEn ? (cat.shortName_en || cat.shortName) : cat.shortName}</span>
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                  isActive ? "bg-bg/25 text-bg" : "bg-white/10 text-text-dim group-hover:text-white"
                )}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Disease List Section Header & Result Count */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">
            {activeCategoryObj.id === 'all' 
              ? (isEn ? 'All Specialties' : 'Tất cả chuyên khoa') 
              : (isEn ? `Department: ${activeCategoryObj.name_en || activeCategoryObj.name}` : `Khoa: ${activeCategoryObj.name}`)}
          </span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-[11px] text-teal-400 hover:text-teal-300 underline font-medium cursor-pointer"
          >
            {isEn ? 'Clear filters' : 'Bỏ lọc'}
          </button>
        )}
      </div>

      {/* Disease Cards Grid */}
      <div className="space-y-4">
        {filteredDiseases.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4">
              {filteredDiseases.slice(0, visibleCount).map((disease) => {
                const categoryConfig = SPECIALTY_CATEGORIES.find(c => c.id === disease.category_id);
                const IconComponent = categoryConfig ? (ICON_MAP[categoryConfig.iconName] || Activity) : Activity;
                const isBookmarked = bookmarkedIds.includes(disease.id);

                return (
                  <motion.div
                    key={disease.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    onClick={() => handleSelectDisease(disease)}
                    className="w-full bg-panel hover:bg-panel/90 p-5 rounded-2xl border border-border shadow-lg transition-all duration-200 group hover:border-primary/40 cursor-pointer relative overflow-hidden"
                  >
                    {/* Top Row: Specialty Icon, Disease Name, Category Tag, Bookmark */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* Icon Khoa */}
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 transition-all duration-200 shadow-inner",
                          disease.severity === 'mild' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/20" :
                          disease.severity === 'moderate' ? "bg-amber-500/10 text-amber-400 border-amber-500/20 group-hover:bg-amber-500/20" :
                          "bg-rose-500/10 text-rose-400 border-rose-500/20 group-hover:bg-rose-500/20"
                        )}>
                          <IconComponent className="w-6 h-6" />
                        </div>

                        {/* Title & Metadata */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                              {isEn ? (disease.name_en || disease.name_vi) : disease.name_vi}
                            </h3>
                            <span className="text-[11px] text-slate-600 font-light hidden sm:inline">
                              {isEn ? `(${disease.name_vi})` : (disease.name_en ? `(${disease.name_en})` : '')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[10px] font-semibold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-300">
                              ICD-10: {disease.icd10}
                            </span>
                            <span className="text-[9px] font-bold uppercase text-teal-800 px-2 py-0.5 bg-teal-50 rounded border border-teal-200 tracking-wider">
                              {isEn ? (categoryConfig?.name_en || disease.category) : disease.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bookmark Button */}
                      <button
                        onClick={(e) => toggleBookmark(e, disease.id)}
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer flex-shrink-0",
                          isBookmarked 
                            ? "bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-xs" 
                            : "bg-slate-100 text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300"
                        )}
                        title={isBookmarked ? (isEn ? "Remove bookmark" : "Bỏ lưu bệnh này") : (isEn ? "Save to bookmarks" : "Lưu bệnh để theo dõi")}
                      >
                        <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-amber-400")} />
                      </button>
                    </div>

                    {/* Middle: Short Description */}
                    <p className="text-xs sm:text-sm text-slate-800 font-normal leading-relaxed mt-3 line-clamp-2">
                      {disease.description}
                    </p>

                    {/* Symptoms List */}
                    {disease.symptoms && disease.symptoms.length > 0 && (
                      <div className="mt-3.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                          <Activity className="w-3 h-3 text-primary" />
                          <span>{isEn ? 'Key symptoms:' : 'Triệu chứng chính:'}</span>
                        </div>
                        <p className="text-xs text-slate-800 font-normal leading-relaxed">
                          {disease.symptoms.map((symptom, idx) => (
                            <span key={idx}>
                              {idx > 0 && <span className="text-teal-600 mx-1.5 font-normal">•</span>}
                              <span>{symptom}</span>
                            </span>
                          ))}
                        </p>
                      </div>
                    )}

                    {/* Severity Badge & Bottom Row */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                      {/* Mức độ nguy cơ */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">{isEn ? 'Severity:' : 'Mức độ:'}</span>
                        {disease.severity === 'mild' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            {isEn ? 'Mild' : 'Nhẹ'}
                          </span>
                        )}
                        {disease.severity === 'moderate' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            {isEn ? 'Moderate / Monitor' : 'Cần theo dõi'}
                          </span>
                        )}
                        {disease.severity === 'severe' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                            {isEn ? 'Severe / Urgent care' : 'Nguy hiểm - Cần khám ngay'}
                          </span>
                        )}
                      </div>

                      {/* Shortcut: Trò chuyện với Bác sĩ AI về bệnh này */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleChatWithAI(e, disease)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 hover:text-teal-200 border border-teal-500/30 text-[11px] font-semibold transition-all shadow-xs active:scale-95 cursor-pointer group/btn"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-teal-400 group-hover/btn:scale-110 transition-transform" />
                          <span>{isEn ? 'Consult AI Doctor →' : 'Hỏi Bác sĩ AI về bệnh này →'}</span>
                        </button>

                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-text-dim group-hover:text-primary transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination / Load More Bar */}
            {visibleCount < filteredDiseases.length ? (
              <div className="pt-2 text-center space-y-2">
                <button
                  onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer"
                >
                  {isEn ? `Load more diseases (+${Math.min(ITEMS_PER_PAGE, filteredDiseases.length - visibleCount)})` : `Xem thêm bệnh lý (+${Math.min(ITEMS_PER_PAGE, filteredDiseases.length - visibleCount)})`}
                </button>
                <p className="text-[11px] text-text-dim">
                  {isEn ? `Showing ${visibleCount} of ${filteredDiseases.length} results` : `Đã tải ${visibleCount} / ${filteredDiseases.length} kết quả`}
                </p>
              </div>
            ) : (
              <p className="text-center text-xs text-text-dim py-4">
                {isEn ? `Showing all ${filteredDiseases.length} matching diseases` : `Đã hiển thị toàn bộ ${filteredDiseases.length} bệnh lý phù hợp`}
              </p>
            )}
          </>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 bg-panel/40 rounded-3xl border border-white/5 p-8">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-text-dim">
              <Search className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="text-white font-serif text-lg">{isEn ? 'No matching diseases found' : 'Không tìm thấy bệnh lý phù hợp'}</p>
              <p className="text-xs text-text-dim font-light max-w-sm mx-auto">
                {isEn ? `No records match "${searchTerm}" or the selected filters.` : `Không có kết quả nào khớp với từ khóa "${searchTerm}" hoặc bộ lọc hiện tại.`}
              </p>
            </div>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-primary text-bg font-bold text-xs uppercase tracking-wider shadow-sm hover:brightness-110 transition-all cursor-pointer"
            >
              {isEn ? 'Reset all filters' : 'Đặt lại tất cả bộ lọc'}
            </button>
          </div>
        )}
      </div>

      {/* Specialty Category Selector Modal (Grid View) */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-panel border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-white">Hệ thống 12 Chuyên khoa Y tế</h3>
                  <p className="text-xs text-text-dim mt-0.5">Chọn chuyên khoa để lọc nhanh danh mục bệnh</p>
                </div>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-dim hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body: 12 Specialty Grid */}
              <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoriesWithCounts.map(cat => {
                  const Icon = ICON_MAP[cat.iconName] || Activity;
                  const isSelected = activeCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setShowCategoryModal(false);
                      }}
                      className={cn(
                        "p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer group",
                        isSelected
                          ? "bg-primary/20 text-white border-primary/50 shadow-md ring-1 ring-primary/30"
                          : "bg-white/5 hover:bg-white/10 border-white/5 text-slate-300 hover:text-white"
                      )}
                    >
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center border transition-all flex-shrink-0",
                        isSelected 
                          ? "bg-primary text-bg border-primary" 
                          : "bg-white/5 text-primary border-white/10 group-hover:scale-105"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold leading-snug group-hover:text-primary transition-colors">
                          {cat.name}
                        </h4>
                        <p className="text-[10px] text-text-dim mt-0.5">
                          {cat.count} bệnh lý tra cứu
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Preliminary Diagnostics Banner */}
      <div className="bg-panel rounded-3xl p-6 text-white shadow-2xl border border-primary/20 relative overflow-hidden group">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary text-bg rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.4)] group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-lg font-bold">Chẩn đoán Sơ bộ cùng Bác sĩ AI</h4>
              <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mt-0.5">Medical Expert System</p>
            </div>
          </div>
          <p className="text-xs text-text-dim leading-relaxed font-light">
            Bạn đang có các triệu chứng bất thường? Hãy trò chuyện với Bác sĩ Tâm An AI để được phân tích dựa trên tiền sử, triệu chứng lâm sàng và chỉ số sinh tồn.
          </p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('app-open-ai-chat', { 
              detail: { prompt: "Chào Bác sĩ Tâm An, tôi đang cảm thấy không khỏe và cần được tư vấn chẩn đoán sơ bộ các triệu chứng của tôi." } 
            }))}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-bg font-bold py-3 rounded-xl text-xs uppercase tracking-widest shadow-lg hover:brightness-105 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Mở khung khám bệnh AI ngay</span>
          </button>
        </div>
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </div>
  );
}
