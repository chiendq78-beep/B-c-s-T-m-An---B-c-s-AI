import { useState } from 'react';
import { 
  HelpCircle, 
  PhoneCall, 
  Mail, 
  MessageSquare, 
  Sparkles, 
  X, 
  BookOpen, 
  Send, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight,
  ShieldCheck,
  Activity,
  Heart,
  Pill,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAIChat?: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'ai' | 'privacy' | 'tools';
}

const FAQS: FAQItem[] = [
  {
    question: 'Bác sĩ AI Tâm An có thể thay thế bác sĩ khám trực tiếp không?',
    answer: 'Bác sĩ AI Tâm An là hệ thống AI y khoa học thuật hỗ trợ tham vấn, sàng lọc triệu chứng ban đầu, gợi ý thảo dược Đông y và hướng dẫn chăm sóc sức khỏe. Trong các trường hợp bệnh lý nghiêm trọng hoặc cấp cứu, bạn luôn cần đến trực tiếp cơ sở y tế hoặc liên hệ 115.',
    category: 'ai'
  },
  {
    question: 'Dữ liệu chỉ số sức khỏe của tôi được lưu trữ và bảo mật như thế nào?',
    answer: 'Dữ liệu chỉ số sinh hiệu (Huyết áp, Đường huyết, BMI, Lịch sử uống thuốc) được mã hóa an toàn trên hệ thống đám mây bảo mật Google Cloud Firebase và chỉ riêng tài khoản của bạn mới có quyền truy cập.',
    category: 'privacy'
  },
  {
    question: 'Làm thế nào để cài đặt nhắc nhở uống thuốc và đo đường huyết?',
    answer: 'Tại màn hình "Tổng quan", bấm vào nút "Nhắc nhở Y tế" hoặc dấu cộng ở mục Lịch nhắc nhở. Bạn có thể chọn nhanh các mẫu có sẵn (Uống thuốc, Đo tiểu đường, Đo huyết áp...) và thiết lập giờ nhắc nhở hàng ngày.',
    category: 'tools'
  },
  {
    question: 'Cách xuất Báo cáo Bệnh án & Sức khỏe PDF gửi cho bác sĩ?',
    answer: 'Tại màn hình "Tổng quan", bạn kéo xuống phần Chỉ số & Xu hướng, bấm vào nút "Xuất Báo Cáo PDF". Hệ thống sẽ tổng hợp đầy đủ các chỉ số sinh hiệu, lịch sử dùng thuốc và biểu đồ thành tệp PDF chuẩn y khoa để bạn in hoặc gửi trực tiếp cho bác sĩ điều trị.',
    category: 'tools'
  },
  {
    question: 'Mô hình Giải phẫu 3D và Dược liệu Việt lấy nguồn dữ liệu từ đâu?',
    answer: 'Kho dữ liệu giải phẫu và dược liệu được biên soạn dựa trên Dược điển Việt Nam, sách Giải phẫu học Y khoa và tài liệu nghiên cứu y học cổ truyền chính thống, cung cấp hình ảnh trực quan 2D/3D sinh động.',
    category: 'general'
  }
];

