import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Leaf, 
  Search, 
  Camera, 
  ChevronRight, 
  Bookmark, 
  Sparkles, 
  Filter, 
  X, 
  Activity, 
  Calendar, 
  Sun,
  Flame,
  Droplets,
  Wind,
  Moon,
  Zap,
  RotateCcw,
  Check,
  MessageSquare,
  ShieldCheck,
  BookOpen,
  Info
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { identifyHerb } from '../../services/gemini';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import DailySymptomHerbSuggestions from '../DailySymptomHerbSuggestions';
import HerbDetailModal from '../HerbDetailModal';
import { registerModal } from '../../utils/modalManager';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  COMPREHENSIVE_HERBS, 
  HERB_GROUPS, 
  SYMPTOM_FILTER_TAGS, 
  NATURE_COLOR_MAP, 
  HerbItem, 
  HerbNature, 
  HerbTaste, 
  HerbMeridian 
} from '../../data/herbsData';

const SEASONAL_HERBS_DATA = [
  {
    month: 1,
    season: 'Mùa Xuân',
    focus: 'Dưỡng can (gan), bồi bổ nguyên khí, điều hòa cơ thể đầu xuân',
    herbName: 'Kỷ tử',
    scientificName: 'Lycium barbarum',
    benefit: 'Bổ can thận, sáng mắt, tăng cường miễn dịch, chống lão hóa',
    tip: 'Hãm trà kỷ tử cùng táo đỏ uống ấm mỗi sáng giúp nhuận sắc, dưỡng huyết.',
    image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=400'
  },
  {
    month: 2,
    season: 'Mùa Xuân',
    focus: 'Hoạt huyết, trừ phong thấp, thanh lọc khí lạnh tích tụ',
    herbName: 'Ngải cứu',
    scientificName: 'Artemisia vulgaris',
    benefit: 'Kinh nguyệt không đều, trị đau nhức khớp do sương ẩm, an thai',
    tip: 'Làm ngải cứu chưng trứng hoặc sắc ấm để tán hàn khử thấp tốt cho xương khớp.',
    image: 'https://images.unsplash.com/photo-1515589654462-a9881e276b8a?auto=format&fit=crop&q=80&w=400'
  },
  {
    month: 3,
    season: 'Mùa Xuân',
    focus: 'Bổ khí huyết, dưỡng phế nhuận tràng, giải nhiệt nhẹ xuân hè',
    herbName: 'Đinh lăng',
    scientificName: 'Polyscias fruticosa',
    benefit: 'Tăng dẻo dai cơ thể, an thần thông mạch, giảm mệt mỏi thể lực',
    tip: 'Dùng lá đinh lăng sắc lấy nước uống hoặc nấu súp bồi bổ cơ thể suy nhược.',
    image: 'https://images.unsplash.com/photo-1628156108169-c09e33454652?auto=format&fit=crop&q=80&w=400'
  },
  {
    month: 4,
    season: 'Mùa Hạ',
    focus: 'Tán nhiệt phế, thanh nhiệt tiêu độc cơ thể thời điểm chớm hạ',
    herbName: 'Kim ngân hoa',
    scientificName: 'Lonicera japonica',
    benefit: 'Thanh nhiệt giải độc, giải cảm sốt, giảm mụn nhọt rôm sảy nhiệt miệng',
    tip: 'Sử dụng trà kim ngân hoa hãm nóng uống thay trà để làm dịu mụn nhọt phát ban.',
    image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&q=80&w=400'
  },
  {
    month: 5,
    season: 'Mùa Hạ',
    focus: 'Thanh lọc đường tiêu hóa, giải trừ nắng nóng ngột ngạt nhiệt đới',
    herbName: 'Lá vối',
    scientificName: 'Cleistocalyx operculatus',
    benefit: 'Kích thích tiêu hóa, thanh nhiệt cơ thể, chống oxy hóa hạ đường huyết',
    tip: 'Nước vối ủ nóng uống hàng ngày giúp giải khát sâu, tiêu thực cực tốt sau bữa ăn.',
    image: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&q=80&w=400'
  },
  {
    month: 6,
    season: 'Mùa Hạ',
    focus: 'Giải nhiệt sâu, sinh tân dịch chống mất nước oi bức đỉnh điểm',
    herbName: 'Cát căn (Sắn dây)',
    scientificName: 'Pueraria lobata',
    benefit: 'Thanh thải phế nhiệt, hạ sốt nhanh, giảm mỏi cơ do trúng nắng',
    tip: 'Pha bột sắn dây với chút nước lọc và nước cốt chanh để có ly trà giải nhiệt tức thì.',
    image: 'https://images.unsplash.com/photo-1615485925602-4836978a5175?auto=format&fit=crop&q=80&w=400'
  },
  {
    month: 7,
    season: 'Mùa Thu',
    focus: 'Dưỡng âm phế, bù nước làm ẩm khí quản chớm khô lạnh hanh hao',
    herbName: 'Mạch môn',
    scientificName: 'Ophiopogon japonicus',
    benefit: 'Dưỡng vị sinh tân, thanh tâm trừ phiền, trị ho lâu ngày, ho khan phổi rát',
    tip: 'Mạch môn kết hợp với cát cánh sắc lấy nước súc họng và uống giúp nhuận phế phế suy.',
    image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=400'
  },
  {
    month: 8,
    season: 'Mùa Thu',
    focus: 'Nhuận phế chỉ khái, an thần dễ ngủ tiết thu sương mát ngọt',
    herbName: 'Bách hợp (Tỏi rừng)',
    scientificName: 'Lilium brownii',
    benefit: 'Bổ phổi trị ho khan bứt rứt, định tâm thư giãn thần kinh ban đêm',
    tip: 'Nấu cháo bách hợp hạt sen mật ong ăn ấm vào buổi tối để dưỡng thần mĩ mãn.',
    image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=400'
  },
  {
    month: 9,
    season: 'Mùa Thu',
    focus: 'Tuyên phế khí, thông đờm thông họng ngày mưa gió mùa thu rụng lá',
    herbName: 'Cát cánh',
    scientificName: 'Platycodon grandiflorus',
    benefit: 'Trị viêm đau họng rát, khản tiếng, trừ đờm ráo, lợi phế khí khai thông',
    tip: 'Ngậm cát cánh cắt lát tẩm mật ong hoặc hãm trà ấm giúp thanh giọng tiêu đờm nhanh.',
    image: 'https://images.unsplash.com/photo-1564849141443-4dc9cf10e53a?auto=format&fit=crop&q=80&w=400'
  },
  {
    month: 10,
    season: 'Mùa Đông',
    focus: 'Ôn vị kiện tỳ, sưởi ấm kinh lạc chống lạnh xâm nhập đầu đông',
    herbName: 'Sinh khương (Gừng tươi)',
    scientificName: 'Zingiber officinale',
    benefit: 'Ấm bụng bổ tiêu hóa, chống đầy bụng, tán phong hàn trị ớn lạnh gai rét',
    tip: 'Nhâm nhi tách trà gừng mật ong sả nóng ngay khi vừa ra gió về để ngăn nhiễm lạnh.',
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=400'
  },
  {
    month: 11,
    season: 'Mùa Đông',
    focus: 'Bổ hỏa trợ dương, hồi ấm huyết mạch những ngày gió bấc giá buốt',
    herbName: 'Quế chi / Quế nhục',
    scientificName: 'Cinnamomum cassia',
    benefit: 'Tăng cường tuần hoàn máu ngoại vi, làm ấm chân tay tê lạnh, chỉ thống giảm đau',
    tip: 'Thêm bột quế hoặc mẩu quế nhỏ vào thực phẩm bồi dưỡng hoặc trà gừng để hoạt huyết ấm thân.',
    image: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&q=80&w=400'
  },
  {
    month: 12,
    season: 'Mùa Đông',
    focus: 'Bổ trung ích khí, an dưỡng tim mạch, hồi phục sinh lực cuối năm',
    herbName: 'Táo nhân / Đại táo',
    scientificName: 'Ziziphus jujuba',
    benefit: 'Bổ tỳ vị ích khí huyết, an thần ngủ ngon, điều hòa trăm vị thuốc',
    tip: 'Kết hợp đại táo hầm chung gà ác, hạt sen bồi dưỡng nguyên khí cực cao ngày cuối năm.',
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=400'
  }
];

