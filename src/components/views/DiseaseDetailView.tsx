import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Activity, 
  AlertCircle, 
  Stethoscope, 
  Search,
  Pill, 
  ShieldCheck, 
  Leaf, 
  Dumbbell,
  Clock,
  Flame,
  ChevronRight,
  Share,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  MessageSquare,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { chatWithAI } from '../../services/gemini';
import { useLanguage } from '../../contexts/LanguageContext';
import { registerModal } from '../../utils/modalManager';

interface Disease {
  id: string;
  name_vi: string;
  name_en?: string;
  icd10?: string;
  category: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  description: string;
  detailedDescription?: string;
  causes?: string[];
  symptoms?: string[];
  redFlags?: string[];
  diagnosis?: string | string[];
  treatment?: string | string[];
  prevention?: string[];
  relatedHerbs?: string[];
  relatedExercises?: string[];
}

interface DiseaseDetailViewProps {
  disease: Disease;
  onBack: () => void;
  onHerbClick?: (herbName: string) => void;
  onExerciseClick?: (exerciseTitle: string) => void;
}

export default function DiseaseDetailView({ disease, onBack, onHerbClick, onExerciseClick }: DiseaseDetailViewProps) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [symptomImages, setSymptomImages] = useState<Record<string, { url: string; description: string }>>({});
  const [loadingSymptom, setLoadingSymptom] = useState<string | null>(null);

  const topFocusRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Đưa con trỏ và vị trí cuộn về đầu trang ngay khi mở
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

    const timer = setTimeout(() => {
      topFocusRef.current?.focus({ preventScroll: true });
    }, 50);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
    };
  }, [disease?.id]);

  // Hỗ trợ phím ESC và cử chỉ back trên mobile/tablet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);

    const unregister = registerModal('disease-detail-fullscreen', onBack);
    const handleBackGesture = (e: Event) => {
      e.preventDefault();
      onBack();
    };
    window.addEventListener('app-back-press', handleBackGesture);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('app-back-press', handleBackGesture);
      unregister();
    };
  }, [onBack]);

  const handleShare = async () => {
    const shareData = {
      title: isEn ? `Disease: ${disease.name_en || disease.name_vi}` : `Thông tin về bệnh: ${disease.name_vi}`,
      text: disease.description,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const generateSymptomImage = async (symptom: string) => {
    if (loadingSymptom) return;
    setLoadingSymptom(symptom);

    try {
      const description = await chatWithAI(`Hãy mô tả một hình ảnh minh họa y tế chuyên nghiệp cho triệu chứng: "${symptom}". 
      Mô tả ngắn gọn trong khoảng 2-3 câu, tập trung vào các đặc điểm trực quan mà một bác sĩ hoặc sinh viên y khoa sẽ thấy. 
      Sử dụng ngôn ngữ chuyên nghiệp và trực quan.`);

      const seed = encodeURIComponent(symptom);
      const medicalImageUrl = `https://picsum.photos/seed/${seed}/800/600?grayscale`;
      
      setSymptomImages(prev => ({
        ...prev,
        [symptom]: {
          url: medicalImageUrl,
          description: description
        }
      }));
    } catch (error) {
      console.error('Error generating symptom image:', error);
    } finally {
      setLoadingSymptom(null);
    }
  };

  const severityColors = {
    mild: "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold",
    moderate: "bg-amber-50 text-amber-950 border-amber-300 font-bold",
    severe: "bg-rose-50 text-rose-950 border-rose-300 font-bold",
    critical: "bg-red-100 text-red-950 border-red-400 font-bold shadow-xs"
  };

  const content = (
    <motion.div 
      initial={{ opacity: 0, scale: 0.99, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.99, y: 12 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="fixed inset-0 z-[60] flex flex-col h-screen w-screen bg-bg overflow-hidden select-text text-slate-900"
      role="dialog"
      aria-modal="true"
      aria-label={disease.name_vi}
    >
      {/* Full-Screen Top Navigation Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button 
            ref={topFocusRef}
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-950 transition-all border border-slate-200 active:scale-95 cursor-pointer flex-shrink-0"
            title={isEn ? "Back to Disease Library" : "Quay lại Thư viện Bệnh lý"}
            aria-label={isEn ? "Back to Disease Library" : "Quay lại Thư viện Bệnh lý"}
          >
            <ChevronLeft className="w-5 h-5 text-teal-600" />
            <span className="text-xs font-semibold hidden xs:inline">{isEn ? "Back" : "Quay lại"}</span>
          </button>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-950 leading-tight truncate">{disease.name_vi}</h2>
              {disease.name_en && (
                <span className="text-xs text-slate-600 hidden md:inline truncate">
                  ({disease.name_en})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[9.5px] text-teal-700 font-bold uppercase tracking-[0.2em]">{disease.category}</p>
              {disease.icd10 && (
                <span className="text-[9.5px] font-mono font-bold text-teal-900 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-300">
                  ICD-10: {disease.icd10}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button 
            onClick={() => {
              const prompt = isEn 
                ? `Hello Dr. Tâm An, I would like to learn in-depth about the disease: ${disease.name_en || disease.name_vi} (${disease.category}${disease.icd10 ? `, ICD-10: ${disease.icd10}` : ''}). Please explain pathogenesis, treatment protocols, and recurrence prevention.`
                : `Chào Bác sĩ Tâm An, tôi đang tìm hiểu chi tiết về bệnh: ${disease.name_vi} (${disease.category}${disease.icd10 ? `, ICD-10: ${disease.icd10}` : ''}). Xin bác sĩ giải thích sâu hơn về cơ chế bệnh sinh, phác đồ điều trị và cách phòng ngừa tái phát.`;
              window.dispatchEvent(new CustomEvent('app-open-ai-chat', { detail: { prompt } }));
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            title={isEn ? "Consult with AI Doctor about this disease" : "Tư vấn với Bác sĩ AI về bệnh này"}
          >
            <MessageSquare className="w-4 h-4 text-teal-600" />
            <span className="hidden sm:inline">{isEn ? "Ask AI Doctor" : "Hỏi Bác sĩ AI"}</span>
          </button>
          
          <button 
            onClick={handleShare}
            className="w-8.5 h-8.5 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 transition-all border border-slate-200 cursor-pointer active:scale-95"
            title={isEn ? "Share" : "Chia sẻ"}
          >
            <Share className="w-4 h-4" />
          </button>

          <button 
            onClick={onBack}
            className="w-8.5 h-8.5 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 transition-all border border-slate-200 hover:border-rose-300 cursor-pointer active:scale-95"
            title={isEn ? "Close full-screen" : "Đóng toàn màn hình"}
            aria-label={isEn ? "Close full-screen" : "Đóng toàn màn hình"}
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Detail Body - Full Width on Mobile, Max-W-4xl Centered for Comfort */}
      <div 
        ref={scrollContainerRef}
        tabIndex={-1}
        className="flex-1 overflow-y-auto p-4 sm:p-6 sm:px-8 space-y-6 no-scrollbar pb-32 focus:outline-none"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Severity & Detailed Description (Crisp Black Font) */}
          <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className={cn(
              "inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[10.5px] font-bold uppercase tracking-widest",
              severityColors[disease.severity]
            )}>
              <Activity className="w-3.5 h-3.5 text-current" />
              {isEn ? "Severity: " : "Mức độ: "}{disease.severity}
            </div>
            <p className="text-xs sm:text-[13.5px] text-slate-950 font-normal leading-relaxed">
              {disease.detailedDescription || disease.description}
            </p>
          </section>

          {/* Symptoms / Red Flags */}
          {disease.redFlags && disease.redFlags.length > 0 && (
            <section className="relative overflow-hidden bg-rose-50/70 border border-rose-300 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-rose-800">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-rose-100 rounded-xl flex items-center justify-center border border-rose-300">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-[10.5px] font-black uppercase tracking-[0.25em] text-rose-900">{isEn ? "Emergency Warning" : "Cảnh báo nguy cấp"}</h3>
                    <p className="text-[9px] text-rose-700 font-bold uppercase tracking-widest mt-0.5">{isEn ? "Seek Immediate Medical Attention" : "Liên hệ y tế ngay lập tức"}</p>
                  </div>
                </div>
                <div className="bg-rose-600 text-white font-bold text-[9px] sm:text-[10px] px-2.5 py-1 rounded-full uppercase tracking-widest shadow-xs">
                  {isEn ? "EMERGENCY" : "CẤP CỨU"}
                </div>
              </div>

              <ul className="space-y-4 relative z-10">
                {disease.redFlags.map((flag, i) => (
                  <li key={i} className="space-y-3">
                    <div className="flex items-start gap-3 text-xs text-slate-950 font-medium leading-relaxed group">
                      <div className="relative mt-1 flex-shrink-0">
                        <span className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-30" />
                        <div className="relative w-3.5 h-3.5 bg-rose-600 rounded-full flex items-center justify-center shadow-xs">
                          <div className="w-1 h-1 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="flex-1 flex items-start justify-between gap-3">
                        <span className="text-slate-950 font-medium leading-relaxed">{flag}</span>
                        <button
                          onClick={() => generateSymptomImage(flag)}
                          disabled={loadingSymptom === flag}
                          className={cn(
                            "flex-shrink-0 p-1.5 rounded-lg transition-all border border-rose-300 cursor-pointer",
                            symptomImages[flag]
                              ? "text-rose-700 bg-rose-100 shadow-xs"
                              : "text-rose-600 bg-white hover:bg-rose-50"
                          )}
                          title={isEn ? "Generate illustrative image" : "Tạo hình ảnh minh họa cảnh báo"}
                        >
                          {loadingSymptom === flag ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* AI Visual for Red Flag */}
                    <AnimatePresence>
                      {symptomImages[flag] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-6 overflow-hidden"
                        >
                          <div className="p-3 bg-white rounded-2xl border border-rose-300 space-y-2.5 shadow-xs">
                            <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-rose-200 shadow-xs">
                              <img 
                                src={symptomImages[flag].url} 
                                alt={`Warning: ${flag}`}
                                className="w-full h-full object-cover grayscale opacity-80 brightness-105"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-2 right-2">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-xs">
                                  <AlertCircle className="w-2.5 h-2.5 text-white" />
                                  <span className="text-[7.5px] font-black uppercase tracking-widest">Urgent Scan</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-[10.5px] text-slate-900 font-medium leading-relaxed px-0.5">
                              {symptomImages[flag].description}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Main Content Sections with Crisp Black Font */}
          <div className="grid gap-5">
            <DetailSection 
              icon={Activity} 
              title={isEn ? "Clinical Symptoms" : "Triệu chứng lâm sàng"} 
              content={disease.symptoms} 
              accentColor="text-teal-700 bg-teal-50 border-teal-200"
              onGenerateImage={generateSymptomImage}
              loadingSymptom={loadingSymptom}
              generatedImages={symptomImages}
            />
            <DetailSection 
              icon={Search} 
              title={isEn ? "Mechanisms & Causes" : "Cơ chế & Nguyên nhân"} 
              content={disease.causes} 
              accentColor="text-amber-800 bg-amber-50 border-amber-200"
            />
            <DetailSection 
              icon={Stethoscope} 
              title={isEn ? "Diagnostic Workflow" : "Quy trình Chẩn đoán"} 
              content={disease.diagnosis} 
              accentColor="text-rose-800 bg-rose-50 border-rose-200"
            />
            <DetailSection 
              icon={Pill} 
              title={isEn ? "Treatment Protocols" : "Phương pháp Điều trị"} 
              content={disease.treatment} 
              accentColor="text-indigo-800 bg-indigo-50 border-indigo-200"
            />
            <DetailSection 
              icon={ShieldCheck} 
              title={isEn ? "Prevention & Lifestyle" : "Phòng ngừa & Lối sống"} 
              content={disease.prevention} 
              accentColor="text-emerald-800 bg-emerald-50 border-emerald-200"
            />
          </div>

          {/* Related Content */}
          {(disease.relatedHerbs || disease.relatedExercises) && (
            <section className="pt-6 border-t border-slate-200/90 space-y-6">
              {disease.relatedHerbs && disease.relatedHerbs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-950">{isEn ? "Supportive Medicinal Herbs" : "Dược liệu bổ trợ"}</h3>
                    <Leaf className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1.5">
                    {disease.relatedHerbs.map((herb, i) => (
                      <button 
                        key={i}
                        onClick={() => onHerbClick?.(herb)}
                        className="flex-shrink-0 bg-white border border-slate-200 hover:border-teal-500 px-3.5 py-2 rounded-xl text-[10.5px] font-bold text-slate-900 uppercase tracking-wider hover:text-teal-700 shadow-2xs transition-all cursor-pointer"
                      >
                        {herb}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {disease.relatedExercises && disease.relatedExercises.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-950">{isEn ? "Therapeutic Workouts" : "Luyện tập trị liệu"}</h3>
                    <Dumbbell className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="grid gap-2.5">
                    {disease.relatedExercises.map((ex, i) => (
                      <button 
                        key={i}
                        onClick={() => onExerciseClick?.(ex)}
                        className="w-full bg-white border border-slate-200 hover:border-teal-400 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl flex items-center justify-between group shadow-2xs transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-teal-50 rounded-xl flex items-center justify-center text-teal-700 border border-teal-200">
                            <Activity className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-semibold text-slate-950 group-hover:text-teal-700 transition-colors">{ex}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </motion.div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}

function DetailSection({ 
  icon: Icon, 
  title, 
  content, 
  accentColor, 
  onGenerateImage,
  loadingSymptom,
  generatedImages
}: { 
  icon: any, 
  title: string, 
  content?: string | string[], 
  accentColor: string,
  onGenerateImage?: (symptom: string) => void,
  loadingSymptom?: string | null,
  generatedImages?: Record<string, { url: string; description: string }>
}) {
  if (!content) return null;
  const items = Array.isArray(content) ? content : [content];
  if (items.length === 0) return null;

  const isSeriousSection = title === "Triệu chứng lâm sàng" || title === "Clinical Symptoms";

  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className={cn("w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border shadow-2xs", accentColor)}>
          <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </div>
        <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-[0.2em]">{title}</h3>
      </div>
      <div className="bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs">
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex flex-col gap-2.5">
              <div className="flex items-start gap-2.5 group">
                <div className="mt-1.5 flex-shrink-0">
                  {isSeriousSection ? (
                    <div className="relative">
                      <div className="w-2 h-2 rounded-full bg-teal-600 shadow-xs" />
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-teal-600 animate-ping opacity-25" />
                    </div>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full block bg-slate-400 mt-0.5" />
                  )}
                </div>
                <div className="flex-1 flex items-start justify-between gap-3">
                  <span className="text-xs sm:text-[13px] text-slate-950 font-normal leading-relaxed">{item}</span>
                  {isSeriousSection && onGenerateImage && (
                    <button
                      onClick={() => onGenerateImage(item)}
                      disabled={loadingSymptom === item}
                      className={cn(
                        "flex-shrink-0 p-1.5 rounded-lg transition-all border cursor-pointer",
                        generatedImages?.[item] 
                          ? "text-teal-800 bg-teal-50 border-teal-300" 
                          : "text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200"
                      )}
                      title="Tạo hình ảnh minh họa bằng AI"
                    >
                      {loadingSymptom === item ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Generated AI Image Display */}
              <AnimatePresence>
                {generatedImages?.[item] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-3 sm:ml-4 overflow-hidden"
                  >
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                        <img 
                          src={generatedImages[item].url} 
                          alt={`Minh họa cho triệu chứng: ${item}`}
                          className="w-full h-full object-cover grayscale opacity-90"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-teal-600 rounded-full animate-pulse shadow-xs" />
                          <span className="text-[8px] font-bold text-slate-900 uppercase tracking-widest bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                            AI Visual Analysis
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-teal-800 uppercase tracking-[0.2em]">
                          <Sparkles className="w-3 h-3 text-teal-600" />
                          Phân tích thị giác AI
                        </div>
                        <p className="text-[10.5px] sm:text-[11px] text-slate-950 font-normal leading-relaxed">
                          {generatedImages[item].description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
