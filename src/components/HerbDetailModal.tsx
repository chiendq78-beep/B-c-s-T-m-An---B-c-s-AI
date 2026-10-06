import { useState, useEffect } from 'react';
import { 
  X, 
  Bookmark, 
  Share2, 
  Sparkles, 
  MessageSquare, 
  AlertTriangle, 
  Flame, 
  ShieldCheck, 
  Check, 
  BookOpen, 
  ChevronRight,
  Info,
  Clock,
  Pill,
  Droplet
} from 'lucide-react';
import { motion } from 'motion/react';
import { HerbItem, NATURE_COLOR_MAP } from '../data/herbsData';
import { registerModal } from '../utils/modalManager';
import { useLanguage } from '../contexts/LanguageContext';

interface HerbDetailModalProps {
  herb: HerbItem | null;
  onClose: () => void;
  onFilterBySymptom?: (symptom: string) => void;
}

export default function HerbDetailModal({ herb, onClose, onFilterBySymptom }: HerbDetailModalProps) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!herb) return;
    try {
      const saved = localStorage.getItem('bookmarked_herbs');
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        setIsBookmarked(ids.includes(herb.id));
      }
    } catch (e) {
      console.error(e);
    }
  }, [herb]);

  // Register modal back press
  useEffect(() => {
    if (!herb) return;
    const unregister = registerModal('herb-detail-modal', onClose);
    const handleBack = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    window.addEventListener('app-back-press', handleBack);
    return () => {
      unregister();
      window.removeEventListener('app-back-press', handleBack);
    };
  }, [herb, onClose]);

  if (!herb) return null;

  const toggleBookmark = () => {
    try {
      const saved = localStorage.getItem('bookmarked_herbs');
      let ids: string[] = saved ? JSON.parse(saved) : [];
      if (ids.includes(herb.id)) {
        ids = ids.filter(i => i !== herb.id);
        setIsBookmarked(false);
      } else {
        ids.push(herb.id);
        setIsBookmarked(true);
      }
      localStorage.setItem('bookmarked_herbs', JSON.stringify(ids));
      window.dispatchEvent(new CustomEvent('app-herbs-bookmark-changed'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    const text = `Dược liệu Cổ truyền: ${herb.name_vi} (${herb.name_scientific})\nTính vị: ${herb.nature}, vị ${herb.tastes.join(', ')}\nQuy kinh: ${herb.meridians.join(', ')}\nChủ trị: ${herb.summaryAction}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: herb.name_vi,
          text: text,
          url: window.location.href,
        });
      } catch {
        // Fallback to copy
        copyToClipboard(text);
      }
    } else {
      copyToClipboard(text);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConsultAI = (topic?: string) => {
    const prompt = topic 
      ? `Chào Bác sĩ Tâm An, tôi muốn tìm hiểu cụ thể về vị thuốc Đông y ${herb.name_vi} (${herb.name_scientific}). Bác sĩ hãy giải thích rõ về: ${topic}, cách phối ngũ an toàn và các lưu ý lâm sàng.`
      : `Chào Bác sĩ Tâm An, xin tư vấn chi tiết về dược liệu ${herb.name_vi} (Tính ${herb.nature}, vị ${herb.tastes.join('/')}, quy kinh ${herb.meridians.join('/')}). Trường hợp của tôi có phù hợp dùng vị thuốc này không và liều lượng phối ngũ như thế nào?`;
    
    window.dispatchEvent(new CustomEvent('app-open-ai-chat', { detail: { prompt } }));
    onClose();
  };

  const natureStyle = NATURE_COLOR_MAP[herb.nature] || NATURE_COLOR_MAP['Bình'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl bg-panel border-0 sm:border sm:border-border rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-left"
      >
        {/* Header Bar with Safe Area for Mobile */}
        <div className="pt-[calc(max(env(safe-area-inset-top,0px),24px)+0.75rem)] sm:pt-4 px-5 pb-3 border-b border-border bg-panel/95 backdrop-blur-md flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
              {isEn ? "Traditional Pharmacopoeia" : "Dược điển Cổ truyền"}
            </span>
            <span className="text-[10px] text-text-dim px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
              {isEn ? (
                herb.groupId === 'bo-khi' ? 'Qi Tonic' :
                herb.groupId === 'giai-bieu' ? 'Exterior Release' :
                herb.groupId === 'an-than' ? 'Calming' :
                herb.groupId === 'tru-thap' ? 'Dampness' :
                herb.groupId === 'thanh-nhiet' ? 'Heat Clearing' : herb.groupName
              ) : herb.groupName}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleBookmark}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isBookmarked 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' 
                  : 'bg-white/5 text-text-dim hover:text-white border-white/10 hover:border-white/20'
              }`}
              title={isBookmarked ? (isEn ? "Remove bookmark" : "Bỏ lưu trữ") : (isEn ? "Save herb" : "Lưu vị thuốc")}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-white/5 text-text-dim hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer"
              title={isEn ? "Share" : "Chia sẻ"}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 text-text-dim hover:text-rose-400 border border-white/10 hover:border-white/20 transition-all cursor-pointer ml-1"
              title={isEn ? "Close" : "Đóng"}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Hero Banner with Botanical Image */}
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-md bg-slate-100 min-h-[170px] sm:min-h-[190px]">
            <img 
              src={herb.image} 
              alt={herb.name_vi}
              className="w-full h-full object-cover absolute inset-0 opacity-95 brightness-[1.02] contrast-[1.02]" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/25 to-transparent" />
            
            <div className="relative z-10 p-5 flex flex-col justify-end min-h-[170px] sm:min-h-[190px] space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-teal-800 bg-white/90 px-2 py-0.5 rounded border border-teal-200/80 shadow-xs backdrop-blur-md">
                  {herb.family}
                </span>
                {isEn ? (
                  <span className="text-xs font-semibold tracking-wide text-teal-900 bg-white/90 px-2.5 py-0.5 rounded border border-teal-200/80 shadow-xs backdrop-blur-md">
                    {herb.name_vi}
                  </span>
                ) : (
                  herb.name_en && (
                    <span className="text-xs font-semibold tracking-wide text-amber-900 bg-white/90 px-2.5 py-0.5 rounded border border-amber-200/80 shadow-xs backdrop-blur-md">
                      {herb.name_en}
                    </span>
                  )
                )}
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl italic font-bold text-white tracking-wide">
                {isEn ? (herb.name_en || herb.name_vi) : herb.name_vi}
              </h2>
              
              <p className="text-xs text-white/90 italic font-mono drop-shadow-sm">
                {herb.name_scientific} • {isEn ? "Part used: " : "Bộ phận dùng: "}<span className="text-white font-medium">{herb.partUsed}</span>
              </p>
            </div>
          </div>

          {/* Core Tứ Khí Ngũ Vị & Quy Kinh (Trụ cột Dược lý Đông Y) */}
          <div className="bg-white/[0.02] border border-border rounded-2xl p-4 sm:p-5 space-y-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {isEn ? "Four Qi • Five Flavors • Meridians" : "Tứ Khí • Ngũ Vị • Quy Kinh"}
              </h3>
              <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest">
                {isEn ? "Core Properties" : "Dược tính cốt lõi"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Tính (Tứ Khí) */}
              <div className={`p-3 rounded-xl border ${natureStyle.border} ${natureStyle.bg} flex flex-col justify-between`}>
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-dim">
                  {isEn ? "Four Qi (Nature)" : "Tứ Khí (Tính)"}
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className={`text-base font-bold ${natureStyle.text}`}>
                    {isEn ? (herb.nature === 'Hàn' ? 'Cold' : herb.nature === 'Lương' ? 'Cool' : herb.nature === 'Bình' ? 'Neutral' : herb.nature === 'Ôn' ? 'Warm' : 'Hot') : natureStyle.label}
                  </span>
                </div>
                <p className="text-[10px] text-text-dim mt-1">
                  {herb.nature === 'Hàn' && (isEn ? 'Clears heat, purges fire, detoxifies blood.' : 'Thanh nhiệt giải độc, lương huyết tả hỏa.')}
                  {herb.nature === 'Lương' && (isEn ? 'Gently cools heat evil, clears lung and liver.' : 'Làm mát dịu nhiệt tà, thanh phế can.')}
                  {herb.nature === 'Bình' && (isEn ? 'Harmonious nature, safe for long-term replenishment.' : 'Tính hòa hoãn, bồi bổ lâu dài không thiên lệch.')}
                  {herb.nature === 'Ôn' && (isEn ? 'Warms meridians, dispels cold, invigorates spleen.' : 'Làm ấm kinh lạc, trừ hàn ôn trung kiện tỳ.')}
                  {herb.nature === 'Nhiệt' && (isEn ? 'Deeply tonifies primary yang, revives devastated collapse.' : 'Đại bổ nguyên dương, hồi dương cứu nghịch.')}
                </p>
              </div>

              {/* Vị (Ngũ Vị) */}
              <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/10 flex flex-col justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-dim">
                  {isEn ? "Five Flavors" : "Ngũ Vị"}
                </span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {herb.tastes.map(taste => (
                    <span key={taste} className="text-xs font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                      {isEn ? (taste === 'Ngọt' ? 'Sweet' : taste === 'Cay' ? 'Acrid' : taste === 'Đắng' ? 'Bitter' : taste === 'Chua' ? 'Sour' : taste === 'Mặn' ? 'Salty' : 'Astringent') : `Vị ${taste}`}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-text-dim mt-1">
                  {herb.tastes.includes('Ngọt') && (isEn ? 'Sweet tonifies and harmonizes. ' : 'Vị ngọt bổ trung hòa hoãn. ')}
                  {herb.tastes.includes('Cay') && (isEn ? 'Acrid disperses and circulates qi. ' : 'Vị cay phát tán hành khí. ')}
                  {herb.tastes.includes('Đắng') && (isEn ? 'Bitter clears heat and dries dampness. ' : 'Vị đắng thanh nhiệt táo thấp. ')}
                  {herb.tastes.includes('Chua') && (isEn ? 'Sour astringes and restrains leakage. ' : 'Vị chua thu liễm cố sáp. ')}
                  {herb.tastes.includes('Mặn') && (isEn ? 'Salty softens hardness and moistens bowels. ' : 'Vị mặn nhuyễn kiên thông tiện. ')}
                </p>
              </div>

              {/* Quy Kinh (12 Kinh lạc) */}
              <div className="p-3 rounded-xl border border-teal-500/20 bg-teal-500/10 flex flex-col justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-dim">
                  {isEn ? "Meridians Entered" : "Quy Kinh Lạc"}
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {herb.meridians.map(m => (
                    <span key={m} className="text-xs font-bold text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/30">
                      {isEn ? (m === 'Phế' ? 'Lung' : m === 'Tỳ' ? 'Spleen' : m === 'Vị' ? 'Stomach' : m === 'Tâm' ? 'Heart' : m === 'Can' ? 'Liver' : m === 'Thận' ? 'Kidney' : m === 'Đởm' ? 'Gallbladder' : m === 'Bàng quang' ? 'Bladder' : m) : `Kinh ${m}`}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-text-dim mt-1">
                  {isEn ? "Directs therapeutic actions precisely to targeted organs." : "Dẫn trực tiếp tác dược vào các tạng phủ chỉ định."}
                </p>
              </div>
            </div>
          </div>

          {/* Công Năng & Chủ Trị Lâm Sàng */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Pill className="w-4 h-4 text-primary" />
              {isEn ? "Clinical Actions & Indications" : "Công Năng & Chủ Trị Lâm Sàng"}
            </h3>
            <div className="bg-primary/[0.04] border border-primary/20 rounded-2xl p-4">
              <p className="text-sm font-medium text-primary leading-relaxed">
                {herb.summaryAction}
              </p>
            </div>
            <ul className="space-y-2 pt-1">
              {herb.detailedActions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Thể Trạng & Triệu Chứng Tương Thích */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {isEn ? "Target Conditions & Matched Symptoms" : "Phù Hợp Gợi Ý Cho Thể Trạng / Triệu Chứng"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {herb.matchedSymptoms.map((sym, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (onFilterBySymptom) {
                      onFilterBySymptom(sym);
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-primary/20 text-xs text-white border border-white/10 hover:border-primary/40 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{sym}</span>
                  <ChevronRight className="w-3 h-3 text-text-dim" />
                </button>
              ))}
            </div>
          </div>

          {/* Liều Lượng & Cách Chế Biến Cổ Truyền */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/[0.02] border border-border rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-text-dim text-[10px] font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {isEn ? "Standard Daily Dosage" : "Liều Lượng Dùng Thường Nhật"}
              </div>
              <p className="text-xs text-white font-medium">
                {herb.dosage}
              </p>
            </div>

            <div className="bg-white/[0.02] border border-border rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-text-dim text-[10px] font-bold uppercase tracking-wider">
                <Droplet className="w-3.5 h-3.5 text-teal-400" />
                {isEn ? "Preparation & Processing" : "Bào Chế & Kinh Nghiệm Dân Gian"}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                {herb.preparationTip}
              </p>
            </div>
          </div>

          {/* Kiêng Kỵ & Chống Chỉ Định (Medical Safety Warning) */}
          <div className="bg-emerald-700 text-white-pure border border-emerald-600 shadow-sm rounded-2xl p-4 sm:p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-white-pure text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-white-pure" />
              <span className="text-white-pure">
                {isEn ? "Contraindications & Safety Precautions" : "Kiêng Kỵ & Chống Chỉ Định An Toàn"}
              </span>
            </div>
            <ul className="space-y-1.5 pl-1">
              {herb.contraindications.map((ci, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-white-pure leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 flex-shrink-0" />
                  <span className="text-white-pure">{ci}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bài Thuốc Phối Ngũ Kinh Điển */}
          {herb.classicFormulas && herb.classicFormulas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  {isEn ? "Classical Herbal Prescriptions" : "Bài Thuốc Phối Ngũ Kinh Điển"}
                </h3>
                <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest">
                  {herb.classicFormulas.length} {isEn ? "Prescriptions" : "Phương thang"}
                </span>
              </div>

              <div className="space-y-3">
                {herb.classicFormulas.map((formula, idx) => (
                  <div 
                    key={idx}
                    className="bg-white/[0.02] border border-border hover:border-primary/30 rounded-2xl p-4 space-y-2.5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif text-base italic font-bold text-white group-hover:text-primary">
                        {formula.name}
                      </h4>
                      <button 
                        onClick={() => handleConsultAI(`bài thuốc ${formula.name}`)}
                        className="text-[10px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        {isEn ? "Ask how to brew" : "Hỏi cách sắc"} <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-xs text-text-dim italic">
                      <span className="font-semibold text-slate-300">{isEn ? "Indications: " : "Chủ trị: "}</span>
                      {formula.indication}
                    </p>

                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-text-dim">
                        {isEn ? "Formulation Ingredients:" : "Thành phần phối ngũ:"}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {formula.composition.map((comp, cIdx) => (
                          <span 
                            key={cIdx}
                            className="text-[10px] text-white/90 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs bg-emerald-700 text-white-pure p-3 rounded-xl border border-emerald-600 shadow-sm leading-relaxed font-normal">
                      <span className="font-bold text-white-pure">{isEn ? "Usage & Dosage: " : "Cách dùng: "}</span>
                      <span className="text-white-pure">{formula.usage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="p-4 border-t border-border bg-panel/95 backdrop-blur-md flex items-center gap-3">
          <button
            onClick={() => handleConsultAI()}
            className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(20,184,166,0.3)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 fill-slate-950" />
            <span>{isEn ? "Ask AI Doctor About This Herb" : "Hỏi Bác sĩ AI về Vị thuốc này"}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-text-dim hover:text-white border border-white/10 transition-all cursor-pointer"
          >
            {isEn ? "Close" : "Đóng"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
