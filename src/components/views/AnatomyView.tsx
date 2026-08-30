import { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Search, 
  Layers, 
  Sparkles, 
  ChevronRight, 
  BookOpen, 
  AlertTriangle, 
  ShieldAlert, 
  Filter, 
  RotateCcw,
  Eye,
  Stethoscope,
  Info,
  CheckCircle2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ORGAN_SYSTEMS_LIST, 
  ALL_ANATOMY_PARTS, 
  AnatomyPartData, 
  OrganSystemMeta 
} from '../../data/anatomyData';
import AnatomyCardModal from '../anatomy/AnatomyCardModal';
import InteractiveBodyMap from '../anatomy/InteractiveBodyMap';

interface AnatomyViewProps {
  setActiveView?: (view: any) => void;
}

export default function AnatomyView({ setActiveView }: AnatomyViewProps) {
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPart, setSelectedPart] = useState<AnatomyPartData | null>(null);

  // Listen for back gesture when a body part modal is active
  useEffect(() => {
    if (!selectedPart) return;
    const handleBackGesture = (e: Event) => {
      e.preventDefault();
      setSelectedPart(null);
    };
    window.addEventListener('app-back-press', handleBackGesture);
    return () => window.removeEventListener('app-back-press', handleBackGesture);
  }, [selectedPart]);

  // Filter parts based on search, system, and gender
  const filteredParts = useMemo(() => {
    return ALL_ANATOMY_PARTS.filter(part => {
      // 1. Search filter (Vietnamese name, Latin, English, symptoms, diseases)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchNameVi = part.name_vi.toLowerCase().includes(query);
        const matchNameLatin = part.name_latin?.toLowerCase().includes(query);
        const matchNameEn = part.name_en?.toLowerCase().includes(query);
        const matchSymptoms = part.commonSymptoms.some(s => s.toLowerCase().includes(query));
        const matchDiseases = part.commonDiseases.some(d => d.toLowerCase().includes(query));
        const matchDefinition = part.definition.toLowerCase().includes(query);

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

  return (
    <div className="p-3 sm:p-5 space-y-3 sm:space-y-4 min-h-full pb-16">
      {/* 1. Page Header */}
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

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên cơ quan, tiếng La-tinh, triệu chứng..."
            className="w-full pl-9 pr-8 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 shadow-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. 12 Organ Systems Horizontal Filter Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Chọn Hệ cơ quan để khám phá:
          </span>
          {selectedSystemId && (
            <button
              onClick={() => setSelectedSystemId(null)}
              className="text-xs text-teal-600 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xem tất cả hệ</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {/* "All" button */}
          <button
            onClick={() => setSelectedSystemId(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
              selectedSystemId === null
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs font-bold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tất cả</span>
          </button>

          {/* 12 Standard Systems */}
          {ORGAN_SYSTEMS_LIST.map((system) => {
            const isSelected = selectedSystemId === system.id;

            return (
              <button
                key={system.id}
                onClick={() => {
                  setSelectedSystemId(isSelected ? null : system.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <system.Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : system.color}`} />
                <span>{system.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Main Body Map & Anatomy Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (5 Cols): Interactive 3D Body Map Canvas */}
        <div className="lg:col-span-5 space-y-2.5">
          <InteractiveBodyMap
            gender={gender}
            setGender={setGender}
            parts={ALL_ANATOMY_PARTS}
            selectedPart={selectedPart}
            onSelectPart={(part) => setSelectedPart(part)}
            selectedSystemId={selectedSystemId}
          />

          {/* Quick Helper Note */}
          <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs text-slate-600 shadow-xs space-y-1">
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <Info className="w-3.5 h-3.5 text-teal-600" />
              <span>Hướng dẫn tương tác trực quan:</span>
            </div>
            <p className="leading-relaxed text-slate-600 text-[11px]">
              • Kéo giữ chuột/ngón tay trên mô hình để <strong>xoay góc nhìn 3D</strong>.
              <br />
              • Bấm vào các <strong>chấm tròn nhấp nháy</strong> để mở thẻ giải phẫu 10 cấp tiêu chuẩn.
            </p>
          </div>
        </div>

        {/* Right Column (7 Cols): List of Standardized Anatomy Cards */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Danh Sách Bộ Phận Giải Phẫu</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Nhấp vào bộ phận để xem chi tiết 10 cấp
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredParts.map((part) => {
                const systemMeta = ORGAN_SYSTEMS_LIST.find(s => s.id === part.systemId) || ORGAN_SYSTEMS_LIST[0];

                return (
                  <motion.div
                    key={part.id}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedPart(part)}
                    className="bg-white rounded-xl p-3 border border-slate-200 hover:border-teal-500/80 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
                  >
                    <div className="space-y-1.5">
                      {/* Top System Tag */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${systemMeta.bgLight}`}>
                          {systemMeta.name}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                      </div>

                      {/* Title & Latin */}
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                          {part.name_vi}
                        </h4>
                        {part.name_latin && (
                          <p className="text-[10px] font-mono italic text-slate-500 truncate">
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
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-medium truncate">
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
      </div>

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
