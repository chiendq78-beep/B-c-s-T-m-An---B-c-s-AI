import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Sparkles, 
  AlertTriangle, 
  PhoneCall, 
  MessageSquare, 
  Layers, 
  CheckCircle2, 
  BookOpen, 
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  RotateCcw,
  Activity,
  HeartHandshake,
  Pill,
  FileText,
  HelpCircle,
  Eye,
  Crosshair
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnatomyPartData } from '../../data/anatomyData';
import { registerModal } from '../../utils/modalManager';
import AnatomyIllustrationViewer from './AnatomyIllustrationViewer';
import Anatomy3DViewer from './Anatomy3DViewer';

interface AnatomyCardModalProps {
  part: AnatomyPartData | null;
  onClose: () => void;
  onNavigateToDisease?: (diseaseName: string) => void;
  onAskAIDoctor?: (promptText: string) => void;
}

export default function AnatomyCardModal({
  part,
  onClose,
  onNavigateToDisease,
  onAskAIDoctor
}: AnatomyCardModalProps) {
  const [activeTab, setActiveTab] = useState<'standard' | 'interactive_3d' | 'faq'>('standard');
  const [model3dAngle, setModel3dAngle] = useState(0);

  // Register this modal in global modal stack for edge swipe gestures
  useEffect(() => {
    if (!part) return;
    const unregister = registerModal(`anatomy-card-${part.id}`, onClose);
    const handleBackPress = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('app-back-press', handleBackPress);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unregister();
      window.removeEventListener('app-back-press', handleBackPress);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [part, onClose]);

  if (!part) return null;

  const handleAskAIWithPrompt = (customPrompt: string) => {
    if (onAskAIDoctor) {
      onAskAIDoctor(customPrompt);
    }
  };

  const handleSymptomClick = (symptom: string) => {
    const prompt = `Tôi đang có triệu chứng "${symptom}" liên quan đến ${part.name_vi} (${part.name_latin || ''}). Bác sĩ AI hãy phân tích các nguyên nhân tiềm ẩn, mức độ nguy hiểm và hướng dẫn theo dõi/thăm khám chi tiết giúp tôi.`;
    handleAskAIWithPrompt(prompt);
  };

  const handleGoToDiseaseView = (diseaseName?: string) => {
    if (onNavigateToDisease) {
      onNavigateToDisease(diseaseName || part.commonDiseases[0] || 'Bệnh lý tim mạch');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/75 backdrop-blur-sm flex flex-col items-center justify-center p-0 lg:p-4 overflow-hidden animate-fadeIn">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-white w-full h-full lg:max-w-5xl lg:h-[95vh] rounded-none lg:rounded-3xl shadow-2xl border-0 lg:border lg:border-slate-200 overflow-hidden flex flex-col"
      >
        {/* Header Bar */}
        <div className="px-4 sm:px-6 pt-[calc(max(env(safe-area-inset-top,0px),24px)+0.75rem)] lg:pt-3.5 pb-3 sm:pb-3.5 border-b border-slate-200 bg-gradient-to-r from-teal-50 via-emerald-50/30 to-slate-50 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-sm shadow-teal-500/20 flex-shrink-0">
              {part.name_vi.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                  {part.name_vi}
                </h2>
                {part.name_latin && (
                  <span className="text-[10px] sm:text-xs italic text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg font-mono border border-teal-200 font-semibold whitespace-nowrap">
                    {part.name_latin}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                {part.name_en || 'Human Anatomy Structure'} • Mã: <span className="font-semibold text-slate-700">{part.code}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onClose}
              aria-label="Đóng cửa sổ"
              className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action / View Mode Selector Pills */}
        <div className="px-3 sm:px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/60 overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setActiveTab('standard')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'standard'
                  ? 'bg-white text-teal-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>10 Mục Chuẩn Hóa Y Khoa</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('interactive_3d')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'interactive_3d'
                  ? 'bg-white text-teal-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
                <span>Minh Họa 3D / Xoay Không Gian</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('faq')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'faq'
                  ? 'bg-white text-teal-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                <span>Hỏi Đáp Bác Sĩ AI ({part.aiQuestionSuggestions?.length || 3})</span>
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAskAIWithPrompt(`Tư vấn chuyên sâu toàn diện về ${part.name_vi} (${part.name_latin || ''}) cho tôi.`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[11px] sm:text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hỏi Bác sĩ AI ngay</span>
            </button>
          </div>
        </div>

        {/* Body Content - Standardized 10 Points */}
        <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1 space-y-6 bg-slate-50/40 overscroll-contain">
          {activeTab === 'interactive_3d' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Anatomy3DViewer
                part={part}
                onAskAI={handleAskAIWithPrompt}
              />
            </motion.div>
          )}

          {activeTab === 'faq' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-teal-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>⑩ Danh Sách Câu Hỏi Thường Gặp & Tình Huống Lâm Sàng</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Chọn một câu hỏi dưới đây để mở cuộc hội chẩn trực tiếp với Bác sĩ AI Tâm An:
                </p>
                <div className="space-y-2 pt-1">
                  {part.aiQuestionSuggestions?.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAskAIWithPrompt(q)}
                      className="w-full text-left p-3.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs text-slate-800 flex items-center justify-between gap-3 shadow-xs hover:shadow transition-all group cursor-pointer"
                    >
                      <span className="font-medium leading-relaxed">{idx + 1}. {q}</span>
                      <ChevronRight className="w-4 h-4 text-teal-600 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* MAIN 10 STANDARDIZED SECTIONS (Always visible or under 'standard' view) */}
          {(activeTab === 'standard' || activeTab === 'interactive_3d' || activeTab === 'faq') && (
            <div className="space-y-4 sm:space-y-5">
              {/* SECTION ① ĐỊNH NGHĨA & SECTION ② VỊ TRÍ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* ① Định nghĩa */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Định nghĩa</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                    {part.definition}
                  </p>
                </div>

                {/* ② Vị trí */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Vị trí giải phẫu</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span>{part.location}</span>
                  </p>
                </div>
              </div>

              {/* SECTION ③ HÌNH ẢNH MINH HỌA */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>Hình ảnh minh họa giải phẫu</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Minh họa y khoa đa chế độ
                  </span>
                </div>
                
                {/* Advanced Multi-mode Anatomical Illustration Viewer */}
                <AnatomyIllustrationViewer
                  part={part}
                  onAskAI={handleAskAIWithPrompt}
                />
              </div>

              {/* SECTION ④ CẤU TRÚC CƠ BẢN & SECTION ⑤ CHỨC NĂNG */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* ④ Cấu trúc */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">4</span>
                    <span>Cấu trúc cơ bản</span>
                  </div>
                  <div className="space-y-2">
                    {part.structures.map((st, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="font-bold text-xs text-teal-800 block">
                          • {st.name}
                        </span>
                        <p className="text-[11px] text-slate-600 mt-0.5 pl-2 leading-relaxed">
                          {st.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ⑤ Chức năng */}
                <div className="bg-teal-50/60 rounded-2xl p-4 sm:p-5 border border-teal-200/80 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-950 uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">5</span>
                    <span>Chức năng sinh học</span>
                  </div>
                  <ul className="space-y-2">
                    {part.functions.map((fn, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-teal-950 font-normal">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{fn}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* SECTION ⑥ BỆNH LÝ LIÊN QUAN */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">6</span>
                    <span>Bệnh lý liên quan</span>
                  </div>
                  <button
                    onClick={() => handleGoToDiseaseView()}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline cursor-pointer"
                  >
                    <span>Mở thư viện bệnh học</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Bệnh phổ biến */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Bệnh thường gặp
                    </span>
                    <ul className="space-y-1.5">
                      {part.commonDiseases.map((d, idx) => (
                        <li key={idx} className="flex items-center justify-between text-xs text-slate-800 py-1.5 border-b border-slate-200/70 last:border-none">
                          <span className="font-medium">{d}</span>
                          <button
                            onClick={() => handleAskAIWithPrompt(`Phân tích bệnh "${d}" ở ${part.name_vi}`)}
                            className="text-[11px] text-teal-600 hover:text-teal-800 font-semibold cursor-pointer"
                          >
                            Hỏi AI
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bệnh nguy hiểm */}
                  <div className="bg-rose-50/80 p-4 rounded-xl border border-rose-200 space-y-2.5">
                    <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                      Bệnh nguy hiểm / Cấp tính
                    </span>
                    <ul className="space-y-1.5">
                      {part.criticalDiseases.map((d, idx) => (
                        <li key={idx} className="flex items-center justify-between text-xs text-rose-950 py-1.5 border-b border-rose-200/70 last:border-none">
                          <span className="font-semibold">{d}</span>
                          <button
                            onClick={() => handleAskAIWithPrompt(`Cảnh báo và xử trí cấp cứu bệnh nguy hiểm "${d}" ở ${part.name_vi}`)}
                            className="text-[11px] text-rose-700 hover:text-rose-900 font-bold cursor-pointer"
                          >
                            Cảnh báo
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* SECTION ⑦ DẤU HIỆU THƯỜNG GẶP */}
              <div className="bg-amber-50/60 rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-950 uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">7</span>
                  <span>Dấu hiệu thường gặp (Bấm vào triệu chứng để Bác sĩ AI phân tích)</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {part.commonSymptoms.map((symp, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSymptomClick(symp)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-200 text-xs font-semibold text-amber-900 shadow-xs hover:shadow transition-all cursor-pointer group active:scale-95"
                    >
                      <span>{symp}</span>
                      <Sparkles className="w-3 h-3 text-amber-500 group-hover:text-amber-700 ml-0.5 animate-pulse" />
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION ⑧ DẤU HIỆU CẢNH BÁO NGUY HIỂM (RED FLAGS) */}
              <div className="bg-red-50 rounded-2xl p-4 sm:p-5 border-2 border-red-400 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-800 font-bold text-xs sm:text-sm uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">8</span>
                    <span>Dấu hiệu cảnh báo nguy hiểm (Cần đi khám ngay / Cấp cứu 115)</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-bold uppercase tracking-widest">
                    SOS 115
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-red-950 leading-relaxed bg-white p-3.5 rounded-xl border border-red-200">
                  🚨 {part.emergencyWarning}
                </p>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-red-800 block">
                    Danh mục triệu chứng báo động đỏ:
                  </span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {part.redFlags.map((flag, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-red-950 font-medium bg-red-100/70 p-2.5 rounded-lg border border-red-200/70">
                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-1 flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href="tel:115"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Gọi Cấp Cứu 115 Ngay</span>
                  </a>
                  <span className="text-[11px] text-red-800 font-medium text-center sm:text-left">
                    Nếu gặp các dấu hiệu đỏ trên, hãy nhanh chóng tới cơ sở y tế gần nhất!
                  </span>
                </div>
              </div>

              {/* SECTION ⑨ GỢI Ý CÂU HỎI AI */}
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-4 sm:p-5 border border-teal-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-teal-950 font-bold text-xs sm:text-sm uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">9</span>
                  <span>Gợi ý câu hỏi cho Bác sĩ AI Tâm An</span>
                </div>
                <div className="space-y-2">
                  {part.aiQuestionSuggestions.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAskAIWithPrompt(prompt)}
                      className="w-full p-3 rounded-xl bg-white hover:bg-teal-50 border border-teal-200 text-left text-xs font-medium text-slate-800 flex items-center justify-between gap-3 shadow-xs hover:shadow transition-all group cursor-pointer"
                    >
                      <div className="flex items-start gap-2.5">
                        <MessageSquare className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <span>{prompt}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-teal-500 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION ⑩ THẢO DƯỢC & THÓI QUEN SỐNG */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Thảo dược */}
                {part.relatedHerbs && part.relatedHerbs.length > 0 && (
                  <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">10a</span>
                      <span>Thảo dược bổ trợ (YHCT)</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {part.relatedHerbs.map((herb, idx) => (
                        <span 
                          key={idx}
                          className="px-2.5 py-1 bg-white rounded-lg text-xs font-semibold text-emerald-900 border border-emerald-200 shadow-xs"
                        >
                          🌿 {herb}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Thói quen sống */}
                {part.healthTips && part.healthTips.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                      <span className="w-5 h-5 rounded-full bg-slate-600 text-white flex items-center justify-center text-[10px] font-bold">10b</span>
                      <span>Thói quen vàng dưỡng thể</span>
                    </div>
                    <ul className="space-y-1.5 pt-1">
                      {part.healthTips.map((tip, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                          <span className="text-teal-600 font-bold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between gap-3 flex-shrink-0">
          <span className="text-[11px] text-slate-500 truncate">
            Chu trình: <strong className="text-teal-700">CƠ THỂ → HỆ CƠ QUAN → BỘ PHẬN → BỆNH LÝ → BÁC SĨ AI</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border border-slate-200 flex items-center gap-1.5"
          >
            <span>Đóng</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
