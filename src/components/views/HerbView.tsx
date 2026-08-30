import { useState, useRef, useEffect, useMemo } from 'react';
import { Leaf, Search, Camera, ChevronRight, Bookmark, Sparkles, Filter, X, Activity, Calendar, Sun } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { identifyHerb } from '../../services/gemini';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import DailySymptomHerbSuggestions from '../DailySymptomHerbSuggestions';

const SAMPLE_HERBS = [
  { 
    id: '1', 
    name_vi: 'Đinh lăng', 
    name_scientific: 'Polyscias fruticosa',
    family: 'Ngũ gia bì', 
    partUsed: 'Rễ và lá',
    benefit: 'Bồi bổ sức khỏe, an thần', 
    image: 'https://images.unsplash.com/photo-1628156108169-c09e33454652?auto=format&fit=crop&q=80&w=400' 
  },
  { 
    id: '2', 
    name_vi: 'Tía tô', 
    name_scientific: 'Perilla frutescens',
    family: 'Hoa môi', 
    partUsed: 'Lá, cành, hạt',
    benefit: 'Giải cảm, hạ sốt', 
    image: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&q=80&w=400' 
  },
  { 
    id: '3', 
    name_vi: 'Kinh giới', 
    name_scientific: 'Elsholtzia cristata',
    family: 'Hoa môi', 
    partUsed: 'Toàn cây trên mặt đất',
    benefit: 'Trị cảm gió, ngứa ngáy', 
    image: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=400' 
  },
];

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
    herbName: 'Gừng (Sinh khương)',
    scientificName: 'Zingiber officinale',
    benefit: 'Ấm bụng bổ tiêu hóa, chống đầy loét nhiệt bụng, tán phong hàn trị cơ thể run',
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
    herbName: 'Táo tàu (Đại táo)',
    scientificName: 'Ziziphus jujuba',
    benefit: 'Bổ tỳ vị ích khí huyết, điều hòa trăm vị thuốc, ổn định huyết khí toàn thân',
    tip: 'Kết hợp đại táo hầm chung gà ác, hạt sen bồi dưỡng nguyên khí cực cao ngày cuối năm.',
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=400'
  }
];

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeasonalMonth, setSelectedSeasonalMonth] = useState<number>(() => {
    return new Date().getMonth() + 1;
  });
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<HerbAIResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dbHerbs, setDbHerbs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load live herbs from Firestore on mount
  useEffect(() => {
    const fetchLiveHerbs = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, 'herbs'));
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDbHerbs(list);
      } catch (err) {
        console.error("Error loading live herbs in HerbView:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveHerbs();
  }, []);

  // Filter and merge sample list with database records
  const processedHerbs = useMemo(() => {
    const mergedMap = new Map<string, any>();
    
    // Static core default items
    SAMPLE_HERBS.forEach(item => {
      mergedMap.set(item.id, item);
    });

    // Firestore overrides/additions
    dbHerbs.forEach(item => {
      const match = SAMPLE_HERBS.find(
        fallback => fallback.id === item.id || fallback.name_vi.toLowerCase() === item.name_vi.toLowerCase()
      );
      if (match) {
        mergedMap.set(match.id, {
          ...match,
          ...item,
          benefit: item.benefit || item.benefits?.join(', ') || match.benefit
        });
      } else {
        mergedMap.set(item.id, {
          image: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&q=80&w=400',
          ...item,
          benefit: item.benefit || item.benefits?.join(', ') || 'Đang cập nhật dược tính'
        });
      }
    });

    const allHerbs = Array.from(mergedMap.values());
    const query = searchTerm.trim().toLowerCase();
    if (!query) return allHerbs;

    return allHerbs.filter(h => 
      h.name_vi.toLowerCase().includes(query) ||
      h.name_scientific?.toLowerCase().includes(query) ||
      h.family?.toLowerCase().includes(query) ||
      h.benefit?.toLowerCase().includes(query)
    );
  }, [searchTerm, dbHerbs]);

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
    setIsCameraOpen(false);
    setCapturedImage(null);
    setAiResult(null);
  };

  return (
    <div className="p-6 space-y-8 bg-bg min-h-full pb-20">
      {/* Header with AI Camera Button */}
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-3xl italic font-light text-white leading-tight">Dược học Cổ truyền</h2>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-primary text-bg px-5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:scale-105 active:scale-95 transition-all border border-white/5"
        >
          <Camera className="w-5 h-5" />
          <span>Quét AI Thực thể</span>
        </button>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleCapture}
        />
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-text-dim group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo phương danh hoặc tính vị..."
            className="w-full bg-white/5 border border-border rounded-xl py-3.5 pr-4 pl-12 text-sm text-white placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/40 focus:bg-white/10 transition-all font-light shadow-inner"
          />
        </div>
        <button className="w-12 h-12 bg-white/5 border border-border rounded-xl flex items-center justify-center text-text-dim hover:text-white transition-all shadow-lg hover:border-primary/20">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* AI Result Modal (Inline Overlay) */}
      <AnimatePresence>
        {capturedImage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-panel border border-primary/20 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden"
          >
            <button onClick={closeCamera} className="absolute top-4 right-4 text-text-dim hover:text-red-400 transition-colors z-20">
              <X className="w-6 h-6" />
            </button>
            <div className="flex gap-5 relative z-10">
              <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border border-white/10">
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 py-1">
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Xử lý Thực thể AI</p>
                <h3 className="font-serif text-xl italic font-light text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  Đối chiếu Dữ liệu
                </h3>
                {isAnalyzing ? (
                  <div className="flex items-center gap-2 text-primary mt-3">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}><Activity className="w-4 h-4" /></motion.div>
                    <span className="text-[11px] font-bold uppercase tracking-widest animate-pulse">Đang định danh...</span>
                  </div>
                ) : (
                  <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest mt-3 px-2 py-0.5 bg-white/5 rounded border border-white/5 inline-block">Trích xuất hoàn tất</p>
                )}
              </div>
            </div>
            
            {aiResult && (
              <div className="bg-bg/40 backdrop-blur-md p-5 rounded-2xl max-h-[400px] overflow-y-auto border border-white/5 shadow-inner space-y-6">
                {!aiResult.identified ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                    <Activity className="w-12 h-12 text-text-dim opacity-20" />
                    <div>
                      <p className="text-white font-medium">Không thể định danh thực thể</p>
                      <p className="text-[10px] text-text-dim uppercase tracking-widest mt-1">Vui lòng thử lại với góc chụp khác hoặc ánh sáng tốt hơn</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <h4 className="text-xl font-serif italic text-primary">{aiResult.name_vi || "Chưa rõ tên"}</h4>
                      <p className="text-xs text-text-dim italic">{aiResult.name_scientific || "Chưa cập nhật tên khoa học"}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                      <div className="grid grid-cols-2 gap-4">
                        <InfoSection title="Họ thực vật (Family)" content={aiResult.family || "Chưa rõ họ"} />
                        <InfoSection title="Bộ phận dùng (Part Used)" content={aiResult.partUsed || "Chưa có thông tin"} />
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Công dụng (Benefits)</p>
                        <div className="flex flex-wrap gap-2">
                          {aiResult.benefits.map((b, i) => (
                            <span key={i} className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[10px] text-white">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <InfoSection title="Cách dùng (Usage)" content={aiResult.usage} />
                        <InfoSection title="Liều lượng (Dosage)" content={aiResult.dosage} />
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Chống chỉ định (Contraindications)</p>
                        <ul className="space-y-1">
                          {aiResult.contraindications.map((c, i) => (
                            <li key={i} className="text-[11px] text-text-dim flex items-start gap-2">
                              <span className="w-1 h-1 bg-rose-500 rounded-full mt-1.5 flex-shrink-0" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {!isAnalyzing && (
              <button 
                onClick={closeCamera}
                className="w-full bg-primary text-bg font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(45,212,191,0.2)] uppercase tracking-widest text-[11px] hover:brightness-110 transition-all active:scale-[0.98]"
              >
                Xác thực Lưu trữ Chuyên ngành
              </button>
            )}
            
            <div className="absolute -left-20 -top-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Symptom-Based Medicinal Herbs & Remedies Suggestions */}
      <DailySymptomHerbSuggestions />

      {/* Popular Herbs Collection */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif text-xl font-bold text-white flex items-center gap-3">
            <Leaf className="w-6 h-6 text-primary" />
            Vị thuốc Kinh điển
          </h3>
          <span className="text-[9px] font-bold text-text-dim uppercase tracking-[0.2em]">Danh mục lưu hành</span>
        </div>
        <div className="grid grid-cols-2 gap-5">
          {processedHerbs.map(herb => (
            <button
              key={herb.id}
              className="bg-panel rounded-3xl overflow-hidden border border-border shadow-xl text-left group hover:border-primary/20 transition-all active:scale-[0.97]"
            >
              <div className="h-32 overflow-hidden relative">
                <img src={herb.image} alt={herb.name_vi} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                <div className="absolute top-3 right-3 w-8 h-8 bg-bg/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Bookmark className="w-4 h-4" />
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <p className="text-[8px] font-bold text-primary uppercase tracking-widest">{herb.family}</p>
                  <p className="text-[8px] font-bold text-text-dim uppercase tracking-widest">{herb.partUsed || "Chưa rõ bộ phận"}</p>
                </div>
                <h4 className="font-serif text-lg italic font-light text-white group-hover:text-primary transition-colors">{herb.name_vi}</h4>
                <p className="text-[9px] text-text-dim italic -mt-1">{herb.name_scientific || "Chưa cập nhật tên khoa học"}</p>
                <p className="text-[10px] text-text-dim line-clamp-2 font-light leading-snug pt-1">{herb.benefit}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Seasonal Herbs Section */}
      <section className="bg-panel rounded-3xl p-6 border border-border shadow-2xl space-y-6" id="seasonal-herbs-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1">
          <div>
            <h3 className="font-serif text-xl font-bold text-white flex items-center gap-3">
              <Calendar className="w-6 h-6 text-primary" />
              Dược Thảo Theo Mùa
            </h3>
            <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest mt-1">
              Khuyến nghị bồi bổ theo tiết khí & thời tiết hệ thống
            </p>
          </div>
          <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 self-start md:self-auto shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            Hôm nay: Tháng {new Date().getMonth() + 1} ({new Date().getMonth() + 1 >= 1 && new Date().getMonth() + 1 <= 3 ? 'Kinh Trập - Xuân phân' : new Date().getMonth() + 1 >= 4 && new Date().getMonth() + 1 <= 6 ? 'Mộc dục - Hạ chí' : new Date().getMonth() + 1 >= 7 && new Date().getMonth() + 1 <= 9 ? 'Bạch lộ - Thu phân' : 'Tiểu tuyết - Đông chí'})
          </span>
        </div>

        {/* 12-Month Navigation */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block px-1">
            Khám phá 12 Tháng dược thảo cổ truyền
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
                  title={`Tháng ${m} - ${monthHerb?.herbName}`}
                >
                  <span className="text-[11px] leading-none">T.{m}</span>
                  {isCurrentSystemMonth && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border border-slate-900 shadow-sm animate-pulse" title="Tháng hiện tại" />
                  )}
                  {/* Miniature tooltip on hover for month's herb */}
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-950 text-[8px] font-sans font-normal text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 border border-white/5 shadow-xl">
                    {monthHerb?.herbName} ({monthHerb?.season})
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
              {/* Decorative radial gradients inside */}
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
                  
                  {/* Dynamic Weather theme watermark or Season badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className={cn("text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full", styles.badge)}>
                      {activeHerb.season}
                    </span>
                    <span className="bg-slate-950/60 backdrop-blur-md border border-white/5 p-1 rounded-full text-white">
                      <Sun className="w-3 h-3 text-amber-400" />
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-left">
                    <p className="text-[8px] font-mono font-bold text-primary uppercase tracking-widest">Tiết khí trọng điểm</p>
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
                      <p className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Cơ chế hoạt động & Trị liệu chủ đạo</p>
                      <p className="text-xs text-text-dim leading-relaxed font-light">
                        {activeHerb.benefit}
                      </p>
                    </div>
                  </div>

                  {/* Elite Tip / Apothecary advice box */}
                  <div className="bg-primary/[0.02] border border-primary/10 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="w-4 h-4 animate-pulse text-primary" />
                      <span className="text-[9.5px] uppercase font-bold tracking-widest">Kinh nghiệm chế biến cổ truyền</span>
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

      {/* Recipes Summary */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif text-xl italic font-light text-white">Liệu pháp Phối ngũ</h3>
          <button className="text-primary text-[10px] font-bold uppercase tracking-widest hover:gap-2 transition-all flex items-center gap-1">Tất cả bài thuốc <ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="grid gap-4">
          <RecipeItem 
            title="Sắc nước lá vối giảm nóng"
            benefit="Giải độc, mát gan"
            ingredients={['Lá vối tươi/khô', 'Cam thảo']}
          />
          <RecipeItem 
            title="Trà Gừng tươi trị cảm"
            benefit="Làm ấm, tán hàn"
            ingredients={['Gừng tươi', 'Mật ong', 'Nước ấm']}
          />
        </div>
      </section>
    </div>
  );
}

function InfoSection({ title, content }: { title: string, content: string }) {
  if (!content) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{title}</p>
      <p className="text-[12px] text-white font-light leading-relaxed">{content}</p>
    </div>
  );
}

function RecipeItem({ title, benefit, ingredients }: { title: string, benefit: string, ingredients: string[] }) {
  return (
    <div className="bg-panel p-5 rounded-2xl border border-border shadow-xl flex items-center justify-between group hover:border-primary/20 transition-all cursor-pointer">
      <div className="space-y-2 flex-1">
        <h4 className="font-serif text-xl italic font-light text-white group-hover:text-primary transition-colors">{title}</h4>
        <p className="text-[11px] text-text-dim italic font-light">Mục tiêu: {benefit}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {ingredients.slice(0, 3).map(i => (
            <span key={i} className="text-[8px] font-bold uppercase tracking-widest bg-white/5 text-primary px-2.5 py-1 rounded-md border border-white/5 shadow-inner">{i}</span>
          ))}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-text-dim group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-2" />
    </div>
  );
}
