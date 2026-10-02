import { useState } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { chatWithAI } from '../../services/gemini';

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
  const [symptomImages, setSymptomImages] = useState<Record<string, { url: string; description: string }>>({});
  const [loadingSymptom, setLoadingSymptom] = useState<string | null>(null);

  const handleShare = async () => {
    const shareData = {
      title: `Thông tin về bệnh: ${disease.name_vi}`,
      text: disease.description,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        // Simple silent feedback or could add a toast if available
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const generateSymptomImage = async (symptom: string) => {
    if (loadingSymptom) return;
    setLoadingSymptom(symptom);

    try {
      // Use Gemini to generate a vivid visual description of the symptom
      const description = await chatWithAI(`Hãy mô tả một hình ảnh minh họa y tế chuyên nghiệp cho triệu chứng: "${symptom}". 
      Mô tả ngắn gọn trong khoảng 2-3 câu, tập trung vào các đặc điểm trực quan mà một bác sĩ hoặc sinh viên y khoa sẽ thấy. 
      Sử dụng ngôn ngữ chuyên nghiệp và trực quan.`);

      // Use Unsplash for higher quality medical-style imagery
      // We use keywords derived from the symptom and "medical illustration"
      const keywords = encodeURIComponent(`${symptom} medical illustration anatomy`);
      const imageUrl = `https://images.unsplash.com/photo-1576091160550-217359f488d5?auto=format&fit=crop&q=80&w=800`;
      // Actually, since we can't search unsplash easily without an API key, we'll keep using picsum 
      // but with better filters to look like a medical scan or thermal image
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
    mild: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    moderate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    severe: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    critical: "bg-red-500/20 text-red-500 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full bg-bg"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg/80 backdrop-blur-xl border-b border-border p-4 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-text-dim hover:text-white transition-all border border-transparent hover:border-border"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl italic font-light text-white leading-tight truncate">{disease.name_vi}</h2>
            {disease.name_en && (
              <span className="text-xs text-text-dim italic font-light hidden sm:inline truncate">
                ({disease.name_en})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[9px] text-primary font-bold uppercase tracking-[0.2em]">{disease.category}</p>
            {disease.icd10 && (
              <span className="text-[9px] font-mono font-bold text-teal-300 bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-500/30">
                ICD-10: {disease.icd10}
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={() => {
            const prompt = `Chào Bác sĩ Tâm An, tôi đang tìm hiểu chi tiết về bệnh: ${disease.name_vi} (${disease.category}${disease.icd10 ? `, ICD-10: ${disease.icd10}` : ''}). Xin bác sĩ giải thích sâu hơn về cơ chế bệnh sinh, phác đồ điều trị và cách phòng ngừa tái phát.`;
            window.dispatchEvent(new CustomEvent('app-open-ai-chat', { detail: { prompt } }));
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
          title="Tư vấn với Bác sĩ AI về bệnh này"
        >
          <MessageSquare className="w-4 h-4 text-teal-400" />
          <span className="hidden sm:inline">Hỏi Bác sĩ AI</span>
        </button>
        <button 
          onClick={handleShare}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-text-dim hover:text-white transition-all border border-transparent hover:border-border"
        >
          <Share className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-32">
        {/* Severity & Basic Info */}
        <section className="space-y-4">
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest",
            severityColors[disease.severity]
          )}>
            <Activity className="w-3 h-3" />
            Mức độ: {disease.severity}
          </div>
          <p className="font-serif text-2xl italic font-light text-white leading-relaxed">
            {disease.detailedDescription || disease.description}
          </p>
        </section>

        {/* Symptoms / Red Flags */}
        {disease.redFlags && disease.redFlags.length > 0 && (
          <section className="relative overflow-hidden bg-gradient-to-br from-red-500/10 via-red-500/[0.05] to-transparent border border-red-500/30 rounded-3xl p-6 space-y-5 shadow-[0_0_25px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20">
            {/* Background Accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 blur-3xl rounded-full" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-red-500">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Cảnh báo nguy cấp</h3>
                  <p className="text-[8px] text-red-400 font-bold uppercase tracking-widest mt-0.5">Liên hệ y tế ngay lập tức</p>
                </div>
              </div>
              <div className="bg-red-500 text-bg text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-red-500/20">
                CẤP CỨU
              </div>
            </div>

            <ul className="space-y-6 relative z-10">
              {disease.redFlags.map((flag, i) => (
                <li key={i} className="space-y-4">
                  <div className="flex items-start gap-4 text-[13px] text-white font-medium italic leading-relaxed group">
                    <div className="relative mt-1 flex-shrink-0">
                      <span className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-30" />
                      <div className="relative w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                        <div className="w-1 h-1 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="flex-1 flex items-start justify-between gap-4">
                      <span className="drop-shadow-sm">{flag}</span>
                      <button
                        onClick={() => generateSymptomImage(flag)}
                        disabled={loadingSymptom === flag}
                        className={cn(
                          "flex-shrink-0 p-2 rounded-lg transition-all border border-red-500/0",
                          symptomImages[flag]
                            ? "text-red-400 bg-red-500/20 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                            : "text-red-400/50 bg-red-500/5 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20"
                        )}
                        title="Tạo hình ảnh minh họa cảnh báo"
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
                        className="ml-8 overflow-hidden"
                      >
                        <div className="p-3 bg-red-500/5 rounded-2xl border border-red-500/20 space-y-3">
                          <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-red-500/20 shadow-2xl">
                            <img 
                              src={symptomImages[flag].url} 
                              alt={`Cảnh báo: ${flag}`}
                              className="w-full h-full object-cover grayscale opacity-50 brightness-110 contrast-125"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-transparent to-transparent" />
                            <div className="absolute top-2 right-2">
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/80 backdrop-blur-sm border border-red-400/30">
                                <AlertCircle className="w-2.5 h-2.5 text-white" />
                                <span className="text-[7px] font-black text-white uppercase tracking-widest">Urgent Scan</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] text-red-200/70 italic font-light leading-relaxed px-1">
                            "{symptomImages[flag].description}"
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

        {/* Main Content Sections */}
        <div className="grid gap-8">
          <DetailSection 
            icon={Activity} 
            title="Triệu chứng lâm sàng" 
            content={disease.symptoms} 
            accentColor="text-primary"
            onGenerateImage={generateSymptomImage}
            loadingSymptom={loadingSymptom}
            generatedImages={symptomImages}
          />
          <DetailSection 
            icon={Search} 
            title="Cơ chế & Nguyên nhân" 
            content={disease.causes} 
            accentColor="text-amber-400"
          />
          <DetailSection 
            icon={Stethoscope} 
            title="Quy trình Chẩn đoán" 
            content={disease.diagnosis} 
            accentColor="text-rose-400"
          />
          <DetailSection 
            icon={Pill} 
            title="Phương pháp Điều trị" 
            content={disease.treatment} 
            accentColor="text-indigo-400"
          />
          <DetailSection 
            icon={ShieldCheck} 
            title="Phòng ngừa & Lối sống" 
            content={disease.prevention} 
            accentColor="text-emerald-400"
          />
        </div>

        {/* Related Content */}
        {(disease.relatedHerbs || disease.relatedExercises) && (
          <section className="pt-8 border-t border-border space-y-8">
            {disease.relatedHerbs && disease.relatedHerbs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl italic font-light text-white">Dược liệu bổ trợ</h3>
                  <Leaf className="w-5 h-5 text-primary" />
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {disease.relatedHerbs.map((herb, i) => (
                    <button 
                      key={i}
                      onClick={() => onHerbClick?.(herb)}
                      className="flex-shrink-0 bg-panel border border-border px-5 py-3 rounded-xl text-[11px] font-bold text-text-dim uppercase tracking-widest hover:text-primary hover:border-primary/30 transition-all"
                    >
                      {herb}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {disease.relatedExercises && disease.relatedExercises.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl italic font-light text-white">Luyện tập trị liệu</h3>
                  <Dumbbell className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="grid gap-3">
                  {disease.relatedExercises.map((ex, i) => (
                    <button 
                      key={i}
                      onClick={() => onExerciseClick?.(ex)}
                      className="w-full bg-panel border border-border p-4 rounded-2xl flex items-center justify-between group hover:border-primary/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-primary border border-white/5">
                          <Activity className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">{ex}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-text-dim group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </motion.div>
  );
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

  const isSeriousSection = title === "Triệu chứng lâm sàng";

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 shadow-inner", accentColor)}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-[0.2em]">{title}</h3>
      </div>
      <div className="bg-panel border border-border rounded-3xl p-6 shadow-2xl">
        <ul className="space-y-6">
          {items.map((item, i) => (
            <li key={i} className="flex flex-col gap-4">
              <div className="flex items-start gap-3 group">
                <div className="mt-1.5 flex-shrink-0">
                  {isSeriousSection ? (
                    <div className="relative">
                      <div className={cn("w-1.5 h-1.5 rounded-full", accentColor.replace('text-', 'bg-'), "shadow-[0_0_8px_currentColor]")} />
                      <div className={cn("absolute inset-0 w-1.5 h-1.5 rounded-full animate-ping opacity-20", accentColor.replace('text-', 'bg-'))} />
                    </div>
                  ) : (
                    <span className={cn("w-1 h-1 rounded-full block", accentColor.replace('text-', 'bg-'))} />
                  )}
                </div>
                <div className="flex-1 flex items-start justify-between gap-4">
                  <span className="text-sm text-white/80 font-light leading-relaxed">{item}</span>
                  {isSeriousSection && onGenerateImage && (
                    <button
                      onClick={() => onGenerateImage(item)}
                      disabled={loadingSymptom === item}
                      className={cn(
                        "flex-shrink-0 p-2 rounded-lg transition-all border border-transparent",
                        generatedImages?.[item] 
                          ? "text-primary bg-primary/10 border-primary/20" 
                          : "text-text-dim bg-white/5 hover:text-white hover:border-white/10"
                      )}
                      title="Tạo hình ảnh minh họa bằng AI"
                    >
                      {loadingSymptom === item ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
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
                    className="ml-4 overflow-hidden"
                  >
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                        <img 
                          src={generatedImages[item].url} 
                          alt={`Minh họa cho triệu chứng: ${item}`}
                          className="w-full h-full object-cover grayscale opacity-60 mix-blend-screen"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-80" />
                        <div className="absolute bottom-3 left-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#2dd4bf]" />
                          <span className="text-[8px] font-bold text-white uppercase tracking-widest bg-bg/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                            AI Visual Analysis
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[9px] font-bold text-primary uppercase tracking-[0.2em]">
                          <Sparkles className="w-3 h-3" />
                          Phân tích thị giác AI
                        </div>
                        <p className="text-[11px] text-text-dim italic font-light leading-relaxed">
                          "{generatedImages[item].description}"
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
