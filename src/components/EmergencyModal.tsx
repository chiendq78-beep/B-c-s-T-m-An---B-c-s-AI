import { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  AlertTriangle, 
  MapPin, 
  Copy, 
  Check, 
  Heart, 
  X, 
  ShieldAlert, 
  Flame, 
  Zap, 
  Activity, 
  Stethoscope,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { registerModal } from '../utils/modalManager';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FirstAidGuide {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  steps: string[];
  warning?: string;
}

const FIRST_AID_GUIDES: FirstAidGuide[] = [
  {
    id: 'cpr',
    title: 'Ép tim CPR & Hồi sinh tim phổi',
    subtitle: 'Nạn nhân bất tỉnh, ngừng thở hoặc thở ngáp',
    icon: Heart,
    color: 'rose',
    steps: [
      'Gọi ngay 115 và đặt người bệnh nằm ngửa trên mặt phẳng cứng.',
      'Đặt gót một bàn tay vào giữa ngực (nửa dưới xương ức), đặt bàn tay kia chồng lên và đan các ngón tay.',
      'Ép ngực liên tục với tần số 100 - 120 lần/phút, độ sâu 5 - 6 cm (dùng trọng lượng cơ thể từ vai dồn xuống).',
      'Sau mỗi 30 lần ép ngực, thổi ngạt 2 lần liên tiếp (nếu được đào tạo). Nếu không, tiếp tục ép ngực không gián đoạn cho đến khi nhân viên y tế đến.'
    ],
    warning: 'Không ép ngực nếu nạn nhân vẫn tỉnh táo, còn thở đều.'
  },
  {
    id: 'fast',
    title: 'Đột quỵ não (Quy tắc F.A.S.T)',
    subtitle: 'Nhận biết giờ vàng cấp cứu đột quỵ',
    icon: Zap,
    color: 'amber',
    steps: [
      'F - Face (Mặt): Yêu cầu người bệnh cười. Xem một bên mặt có bị méo, xệ khóe miệng không.',
      'A - Arm (Tay): Yêu cầu giơ 2 tay lên cao. Xem một bên tay có bị yếu, rơi xuống không.',
      'S - Speech (Lời nói): Yêu cầu nói câu đơn giản. Xem giọng có ngọng, ú ớ, khó hiểu không.',
      'T - Time (Thời gian): Nếu có bất kỳ dấu hiệu nào, gọi ngay 115 lập tức. Đặt bệnh nhân nằm nghiêng an toàn, KHÔNG cạo gió, KHÔNG cho uống thuốc hay ăn uống.'
    ],
    warning: 'Thời gian vàng cấp cứu đột quỵ là trong vòng 3 - 4.5 giờ đầu!'
  },
  {
    id: 'heimlich',
    title: 'Hóc dị vật / Tắc nghẽn đường thở',
    subtitle: 'Thủ thuật Heimlich giải phóng đường thở',
    icon: AlertTriangle,
    color: 'orange',
    steps: [
      'Đứng sau lưng nạn nhân, vòng 2 tay qua eo nạn nhân.',
      'Nắm một bàn tay thành nắm đấm, đặt ngón cái ngay phía trên rốn và dưới mũi ức.',
      'Bàn tay kia ôm lấy nắm đấm, giật mạnh theo hướng VÀO TRONG và LÊN TRÊN dứt khoát.',
      'Lặp lại 5 lần cho đến khi dị vật bật ra hoặc nạn nhân thở lại được.'
    ],
    warning: 'Với phụ nữ mang thai hoặc người béo phì, ép tay ở giữa xương ức thay vì vùng bụng.'
  },
  {
    id: 'bleeding',
    title: 'Chảy máu cấp & Cầm máu',
    subtitle: 'Vết thương hở chảy máu nhiều',
    icon: Activity,
    color: 'red',
    steps: [
      'Dùng gạc sạch hoặc vải sạch ép trực tiếp lên miệng vết thương với lực mạnh vừa đủ.',
      'Nâng cao vùng bị thương cao hơn tim (nếu không nghi ngờ gãy xương).',
      'Nếu máu thấm ướt gạc, KHÔNG gỡ gạc cũ ra mà đặt thêm lớp gạc mới lên trên và tiếp tục ấn chặt.',
      'Băng ép cố định và chuyển ngay đến cơ sở y tế gần nhất.'
    ],
    warning: 'Không được tự ý rút các dị vật lớn đâm sâu trong vết thương ra.'
  },
  {
    id: 'burn',
    title: 'Sơ cứu Bỏng (Lửa / Nước sôi)',
    subtitle: 'Hạ nhiệt và bảo vệ vùng da tổn thương',
    icon: Flame,
    color: 'amber',
    steps: [
      'Ngâm hoặc xối vùng bỏng dưới vòi nước mát sạch (15 - 20°C) liên tục trong 15 - 20 phút.',
      'Tháo bỏ đồ trang sức, đồng hồ, nới lỏng quần áo trước khi vùng bỏng bị sưng phù.',
      'Bọc nhẹ vùng bỏng bằng gạc sạch vô khuẩn hoặc màng bọc thực phẩm sạch.',
      'Giữ ấm cho người bệnh và đưa đến bệnh viện nếu vết bỏng rộng hoặc phồng rộp nặng.'
    ],
    warning: 'Tuyệt đối KHÔNG dùng đá lạnh chườm trực tiếp, KHÔNG bôi kem đánh răng, nước mắm hay mỡ trăn lên vết bỏng.'
  }
];

const MAJOR_HOSPITALS = [
  { name: 'Trung tâm Cấp cứu 115', hotline: '115', desc: 'Đầu số Cấp cứu Y tế Toàn quốc (Miễn phí 24/7)' },
  { name: 'Đường dây nóng Bộ Y Tế', hotline: '19009095', desc: 'Tư vấn y tế & Tiếp nhận phản ánh khẩn cấp' },
  { name: 'Cứu hộ cứu nạn khẩn cấp', hotline: '112', desc: 'Tìm kiếm cứu nạn, thiên tai, tai nạn nghiêm trọng' },
  { name: 'BV Bạch Mai (Hà Nội)', hotline: '02438693731', desc: 'Khoa Cấp cứu A9 - Cấp cứu đa khoa tuyến cuối' },
  { name: 'BV Chợ Rẫy (TP.HCM)', hotline: '02838554137', desc: 'Khoa Cấp cứu Hồi sức tích cực đầu ngành phía Nam' },
  { name: 'BV Đại học Y Dược (TP.HCM)', hotline: '02838554269', desc: 'Trung tâm Cấp cứu & Can thiệp mạch can thiệp' },
  { name: 'BV Trung ương Huế', hotline: '02343822325', desc: 'Trung tâm Cấp cứu đa khoa Miền Trung' }
];

export default function EmergencyModal({ isOpen, onClose }: EmergencyModalProps) {
  const [activeTab, setActiveTab] = useState<'call' | 'firstaid'>('call');
  const [selectedGuide, setSelectedGuide] = useState<FirstAidGuide | null>(FIRST_AID_GUIDES[0]);
  
  // Location detection
  const [locationText, setLocationText] = useState<string>('Đang định vị tọa độ...');
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [copiedLocation, setCopiedLocation] = useState(false);
  const [locating, setLocating] = useState(false);
  const [emergencyContactName] = useState(() => localStorage.getItem('emergency_contactName') || '');
  const [emergencyContactPhone] = useState(() => localStorage.getItem('emergency_contactPhone') || '');

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setLocationText('Trình duyệt không hỗ trợ định vị tự động');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationCoords({ lat: latitude, lng: longitude });
        setLocationText(`Vĩ độ: ${latitude.toFixed(5)}, Kinh độ: ${longitude.toFixed(5)}`);
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocationText('Chưa cấp quyền GPS. Vui lòng đọc địa chỉ cụ thể của bạn cho trực đài 115.');
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (isOpen) {
      fetchLocation();
    }
  }, [isOpen]);

  const copyLocationToClipboard = () => {
    if (locationCoords) {
      const text = `Tọa độ vị trí cấp cứu: https://maps.google.com/?q=${locationCoords.lat},${locationCoords.lng} (${locationText})`;
      navigator.clipboard.writeText(text);
      setCopiedLocation(true);
      setTimeout(() => setCopiedLocation(false), 3000);
    } else {
      navigator.clipboard.writeText(locationText);
      setCopiedLocation(true);
      setTimeout(() => setCopiedLocation(false), 3000);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const unregister = registerModal('emergency-modal', onClose);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unregister();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen flex flex-col bg-white overflow-hidden select-none">
      {/* Modal Card Fullscreen */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full h-full min-h-screen bg-white flex flex-col overflow-hidden"
      >
        {/* Urgent Teal Green Header: Nền xanh, chữ trắng */}
        <div className="emergency-header bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-force-white p-4 sm:p-6 pt-[calc(max(env(safe-area-inset-top,0px),16px)+0.5rem)] relative overflow-hidden flex-shrink-0 shadow-lg">
          <div className="max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner animate-pulse flex-shrink-0">
                  <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 text-force-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-force-white tracking-wide">HỖ TRỢ Y TẾ</h2>
                    <span className="badge-115 px-2 py-0.5 rounded-full bg-white text-teal-800 text-[10px] font-black tracking-widest uppercase shadow-2xs">
                      115
                    </span>
                  </div>
                  <p className="text-teal-50 text-xs mt-0.5 font-medium opacity-90">Hỗ trợ khẩn cấp 24/7 & Hướng dẫn sơ cứu tức thì</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-force-white flex items-center justify-center transition-all cursor-pointer border border-white/20 flex-shrink-0 active:scale-95"
                title="Đóng (Esc)"
              >
                <X className="w-5 h-5 text-force-white" />
              </button>
            </div>

            {/* Quick tabs */}
            <div className="flex gap-1.5 sm:gap-2 mt-4 bg-teal-950/25 p-1 rounded-xl backdrop-blur-sm border border-white/20">
              <button
                onClick={() => setActiveTab('call')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === 'call' 
                    ? "active-tab-btn bg-white text-teal-800 shadow-md font-black" 
                    : "text-force-white/90 hover:text-force-white"
                )}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Gọi 115 & Hotline</span>
              </button>
              <button
                onClick={() => setActiveTab('firstaid')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === 'firstaid' 
                    ? "active-tab-btn bg-white text-teal-800 shadow-md font-black" 
                    : "text-force-white/90 hover:text-force-white"
                )}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Sơ cứu khẩn cấp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-2xl mx-auto w-full space-y-5">
            {/* TAB 1: CALL 115 & HOTLINES */}
            {activeTab === 'call' && (
              <div className="space-y-5">
                {/* Giant One-Touch 115 Button */}
                <div className="text-center bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 shadow-sm">
                  <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-3">
                    NHẤN ĐỂ GỌI TRỰC TIẾP CẤP CỨU Y TẾ
                  </p>
                  <a
                    href="tel:115"
                    className="btn-call-115 inline-flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-force-white rounded-2xl font-black text-xl sm:text-2xl shadow-[0_8px_30px_rgba(225,29,72,0.4)] transition-all transform active:scale-95 group border-2 border-white cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
                      <PhoneCall className="w-6 h-6 text-force-white" />
                    </div>
                    <span className="text-force-white">GỌI 115 NGAY (MIỄN PHÍ)</span>
                  </a>
                  <p className="text-[11px] text-slate-500 mt-3 font-medium">
                    Trực đài tiếp nhận 24/7 trên toàn quốc • Hỗ trợ điều phối xe cứu thương gần nhất
                  </p>
                </div>

              {/* Live Location Helper Card: Nền xanh nhạt */}
              <div className="bg-emerald-50/75 border border-emerald-200/90 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Vị trí hiện tại của bạn (Đọc cho trực đài 115)
                  </span>
                  <button
                    onClick={fetchLocation}
                    disabled={locating}
                    className="text-[10px] text-teal-700 hover:text-teal-900 hover:underline font-bold cursor-pointer"
                  >
                    {locating ? 'Đang cập nhật...' : 'Làm mới GPS'}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-white/95 p-3 rounded-xl border border-emerald-200/80 gap-2 shadow-2xs">
                  <span className="text-xs text-slate-800 font-medium select-all break-all">
                    {locationText}
                  </span>
                  <button
                    onClick={copyLocationToClipboard}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 rounded-lg text-xs font-bold flex items-center gap-1 flex-shrink-0 transition-colors cursor-pointer active:scale-95"
                    title="Sao chép tọa độ"
                  >
                    {copiedLocation ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Emergency Contact Quick Dial */}
              {emergencyContactPhone && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                      Người thân khẩn cấp ({emergencyContactName || 'Người nhà'})
                    </span>
                    <span className="text-xs text-slate-800 font-bold mt-0.5 block">{emergencyContactPhone}</span>
                  </div>
                  <a
                    href={`tel:${emergencyContactPhone}`}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Gọi người thân</span>
                  </a>
                </div>
              )}

              {/* Other Vital Hotlines */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Đường dây nóng bệnh viện tuyến đầu
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {MAJOR_HOSPITALS.map((hosp, idx) => (
                    <a
                      key={idx}
                      href={`tel:${hosp.hotline}`}
                      className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between group transition-all cursor-pointer shadow-2xs hover:border-teal-300"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{hosp.name}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{hosp.desc}</p>
                      </div>
                      <div className="flex items-center gap-1 text-teal-700 font-mono font-bold text-xs bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors flex-shrink-0">
                        <PhoneCall className="w-3 h-3" />
                        <span>{hosp.hotline}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FIRST AID GUIDES */}
          {activeTab === 'firstaid' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 font-medium">
                Chọn tình huống cấp bách bên dưới để xem các bước xử trí cứu sinh ngay trong khi chờ xe cấp cứu 115 đến:
              </p>

              {/* Horizontal Tabs for First Aid topics */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {FIRST_AID_GUIDES.map((guide) => {
                  const isSelected = selectedGuide?.id === guide.id;
                  const IconComp = guide.icon;
                  return (
                    <button
                      key={guide.id}
                      onClick={() => setSelectedGuide(guide)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer",
                        isSelected
                          ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{guide.title.split('(')[0]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Guide Details */}
              {selectedGuide && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start gap-3 border-b border-slate-200 pb-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                      <selectedGuide.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{selectedGuide.title}</h3>
                      <p className="text-xs text-slate-600 mt-0.5">{selectedGuide.subtitle}</p>
                    </div>
                  </div>

                  {/* Step by step list */}
                  <div className="space-y-2.5">
                    <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Các bước thực hiện chuẩn y khoa:</p>
                    {selectedGuide.steps.map((step, sIdx) => (
                      <div key={sIdx} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
                        <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <p className="text-xs text-slate-800 leading-relaxed font-medium">{step}</p>
                      </div>
                    ))}
                  </div>

                  {/* Caution Warning Box */}
                  {selectedGuide.warning && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] font-medium leading-relaxed">
                        <strong>Lưu ý an toàn:</strong> {selectedGuide.warning}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0 pb-[calc(max(env(safe-area-inset-bottom,0px),12px)+0.5rem)]">
          <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
            <p className="text-[10px] text-slate-500 font-medium">
              * Trong tình huống khẩn cấp, luôn ưu tiên gọi ngay 115 trước tiên.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer active:scale-95 shadow-2xs"
            >
              Đóng
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