const ALL_NATURES: HerbNature[] = ['Hàn', 'Lương', 'Bình', 'Ôn', 'Nhiệt'];
const ALL_TASTES: HerbTaste[] = ['Ngọt', 'Cay', 'Đắng', 'Chua', 'Mặn'];
const ALL_MERIDIANS: HerbMeridian[] = ['Phế', 'Tỳ', 'Vị', 'Tâm', 'Can', 'Thận', 'Đởm', 'Bàng quang'];

const getSeasonStyles = (season: string) => {
  switch (season) {
    case 'Mùa Xuân':
      return {
        accentText: 'text-emerald-400',
        bgAccent: 'bg-emerald-500/10',
        borderAccent: 'border-emerald-500/20',
        glowAccent: 'shadow-[0_0_20px_rgba(16,185,129,0.1)]',
        badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
      };
    case 'Mùa Hạ':
      return {
        accentText: 'text-cyan-400',
        bgAccent: 'bg-cyan-500/10',
        borderAccent: 'border-cyan-500/20',
        glowAccent: 'shadow-[0_0_20px_rgba(6,182,212,0.1)]',
        badge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
      };
    case 'Mùa Thu':
      return {
        accentText: 'text-amber-400',
        bgAccent: 'bg-amber-500/10',
        borderAccent: 'border-amber-500/20',
        glowAccent: 'shadow-[0_0_20px_rgba(245,158,11,0.1)]',
        badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
      };
    case 'Mùa Đông':
    default:
      return {
        accentText: 'text-sky-400',
        bgAccent: 'bg-sky-500/10',
        borderAccent: 'border-sky-500/20',
        glowAccent: 'shadow-[0_0_20px_rgba(56,189,248,0.1)]',
        badge: 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
      };
  }
};

interface HerbAIResult {
  name_vi: string;
  name_scientific: string;
  family: string;
  partUsed: string;
  benefits: string[];
  usage: string;
  dosage: string;
  contraindications: string[];
  identified: boolean;
}

