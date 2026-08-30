import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronRight, AlertCircle, Bookmark, Filter, Pill, Activity, Sparkles, Check, ChevronDown, SortAsc } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import DiseaseDetailView from './DiseaseDetailView';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const SAMPLE_DISEASES = [
  { 
    id: '1', 
    name_vi: 'Viêm dạ dày', 
    severity: 'moderate', 
    category: 'Tiêu hóa', 
    description: 'Tình trạng niêm mạc dạ dày bị viêm loét do nhiều nguyên nhân.',
    detailedDescription: 'Viêm dạ dày là tình trạng niêm mạc dạ dày bị tổn thương, sưng nề và viêm nhiễm. Đây là một trong những bệnh lý phổ biến nhất về đường tiêu hóa, có thể diễn tiến cấp tính hoặc mãn tính.',
    causes: [
      'Nhiễm vi khuẩn Helicobacter pylori (H. pylori)',
      'Lạm dụng thuốc giảm đau kháng viêm (NSAIDs)',
      'Thói quen ăn uống không điều độ, ăn quá cay, nóng',
      'Căng thẳng tâm lý (Stress) kéo dài',
      'Tiêu thụ quá nhiều rượu bia và chất kích thích'
    ],
    symptoms: [
      'Đau vùng thượng vị (vùng trên rốn)',
      'Đầy bụng, khó tiêu, ợ hơi, ợ chua',
      'Buồn nôn hoặc nôn mửa',
      'Chán ăn, sụt cân không rõ nguyên nhân'
    ],
    redFlags: [
      'Nôn ra máu hoặc nôn ra chất đen như bã cà phê',
      'Đi ngoài phân đen, có mùi khắm đặc trưng',
      'Đau bụng dữ dội, không thuyên giảm',
      'Thiếu máu, sụt cân nhanh'
    ],
    treatment: [
      'Sử dụng thuốc kháng sinh nếu có nhiễm vi khuẩn H. pylori',
      'Thuốc ức chế bơm Proton (PPI) để giảm tiết acid',
      'Thuốc trung hòa acid dạ dày',
      'Điều chỉnh chế độ ăn uống: chia nhỏ bữa ăn, tránh ăn quá no'
    ],
    prevention: [
      'Ăn uống vệ sinh, thực hiện ăn chín uống sôi',
      'Hạn chế rượu bia, thuốc lá và thực phẩm cay nóng',
      'Tránh stress, làm việc và nghỉ ngơi hợp lý',
      'Không tự ý sử dụng các thuốc giảm đau không theo chỉ định'
    ],
    relatedHerbs: ['Nghệ vàng', 'Chè dây', 'Cam thảo'],
    relatedExercises: ['Yoga phục hồi', 'Đi bộ nhẹ nhàng']
  },
  { 
    id: '2', 
    name_vi: 'Cao huyết áp', 
    severity: 'severe', 
    category: 'Tuần hoàn', 
    description: 'Áp lực máu động mạch tăng cao mạn tính, nguy cơ tai biến.',
    detailedDescription: 'Tăng huyết áp (hay cao huyết áp) là một bệnh lý mãn tính khi áp lực máu tác động lên thành động mạch quá cao. Nếu không được kiểm soát, bệnh có thể gây ra nhiều biến chứng nguy hiểm như nhồi máu cơ tim, tai biến mạch máu não.',
    causes: [
      'Yếu tố di truyền và tuổi tác',
      'Chế độ ăn nhiều muối và chất béo bão hòa',
      'Thừa cân, béo phì, lười vận động',
      'Hút thuốc lá và uống nhiều rượu bia',
      'Bệnh lý thận hoặc nội tiết'
    ],
    symptoms: [
      'Nhức đầu (thường ở vùng sau gáy vào buổi sáng)',
      'Chóng mặt, hoa mắt, ù tai',
      'Hồi hộp, đánh trống ngực',
      'Chảy máu cam hoặc nhìn mờ'
    ],
    redFlags: [
      'Đau tức ngực dữ dội (nghi ngờ nhồi máu cơ tim)',
      'Yếu liệt nửa người, méo miệng (nghi ngờ tai biến)',
      'Khó thở đột ngột, vã mồ hôi',
      'Co giật hoặc hôn mê'
    ],
    treatment: [
      'Sử dụng thuốc hạ áp theo chỉ định liên tục của bác sĩ',
      'Chế độ ăn DASH (nhiều rau xanh, trái cây, bớt muối)',
      'Giảm cân và duy trì chỉ số BMI hợp lý',
      'Kiểm soát các bệnh đi kèm như tiểu đường, mỡ máu'
    ],
    prevention: [
      'Giảm lượng muối tiêu thụ dưới 5g/ngày',
      'Tập thể dục ít nhất 30 phút mỗi ngày',
      'Hạn chế rượu bia, tuyệt đối không hút thuốc lá',
      'Kiểm tra huyết áp định kỳ tại nhà'
    ],
    relatedHerbs: ['Hoa tam thất', 'Táo mèo', 'Hoa hòe'],
    relatedExercises: ['Đạp xe nhẹ nhàng', 'Bơi lội', 'Đi bộ nhanh']
  },
  { id: '3', name_vi: 'Cảm cúm', severity: 'mild', category: 'Hô hấp', description: 'Bệnh truyền nhiễm do virus tấn công hệ hô hấp...' },
  { id: '4', name_vi: 'Thoát vị đĩa đệm', severity: 'moderate', category: 'Cơ xương', description: 'Đĩa đệm bị lệch khỏi vị trí chèn ép thần kinh...' },
  { id: '5', name_vi: 'Viêm gan B', severity: 'severe', category: 'Gan mật', description: 'Nhiễm trùng gan do virus viêm gan B...' },
];

