import { useState, useEffect, useMemo } from 'react';
import { 
  Scale, 
  Ruler, 
  Sparkles, 
  Info, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Heart, 
  Activity,
  Flame,
  Droplets,
  BookmarkCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

interface BmiCategory {
  label: string;
  sublabel: string;
  color: string;
  textColor: string;
  badgeBg: string;
  borderColor: string;
  rangeText: string;
  min: number;
  max: number;
  description: string;
  advice: string;
  herbs: string[];
  exercises: string[];
}

export default function BmiCalculatorCard() {
  const { user } = useAuth();

  // Load saved height and weight from localStorage if available
  const [height, setHeight] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_bmi_height');
      return saved ? parseFloat(saved) : 165;
    }
    return 165;
  });

  const [weight, setWeight] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_bmi_weight');
      return saved ? parseFloat(saved) : 60;
    }
    return 60;
  });

  const [standard, setStandard] = useState<'asian' | 'who'>('asian');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Save to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_bmi_height', height.toString());
      localStorage.setItem('user_bmi_weight', weight.toString());
    }
  }, [height, weight]);

  // BMI Calculation
  const bmiValue = useMemo(() => {
    if (!height || height <= 0 || !weight || weight <= 0) return 0;
    const heightInMeters = height / 100;
    const val = weight / (heightInMeters * heightInMeters);
    return parseFloat(val.toFixed(1));
  }, [height, weight]);

  // Ideal weight range for height
  const idealWeightRange = useMemo(() => {
    if (!height || height <= 0) return { min: 0, max: 0 };
    const h = height / 100;
    if (standard === 'asian') {
      return {
        min: parseFloat((18.5 * h * h).toFixed(1)),
        max: parseFloat((22.9 * h * h).toFixed(1))
      };
    }
    return {
      min: parseFloat((18.5 * h * h).toFixed(1)),
      max: parseFloat((24.9 * h * h).toFixed(1))
    };
  }, [height, standard]);

  // Weight difference compared to ideal mid-point
  const weightDiff = useMemo(() => {
    const idealMid = (idealWeightRange.min + idealWeightRange.max) / 2;
    const diff = weight - idealMid;
    return parseFloat(diff.toFixed(1));
  }, [weight, idealWeightRange]);

  // Asian Standard (WPRO / IDI) vs WHO Standard
  const categories: BmiCategory[] = useMemo(() => {
    if (standard === 'asian') {
      return [
        {
          label: 'Thiếu cân / Gầy',
          sublabel: 'Cần bổ sung khí huyết',
          color: 'bg-sky-500',
          textColor: 'text-sky-400',
          badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
          borderColor: 'border-sky-500/30',
          rangeText: '< 18.5',
          min: 0,
          max: 18.4,
          description: 'Cơ thể đang ở mức nhẹ cân. Cần chú ý bồi bổ tỳ vị, tăng cường hấp thu dinh dưỡng và xây dựng cơ bắp.',
          advice: 'Ăn thêm các bữa phụ giàu đạm, hạt dinh dưỡng, chia nhỏ bữa ăn và ngủ đủ 7-8 tiếng.',
          herbs: ['Đẳng sâm', 'Hoàng kỳ', 'Đại táo', 'Kỷ tử', 'Long nhãn'],
          exercises: ['Yoga tăng cường cơ bắp', 'Tập tạ nhẹ', 'Khí công dưỡng sinh']
        },
        {
          label: 'Bình thường / Lý tưởng',
          sublabel: 'Thể trạng cân đối tuyệt vời',
          color: 'bg-emerald-500',
          textColor: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          borderColor: 'border-emerald-500/30',
          rangeText: '18.5 - 22.9',
          min: 18.5,
          max: 22.9,
          description: 'Chúc mừng bạn! Chỉ số BMI hoàn toàn nằm trong ngưỡng khỏe mạnh chuẩn châu Á. Nguy cơ mắc bệnh chuyển hóa thấp.',
          advice: 'Tiếp tục duy trì chế độ ăn uống cân bằng âm dương, luyện tập thể thao đều đặn 30 phút mỗi ngày.',
          herbs: ['Trà hoa cúc', 'Linh chi', 'Táo đỏ', 'Lá sen hãm trà'],
          exercises: ['Chạy bộ nhẹ nhàng', 'Bơi lội', 'Bát đoạn cẩm dưỡng sinh']
        },
        {
          label: 'Thừa cân (Tiền béo phì)',
          sublabel: 'Cần kiểm soát calo & mỡ thừa',
          color: 'bg-amber-500',
          textColor: 'text-amber-400',
          badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          borderColor: 'border-amber-500/30',
          rangeText: '23.0 - 24.9',
          min: 23.0,
          max: 24.9,
          description: 'Thể trạng bắt đầu có xu hướng tích tụ mỡ thừa nội tạng. Nên điều chỉnh sớm để tránh tiến triển sang béo phì.',
          advice: 'Hạn chế tinh bột nhanh, đồ chiên xào nhiều dầu mỡ và đồ ngọt; uống nhiều nước lọc trước bữa ăn.',
          herbs: ['Lá sen khô', 'Sơn tra (Táo mèo)', 'Giảo cổ lam', 'Trà xanh'],
          exercises: ['Cardio đốt mỡ', 'Đi bộ nhanh 45 phút', 'Đạp xe ngoài trời']
        },
        {
          label: 'Béo phì độ I',
          sublabel: 'Nguy cơ chuyển hóa & tim mạch',
          color: 'bg-orange-500',
          textColor: 'text-orange-400',
          badgeBg: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
          borderColor: 'border-orange-500/30',
          rangeText: '25.0 - 29.9',
          min: 25.0,
          max: 29.9,
          description: 'Cơ thể đang ở mức thừa mỡ đáng kể. Cần có kế hoạch dinh dưỡng giảm cân khoa học và tăng vận động.',
          advice: 'Cắt giảm đường tinh luyện, kiểm soát khẩu phần ăn, ăn nhiều rau xanh giàu chất xơ và kiểm tra mỡ máu định kỳ.',
          herbs: ['Giảo cổ lam', 'Khổ qua rừng (Mướp đắng)', 'Phan tả diệp', 'Sơn tra'],
          exercises: ['Bơi lội (giảm tải khớp)', 'Đi bộ biến tốc', 'Pilates / Yoga nhẹ nhàng']
        },
        {
          label: 'Béo phì độ II trở lên',
          sublabel: 'Cảnh báo sức khỏe cấp bách',
          color: 'bg-rose-500',
          textColor: 'text-rose-400',
          badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
          borderColor: 'border-rose-500/30',
          rangeText: '≥ 30.0',
          min: 30.0,
          max: 100,
          description: 'Mức béo phì có nguy cơ cao đối với huyết áp, tim mạch, gan nhiễm mỡ và tiểu đường tuýp 2.',
          advice: 'Nên tham khảo ý kiến bác sĩ chuyên khoa dinh dưỡng để có lộ trình giảm cân an toàn và kiểm tra tổng quát.',
          herbs: ['Trà giảo cổ lam', 'Lá vằng', 'Cốt khí củ', 'Hà thủ ô trắng'],
          exercises: ['Vận động dưới nước', 'Đi bộ dưỡng sinh nhẹ', 'Tập thở khí công sâu']
        }
      ];
    } else {
      // WHO Standard
      return [
        {
          label: 'Thiếu cân (Underweight)',
          sublabel: 'Gầy nhẹ đến trung bình',
          color: 'bg-sky-500',
          textColor: 'text-sky-400',
          badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
          borderColor: 'border-sky-500/30',
          rangeText: '< 18.5',
          min: 0,
          max: 18.4,
          description: 'Chỉ số khối cơ thể thấp theo chuẩn WHO quốc tế.',
          advice: 'Tăng lượng calo nạp vào hàng ngày, bổ sung khoáng chất và vitamin tổng hợp.',
          herbs: ['Đẳng sâm', 'Kỷ tử', 'Đại táo'],
          exercises: ['Tập thể dục nhẹ', 'Yoga phục hồi']
        },
        {
          label: 'Bình thường (Normal weight)',
          sublabel: 'Chỉ số chuẩn quốc tế',
          color: 'bg-emerald-500',
          textColor: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          borderColor: 'border-emerald-500/30',
          rangeText: '18.5 - 24.9',
          min: 18.5,
          max: 24.9,
          description: 'Chỉ số cân đối theo chuẩn quốc tế WHO.',
          advice: 'Duy trì lối sống lành mạnh, ăn đủ chất và vận động thể lực đều đặn.',
          herbs: ['Linh chi', 'Trà thảo mộc', 'Hoa cúc'],
          exercises: ['Thể thao tổng hợp', 'Chạy bộ']
        },
        {
          label: 'Thừa cân (Overweight)',
          sublabel: 'Tiền béo phì',
          color: 'bg-amber-500',
          textColor: 'text-amber-400',
          badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          borderColor: 'border-amber-500/30',
          rangeText: '25.0 - 29.9',
          min: 25.0,
          max: 29.9,
          description: 'Cân nặng vượt ngưỡng khuyến nghị của WHO.',
          advice: 'Kiểm soát khẩu phần ăn, giảm đồ ngọt và tăng cường cardio.',
          herbs: ['Giảo cổ lam', 'Lá sen', 'Sơn tra'],
          exercises: ['Cardio HIIT', 'Bơi lội']
        },
        {
          label: 'Béo phì độ I (Obesity Class I)',
          sublabel: 'Thừa mỡ mức độ trung bình',
          color: 'bg-orange-500',
          textColor: 'text-orange-400',
          badgeBg: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
          borderColor: 'border-orange-500/30',
          rangeText: '30.0 - 34.9',
          min: 30.0,
          max: 34.9,
          description: 'Béo phì độ 1 theo tiêu chuẩn WHO.',
          advice: 'Cần có chế độ thâm hụt calo nghiêm ngặt và theo dõi sức khỏe.',
          herbs: ['Mướp đắng rừng', 'Lá sen', 'Giảo cổ lam'],
          exercises: ['Đi bộ nhanh', 'Bơi lội']
        },
        {
          label: 'Béo phì độ II-III (Severe Obesity)',
          sublabel: 'Béo phì nặng',
          color: 'bg-rose-500',
          textColor: 'text-rose-400',
          badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
          borderColor: 'border-rose-500/30',
          rangeText: '≥ 35.0',
          min: 35.0,
          max: 100,
          description: 'Nguy cơ cao về bệnh lý chuyển hóa và tim mạch.',
          advice: 'Cần điều trị và theo dõi chặt chẽ cùng chuyên gia y tế.',
          herbs: ['Trà giảo cổ lam', 'Hà thủ ô'],
          exercises: ['Thể dục trị liệu', 'Vận động khớp nhẹ']
        }
      ];
    }
  }, [standard]);

  // Current category matching the calculated BMI
  const currentCategory = useMemo(() => {
    if (!bmiValue) return categories[1];
    const match = categories.find(c => bmiValue >= c.min && bmiValue <= c.max);
    return match || categories[categories.length - 1];
  }, [bmiValue, categories]);

  // Percentage on the scale bar (from BMI 15 to 35)
  const scalePercent = useMemo(() => {
    if (!bmiValue) return 50;
    const minScale = 15;
    const maxScale = 35;
    const clamped = Math.max(minScale, Math.min(maxScale, bmiValue));
    return ((clamped - minScale) / (maxScale - minScale)) * 100;
  }, [bmiValue]);

  // Reset to default
  const handleReset = () => {
    setHeight(165);
    setWeight(60);
  };

  const handleSaveToProfile = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="home-bmi-calculator-section">
      {/* Header with medium-soft green background */}
      <div className="bg-teal-100/70 border-b border-teal-200/90 px-4 sm:px-5 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-200/60 flex items-center justify-center text-teal-700 border border-teal-300/80 shadow-xs">
            <Scale className="w-4 h-4 text-teal-700" />
          </div>
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              Chỉ số Thể trạng & BMI
            </h3>
            <p className="text-[8.5px] sm:text-[9px] text-teal-800 font-bold uppercase tracking-wider mt-0.5">
              Phân tích thể trạng chuẩn Nhân trắc học Y tế & Đông Y
            </p>
          </div>
        </div>

        {/* Standard selector pills */}
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-teal-200 shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStandard('asian')}
            className={cn(
              "px-2.5 py-1 rounded-md text-[9.5px] font-bold uppercase tracking-wider transition-all cursor-pointer",
              standard === 'asian'
                ? "bg-teal-700 text-white-pure shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
            title="Chuẩn WPRO / IDI dành riêng cho người Châu Á & Việt Nam"
          >
            Chuẩn Châu Á (WPRO)
          </button>
          <button
            type="button"
            onClick={() => setStandard('who')}
            className={cn(
              "px-2.5 py-1 rounded-md text-[9.5px] font-bold uppercase tracking-wider transition-all cursor-pointer",
              standard === 'who'
                ? "bg-teal-700 text-white-pure shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
            title="Chuẩn Quốc tế của Tổ chức Y tế Thế giới (WHO)"
          >
            Chuẩn WHO Quốc Tế
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-3 sm:space-y-3.5">

      {/* Main Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5">
        {/* Left column: Height & Weight Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-bg/40 border border-white/5 rounded-xl p-3 sm:p-3.5 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-bold text-text-dim uppercase tracking-wider">
              Thông số nhân trắc của bạn
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-text-dim hover:text-white text-[9.5px] flex items-center gap-1 transition-colors"
              title="Đặt lại thông số mặc định"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Mặc định</span>
            </button>
          </div>

          {/* Height Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-teal-400" />
                Chiều cao
              </label>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-mono font-bold text-white">{height}</span>
                <span className="text-[10px] text-text-dim font-mono">cm</span>
              </div>
            </div>
            <input
              type="range"
              min={120}
              max={210}
              step={1}
              value={height}
              onChange={(e) => setHeight(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
            />
            <div className="flex justify-between text-[8.5px] font-mono text-text-dim">
              <span>120 cm</span>
              <span>165 cm</span>
              <span>210 cm</span>
            </div>
          </div>

          {/* Weight Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                Cân nặng
              </label>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-mono font-bold text-white">{weight}</span>
                <span className="text-[10px] text-text-dim font-mono">kg</span>
              </div>
            </div>
            <input
              type="range"
              min={35}
              max={150}
              step={0.5}
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
            />
            <div className="flex justify-between text-[8.5px] font-mono text-text-dim">
              <span>35 kg</span>
              <span>65 kg</span>
              <span>150 kg</span>
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-white/5">
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2 text-left">
              <span className="text-[8.5px] text-text-dim uppercase font-bold block mb-0.5">Cân nặng lý tưởng</span>
              <span className="text-[11px] font-mono font-bold text-emerald-400">
                {idealWeightRange.min} - {idealWeightRange.max} kg
              </span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2 text-left">
              <span className="text-[8.5px] text-text-dim uppercase font-bold block mb-0.5">Nhu cầu nước/ngày</span>
              <span className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                <Droplets className="w-2.5 h-2.5" />
                {(weight * 0.035).toFixed(1)} Lít
              </span>
            </div>
          </div>
        </div>

        {/* Right column: Results & Visual Scale (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-2.5 sm:space-y-3">
          {/* Main BMI Result Badge Card */}
          <div className={cn(
            "rounded-xl p-3 sm:p-3.5 border transition-all duration-300 relative overflow-hidden bg-bg/60",
            currentCategory.borderColor,
            "shadow-sm"
          )}>
            {/* Ambient background glow */}
            <div className={cn(
              "absolute -right-16 -top-16 w-32 h-32 rounded-full blur-3xl opacity-15",
              currentCategory.color
            )} />

            {/* Top row: Badge and reference range */}
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", currentCategory.badgeBg)}>
                {currentCategory.label}
              </span>
              <span className="text-[9.5px] text-text-dim font-mono">
                Ngưỡng chuẩn: {currentCategory.rangeText}
              </span>
            </div>

            {/* Main 1-row layout: Left text & Right BMI box */}
            <div className="flex flex-row items-center justify-between gap-3 relative z-10">
              <div className="space-y-1 min-w-0 flex-1">
                <h4 className={cn("text-sm sm:text-base font-serif italic font-medium leading-snug", currentCategory.textColor)}>
                  {currentCategory.sublabel}
                </h4>
                <p className="text-[11px] text-text-dim font-light leading-relaxed">
                  {currentCategory.description}
                </p>
              </div>

              {/* Big BMI Number Display */}
              <div className="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl bg-white/[0.04] border border-white/10 w-20 sm:w-24 shrink-0 shadow-xs">
                <span className="text-[8px] sm:text-[8.5px] font-bold text-text-dim uppercase tracking-wider whitespace-nowrap">Chỉ số BMI</span>
                <span className={cn("text-xl sm:text-3xl font-mono font-extrabold tracking-tight leading-none my-0.5", currentCategory.textColor)}>
                  {bmiValue}
                </span>
                <span className="text-[8px] sm:text-[8.5px] font-mono text-text-dim whitespace-nowrap">
                  kg/m²
                </span>
              </div>
            </div>

            {/* Visual Gauge / Scale Bar */}
            <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1">
              <div className="flex justify-between items-center text-[8.5px] text-text-dim font-mono uppercase">
                <span>15.0 (Thiếu cân)</span>
                <span className="text-emerald-400 font-bold">18.5 - 22.9 (Chuẩn)</span>
                <span>35.0+ (Béo phì)</span>
              </div>

              {/* Gradient Track */}
              <div className="relative w-full h-2.5 bg-white/5 rounded-full overflow-visible border border-white/10 flex">
                <div className="w-[17.5%] h-full bg-sky-500/60 rounded-l-full" title="Thiếu cân (< 18.5)" />
                <div className="w-[22%] h-full bg-emerald-500/80" title="Bình thường (18.5 - 22.9)" />
                <div className="w-[10%] h-full bg-amber-500/80" title="Thừa cân (23.0 - 24.9)" />
                <div className="w-[25%] h-full bg-orange-500/80" title="Béo phì độ 1 (25.0 - 29.9)" />
                <div className="flex-1 h-full bg-rose-500/80 rounded-r-full" title="Béo phì độ 2+ (≥ 30.0)" />

                {/* Needle Indicator */}
                <motion.div
                  className="absolute -top-1 -bottom-1 w-3 bg-white border-2 border-slate-900 rounded-full shadow-sm z-20 -ml-1.5 transition-all duration-300"
                  style={{ left: `${scalePercent}%` }}
                  animate={{ left: `${scalePercent}%` }}
                />
              </div>

              {/* Status summary under gauge */}
              <div className="flex items-center justify-between text-[9.5px] text-text-dim pt-0.5">
                <span>
                  Chênh lệch thể trọng: <strong className={cn(weightDiff > 0 ? "text-amber-400" : weightDiff < 0 ? "text-sky-400" : "text-emerald-400")}>
                    {weightDiff > 0 ? `+${weightDiff} kg` : weightDiff < 0 ? `${weightDiff} kg` : 'Cân đối chuẩn'}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={handleSaveToProfile}
                  className="text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Đã lưu thông số</span>
                    </>
                  ) : (
                    <>
                      <BookmarkCheck className="w-3 h-3" />
                      <span>Ghi nhớ thể trạng</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Oriental Medicine & Health Advice Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Advice & Diet */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-primary">
                <Heart className="w-3 h-3" />
                <span className="text-[9.5px] uppercase font-bold tracking-wider">Lời khuyên dưỡng sinh</span>
              </div>
              <p className="text-[10.5px] text-text-dim font-light leading-snug">
                {currentCategory.advice}
              </p>
            </div>

            {/* Recommended Herbs */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Sparkles className="w-3 h-3" />
                <span className="text-[9.5px] uppercase font-bold tracking-wider">Thảo dược Đông Y phù hợp</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {currentCategory.herbs.map((herb, i) => (
                  <span 
                    key={i} 
                    className="text-[9.5px] bg-emerald-700 text-white-pure border border-emerald-600 px-2 py-0.5 rounded-lg font-medium shadow-xs"
                  >
                    {herb}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