export default function HerbView() {
  const { language, t } = useLanguage();
  const isEn = language === 'en';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedSymptom, setSelectedSymptom] = useState<string>('all');
  const [selectedNature, setSelectedNature] = useState<HerbNature | 'all'>('all');
  const [selectedTaste, setSelectedTaste] = useState<HerbTaste | 'all'>('all');
  const [selectedMeridian, setSelectedMeridian] = useState<HerbMeridian | 'all'>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState<boolean>(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  
  // Modal state
  const [selectedHerbForModal, setSelectedHerbForModal] = useState<HerbItem | null>(null);

  // Bookmarks local state
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bookmarked_herbs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Seasonal widget
  const [selectedSeasonalMonth, setSelectedSeasonalMonth] = useState<number>(() => {
    return new Date().getMonth() + 1;
  });

  // AI Camera scanning state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<HerbAIResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync bookmark updates from global events
  useEffect(() => {
    const handleBookmarkChange = () => {
      try {
        const saved = localStorage.getItem('bookmarked_herbs');
        setBookmarkedIds(saved ? JSON.parse(saved) : []);
      } catch {
        // ignore
      }
    };
    window.addEventListener('app-herbs-bookmark-changed', handleBookmarkChange);
    return () => window.removeEventListener('app-herbs-bookmark-changed', handleBookmarkChange);
  }, []);

  // Listen for root menu reset to return to top of Herb view
  useEffect(() => {
    const handleResetToRoot = (e: any) => {
      if (e.detail?.view === 'herb') {
        setSelectedHerbForModal(null);
        setIsFilterPanelOpen(false);
        setSelectedGroup('all');
        setSelectedSymptom(null);
        setSelectedNature('all');
        setSelectedTaste('all');
        setSelectedMeridian('all');
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

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: string[];
    if (bookmarkedIds.includes(id)) {
      updated = bookmarkedIds.filter(item => item !== id);
    } else {
      updated = [...bookmarkedIds, id];
    }
    setBookmarkedIds(updated);
    localStorage.setItem('bookmarked_herbs', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('app-herbs-bookmark-changed'));
  };

  const handleAskAIAboutHerb = (herb: HerbItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const prompt = `Chào Bác sĩ Tâm An, xin tư vấn cho tôi về vị thuốc Đông y ${herb.name_vi} (Tính ${herb.nature}, vị ${herb.tastes.join('/')}, quy kinh ${herb.meridians.join('/')}). Trường hợp của tôi có phù hợp dùng không và cách phối ngũ liều dùng chuẩn như thế nào?`;
    window.dispatchEvent(new CustomEvent('app-open-ai-chat', { detail: { prompt } }));
  };

  // Filter herbs based on search, group, symptom, nature, taste, meridian, and bookmarks
  const filteredHerbs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return COMPREHENSIVE_HERBS.filter(herb => {
      // Search term
      if (query) {
        const matchName = herb.name_vi.toLowerCase().includes(query);
        const matchEn = herb.name_en?.toLowerCase().includes(query);
        const matchSci = herb.name_scientific.toLowerCase().includes(query);
        const matchFamily = herb.family.toLowerCase().includes(query);
        const matchAction = herb.summaryAction.toLowerCase().includes(query);
        const matchSymptoms = herb.matchedSymptoms.some(s => s.toLowerCase().includes(query));
        const matchNature = herb.nature.toLowerCase().includes(query);
        const matchTaste = herb.tastes.some(t => t.toLowerCase().includes(query));
        const matchMeridian = herb.meridians.some(m => m.toLowerCase().includes(query));

        if (!matchName && !matchEn && !matchSci && !matchFamily && !matchAction && !matchSymptoms && !matchNature && !matchTaste && !matchMeridian) {
          return false;
        }
      }

      // Group filter
      if (selectedGroup !== 'all' && herb.groupId !== selectedGroup) {
        return false;
      }

      // Symptom filter
      if (selectedSymptom !== 'all') {
        const tag = SYMPTOM_FILTER_TAGS.find(t => t.id === selectedSymptom);
        if (tag && tag.symptom) {
          const hasSymptom = herb.matchedSymptoms.some(s => 
            s.toLowerCase().includes(tag.symptom.toLowerCase()) || 
            tag.symptom.toLowerCase().includes(s.toLowerCase())
          );
          if (!hasSymptom) return false;
        }
      }

      // Nature filter
      if (selectedNature !== 'all' && herb.nature !== selectedNature) {
        return false;
      }

      // Taste filter
      if (selectedTaste !== 'all' && !herb.tastes.includes(selectedTaste)) {
        return false;
      }

      // Meridian filter
      if (selectedMeridian !== 'all' && !herb.meridians.includes(selectedMeridian) && !herb.meridians.includes('12 đường kinh')) {
        return false;
      }

      // Bookmark filter
      if (onlyBookmarked && !bookmarkedIds.includes(herb.id)) {
        return false;
      }

      return true;
    });
  }, [searchTerm, selectedGroup, selectedSymptom, selectedNature, selectedTaste, selectedMeridian, onlyBookmarked, bookmarkedIds]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedGroup !== 'all') count++;
    if (selectedSymptom !== 'all') count++;
    if (selectedNature !== 'all') count++;
    if (selectedTaste !== 'all') count++;
    if (selectedMeridian !== 'all') count++;
    if (onlyBookmarked) count++;
    return count;
  }, [selectedGroup, selectedSymptom, selectedNature, selectedTaste, selectedMeridian, onlyBookmarked]);

  const resetAllFilters = () => {
    setSelectedGroup('all');
    setSelectedSymptom('all');
    setSelectedNature('all');
    setSelectedTaste('all');
    setSelectedMeridian('all');
    setOnlyBookmarked(false);
    setSearchTerm('');
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCapturedImage(base64String);
        analyzeHerb(base64String.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeHerb = async (base64: string) => {
    setIsAnalyzing(true);
    setAiResult(null);
    try {
      const response = await identifyHerb(base64);
      const parsed: HerbAIResult = JSON.parse(response);
      setAiResult(parsed);
    } catch (error) {
      console.error(error);
      setAiResult({
        name_vi: "Lỗi kết nối",
        name_scientific: "",
        family: "",
        partUsed: "",
        benefits: [],
        usage: "",
        dosage: "",
        contraindications: [],
        identified: false
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const closeCamera = () => {
    setCapturedImage(null);
    setAiResult(null);
  };

  // Find matching herb in database from AI result
  const matchedHerbFromAI = useMemo(() => {
    if (!aiResult || !aiResult.identified) return null;
    const name = aiResult.name_vi?.toLowerCase();
    const sci = aiResult.name_scientific?.toLowerCase();
    return COMPREHENSIVE_HERBS.find(h => 
      h.name_vi.toLowerCase().includes(name) || 
      name?.includes(h.name_vi.toLowerCase()) ||
      (sci && h.name_scientific.toLowerCase().includes(sci))
    ) || null;
  }, [aiResult]);

  return (
    <div className="p-4 sm:p-6 space-y-7 bg-bg min-h-full pb-24 text-left">
      {/* Header with AI Camera Button */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.25em]">
            {isEn ? 'Traditional Medicine • Pharmacopoeia' : 'Y Học Cổ Truyền • Dược Điển'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 flex-nowrap">
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl italic font-light text-white leading-tight truncate">
            {isEn ? 'Traditional Herbal Medicine' : 'Dược Học Cổ Truyền'}
          </h1>

          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 bg-emerald-600/85 hover:bg-emerald-600 backdrop-blur-md text-white-pure px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide shadow-md shadow-emerald-700/25 hover:shadow-lg hover:shadow-emerald-700/35 hover:-translate-y-0.5 active:translate-y-0 transition-all border border-emerald-400/30 cursor-pointer flex-shrink-0 whitespace-nowrap"
            title={isEn ? "AI herbal identification" : "Quét nhận diện dược liệu bằng A.I"}
          >
            <Camera className="w-3.5 h-3.5 text-white-pure flex-shrink-0" />
            <span className="text-white-pure font-medium">{isEn ? 'AI Scan' : 'Quét A.I'}</span>
          </button>
        </div>

        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleCapture}
        />
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="space-y-3">
        <div className="flex gap-2.5">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-text-dim group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isEn ? "Search by herb name, English name, properties, meridians..." : "Tìm theo phương danh, tên tiếng Anh, tính vị, quy kinh..."}
              className="w-full bg-white/5 border border-border rounded-2xl py-3 pr-4 pl-11 text-xs sm:text-sm text-white placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/50 focus:bg-white/10 transition-all font-light shadow-inner"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-text-dim hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button 
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={cn(
              "px-3.5 py-3 rounded-2xl border flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer shadow-sm",
              isFilterPanelOpen || activeFiltersCount > 0
                ? "bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                : "bg-white/5 border-border text-text-dim hover:text-white hover:border-white/20"
            )}
            title={isEn ? "Open deep herbal filters" : "Mở bộ lọc chuyên sâu Đông y"}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">{isEn ? 'Filters' : 'Bộ lọc'}</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-teal-400 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setOnlyBookmarked(!onlyBookmarked)}
            className={cn(
              "px-3.5 py-3 rounded-2xl border flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer",
              onlyBookmarked
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm"
                : "bg-white/5 border-border text-text-dim hover:text-white hover:border-white/20"
            )}
            title={isEn ? "Only show saved herbs" : "Chỉ hiện vị thuốc đã lưu"}
          >
            <Bookmark className={cn("w-4 h-4", onlyBookmarked ? "fill-amber-400 text-amber-400" : "")} />
            <span className="hidden md:inline">{isEn ? 'Saved' : 'Đã lưu'}</span>
            {bookmarkedIds.length > 0 && (
              <span className="text-[10px] text-text-dim font-mono">({bookmarkedIds.length})</span>
            )}
          </button>
        </div>

        {/* 1-Click Symptom Filter Pills (Liên kết thuộc tính Dược liệu với Thể trạng ghi nhận) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              {isEn ? "Quick Filter by Condition / Symptoms:" : "Lọc Nhanh Theo Thể Trạng / Triệu Chứng:"}
            </span>
            {selectedSymptom !== 'all' && (
              <button 
                onClick={() => setSelectedSymptom('all')}
                className="text-[10px] text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {isEn ? "Clear filter" : "Xóa lọc thể trạng"}
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {SYMPTOM_FILTER_TAGS.map(tag => {
              const isSelected = selectedSymptom === tag.id;
              // Count matching herbs for this symptom tag
              const count = tag.id === 'all' 
                ? COMPREHENSIVE_HERBS.length 
                : COMPREHENSIVE_HERBS.filter(h => 
                    h.matchedSymptoms.some(s => s.toLowerCase().includes(tag.symptom?.toLowerCase() || ''))
                  ).length;

              return (
                <button
                  key={tag.id}
                  onClick={() => setSelectedSymptom(tag.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer active:scale-95",
                    isSelected
                      ? "bg-primary text-slate-950 border-primary font-bold shadow-md shadow-primary/20 scale-[1.02]"
                      : "bg-white/[0.03] border-white/10 text-text-dim hover:text-white hover:border-white/20 hover:bg-white/[0.06]"
                  )}
                >
                  <span>{isEn && tag.label_en ? tag.label_en : tag.label}</span>
                  <span className={cn(
                    "text-[10px] font-mono px-1.5 py-0.2 rounded-full",
                    isSelected ? "bg-slate-950/20 text-slate-950 font-bold" : "bg-white/5 text-text-dim"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Expandable Advanced Filter Panel (Tứ Khí, Ngũ Vị, Quy Kinh, Nhóm Tác Dụng) */}
        <AnimatePresence>
          {isFilterPanelOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-panel border border-border rounded-3xl p-5 shadow-2xl space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    {isEn ? "Advanced Traditional Herbal Medicine Filters" : "Bộ Lọc Chuyên Sâu Y Học Cổ Truyền"}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={resetAllFilters}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{isEn ? "Reset filters" : "Đặt lại bộ lọc"}</span>
                    </button>
                  )}
                  <button 
                    onClick={() => setIsFilterPanelOpen(false)}
                    className="p-1 rounded-lg text-text-dim hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Group Filter */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">
                  {isEn ? "1. Functional Category:" : "1. Nhóm Dược Liệu Tác Dụng:"}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {HERB_GROUPS.map(grp => (
                    <button
                      key={grp.id}
                      onClick={() => setSelectedGroup(grp.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between",
                        selectedGroup === grp.id
                          ? "bg-teal-500/20 border-teal-500/40 text-teal-300 font-bold shadow-xs"
                          : "bg-white/[0.02] border-white/5 text-text-dim hover:text-white hover:border-white/15"
                      )}
                    >
                      <span className="truncate">{isEn && grp.shortName_en ? grp.shortName_en : grp.shortName}</span>
                      {selectedGroup === grp.id && <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tứ Khí (Tính) Filter */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">
                  {isEn ? "2. Four Qi (Nature: Cold - Cool - Neutral - Warm - Hot):" : "2. Tứ Khí (Tính: Hàn - Lương - Bình - Ôn - Nhiệt):"}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedNature('all')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer",
                      selectedNature === 'all'
                        ? "bg-white/20 text-white border-white/40"
                        : "bg-white/[0.02] border-white/5 text-text-dim hover:text-white"
                    )}
                  >
                    {isEn ? "All Natures" : "Tất cả tính"}
                  </button>
                  {ALL_NATURES.map(nature => {
                    const style = NATURE_COLOR_MAP[nature];
                    const isSelected = selectedNature === nature;
                    return (
                      <button
                        key={nature}
                        onClick={() => setSelectedNature(nature)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                          isSelected
                            ? cn(style.bg, style.text, style.border, "ring-1 ring-primary/40 shadow-xs")
                            : "bg-white/[0.02] border-white/5 text-text-dim hover:text-white"
                        )}
                      >
                        {isEn ? (nature === 'Hàn' ? 'Cold' : nature === 'Lương' ? 'Cool' : nature === 'Bình' ? 'Neutral' : nature === 'Ôn' ? 'Warm' : 'Hot') : nature}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ngũ Vị Filter */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">
                  {isEn ? "3. Five Flavors:" : "3. Ngũ Vị (Vị):"}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedTaste('all')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer",
                      selectedTaste === 'all'
                        ? "bg-white/20 text-white border-white/40"
                        : "bg-white/[0.02] border-white/5 text-text-dim hover:text-white"
                    )}
                  >
                    {isEn ? "All Flavors" : "Tất cả vị"}
                  </button>
                  {ALL_TASTES.map(taste => (
                    <button
                      key={taste}
                      onClick={() => setSelectedTaste(taste)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                        selectedTaste === taste
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/40 ring-1 ring-purple-500/40"
                          : "bg-white/[0.02] border-white/5 text-text-dim hover:text-white"
                      )}
                    >
                      {isEn ? (taste === 'Ngọt' ? 'Sweet' : taste === 'Cay' ? 'Acrid / Pungent' : taste === 'Đắng' ? 'Bitter' : taste === 'Chua' ? 'Sour' : taste === 'Mặn' ? 'Salty' : 'Astringent') : `Vị ${taste}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quy Kinh (12 Kinh Lạc) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">
                  {isEn ? "4. Meridians:" : "4. Quy Kinh Lạc:"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedMeridian('all')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer",
                      selectedMeridian === 'all'
                        ? "bg-white/20 text-white border-white/40"
                        : "bg-white/[0.02] border-white/5 text-text-dim hover:text-white"
                    )}
                  >
                    {isEn ? "All Meridians" : "Tất cả kinh"}
                  </button>
                  {ALL_MERIDIANS.map(meridian => (
                    <button
                      key={meridian}
                      onClick={() => setSelectedMeridian(meridian)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium transition-all border cursor-pointer",
                        selectedMeridian === meridian
                          ? "bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold"
                          : "bg-white/[0.02] border-white/5 text-text-dim hover:text-white"
                      )}
                    >
                      {isEn ? (meridian === 'Phế' ? 'Lung' : meridian === 'Tỳ' ? 'Spleen' : meridian === 'Vị' ? 'Stomach' : meridian === 'Tâm' ? 'Heart' : meridian === 'Can' ? 'Liver' : meridian === 'Thận' ? 'Kidney' : meridian === 'Đởm' ? 'Gallbladder' : 'Bladder') : `Kinh ${meridian}`}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Camera Result Banner (when image captured) */}
      <AnimatePresence>
        {capturedImage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-panel border border-primary/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 relative overflow-hidden"
          >
            <button 
              onClick={closeCamera} 
              className="absolute top-4 right-4 text-text-dim hover:text-rose-400 transition-colors z-20 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex gap-4 sm:gap-5 relative z-10">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border border-white/10">
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 py-1">
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">
                  Định Danh Thực Thể AI
                </p>
                <h3 className="font-serif text-lg sm:text-xl italic font-light text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  Đối chiếu Dược điển Đông y
                </h3>
                {isAnalyzing ? (
                  <div className="flex items-center gap-2 text-primary mt-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                      <Activity className="w-4 h-4" />
                    </motion.div>
                    <span className="text-[11px] font-bold uppercase tracking-widest animate-pulse">
                      Đang phân tích mẫu vật...
                    </span>
                  </div>
                ) : (
                  <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest mt-2 px-2 py-0.5 bg-white/5 rounded border border-white/5 inline-block">
                    Trích xuất hoàn tất
                  </p>
                )}
              </div>
            </div>
            
            {aiResult && (
              <div className="bg-bg/60 backdrop-blur-md p-4 sm:p-5 rounded-2xl max-h-[350px] overflow-y-auto border border-white/5 shadow-inner space-y-4">
                {!aiResult.identified ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                    <Activity className="w-10 h-10 text-text-dim opacity-30" />
                    <p className="text-white font-medium text-sm">Không thể nhận diện chính xác thực thể</p>
                    <p className="text-[10px] text-text-dim uppercase tracking-wider">
                      Vui lòng thử lại với góc chụp cận cảnh lá, củ hoặc hoa
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div>
                        <h4 className="text-xl font-serif italic text-primary font-bold">
                          {aiResult.name_vi}
                        </h4>
                        <p className="text-xs text-text-dim italic">
                          {aiResult.name_scientific} • Họ: {aiResult.family}
                        </p>
                      </div>

                      {matchedHerbFromAI && (
                        <button
                          onClick={() => {
                            setSelectedHerbForModal(matchedHerbFromAI);
                            closeCamera();
                          }}
                          className="px-3.5 py-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5 hover:bg-teal-500/30 transition-all cursor-pointer self-start sm:self-auto"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Xem trong Dược điển</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Bộ phận dùng:</span>
                        <p className="text-white">{aiResult.partUsed || "Đang cập nhật"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Liều lượng:</span>
                        <p className="text-white">{aiResult.dosage || "Tham khảo bác sĩ"}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Công năng chủ trị:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {aiResult.benefits.map((b, i) => (
                          <span key={i} className="px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[10px] text-white">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Medicinal Herbs Directory */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2 px-1 flex-nowrap">
          <div className="min-w-0">
            <h2 className="font-serif text-sm sm:text-base md:text-lg font-bold text-slate-900 flex items-center gap-1.5 whitespace-nowrap">
              <Leaf className="w-4 h-4 text-primary shrink-0" />
              <span>{isEn ? "Standardized Traditional Remedies" : "Vị Thuốc Cổ Truyền Chuẩn Hóa"}</span>
            </h2>
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={resetAllFilters}
              className="text-xs text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer font-semibold whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isEn ? "Clear filters" : "Bỏ lọc"}</span>
            </button>
          )}
        </div>

        {/* Empty Search State */}
        {filteredHerbs.length === 0 ? (
          <div className="bg-panel border border-border rounded-3xl p-10 text-center space-y-4">
            <Leaf className="w-12 h-12 text-text-dim opacity-30 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-white font-medium text-base">
                {isEn ? "No matching medicinal herbs found" : "Không tìm thấy vị thuốc phù hợp"}
              </h3>
              <p className="text-xs text-text-dim max-w-md mx-auto">
                {isEn 
                  ? "No herbs match your search query or selected filters. Try searching by name or reset filters."
                  : "Không có dược liệu nào khớp với từ khóa tìm kiếm hoặc các bộ lọc đang chọn. Hãy thử tìm theo tên tiếng Việt hoặc đặt lại bộ lọc."}
              </p>
            </div>
            <button
              onClick={resetAllFilters}
              className="px-4 py-2.5 rounded-xl bg-primary text-slate-950 font-bold text-xs uppercase tracking-wider shadow-sm hover:brightness-110 cursor-pointer"
            >
              {isEn ? "Reset all filters" : "Đặt lại tất cả bộ lọc"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredHerbs.map(herb => {
              const isSaved = bookmarkedIds.includes(herb.id);

              return (
                <div
                  key={herb.id}
                  onClick={() => setSelectedHerbForModal(herb)}
                  className="bg-panel rounded-3xl overflow-hidden border border-border shadow-xl text-left group hover:border-teal-500/40 transition-all cursor-pointer flex flex-col justify-between hover:shadow-2xl hover:-translate-y-0.5"
                >
                  <div>
                    {/* Header above the image with colored background */}
                    <div className="bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-emerald-50/70 border-b border-teal-100/70 px-3.5 sm:px-4 py-2 sm:py-2.5 transition-colors group-hover:from-emerald-100/60 group-hover:to-teal-100/60">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-serif text-[15px] sm:text-base italic font-semibold text-slate-800 group-hover:text-teal-900 transition-colors truncate">
                          {isEn ? (herb.name_en || herb.name_vi) : herb.name_vi}
                        </h3>
                        <span className="text-[8px] sm:text-[8.5px] text-teal-700 font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 border border-teal-200/80 shadow-2xs shrink-0 whitespace-nowrap">
                          {isEn ? (
                            herb.groupId === 'bo-khi' ? 'Qi Tonic' :
                            herb.groupId === 'giai-bieu' ? 'Exterior Release' :
                            herb.groupId === 'an-than' ? 'Calming' :
                            herb.groupId === 'tru-thap' ? 'Dampness' :
                            herb.groupId === 'thanh-nhiet' ? 'Heat Clearing' : herb.groupName.split(' - ')[0]
                          ) : herb.groupName.split(' - ')[0]}
                        </span>
                      </div>
                      <p className="text-[9px] sm:text-[9.5px] text-teal-700/80 font-mono italic truncate mt-0.5 font-light">
                        {herb.name_scientific}
                      </p>
                    </div>

                    {/* Herb Image & Top Overlays */}
                    <div className="h-40 sm:h-44 overflow-hidden relative bg-slate-100">
                      <img 
                        src={herb.image} 
                        alt={herb.name_vi} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[1.02] contrast-[1.02]" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                      
                      {/* Botanical Family & Subtitle Badge */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[8px] sm:text-[8.5px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-teal-800 border border-teal-200/70 shadow-2xs">
                          {herb.family}
                        </span>
                        {isEn ? (
                          <span className="text-[8.5px] sm:text-[9px] font-normal tracking-normal px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-teal-900 border border-teal-200/70 shadow-2xs">
                            {herb.name_vi}
                          </span>
                        ) : (
                          herb.name_en && (
                            <span className="text-[8.5px] sm:text-[9px] font-normal tracking-normal px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-amber-900 border border-amber-200/70 shadow-2xs">
                              {herb.name_en}
                            </span>
                          )
                        )}
                      </div>

                      {/* Bookmark Quick Action Button */}
                      <button 
                        onClick={(e) => toggleBookmark(herb.id, e)}
                        className={`absolute top-2.5 right-2.5 w-7 h-7 backdrop-blur-md rounded-full flex items-center justify-center border transition-all cursor-pointer shadow-2xs ${
                          isSaved 
                            ? 'bg-amber-50 text-amber-600 border-amber-300' 
                            : 'bg-white/90 text-slate-700 border-slate-200/80 hover:bg-white hover:text-slate-950'
                        }`}
                        title={isSaved ? (isEn ? 'Saved' : 'Đã lưu trữ') : (isEn ? 'Save herb' : 'Lưu trữ vị thuốc')}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>

                      {/* Part Used on bottom left of image */}
                      <div className="absolute bottom-2 left-2.5 text-[8.5px] sm:text-[9px] font-mono flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-slate-800 border border-slate-200/70 shadow-2xs">
                        <span className="text-primary font-semibold">{isEn ? 'Part:' : 'Bộ phận:'}</span>
                        <span className="truncate max-w-[180px] text-slate-700 font-normal">{herb.partUsed}</span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3.5 sm:p-4 space-y-2.5">
                      {/* Summary action */}
                      <p className="text-[11px] sm:text-xs text-slate-600 font-normal line-clamp-2 leading-relaxed">
                        {herb.summaryAction}
                      </p>

                      {/* Matched symptoms text */}
                      <div className="space-y-0.5 pt-0.5">
                        <span className="text-[8px] sm:text-[8.5px] font-medium text-slate-500 uppercase tracking-wider block">
                          {isEn ? 'Target Conditions:' : 'Tương thích thể trạng:'}
                        </span>
                        <p className="text-[11px] sm:text-xs text-slate-800 font-normal leading-relaxed">
                          {herb.matchedSymptoms.slice(0, 3).join(' • ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-3.5 sm:px-4 pb-3 pt-1 flex items-center justify-between border-t border-border/50 text-[11px]">
                    <button
                      onClick={(e) => handleAskAIAboutHerb(herb, e)}
                      className="text-teal-700 hover:text-teal-900 flex items-center gap-1 font-medium transition-colors cursor-pointer py-0.5"
                    >
                      <MessageSquare className="w-3 h-3 text-teal-600" />
                      <span>{isEn ? 'Ask AI Doctor' : 'Hỏi Bác sĩ AI'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedHerbForModal(herb)}
                      className="text-slate-600 hover:text-teal-800 flex items-center gap-0.5 font-medium transition-colors cursor-pointer group-hover:translate-x-0.5 py-0.5"
                    >
                      <span>{isEn ? 'Details' : 'Chi tiết'}</span>
                      <ChevronRight className="w-3 h-3 text-teal-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Daily Symptom-Based Medicinal Herbs & Remedies Suggestions */}
      <DailySymptomHerbSuggestions />

      {/* Seasonal Herbs Section (Dược Thảo 12 Tháng Theo Tiết Khí) */}
      <section className="bg-panel rounded-3xl p-5 sm:p-6 border border-border shadow-2xl space-y-6" id="seasonal-herbs-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1">
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              {isEn ? "Seasonal Herbs & Solar Terms" : "Dược Thảo Theo Mùa & Tiết Khí"}
            </h3>
            <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">
              {isEn 
                ? "Wellness recommendations aligned with the 12-month natural cycle" 
                : "Khuyến nghị bồi dưỡng theo vòng tuần hoàn thiên nhiên 12 tháng"}
            </p>
          </div>
          <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 self-start md:self-auto shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            {isEn ? `Today: Month ${new Date().getMonth() + 1}` : `Hôm nay: Tháng ${new Date().getMonth() + 1}`} ({new Date().getMonth() + 1 >= 1 && new Date().getMonth() + 1 <= 3 ? (isEn ? 'Spring Awakening' : 'Kinh Trập - Xuân phân') : new Date().getMonth() + 1 >= 4 && new Date().getMonth() + 1 <= 6 ? (isEn ? 'Summer Solstice' : 'Mộc dục - Hạ chí') : new Date().getMonth() + 1 >= 7 && new Date().getMonth() + 1 <= 9 ? (isEn ? 'Autumn Equinox' : 'Bạch lộ - Thu phân') : (isEn ? 'Winter Solstice' : 'Tiểu tuyết - Đông chí')})
          </span>
        </div>

        {/* 12-Month Navigation */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block px-1">
            {isEn ? "Explore 12 Months of Traditional Herbal Remedies" : "Khám phá 12 Tháng dược thảo cổ truyền"}
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const isCurrentSystemMonth = m === (new Date().getMonth() + 1);
              const isSelected = m === selectedSeasonalMonth;
              const monthHerb = SEASONAL_HERBS_DATA.find(h => h.month === m);
              const styles = getSeasonStyles(monthHerb?.season || 'Mùa Xuân');
              
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedSeasonalMonth(m)}
                  className={cn(
                    "relative py-2.5 rounded-xl text-xs font-bold font-mono transition-all border flex flex-col items-center justify-center cursor-pointer active:scale-95 group",
                    isSelected
                      ? cn(styles.bgAccent, styles.borderAccent, styles.accentText, "ring-1 ring-primary/20 shadow-lg")
                      : "bg-white/[0.01] border-white/5 text-text-dim hover:text-white hover:border-white/10"
                  )}
                  title={`${isEn ? 'Month' : 'Tháng'} ${m} - ${monthHerb?.herbName}`}
                >
                  <span className="text-[11px] leading-none">{isEn ? `M.${m}` : `T.${m}`}</span>
                  {isCurrentSystemMonth && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border border-slate-900 shadow-sm animate-pulse" title={isEn ? "Current month" : "Tháng hiện tại"} />
                  )}
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-950 text-[8px] font-sans font-normal text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 border border-white/5 shadow-xl">
                    {monthHerb?.herbName} ({isEn ? (monthHerb?.season === 'Mùa Xuân' ? 'Spring' : monthHerb?.season === 'Mùa Hạ' ? 'Summer' : monthHerb?.season === 'Mùa Thu' ? 'Autumn' : 'Winter') : monthHerb?.season})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Seasonal Herb Card */}
        {(() => {
          const activeHerb = SEASONAL_HERBS_DATA.find(h => h.month === selectedSeasonalMonth);
          if (!activeHerb) return null;
          const styles = getSeasonStyles(activeHerb.season);

          return (
            <div className={cn("bg-bg/40 border border-white/5 rounded-3xl p-5 md:p-6 transition-all relative overflow-hidden", styles.glowAccent)}>
              <div className="absolute -right-24 -bottom-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
                {/* Image panel */}
                <div className="md:col-span-4 h-48 md:h-full min-h-[160px] rounded-2xl overflow-hidden relative border border-white/10 group">
                  <img
                    src={activeHerb.image}
                    alt={activeHerb.herbName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />
                  
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className={cn("text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full", styles.badge)}>
                      {isEn ? (activeHerb.season === 'Mùa Xuân' ? 'Spring' : activeHerb.season === 'Mùa Hạ' ? 'Summer' : activeHerb.season === 'Mùa Thu' ? 'Autumn' : 'Winter') : activeHerb.season}
                    </span>
                    <span className="bg-slate-950/60 backdrop-blur-md border border-white/5 p-1 rounded-full text-white">
                      <Sun className="w-3 h-3 text-amber-400" />
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-left">
                    <p className="text-[8px] font-mono font-bold text-primary uppercase tracking-widest">
                      {isEn ? "Solar Term Focus" : "Tiết khí trọng điểm"}
                    </p>
                    <p className="text-xs text-white font-medium line-clamp-1">{activeHerb.focus}</p>
                  </div>
                </div>

                {/* Info panel */}
                <div className="md:col-span-8 flex flex-col justify-between space-y-4 text-left">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h4 className="font-serif text-2xl italic font-light text-white group-hover:text-primary transition-colors">
                        {activeHerb.herbName}
                      </h4>
                      <span className="text-[10px] text-text-dim font-light font-mono px-2 py-0.5 border border-white/5 bg-white/[0.01] rounded-md">
                        {activeHerb.scientificName}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-text-dim uppercase tracking-wider">
                        {isEn ? "Action & Main Therapeutics" : "Cơ chế hoạt động & Trị liệu chủ đạo"}
                      </p>
                      <p className="text-xs text-text-dim leading-relaxed font-light">
                        {activeHerb.benefit}
                      </p>
                    </div>
                  </div>

                  {/* Apothecary advice box */}
                  <div className="bg-primary/[0.02] border border-primary/10 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="w-4 h-4 animate-pulse text-primary" />
                      <span className="text-[9.5px] uppercase font-bold tracking-widest">
                        {isEn ? "Traditional Apothecary Wisdom" : "Kinh nghiệm chế biến cổ truyền"}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-white/90 font-light leading-relaxed">
                      {activeHerb.tip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Classical Formulas Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-serif text-xl italic font-light text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>{isEn ? "Classical Herbal Prescriptions" : "Liệu Pháp Phối Ngũ Kinh Điển"}</span>
            </h3>
            <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">
              {isEn ? "Balanced formulations adhering to sovereign, minister, assistant, and courier principles" : "Các bài thuốc mẫu mực theo nguyên tắc Quân - Thần - Tá - Sứ"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RecipeCard 
            title={isEn ? "Four Gentlemen Decoction (Si Jun Zi Tang)" : "Tứ quân tử thang"}
            indication={isEn ? "Tonifies spleen qi, restores vital stamina, eases chronic fatigue and indigestion" : "Đại bổ nguyên khí tỳ vị, trị mệt mỏi suy nhược, ăn uống không tiêu"}
            ingredients={isEn ? ['Asian Ginseng (Monarch)', 'Atractylodes (Minister)', 'Poria (Assistant)', 'Honey Licorice (Envoy)'] : ['Nhân sâm (Quân)', 'Bạch truật (Thần)', 'Bạch linh (Tá)', 'Chích Cam thảo (Sứ)']}
            dosage={isEn ? "Decoct 1 packet daily, divide into 2 warm doses" : "Sắc ấm ngày 1 thang chia làm 2 lần"}
          />
          <RecipeCard 
            title={isEn ? "Yin Qiao Powder (Yin Qiao San)" : "Ngân kiều tán"}
            indication={isEn ? "Clears wind-heat, relieves fever, soothes sore throat, dispels rash" : "Tán phong nhiệt giải cảm, trị cảm sốt nhiệt, đau rát họng, phát ban"}
            ingredients={isEn ? ['Honeysuckle (Monarch)', 'Forsythia (Monarch)', 'Mint (Minister)', 'Platycodon (Assistant)', 'Licorice (Envoy)'] : ['Kim ngân hoa (Quân)', 'Liên kiều (Quân)', 'Bạc hà (Thần)', 'Cát cánh (Tá)', 'Cam thảo (Sứ)']}
            dosage={isEn ? "Drink warm during mild fever or onset of rash" : "Sắc nước uống ấm lúc đang sốt nhẹ phát ban"}
          />
          <RecipeCard 
            title={isEn ? "Sour Jujube Decoction (Suan Zao Ren Tang)" : "Toan táo nhân thang"}
            indication={isEn ? "Nourishes heart yin, calms the mind, treats persistent insomnia, anxiety, night sweats" : "Dưỡng tâm an thần, trị mất ngủ triền miên, bồn chồn lo âu, đổ mồ hôi trộm"}
            ingredients={isEn ? ['Roasted Jujube Seed', 'Anemarrhena', 'Poria', 'Chuanxiong', 'Licorice'] : ['Toan táo nhân sao đen', 'Tri mẫu', 'Phục linh', 'Xuyên khung', 'Cam thảo']}
            dosage={isEn ? "Drink 1 warm cup 1 hour before sleep" : "Uống 1 chén ấm trước khi đi ngủ 1 giờ"}
          />
          <RecipeCard 
            title={isEn ? "Two Cured Herbs Decoction (Er Chen Tang)" : "Nhị trần thang"}
            indication={isEn ? "Dries dampness, transforms phlegm, regulates qi, eases cough and nausea" : "Táo thấp hóa đờm lí khí, trị ho nhiều đờm bọt trắng, đầy trướng bụng buồn nôn"}
            ingredients={isEn ? ['Aged Tangerine Peel', 'Prepared Pinellia', 'Poria', 'Licorice', 'Fresh Ginger'] : ['Trần bì lâu năm', 'Bán hạ chế', 'Phục linh', 'Cam thảo', 'Gừng tươi']}
            dosage={isEn ? "Decoct and drink warm in 2 doses during the day" : "Sắc nước uống chia 2 lần ấm trong ngày"}
          />
        </div>
      </section>

      {/* Full Herb Detail Modal */}
      <AnimatePresence>
        {selectedHerbForModal && (
          <HerbDetailModal 
            herb={selectedHerbForModal} 
            onClose={() => setSelectedHerbForModal(null)}
            onFilterBySymptom={(sym) => {
              const matchedTag = SYMPTOM_FILTER_TAGS.find(t => 
                t.symptom && sym.toLowerCase().includes(t.symptom.toLowerCase())
              );
              if (matchedTag) {
                setSelectedSymptom(matchedTag.id);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RecipeCard({ 
  title, 
  indication, 
  ingredients, 
  dosage 
}: { 
  title: string; 
  indication: string; 
  ingredients: string[]; 
  dosage: string;
}) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const handleConsult = () => {
    const prompt = isEn
      ? `Hello AI Doctor Tam An, please provide clinical guidance on the traditional formula: ${title}. Ingredients: ${ingredients.join(', ')}. What are the recommended dosage adjustments for modern lifestyle?`
      : `Chào Bác sĩ Tâm An, xin tư vấn chi tiết về bài thuốc cổ truyền: ${title}. Thành phần gồm: ${ingredients.join(', ')}. Cách gia giảm liều dùng cho thể trạng người Việt như thế nào?`;
    window.dispatchEvent(new CustomEvent('app-open-ai-chat', { detail: { prompt } }));
  };

  return (
    <div className="bg-panel p-5 rounded-2xl border border-border shadow-xl space-y-3 hover:border-primary/30 transition-all text-left">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-serif text-lg italic font-bold text-white group-hover:text-primary">
          {title}
        </h4>
        <button
          onClick={handleConsult}
          className="text-[10px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
        >
          <MessageSquare className="w-3 h-3" />
          <span>{isEn ? "Ask AI Doctor" : "Hỏi Bác sĩ AI"}</span>
        </button>
      </div>

      <p className="text-xs text-text-dim italic leading-snug">
        <span className="font-semibold text-slate-300">{isEn ? "Indications: " : "Chủ trị: "}</span>
        {indication}
      </p>

      <div className="flex flex-wrap gap-1.5 pt-1">
        {ingredients.map(ing => (
          <span 
            key={ing} 
            className="text-[10px] font-mono bg-white/5 text-primary px-2.5 py-0.5 rounded-md border border-white/5"
          >
            {ing}
          </span>
        ))}
      </div>

      <div className="text-[11px] bg-emerald-700 text-white-pure p-2.5 rounded-xl border border-emerald-600 font-normal">
        <span className="font-bold text-white-pure">{isEn ? "Usage & Dosage: " : "Cách dùng: "}</span>
        <span className="text-white-pure">{dosage}</span>
      </div>
    </div>
  );
}