export default function SupportModal({ isOpen, onClose, onOpenAIChat }: SupportModalProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'guide' | 'faq' | 'contact' | 'feedback'>('guide');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Feedback form state
  const [feedbackSubject, setFeedbackSubject] = useState('Đóng góp tính năng mới');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setFeedbackMessage('');
    }, 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md cursor-pointer"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-teal-100 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
      >
        {/* Teal Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white p-5 sm:p-6 relative overflow-hidden flex-shrink-0 shadow-md">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">TRUNG TÂM HỖ TRỢ & HƯỚNG DẪN</h2>
                <p className="text-teal-100 text-xs mt-0.5 font-medium">Bác sĩ Tâm An AI • Đồng hành cùng sức khỏe gia đình bạn</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Sub-tabs */}
          <div className="flex gap-1.5 mt-4 bg-black/20 p-1 rounded-xl backdrop-blur-sm border border-white/15 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('guide')}
              className={cn(
                "flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                activeTab === 'guide' ? "bg-white text-teal-800 shadow-sm font-black" : "text-white/80 hover:text-white"
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Hướng dẫn</span>
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={cn(
                "flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                activeTab === 'faq' ? "bg-white text-teal-800 shadow-sm font-black" : "text-white/80 hover:text-white"
              )}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Hỏi đáp (FAQ)</span>
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={cn(
                "flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                activeTab === 'contact' ? "bg-white text-teal-800 shadow-sm font-black" : "text-white/80 hover:text-white"
              )}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Liên hệ</span>
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={cn(
                "flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                activeTab === 'feedback' ? "bg-white text-teal-800 shadow-sm font-black" : "text-white/80 hover:text-white"
              )}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Góp ý</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* TAB 1: USER GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-teal-800 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>1. Tham vấn Bác sĩ AI</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Bấm vào nút "Hỏi Bác Sĩ AI" ở góc dưới hoặc thanh tiêu đề để mô tả triệu chứng, hỏi về tương tác thuốc và nhận lời khuyên dinh dưỡng tức thì.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>2. Theo dõi Chỉ số Sinh hiệu</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Nhập huyết áp, đường huyết, nhịp tim, chỉ số BMI và lượng nước uống mỗi ngày. Ứng dụng tự động vẽ đồ thị xu hướng và phân tích nguy cơ.
                  </p>
                </div>

                <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                    <Pill className="w-4 h-4 text-blue-600" />
                    <span>3. Lịch Nhắc Uống Thuốc</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Cài đặt chuông báo và thông báo nhắc nhở uống thuốc đúng giờ theo đơn bác sĩ, nhắc đo đường huyết trước/sau ăn và đo huyết áp định kỳ.
                  </p>
                </div>

                <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>4. Tra cứu Dược liệu & Bệnh học</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Tìm kiếm từ điển hàng trăm cây thuốc Nam, bài thuốc cổ truyền và tra cứu nguyên nhân, triệu chứng các bệnh lý thường gặp.
                  </p>
                </div>
              </div>

              {/* Quick AI Trigger Card inside Guide */}
              <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                <div>
                  <h4 className="text-xs font-bold text-teal-900">Cần tư vấn trực tiếp ngay bây giờ?</h4>
                  <p className="text-[11px] text-teal-700 mt-0.5">Trợ lý y khoa Tâm An AI sẵn sàng giải đáp mọi thắc mắc của bạn.</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenAIChat) onOpenAIChat();
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all flex-shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Trò chuyện AI</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div 
                    key={idx} 
                    className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 transition-colors hover:border-teal-300"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <span className="text-xs font-bold text-slate-800 leading-snug">{faq.question}</span>
                      <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform flex-shrink-0", isOpen && "rotate-180 text-teal-600")} />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 bg-white"
                        >
                          {faq.answer}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: CONTACT & SUPPORT HOTLINE */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Kênh liên hệ hỗ trợ</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href="tel:19009095"
                    className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3 hover:border-teal-400 hover:shadow-xs transition-all cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Hotline Y Tế Quốc Gia</span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5">1900 9095 (24/7)</span>
                    </div>
                  </a>

                  <a
                    href="mailto:support@tamanai.health"
                    className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3 hover:border-teal-400 hover:shadow-xs transition-all cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Email hỗ trợ kỹ thuật</span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5">support@tamanai.health</span>
                    </div>
                  </a>
                </div>
              </div>

              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Cam kết Y đức & Bảo mật thông tin</span>
                </div>
                <p className="text-[11px] text-teal-800 leading-relaxed">
                  Ứng dụng Bác sĩ Tâm An cam kết tuân thủ các quy chuẩn bảo mật y tế số hóa, tôn trọng quyền riêng tư và không chia sẻ hồ sơ bệnh án của bạn cho bất kỳ bên thứ ba nào.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: FEEDBACK FORM */}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              {feedbackSent ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-900">Cảm ơn bạn đã gửi ý kiến đóng góp!</h4>
                  <p className="text-xs text-emerald-700">
                    Đội ngũ phát triển Bác sĩ Tâm An sẽ nghiên cứu và không ngừng hoàn thiện để mang lại trải nghiệm y tế tốt nhất cho bạn và gia đình.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendFeedback} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Chủ đề phản hồi
                    </label>
                    <select
                      value={feedbackSubject}
                      onChange={(e) => setFeedbackSubject(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-teal-500"
                    >
                      <option value="Đóng góp tính năng mới">Đóng góp tính năng mới</option>
                      <option value="Báo lỗi kỹ thuật">Báo lỗi kỹ thuật</option>
                      <option value="Góp ý về lời khuyên Bác sĩ AI">Góp ý về lời khuyên Bác sĩ AI</option>
                      <option value="Góp ý về từ điển Dược liệu & Bệnh học">Góp ý về từ điển Dược liệu & Bệnh học</option>
                      <option value="Ý kiến khác">Ý kiến khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Nội dung chi tiết
                    </label>
                    <textarea
                      rows={4}
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      placeholder="Mô tả ý kiến hoặc vấn đề bạn gặp phải trong quá trình sử dụng ứng dụng..."
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-teal-500 leading-relaxed"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Gửi ý kiến đóng góp</span>
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] text-slate-500 font-medium">
            Phiên bản: Tâm An Expert AI v2.6.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </motion.div>
    </div>
  );
}
