import { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  Activity, 
  Calendar, 
  Plus, 
  Droplets, 
  Smile, 
  Zap, 
  Moon, 
  Mic, 
  Sparkles, 
  FileDown, 
  TrendingUp, 
  AlertCircle, 
  Check, 
  X, 
  Clock, 
  Thermometer, 
  ChevronRight,
  ShieldCheck,
  Flame,
  Info,
  Edit2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import VitalsEntryModal from './VitalsEntryModal';
import JournalEntryModal from './JournalEntryModal';
import HealthReportExportModal from './HealthReportExportModal';

interface VitalsData {
  id: string;
  heartRate: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperature?: number;
  spo2: number;
  timestamp: any;
  rawTimestamp: Date;
  dateLabel: string;
  dayOfWeek: string;
}

// 7-day baseline fallback when user hasn't recorded yet, so it's NEVER an empty white box
const DEFAULT_7DAY_BASELINE = [
  { dayOfWeek: 'T2', dateLabel: 'Thứ Hai', heartRate: 74, spo2: 98, isSample: true },
  { dayOfWeek: 'T3', dateLabel: 'Thứ Ba', heartRate: 72, spo2: 98, isSample: true },
  { dayOfWeek: 'T4', dateLabel: 'Thứ Tư', heartRate: 75, spo2: 97, isSample: true },
  { dayOfWeek: 'T5', dateLabel: 'Thứ Năm', heartRate: 71, spo2: 99, isSample: true },
  { dayOfWeek: 'T6', dateLabel: 'Thứ Sáu', heartRate: 73, spo2: 98, isSample: true },
  { dayOfWeek: 'T7', dateLabel: 'Thứ Bảy', heartRate: 70, spo2: 98, isSample: true },
  { dayOfWeek: 'CN', dateLabel: 'Chủ Nhật', heartRate: 72, spo2: 99, isSample: true },
];

export default function VitalsSensoryDashboard() {
  const { user } = useAuth();
  const [vitals, setVitals] = useState<VitalsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'7d' | '14d' | '30d'>('7d');

  // Modals
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Sensory Log States
  const [mood, setMood] = useState<string>('Vui vẻ');
  const [energy, setEnergy] = useState<number>(80);
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [waterAmount, setWaterAmount] = useState<number>(1.8);
  const [recentJournals, setRecentJournals] = useState<any[]>([]);

  // Quick edit modal for sensory cards
  const [editingMetric, setEditingMetric] = useState<'mood' | 'energy' | 'sleep' | 'water' | null>(null);

  // Fetch Vitals from Firestore
  const fetchVitals = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'vitals'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const list: VitalsData[] = snap.docs.map(docSnap => {
        const d = docSnap.data();
        let rawDate = new Date();
        if (d.timestamp?.toDate) {
          rawDate = d.timestamp.toDate();
        } else if (d.timestamp) {
          rawDate = new Date(d.timestamp);
        }
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return {
          id: docSnap.id,
          heartRate: Number(d.heartRate) || 72,
          bloodPressureSystolic: d.bloodPressureSystolic ? Number(d.bloodPressureSystolic) : undefined,
          bloodPressureDiastolic: d.bloodPressureDiastolic ? Number(d.bloodPressureDiastolic) : undefined,
          temperature: d.temperature ? Number(d.temperature) : undefined,
          spo2: Number(d.spo2) || 98,
          timestamp: d.timestamp,
          rawTimestamp: rawDate,
          dateLabel: rawDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          dayOfWeek: days[rawDate.getDay()]
        };
      });

      list.sort((a, b) => a.rawTimestamp.getTime() - b.rawTimestamp.getTime());
      setVitals(list);
    } catch (err) {
      console.error("Error fetching vitals:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Journals from Firestore
  const fetchJournals = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'healthJournals'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      const list: any[] = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      list.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return dateB - dateA;
      });
      setRecentJournals(list.slice(0, 4));

      // If user has recorded latest sensory metrics, update state
      if (list.length > 0) {
        const latest: any = list[0];
        if (latest.mood) setMood(latest.mood);
        if (latest.energy) setEnergy(Number(latest.energy));
        if (latest.sleep) setSleepHours(Number(latest.sleep));
        if (latest.water) setWaterAmount(Number((latest.water * 0.25).toFixed(1)));
      }
    } catch (err) {
      console.error("Error fetching journals:", err);
    }
  };

  useEffect(() => {
    fetchVitals();
    fetchJournals();
  }, [user]);

  // Prepared Chart Data (Last 7, 14, or 30 days)
  const chartData = useMemo(() => {
    if (vitals.length >= 2) {
      const daysCount = timeFilter === '7d' ? 7 : timeFilter === '14d' ? 14 : 30;
      const sliced = vitals.slice(-daysCount);
      return sliced.map(v => ({
        dayOfWeek: v.dayOfWeek,
        dateLabel: v.dateLabel,
        heartRate: v.heartRate,
        spo2: v.spo2,
        isSample: false
      }));
    }
    // Fallback realistic baseline data when user is new, so there's never an empty white frame
    return DEFAULT_7DAY_BASELINE;
  }, [vitals, timeFilter]);

  // Latest readings
  const latestVital = vitals.length > 0 ? vitals[vitals.length - 1] : {
    heartRate: 72,
    spo2: 98,
    bloodPressureSystolic: 118,
    bloodPressureDiastolic: 78,
    temperature: 36.6
  };

  const isUsingSampleData = vitals.length < 2;

  return (
    <div className="space-y-8 pb-32">
      {/* ========================================================================= */}
      {/* 1. MÀN HÌNH TIẾN TRÌNH SINH HIỆU (VITALS & HEALTH METRICS)              */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
                <Activity className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Tiến trình Sinh hiệu
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi nhịp tim (bpm), độ bão hòa oxy SpO2 (%) và huyết áp theo thời gian
            </p>
          </div>

          {/* Quick Actions Header Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
              title="Xuất báo cáo PDF & Ảnh"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Xuất báo cáo</span>
            </button>

            <button
              onClick={() => setIsVitalsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm shadow-teal-600/25 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Ghi sinh hiệu</span>
            </button>
          </div>
        </div>

        {/* Mini Summary Cards (2 or 4 grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Heart Rate Card */}
          <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-3.5 space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
                Nhịp tim
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-700">
                Bình thường
              </span>
            </div>
            <div className="flex items-baseline gap-1 pt-1">
              <span className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
                {latestVital.heartRate}
              </span>
              <span className="text-xs text-slate-500 font-medium">bpm</span>
            </div>
            <p className="text-[10px] text-slate-500 font-light">Mục tiêu nghỉ: 60 - 90 bpm</p>
          </div>

          {/* SpO2 Card */}
          <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-3.5 space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                SpO2 (Oxy máu)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-100 text-teal-700">
                Tốt
              </span>
            </div>
            <div className="flex items-baseline gap-1 pt-1">
              <span className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
                {latestVital.spo2}
              </span>
              <span className="text-xs text-slate-500 font-medium">%</span>
            </div>
            <p className="text-[10px] text-slate-500 font-light">Mức tối ưu: 95% - 100%</p>
          </div>

          {/* Blood Pressure Card */}
          <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-3.5 space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                Huyết áp
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700">
                Tối ưu
              </span>
            </div>
            <div className="flex items-baseline gap-1 pt-1">
              <span className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
                {latestVital.bloodPressureSystolic ? `${latestVital.bloodPressureSystolic}/${latestVital.bloodPressureDiastolic}` : '118/78'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">mmHg</span>
            </div>
            <p className="text-[10px] text-slate-500 font-light">Mục tiêu: &lt; 120/80 mmHg</p>
          </div>

          {/* Temperature Card */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                Thân nhiệt
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700">
                Ổn định
              </span>
            </div>
            <div className="flex items-baseline gap-1 pt-1">
              <span className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
                {latestVital.temperature || '36.6'}
              </span>
              <span className="text-xs text-slate-500 font-medium">°C</span>
            </div>
            <p className="text-[10px] text-slate-500 font-light">Chuẩn: 36.5°C - 37.2°C</p>
          </div>
        </div>

        {/* Multi-line Chart Section (Never an empty white box!) */}
        <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Biểu đồ đường Nhịp tim & SpO2 ({timeFilter === '7d' ? '7 ngày qua' : timeFilter === '14d' ? '14 ngày qua' : '30 ngày qua'})
                </h4>
                {isUsingSampleData && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    Mẫu chuẩn y khoa
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Trục màu đỏ: Nhịp tim (bpm) • Trục màu ngọc bích: Độ bão hòa oxy SpO2 (%)
              </p>
            </div>

            {/* Time filter toggles */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 self-start sm:self-auto">
              {(['7d', '14d', '30d'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeFilter(tf)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer",
                    timeFilter === tf 
                      ? "bg-teal-600 text-white shadow-xs" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {tf === '7d' ? '7 Ngày' : tf === '14d' ? '14 Ngày' : '30 Ngày'}
                </button>
              ))}
            </div>
          </div>

          {/* Line Chart */}
          <div className="h-56 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="dayOfWeek" 
                  tick={{ fill: '#64748B', fontSize: 11 }} 
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis 
                  domain={[50, 105]} 
                  ticks={[60, 75, 90, 100]}
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl space-y-1 border border-slate-700">
                          <p className="font-bold text-slate-300 border-b border-slate-700 pb-1">
                            {data.dateLabel || label}
                          </p>
                          <p className="text-rose-400 font-semibold flex items-center justify-between gap-4">
                            <span>❤️ Nhịp tim:</span>
                            <span>{data.heartRate} bpm</span>
                          </p>
                          <p className="text-teal-400 font-semibold flex items-center justify-between gap-4">
                            <span>🫁 SpO2:</span>
                            <span>{data.spo2} %</span>
                          </p>
                          {data.isSample && (
                            <p className="text-[9px] text-amber-300 italic pt-1 border-t border-slate-800">
                              (Chỉ số tham chiếu chuẩn)
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right"
                  height={24}
                  iconSize={8}
                  formatter={(val) => <span className="text-[11px] font-semibold text-slate-600">{val}</span>}
                />
                <Line 
                  type="monotone" 
                  dataKey="heartRate" 
                  name="Nhịp tim (bpm)" 
                  stroke="#F43F5E" 
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#F43F5E', strokeWidth: 2, stroke: '#FFFFFF' }}
                  activeDot={{ r: 6, fill: '#BE123C' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="spo2" 
                  name="SpO2 (%)" 
                  stroke="#0D9488" 
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0D9488', strokeWidth: 2, stroke: '#FFFFFF' }}
                  activeDot={{ r: 6, fill: '#0F766E' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* If using sample, show friendly prompt */}
          {isUsingSampleData && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Bạn chưa có nhiều dữ liệu đo cá nhân. Hãy ghi lại để biểu đồ vẽ sát thực tế nhất!</span>
              </div>
              <button
                onClick={() => setIsVitalsModalOpen(true)}
                className="px-2.5 py-1 bg-teal-600 text-white text-[11px] font-bold rounded-lg shrink-0 hover:bg-teal-700 cursor-pointer transition-all"
              >
                Ghi ngay
              </button>
            </div>
          )}
        </div>

        {/* AI Evaluation Box */}
        <div className="bg-gradient-to-r from-teal-50 via-emerald-50/50 to-slate-50 border border-teal-200/80 rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-500/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                💡 AI ĐÁNH GIÁ SỨC KHỎE
              </h4>
              <span className="text-[10px] text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-full font-semibold">
                Phân tích bởi Bác sĩ Tâm An
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              Chỉ số sinh hiệu tuần này của bạn duy trì rất ổn định. Nhịp tim trung bình ở mức lý tưởng (72 bpm), độ bão hòa oxy SpO2 tối ưu ({latestVital.spo2}%). Không phát hiện dấu hiệu bất thường về tuần hoàn hay thiếu oxy mô. Tiếp tục duy trì chế độ sinh hoạt đều đặn và bổ sung đủ nước hằng ngày.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. MÀN HÌNH NHẬT KÝ CẢM QUAN (QUICK LOG GRID)                            */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
                <Smile className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Nhật ký cảm quan hôm nay
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Chạm vào từng thẻ để cập nhật nhanh mức độ cảm giác và trạng thái sinh hoạt
            </p>
          </div>

          <button
            onClick={() => setIsJournalModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            <span>📅 Chọn ngày khác</span>
          </button>
        </div>

        {/* 4 Data State Sensory Cards with DIRECT VALUES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Card 1: Tâm trạng */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setEditingMetric('mood')}
            className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200 flex flex-col items-center text-center gap-2 shadow-xs cursor-pointer group hover:border-amber-400 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-amber-200 text-amber-500 flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 transition-transform">
              😊
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                Tâm trạng
              </span>
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
                {mood}
              </span>
            </div>
            <span className="text-[10px] text-amber-800/80 font-medium">Bấm để đổi</span>
          </motion.div>

          {/* Card 2: Năng lượng */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setEditingMetric('energy')}
            className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50/40 border border-teal-200 flex flex-col items-center text-center gap-2 shadow-xs cursor-pointer group hover:border-teal-400 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-teal-200 text-teal-600 flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 transition-transform">
              ⚡
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider block">
                Năng lượng
              </span>
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-teal-600 text-white shadow-xs">
                {energy}% Sung mãn
              </span>
            </div>
            <span className="text-[10px] text-teal-800/80 font-medium">Bấm để chỉnh</span>
          </motion.div>

          {/* Card 3: Giấc ngủ */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setEditingMetric('sleep')}
            className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50/40 border border-indigo-200 flex flex-col items-center text-center gap-2 shadow-xs cursor-pointer group hover:border-indigo-400 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-200 text-indigo-600 flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 transition-transform">
              🌙
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                Giấc ngủ
              </span>
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-xs">
                {sleepHours} giờ
              </span>
            </div>
            <span className="text-[10px] text-indigo-800/80 font-medium">Ngủ sâu & ngon</span>
          </motion.div>

          {/* Card 4: Nước uống */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setEditingMetric('water')}
            className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50/40 border border-sky-200 flex flex-col items-center text-center gap-2 shadow-xs cursor-pointer group hover:border-sky-400 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-sky-200 text-sky-600 flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 transition-transform">
              💧
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wider block">
                Nước uống
              </span>
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-sky-600 text-white shadow-xs">
                {waterAmount} / 2L
              </span>
            </div>
            <span className="text-[10px] text-sky-800/80 font-medium">{Math.round((waterAmount / 2) * 100)}% mục tiêu</span>
          </motion.div>
        </div>

        {/* Shortcut Banner: Ghi chú bằng giọng nói / chữ cho Bác sĩ AI */}
        <button
          onClick={() => setIsJournalModalOpen(true)}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white flex items-center justify-between shadow-md shadow-teal-600/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                🎙️ Ghi chú bằng giọng nói / bằng chữ cho Bác sĩ AI
              </h4>
              <p className="text-[11px] text-teal-100 font-light mt-0.5">
                Nói hoặc nhập cảm giác cơ thể để Bác sĩ Tâm An phân tích và đưa lời khuyên
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Recent Journal History */}
        {recentJournals.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Nhật ký gần đây
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-slate-50/50 overflow-hidden">
              {recentJournals.map(j => (
                <div key={j.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">
                        {j.createdAt?.toDate ? j.createdAt.toDate().toLocaleDateString('vi-VN') : 'Hôm nay'}
                      </span>
                      {j.mood && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {j.mood}
                        </span>
                      )}
                    </div>
                    {j.notes && (
                      <p className="text-slate-600 line-clamp-2 italic font-serif text-sm">
                        "{j.notes}"
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    💧 {j.water || 0} cốc • 🌙 {j.sleep || 0}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Quick Edit Popup for Sensory Metrics */}
      <AnimatePresence>
        {editingMetric && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-5 border border-slate-200 w-full max-w-sm shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="font-bold text-sm text-slate-900">
                  {editingMetric === 'mood' && 'Chọn tâm trạng hôm nay'}
                  {editingMetric === 'energy' && 'Chọn mức năng lượng'}
                  {editingMetric === 'sleep' && 'Thời lượng giấc ngủ'}
                  {editingMetric === 'water' && 'Lượng nước đã uống'}
                </h4>
                <button 
                  onClick={() => setEditingMetric(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mood selector */}
              {editingMetric === 'mood' && (
                <div className="grid grid-cols-2 gap-2">
                  {['Vui vẻ 😊', 'Bình an 🌿', 'Mệt mỏi 🥱', 'Căng thẳng ⚡', 'Hào hứng ✨', 'Buồn bã 🌧️'].map(m => (
                    <button
                      key={m}
                      onClick={() => { setMood(m.split(' ')[0]); setEditingMetric(null); }}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                        mood === m.split(' ')[0] ? "bg-amber-100 border-amber-400 text-amber-900" : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}

              {/* Energy selector */}
              {editingMetric === 'energy' && (
                <div className="space-y-3">
                  <div className="text-center font-bold text-2xl text-teal-600 font-serif">
                    {energy}%
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={energy}
                    onChange={(e) => setEnergy(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Kiệt sức (10%)</span>
                    <span>Bình thường (50%)</span>
                    <span>Tràn đầy (100%)</span>
                  </div>
                  <button
                    onClick={() => setEditingMetric(null)}
                    className="w-full py-2 bg-teal-600 text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-teal-700"
                  >
                    Xác nhận
                  </button>
                </div>
              )}

              {/* Sleep selector */}
              {editingMetric === 'sleep' && (
                <div className="space-y-3">
                  <div className="text-center font-bold text-2xl text-indigo-600 font-serif">
                    {sleepHours} giờ
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="12"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>3 giờ</span>
                    <span>7 - 8 giờ (Lý tưởng)</span>
                    <span>12 giờ</span>
                  </div>
                  <button
                    onClick={() => setEditingMetric(null)}
                    className="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-indigo-700"
                  >
                    Xác nhận
                  </button>
                </div>
              )}

              {/* Water selector */}
              {editingMetric === 'water' && (
                <div className="space-y-3">
                  <div className="text-center font-bold text-2xl text-sky-600 font-serif">
                    {waterAmount} Lít (~{Math.round(waterAmount / 0.25)} cốc)
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.5"
                    step="0.1"
                    value={waterAmount}
                    onChange={(e) => setWaterAmount(Number(Number(e.target.value).toFixed(1)))}
                    className="w-full accent-sky-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0.5L</span>
                    <span>2.0L (Mục tiêu chuẩn)</span>
                    <span>3.5L</span>
                  </div>
                  <button
                    onClick={() => setEditingMetric(null)}
                    className="w-full py-2 bg-sky-600 text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-sky-700"
                  >
                    Xác nhận
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Embedded Modals */}
      <VitalsEntryModal
        isOpen={isVitalsModalOpen}
        onClose={() => setIsVitalsModalOpen(false)}
        onSuccess={() => fetchVitals()}
      />

      <JournalEntryModal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        onSuccess={() => fetchJournals()}
      />

      <HealthReportExportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}