export default function DiseaseView({ setActiveView }: { setActiveView: (view: any) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [activeSeverity, setActiveSeverity] = useState('Tất cả');
  const [sortBy, setSortBy] = useState('alphabetical');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<any | null>(null);
  const [dbDiseases, setDbDiseases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load live diseases from Firestore on mount
  useEffect(() => {
    const fetchLiveDiseases = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, 'diseases'));
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDbDiseases(list);
      } catch (err) {
        console.error("Error loading live diseases in DiseaseView:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveDiseases();
  }, []);

  const categories = ['Tất cả', 'Tiêu hóa', 'Tuần hoàn', 'Hô hấp', 'Cơ xương', 'Thần kinh', 'Gan mật'];
  
  const severities = [
    { label: 'Tất cả', value: 'Tất cả' },
    { label: 'Nhẹ', value: 'mild' },
    { label: 'Trung bình', value: 'moderate' },
    { label: 'Nặng', value: 'severe' },
  ];

  const sortOptions = [
    { label: 'Tên (A-Z)', value: 'alphabetical' },
    { label: 'Mức độ (Giảm dần)', value: 'severity-desc' },
    { label: 'Mức độ (Tăng dần)', value: 'severity-asc' },
  ];

  const severityMap: Record<string, number> = { 'mild': 1, 'moderate': 2, 'severe': 3 };

  const processedDiseases = useMemo(() => {
    // Combine SAMPLE_DISEASES static presets with dbDiseases live records
    const mergedMap = new Map<string, any>();
    
    // Fallbacks
    SAMPLE_DISEASES.forEach(d => {
      mergedMap.set(d.id, d);
    });

    // Firestore overrides/addition
    dbDiseases.forEach(d => {
      const match = SAMPLE_DISEASES.find(
        fallback => fallback.id === d.id || fallback.name_vi.toLowerCase() === d.name_vi.toLowerCase()
      );
      if (match) {
        mergedMap.set(match.id, { ...match, ...d });
      } else {
        mergedMap.set(d.id, d);
      }
    });

    const allDiseases = Array.from(mergedMap.values());

    let result = allDiseases.filter(d => 
      (activeCategory === 'Tất cả' || d.category === activeCategory) &&
      (activeSeverity === 'Tất cả' || d.severity === activeSeverity) &&
      d.name_vi.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.name_vi.localeCompare(b.name_vi);
      } else if (sortBy === 'severity-desc') {
        const aVal = severityMap[a.severity] || 0;
        const bVal = severityMap[b.severity] || 0;
        return bVal - aVal;
      } else if (sortBy === 'severity-asc') {
        const aVal = severityMap[a.severity] || 0;
        const bVal = severityMap[b.severity] || 0;
        return aVal - bVal;
      }
      return 0;
    });

    return result;
  }, [searchTerm, activeCategory, activeSeverity, sortBy, dbDiseases]);

  // Listen for back gesture when a disease detail is active
  useEffect(() => {
    if (!selectedDisease) return;
    const handleBackGesture = (e: Event) => {
      e.preventDefault();
      setSelectedDisease(null);
    };
    window.addEventListener('app-back-press', handleBackGesture);
    return () => window.removeEventListener('app-back-press', handleBackGesture);
  }, [selectedDisease]);

  if (selectedDisease) {
    return (
      <DiseaseDetailView 
        disease={selectedDisease} 
        onBack={() => setSelectedDisease(null)} 
        onHerbClick={() => setActiveView('herb')}
        onExerciseClick={() => setActiveView('health')}
      />
    );
  }

  return (
    <div className="p-6 space-y-8 bg-bg min-h-full">
      {/* Search Header */}
      <div className="space-y-5">
        <h2 className="font-serif text-3xl font-bold text-white">Thư viện Bệnh lý</h2>
        <div className="flex gap-3">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-text-dim group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tra cứu triệu chứng hoặc mã bệnh..."
              className="w-full bg-white/5 border border-border rounded-xl py-3 pr-4 pl-12 text-sm text-white placeholder:text-text-dim outline-none focus:ring-1 focus:ring-primary/30 transition-all font-light"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "w-12 h-12 border rounded-xl flex items-center justify-center transition-all shadow-lg",
              showFilters 
                ? "bg-primary text-bg border-primary shadow-[0_0_15px_rgba(45,212,191,0.3)]" 
                : "bg-white/5 text-text-dim border-white/5 hover:text-white hover:border-primary/20"
            )}
          >
            <Filter className={cn("w-5 h-5 transition-transform", showFilters && "scale-90")} />
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-5"
          >
            <div className="bg-panel/50 backdrop-blur-md rounded-2xl p-5 border border-white/5 shadow-2xl space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest px-1">Mức độ Nghiêm trọng</p>
                <div className="flex flex-wrap gap-2">
                  {severities.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setActiveSeverity(s.value)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-[10px] font-medium transition-all border",
                        activeSeverity === s.value
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-white/5 text-text-dim border-transparent hover:border-white/10"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest px-1">Sắp xếp theo</p>
                <div className="grid grid-cols-1 gap-2">
                  {sortOptions.map(o => (
                    <button
                      key={o.value}
                      onClick={() => setSortBy(o.value)}
                      className={cn(
                        "flex items-center justify-between px-4 py-2.5 rounded-xl text-[11px] font-light transition-all border",
                        sortBy === o.value
                          ? "bg-white/10 text-white border-white/20"
                          : "bg-white/5 text-text-dim border-transparent hover:border-white/5"
                      )}
                    >
                      {o.label}
                      {sortBy === o.value && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                <button 
                  onClick={() => {
                    setActiveSeverity('Tất cả');
                    setSortBy('alphabetical');
                    setActiveCategory('Tất cả');
                  }}
                  className="text-[10px] text-text-dim hover:text-white transition-colors"
                >
                  Xóa tất cả bộ lọc
                </button>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="text-[10px] text-primary font-bold uppercase tracking-widest"
                >
                  Đóng
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories Scale */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex-shrink-0 border",
              activeCategory === cat 
                ? "bg-primary text-bg border-primary shadow-[0_0_20px_rgba(45,212,191,0.2)] scale-105" 
                : "bg-white/5 text-text-dim border-white/5 hover:border-border hover:text-white"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Disease List */}
      <div className="space-y-4">
        <p className="text-[9px] font-bold text-text-dim uppercase tracking-[0.3em] px-1 opacity-60">
          Kết quả lưu trữ ({processedDiseases.length})
        </p>
        <div className="grid gap-4">
          {processedDiseases.length > 0 ? (
            processedDiseases.map((disease) => (
            <motion.button
              key={disease.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onClick={() => setSelectedDisease(disease)}
              className="w-full bg-panel p-5 rounded-2xl border border-border shadow-xl flex items-center justify-between text-left group hover:border-primary/20 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-5">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center border border-white/5 shadow-inner transition-colors",
                  disease.severity === 'mild' ? "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20" :
                  disease.severity === 'moderate' ? "bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20" :
                  "bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20"
                )}>
                  <Activity className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-serif text-xl italic font-light text-white group-hover:text-primary transition-colors">{disease.name_vi}</h4>
                    <span className="text-[8px] font-bold uppercase text-primary/70 px-2 py-0.5 bg-primary/5 rounded-md border border-primary/10 tracking-widest">
                      {disease.category}
                    </span>
                  </div>
                  <p className="text-xs text-text-dim font-light line-clamp-1 mt-1">{disease.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Bookmark className="w-4 h-4 text-text-dim hover:text-white transition-colors" />
                <ChevronRight className="w-5 h-5 text-text-dim group-hover:text-primary transition-colors" />
              </div>
            </motion.button>
          ))
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <Search className="w-12 h-12 text-text-dim" />
            <div>
              <p className="text-white font-serif italic">Không tìm thấy bệnh lý nào</p>
              <p className="text-[10px] text-text-dim uppercase tracking-widest mt-1">Vui lòng điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Symptom Checker Shortcut */}
      <div className="bg-panel rounded-3xl p-6 text-white shadow-2xl border border-primary/10 panel-gradient relative overflow-hidden group">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary text-bg rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(45,212,191,0.4)] group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-lg italic font-light">Chẩn đoán Sơ bộ AI</h4>
              <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mt-1">Deep Analysis Engine</p>
            </div>
          </div>
          <p className="text-xs text-text-dim leading-relaxed font-light">
            Mô phỏng chẩn đoán dựa trên các chỉ số sinh tồn và triệu chứng lâm sàng được cung cấp. Phân tích bởi mô hình ngôn ngữ y khoa chuyên biệt.
          </p>
          <button className="w-full bg-white text-bg font-bold py-3 rounded-xl text-[11px] uppercase tracking-widest shadow-lg hover:brightness-110 transition-all">
            Bắt đầu phân tích thực thể
          </button>
        </div>
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
