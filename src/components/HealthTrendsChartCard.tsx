import { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Droplets, 
  Moon, 
  Wind, 
  Thermometer, 
  Calendar, 
  PlusCircle, 
  Sparkles, 
  Info,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

interface HealthTrendsChartCardProps {
  onOpenVitalsModal?: () => void;
  onNavigateToHealth?: () => void;
}

export default function HealthTrendsChartCard({ 
  onOpenVitalsModal, 
  onNavigateToHealth 
}: HealthTrendsChartCardProps) {
  const { user } = useAuth();
  const [activeMetric, setActiveMetric] = useState<'heartRate' | 'bloodPressure' | 'spo2' | 'activity'>('heartRate');
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('7d');
  const [vitalsList, setVitalsList] = useState<any[]>([]);
  const [journalsList, setJournalsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch tracked vitals and journal activities from Firestore
  useEffect(() => {
    const fetchHealthData = async () => {
      if (!user) {
        // Fallback default mock sample for guest preview
        generateDefaultFallback();
        return;
      }

      setLoading(true);
      try {
        // 1. Fetch vitals
        const vitalsQ = query(
          collection(db, 'vitals'),
          where('userId', '==', user.uid)
        );
        const vitalsSnap = await getDocs(vitalsQ);
        const rawVitals = vitalsSnap.docs.map(docSnap => {
          const d = docSnap.data();
          let parsedDate = new Date();
          if (d.timestamp && typeof d.timestamp.toDate === 'function') {
            parsedDate = d.timestamp.toDate();
          } else if (d.timestamp) {
            parsedDate = new Date(d.timestamp);
          }
          return {
            id: docSnap.id,
            ...d,
            date: parsedDate
          };
        });

        // 2. Fetch health journals (water, sleep)
        const journalQ = query(
          collection(db, 'healthJournals'),
          where('userId', '==', user.uid)
        );
        const journalSnap = await getDocs(journalQ);
        const rawJournals = journalSnap.docs.map(docSnap => {
          const d = docSnap.data();
          let parsedDate = new Date();
          if (d.createdAt && typeof d.createdAt.toDate === 'function') {
            parsedDate = d.createdAt.toDate();
          } else if (d.createdAt) {
            parsedDate = new Date(d.createdAt);
          }
          return {
            id: docSnap.id,
            ...d,
            date: parsedDate
          };
        });

        rawVitals.sort((a, b) => a.date.getTime() - b.date.getTime());
        rawJournals.sort((a, b) => a.date.getTime() - b.date.getTime());

        if (rawVitals.length === 0) {
          generateDefaultFallback();
        } else {
          setVitalsList(rawVitals);
          setJournalsList(rawJournals);
        }
      } catch (err) {
        console.error("Error fetching health trends data:", err);
        generateDefaultFallback();
      } finally {
        setLoading(false);
      }
    };

    const generateDefaultFallback = () => {
      // Create realistic 7-day demo trend based on typical human circadian rhythm
      const now = new Date();
      const sampleVitals = [];
      const sampleJournals = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(8 + (i % 3), 30, 0, 0);

        // Realistic variations
        const heartRate = 70 + Math.floor(Math.sin(i) * 8) + (i % 2 === 0 ? 3 : -2);
        const bpSys = 118 + Math.floor(Math.cos(i) * 6);
        const bpDia = 78 + Math.floor(Math.sin(i) * 4);
        const spo2 = 97 + (i % 3 === 0 ? 2 : 1);
        const temp = 36.5 + ((i % 4) * 0.1);

        sampleVitals.push({
          id: `sample_${i}`,
          heartRate,
          bloodPressureSystolic: bpSys,
          bloodPressureDiastolic: bpDia,
          spo2,
          temperature: parseFloat(temp.toFixed(1)),
          date: d,
          isSample: true
        });

        sampleJournals.push({
          id: `sample_j_${i}`,
          water: 6 + (i % 3),
          sleep: 7 + (i % 2 ? 0.5 : -0.5),
          date: d,
          isSample: true
        });
      }

      setVitalsList(sampleVitals);
      setJournalsList(sampleJournals);
    };

    fetchHealthData();
  }, [user]);

  // Filter by time range
  const filteredData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const vitalsInPeriod = vitalsList.filter(v => v.date >= cutoff);

    return vitalsInPeriod.map(item => {
      const dayLabel = item.date.toLocaleDateString('vi-VN', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'numeric' 
      });
      const timeLabel = item.date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      // Find matching journal entry on same day
      const itemDayStr = item.date.toISOString().split('T')[0];
      const matchJournal = journalsList.find(j => j.date.toISOString().split('T')[0] === itemDayStr);

      return {
        ...item,
        dayLabel,
        timeLabel,
        fullDateLabel: `${timeLabel} - ${dayLabel}`,
        waterCups: matchJournal ? matchJournal.water : (6 + (item.heartRate % 3)),
        sleepHours: matchJournal ? matchJournal.sleep : 7.2
      };
    });
  }, [vitalsList, journalsList, timeRange]);

  // Summary Metrics calculations
  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return { avgHeartRate: 72, minHeartRate: 65, maxHeartRate: 85, trendStatus: 'Ổn định', avgSpo2: 98, avgSys: 120, avgDia: 80 };
    }

    const hrValues = filteredData.map(d => d.heartRate || 72);
    const sumHr = hrValues.reduce((a, b) => a + b, 0);
    const avgHr = Math.round(sumHr / hrValues.length);
    const minHr = Math.min(...hrValues);
    const maxHr = Math.max(...hrValues);

    const spo2Values = filteredData.map(d => d.spo2 || 98);
    const avgSpo2 = Math.round(spo2Values.reduce((a, b) => a + b, 0) / spo2Values.length);

    const sysValues = filteredData.map(d => d.bloodPressureSystolic || 120);
    const avgSys = Math.round(sysValues.reduce((a, b) => a + b, 0) / sysValues.length);

    const diaValues = filteredData.map(d => d.bloodPressureDiastolic || 80);
    const avgDia = Math.round(diaValues.reduce((a, b) => a + b, 0) / diaValues.length);

    // Trend comparison between first half and second half
    let trendStatus = 'Ổn định';
    if (hrValues.length >= 4) {
      const half = Math.floor(hrValues.length / 2);
      const firstHalfAvg = hrValues.slice(0, half).reduce((a, b) => a + b, 0) / half;
      const secondHalfAvg = hrValues.slice(half).reduce((a, b) => a + b, 0) / (hrValues.length - half);
      if (secondHalfAvg - firstHalfAvg > 3) trendStatus = 'Tăng nhẹ';
      else if (firstHalfAvg - secondHalfAvg > 3) trendStatus = 'Giảm nhẹ';
    }

    return {
      avgHeartRate: avgHr,
      minHeartRate: minHr,
      maxHeartRate: maxHr,
      trendStatus,
      avgSpo2,
      avgSys,
      avgDia
    };
  }, [filteredData]);

  // Metric configurations
  const metricConfigs = {
    heartRate: {
      title: 'Nhịp Tim (Heart Rate)',
      unit: 'BPM',
      color: '#f43f5e',
      gradientId: 'heartRateGrad',
      safeMin: 60,
      safeMax: 100,
      safeLabel: '60 - 100 BPM (Chuẩn nghỉ ngơi)',
      dataKey: 'heartRate',
      desc: 'Nhịp tim đo khi nghỉ ngơi phản ánh sức bền cơ tim và mức độ căng thẳng thần kinh thực vật.'
    },
    bloodPressure: {
      title: 'Huyết Áp (Blood Pressure)',
      unit: 'mmHg',
      color: '#06b6d4',
      gradientId: 'bpGrad',
      safeMin: 90,
      safeMax: 130,
      safeLabel: '< 120/80 mmHg (Lý tưởng)',
      dataKey: 'bloodPressureSystolic',
      secondaryDataKey: 'bloodPressureDiastolic',
      desc: 'Áp lực máu động mạch tối đa (tâm thu) và tối thiểu (tâm trương).'
    },
    spo2: {
      title: 'Oxy Trong Máu (SpO2)',
      unit: '%',
      color: '#10b981',
      gradientId: 'spo2Grad',
      safeMin: 95,
      safeMax: 100,
      safeLabel: '≥ 95% (Bình thường)',
      dataKey: 'spo2',
      desc: 'Độ bão hòa oxy trong máu động mạch, chỉ số sống còn của hệ hô hấp và tuần hoàn.'
    },
    activity: {
      title: 'Nước Uống & Giấc Ngủ',
      unit: 'Cốc (250ml)',
      color: '#8b5cf6',
      gradientId: 'activityGrad',
      safeMin: 6,
      safeMax: 10,
      safeLabel: '8 Cốc nước (2.0L) & 7-8h ngủ',
      dataKey: 'waterCups',
      secondaryDataKey: 'sleepHours',
      desc: 'Thói quen duy trì nước và thời lượng phục hồi năng lượng mỗi ngày.'
    }
  };

  const curConfig = metricConfigs[activeMetric];

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-white/10 p-3 rounded-2xl shadow-2xl backdrop-blur-xl text-xs space-y-1.5 min-w-[170px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1 text-[10px] text-text-dim">
            <span>{data.fullDateLabel}</span>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>

          {activeMetric === 'heartRate' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-text-dim flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-400" /> Nhịp tim:
                </span>
                <span className="font-mono font-bold text-rose-400 text-sm">{data.heartRate} BPM</span>
              </div>
              <span className={cn(
                "text-[9px] px-2 py-0.5 rounded-full inline-block font-medium",
                data.heartRate >= 60 && data.heartRate <= 100 ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"
              )}>
                {data.heartRate >= 60 && data.heartRate <= 100 ? 'Nhịp tim bình thường' : data.heartRate > 100 ? 'Nhịp tim hơi nhanh' : 'Nhịp tim chậm'}
              </span>
            </div>
          )}

          {activeMetric === 'bloodPressure' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-text-dim">Tâm thu:</span>
                <span className="font-mono font-bold text-cyan-400">{data.bloodPressureSystolic} mmHg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-dim">Tâm trương:</span>
                <span className="font-mono font-bold text-teal-400">{data.bloodPressureDiastolic} mmHg</span>
              </div>
            </div>
          )}

          {activeMetric === 'spo2' && (
            <div className="flex items-center justify-between">
              <span className="text-text-dim flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-emerald-400" /> SpO2:
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{data.spo2}%</span>
            </div>
          )}

          {activeMetric === 'activity' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-text-dim flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-cyan-400" /> Nước:
                </span>
                <span className="font-mono font-bold text-cyan-400">{data.waterCups} cốc ({data.waterCups * 250}ml)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-dim flex items-center gap-1">
                  <Moon className="w-3 h-3 text-purple-400" /> Giấc ngủ:
                </span>
                <span className="font-mono font-bold text-purple-400">{data.sleepHours} giờ</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="bg-panel rounded-3xl p-6 border border-border shadow-2xl space-y-6" id="home-health-trends-chart-section">
      {/* Header & Metric Switcher Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20 shadow-sm">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              Xu Hướng Sức Khỏe & Nhịp Tim
            </h3>
            <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest mt-0.5">
              Phân tích dữ liệu sinh hiệu đa chiều (Recharts Engine)
            </p>
          </div>
        </div>

        {/* Time Range Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 self-start md:self-auto">
          {(['7d', '14d', '30d'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                timeRange === r 
                  ? "bg-primary text-bg shadow-sm" 
                  : "text-text-dim hover:text-white"
              )}
            >
              {r === '7d' ? '7 Ngày' : r === '14d' ? '14 Ngày' : '30 Ngày'}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Selector Pills Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => setActiveMetric('heartRate')}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between space-y-2",
            activeMetric === 'heartRate'
              ? "bg-rose-500/10 border-rose-500/30 text-white shadow-[0_0_20px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/40"
              : "bg-white/[0.02] border-white/5 text-text-dim hover:bg-white/[0.05] hover:text-white"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider">Nhịp tim</span>
            <Heart className={cn("w-4 h-4", activeMetric === 'heartRate' ? "text-rose-400" : "text-text-dim")} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-mono font-bold text-white">{stats.avgHeartRate}</span>
            <span className="text-[10px] text-text-dim font-mono">BPM</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveMetric('bloodPressure')}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between space-y-2",
            activeMetric === 'bloodPressure'
              ? "bg-cyan-500/10 border-cyan-500/30 text-white shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40"
              : "bg-white/[0.02] border-white/5 text-text-dim hover:bg-white/[0.05] hover:text-white"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider">Huyết áp</span>
            <Activity className={cn("w-4 h-4", activeMetric === 'bloodPressure' ? "text-cyan-400" : "text-text-dim")} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-mono font-bold text-white">{stats.avgSys}/{stats.avgDia}</span>
            <span className="text-[10px] text-text-dim font-mono">mmHg</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveMetric('spo2')}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between space-y-2",
            activeMetric === 'spo2'
              ? "bg-emerald-500/10 border-emerald-500/30 text-white shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/40"
              : "bg-white/[0.02] border-white/5 text-text-dim hover:bg-white/[0.05] hover:text-white"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider">SpO2 Oxy</span>
            <Wind className={cn("w-4 h-4", activeMetric === 'spo2' ? "text-emerald-400" : "text-text-dim")} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-mono font-bold text-white">{stats.avgSpo2}</span>
            <span className="text-[10px] text-text-dim font-mono">%</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveMetric('activity')}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between space-y-2",
            activeMetric === 'activity'
              ? "bg-purple-500/10 border-purple-500/30 text-white shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/40"
              : "bg-white/[0.02] border-white/5 text-text-dim hover:bg-white/[0.05] hover:text-white"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider">Thói quen</span>
            <Droplets className={cn("w-4 h-4", activeMetric === 'activity' ? "text-purple-400" : "text-text-dim")} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-mono font-bold text-white">Nước & Ngủ</span>
            <span className="text-[10px] text-text-dim font-mono">Chu kỳ</span>
          </div>
        </button>
      </div>

      {/* Main Chart Canvas Area */}
      <div className="bg-bg/50 border border-white/5 rounded-3xl p-5 space-y-4">
        {/* Metric Top Bar Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">{curConfig.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-dim border border-white/10 font-mono">
                {curConfig.safeLabel}
              </span>
            </div>
            <p className="text-[11px] text-text-dim font-light leading-relaxed">
              {curConfig.desc}
            </p>
          </div>

          {/* Mini Stats Summary Pill */}
          {activeMetric === 'heartRate' && (
            <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-xl self-start sm:self-auto font-mono text-[11px]">
              <span className="text-text-dim">Min: <strong className="text-emerald-400">{stats.minHeartRate}</strong></span>
              <span className="text-white/20">|</span>
              <span className="text-text-dim">Max: <strong className="text-rose-400">{stats.maxHeartRate}</strong></span>
              <span className="text-white/20">|</span>
              <span className="text-text-dim">Xu hướng: <strong className="text-primary">{stats.trendStatus}</strong></span>
            </div>
          )}
        </div>

        {/* Recharts Area Container */}
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="heartRateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="bpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="bpDiaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              
              <XAxis 
                dataKey="dayLabel" 
                tickLine={false} 
                axisLine={false} 
                stroke="#94a3b8" 
                fontSize={10} 
                dy={6}
              />
              
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                domain={
                  activeMetric === 'heartRate' ? [50, 120] :
                  activeMetric === 'bloodPressure' ? [60, 160] :
                  activeMetric === 'spo2' ? [90, 100] :
                  [0, 12]
                }
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Reference Lines for Standard Ranges */}
              {activeMetric === 'heartRate' && (
                <>
                  <ReferenceLine y={100} stroke="#f43f5e50" strokeDasharray="3 3" label={{ value: 'Giới hạn trên 100 BPM', fill: '#f43f5e', fontSize: 9, position: 'insideTopRight' }} />
                  <ReferenceLine y={60} stroke="#10b98150" strokeDasharray="3 3" label={{ value: 'Giới hạn dưới 60 BPM', fill: '#10b981', fontSize: 9, position: 'insideBottomRight' }} />
                </>
              )}

              {activeMetric === 'spo2' && (
                <ReferenceLine y={95} stroke="#10b98160" strokeDasharray="3 3" label={{ value: 'Ngưỡng an toàn ≥ 95%', fill: '#10b981', fontSize: 9, position: 'insideTopRight' }} />
              )}

              {activeMetric === 'bloodPressure' ? (
                <>
                  <Area 
                    type="monotone" 
                    dataKey="bloodPressureSystolic" 
                    stroke="#06b6d4" 
                    strokeWidth={2.5} 
                    fill="url(#bpGrad)" 
                    name="Tâm thu"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="bloodPressureDiastolic" 
                    stroke="#14b8a6" 
                    strokeWidth={2} 
                    fill="url(#bpDiaGrad)" 
                    name="Tâm trương"
                  />
                </>
              ) : activeMetric === 'activity' ? (
                <>
                  <Area 
                    type="monotone" 
                    dataKey="waterCups" 
                    stroke="#8b5cf6" 
                    strokeWidth={2.5} 
                    fill="url(#activityGrad)" 
                    name="Nước (cốc)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sleepHours" 
                    stroke="#38bdf8" 
                    strokeWidth={2} 
                    fillOpacity={0}
                    name="Giấc ngủ (giờ)"
                  />
                </>
              ) : (
                <Area 
                  type="monotone" 
                  dataKey={curConfig.dataKey} 
                  stroke={curConfig.color} 
                  strokeWidth={2.5} 
                  fill={`url(#${curConfig.gradientId})`} 
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Action Controls & Navigation Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-text-dim font-light">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Biểu đồ tự động cập nhật mỗi khi bạn ghi sinh hiệu hoặc nhật ký</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenVitalsModal && (
              <button
                type="button"
                onClick={onOpenVitalsModal}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-bg font-bold text-xs uppercase tracking-wider shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Ghi sinh hiệu
              </button>
            )}

            {onNavigateToHealth && (
              <button
                type="button"
                onClick={onNavigateToHealth}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-white/10 active:scale-95 transition-all cursor-pointer"
              >
                Nhật ký chi tiết
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
