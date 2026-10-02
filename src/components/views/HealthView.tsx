import { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  Flame, 
  Dumbbell, 
  Heart, 
  Sparkles, 
  Calendar, 
  Plus, 
  Filter, 
  ChevronRight, 
  Activity, 
  Layers, 
  Check, 
  X, 
  Award, 
  Volume2, 
  Wind, 
  Smile,
  ShieldCheck,
  TrendingUp,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { registerModal } from '../../utils/modalManager';

interface Exercise {
  id: string;
  title: string;
  category: 'cotsong' | 'timmach' | 'giamstress' | 'dotcalo' | 'thothieng' | 'all';
  categoryLabel: string;
  tag: string;
  duration: number; // minutes
  kcal: number;
  level: 'Nhẹ nhàng' | 'Vừa phải' | 'Nâng cao';
  image: string;
  description: string;
  benefits: string[];
  steps: string[];
}

const THERAPY_EXERCISES: Exercise[] = [
  {
    id: 'hero-yoga-spine',
    title: 'YOGA PHỤC HỒI CHUYÊN SÂU',
    category: 'cotsong',
    categoryLabel: 'Cột sống',
    tag: 'Giảm đau lưng',
    duration: 25,
    kcal: 180,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=1200',
    description: 'Liệu pháp giải phóng căng thẳng vùng cơ thắt lưng và tăng tính linh hoạt cột sống.',
    benefits: ['Kéo giãn đốt sống L4-L5', 'Giảm chèn ép dây thần kinh tọa', 'Tăng lưu thông máu vùng lưng'],
    steps: [
      'Tư thế Con Mèo - Con Bò (Cat-Cow): 3 phút làm mềm cột sống',
      'Tư thế Em Bé (Child Pose): 5 phút kéo giãn cơ thắt lưng',
      'Tư thế Cây Cầu (Bridge Pose): 5 phút củng cố cơ mông và đáy chậu',
      'Tư thế Rắn Hổ Mang nhẹ: 4 phút giải phóng áp lực đĩa đệm',
      'Thư giãn Savasana và thở bụng sâu: 8 phút'
    ]
  },
  {
    id: 'ex-sun-salutation',
    title: 'Chào mặt trời (Surya Namaskar)',
    category: 'dotcalo',
    categoryLabel: 'Đốt calo',
    tag: 'Khởi động ngày mới',
    duration: 15,
    kcal: 120,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600',
    description: 'Chuỗi 12 động tác liên hoàn đánh thức toàn bộ nhóm cơ và kích hoạt năng lượng tích cực.',
    benefits: ['Làm nóng cơ thể', 'Tăng độ dẻo dai toàn thân', 'Cải thiện tuần hoàn máu'],
    steps: [
      'Tư thế cầu nguyện (Pranamasana)',
      'Tư thế vươn tay ngả sau (Hastauttanasana)',
      'Tư thế cúi gập người (Padahastasana)',
      'Tư thế chiến binh thấp',
      'Tư thế tấm ván và rắn hổ mang'
    ]
  },
  {
    id: 'ex-neck-shoulder',
    title: 'Trị liệu Đau Cổ Vai Gáy',
    category: 'cotsong',
    categoryLabel: 'Cột sống',
    tag: 'Dân văn phòng',
    duration: 18,
    kcal: 110,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=600',
    description: 'Tập trung thả lỏng cơ thang, cơ nâng vai và giải phóng chèn ép rễ thần kinh cổ.',
    benefits: ['Giảm căng cứng cổ gáy', 'Phòng ngừa thoái hóa đốt sống cổ', 'Cắt đứt cơn đau nửa đầu sau'],
    steps: [
      'Nghiêng đầu sang hai bên kết hợp ấn huyệt Phong Trì',
      'Xoay tròn khớp vai mở ngực',
      'Động tác luồn kim kéo giãn cơ liên bả vai',
      'Tư thế mặt bò kéo giãn cánh tay'
    ]
  },
  {
    id: 'ex-meditation-breathing',
    title: 'Thiền Chánh Niệm & Hơi Thở Sâu',
    category: 'thothieng',
    categoryLabel: 'Thở & Thiền',
    tag: 'An thần & Ngủ ngon',
    duration: 12,
    kcal: 35,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1591228127791-8e2eaef098d3?auto=format&fit=crop&q=80&w=600',
    description: 'Kỹ thuật thở cơ hoành 4-7-8 giúp làm dịu hệ thần kinh giao cảm và giảm cortisol.',
    benefits: ['Giảm lo âu căng thẳng', 'Ổn định huyết áp', 'Cải thiện chất lượng giấc ngủ'],
    steps: [
      'Ngồi thẳng lưng, nhắm mắt nhẹ nhàng',
      'Hít vào bằng mũi trong 4 giây căng tròn bụng',
      'Giữ hơi thở thư thái trong 7 giây',
      'Thở từ từ qua miệng trong 8 giây',
      'Lặp lại chu kỳ 8 lần liên tục'
    ]
  },
  {
    id: 'ex-cardio-flow',
    title: 'Dưỡng Sinh Khí Công Tim Mạch',
    category: 'timmach',
    categoryLabel: 'Tim mạch',
    tag: 'Tăng sức bền tim',
    duration: 20,
    kcal: 155,
    level: 'Vừa phải',
    image: 'https://images.unsplash.com/photo-1510894347713-fc3ad6cb0d4d?auto=format&fit=crop&q=80&w=600',
    description: 'Vận động nhịp điệu nhẹ nhàng điều hòa nhịp tim, cải thiện đàn hồi thành mạch máu.',
    benefits: ['Hạ áp tự nhiên', 'Tăng thể tích tống máu', 'Tăng cường oxy mô'],
    steps: [
      'Xoay khớp cổ chân, cổ tay điều hòa khí huyết',
      'Động tác Bát Đoạn Cẩm: Lưỡng thủ thác thiên lý tam tiêu',
      'Đi bộ nhịp thở 3 bước hít - 3 bước thở',
      'Vỗ tay tĩnh mạch thư giãn'
    ]
  },
  {
    id: 'ex-stress-relief',
    title: 'Yoga Giải Tỏa Căng Thẳng (De-Stress)',
    category: 'giamstress',
    categoryLabel: 'Giảm stress',
    tag: 'Thư giãn cảm xúc',
    duration: 22,
    kcal: 130,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&q=80&w=600',
    description: 'Kết hợp các tư thế gập người về phía trước giải tỏa áp lực tâm lý và mệt mỏi tích tụ.',
    benefits: ['Tăng sóng não Alpha thư thái', 'Giảm đau căng đầu do stress', 'Khơi thông kinh lạc'],
    steps: [
      'Tư thế Cánh Bướm gập người',
      'Tư thế Chó úp mặt (Downward Dog)',
      'Tư thế Gác chân lên tường (Viparita Karani)',
      'Thả lỏng toàn thân với nhạc trị liệu'
    ]
  }
];

// Structured multi-week therapeutic programs
const THERAPY_PROGRAMS = [
  {
    id: 'prog-spine-14d',
    title: 'Lộ Trình 14 Ngày Chữa Lành Cột Sống',
    category: 'Cột sống & Đĩa đệm',
    days: 14,
    dailyMinutes: 20,
    totalSessions: 14,
    completedSessions: 3,
    level: 'Mọi đối tượng',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=500',
    desc: 'Phác đồ chuyên sâu phục hồi đau thắt lưng, thoái hóa cột sống và đau dây thần kinh tọa.'
  },
  {
    id: 'prog-cardio-21d',
    title: 'Liệu Trình 21 Ngày Tăng Sức Bền Tim Mạch',
    category: 'Tuần hoàn & Tim',
    days: 21,
    dailyMinutes: 25,
    totalSessions: 21,
    completedSessions: 0,
    level: 'Nhẹ đến Vừa',
    image: 'https://images.unsplash.com/photo-1510894347713-fc3ad6cb0d4d?auto=format&fit=crop&q=80&w=500',
    desc: 'Cải thiện chỉ số huyết áp, hạ nhịp tim nghỉ và tăng lượng oxy SpO2 cho cơ thể.'
  },
  {
    id: 'prog-sleep-7d',
    title: 'Khóa 7 Ngày Cải Thiện Giấc Ngủ & Giải Tỏa Lo Âu',
    category: 'Thần kinh & Giấc ngủ',
    days: 7,
    dailyMinutes: 15,
    totalSessions: 7,
    completedSessions: 5,
    level: 'Nhẹ nhàng',
    image: 'https://images.unsplash.com/photo-1591228127791-8e2eaef098d3?auto=format&fit=crop&q=80&w=500',
    desc: 'Bài tập kéo giãn trước khi ngủ kết hợp âm thanh thiền định giúp chìm vào giấc ngủ sâu.'
  }
];

export default function HealthView() {
  const { user } = useAuth();
  // Sub-tabs as explicitly requested: [ Cho bạn hôm nay ] | [ Giáo trình Trị liệu ] | [ Lịch sử luyện tập ]
  const [subTab, setSubTab] = useState<'today' | 'programs' | 'history'>('today');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'cotsong' | 'timmach' | 'giamstress' | 'dotcalo' | 'thothieng'>('all');

  // Active workout session modal
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);

  // Workout History
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([
    {
      id: 'wh-1',
      title: 'YOGA PHỤC HỒI CHUYÊN SÂU',
      duration: 25,
      kcal: 180,
      date: 'Hôm qua, 07:30',
      category: 'Cột sống'
    },
    {
      id: 'wh-2',
      title: 'Chào mặt trời (Surya Namaskar)',
      duration: 15,
      kcal: 120,
      date: '2 ngày trước, 06:45',
      category: 'Đốt calo'
    },
    {
      id: 'wh-3',
      title: 'Thiền Chánh Niệm & Hơi Thở Sâu',
      duration: 12,
      kcal: 35,
      date: '3 ngày trước, 21:15',
      category: 'Thở & Thiền'
    }
  ]);

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Back gesture listener for modal
  useEffect(() => {
    if (!activeExercise) return;
    const closeFn = () => {
      setActiveExercise(null);
      setIsTimerRunning(false);
      setSessionSeconds(0);
      setSessionCompleted(false);
    };
    const unregister = registerModal('workout-session-modal', closeFn);
    const handleBack = (e: Event) => {
      e.preventDefault();
      closeFn();
    };
    window.addEventListener('app-back-press', handleBack);
    return () => {
      unregister();
      window.removeEventListener('app-back-press', handleBack);
    };
  }, [activeExercise]);

  // Listen for root menu reset to return to top of Health view
  useEffect(() => {
    const handleResetToRoot = (e: any) => {
      if (e.detail?.view === 'health') {
        setSubTab('today');
        setActiveExercise(null);
        setIsTimerRunning(false);
        setSessionSeconds(0);
        setSelectedFilter('all');
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        document.getElementById('top-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    window.addEventListener('app-reset-to-root', handleResetToRoot);
    return () => window.removeEventListener('app-reset-to-root', handleResetToRoot);
  }, []);

  const startExercise = (ex: Exercise) => {
    setActiveExercise(ex);
    setSessionSeconds(0);
    setIsTimerRunning(true);
    setSessionCompleted(false);
  };

  const finishExercise = async () => {
    setIsTimerRunning(false);
    setSessionCompleted(true);
    if (!activeExercise) return;

    const actualMinutes = Math.max(1, Math.round(sessionSeconds / 60)) || activeExercise.duration;
    const actualKcal = Math.round((activeExercise.kcal / activeExercise.duration) * actualMinutes);

    const record = {
      id: `wh_${Date.now()}`,
      title: activeExercise.title,
      duration: actualMinutes,
      kcal: actualKcal,
      date: 'Vừa xong',
      category: activeExercise.categoryLabel
    };

    setWorkoutHistory(prev => [record, ...prev]);

    // Persist to Firestore if user logged in
    if (user) {
      try {
        await addDoc(collection(db, 'workoutSessions'), {
          userId: user.uid,
          exerciseId: activeExercise.id,
          title: activeExercise.title,
          duration: actualMinutes,
          kcal: actualKcal,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Error saving workout session:", err);
      }
    }
  };

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    if (selectedFilter === 'all') return THERAPY_EXERCISES;
    return THERAPY_EXERCISES.filter(ex => ex.category === selectedFilter);
  }, [selectedFilter]);

  // Stats calculation
  const totalStats = useMemo(() => {
    const totalMinutes = workoutHistory.reduce((acc, curr) => acc + curr.duration, 0);
    const totalKcal = workoutHistory.reduce((acc, curr) => acc + curr.kcal, 0);
    const sessionCount = workoutHistory.length;
    return { totalMinutes, totalKcal, sessionCount };
  }, [workoutHistory]);

  const featuredExercise = THERAPY_EXERCISES[0];

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-bg min-h-full pb-36">
      {/* 1. Header with Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-teal-700 font-bold text-[11px] uppercase tracking-wider">
          <Dumbbell className="w-4 h-4 text-teal-600" />
          <span>Luyện tập Trị liệu & Phục hồi</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Sức Khỏe & Vận Động
        </h1>
        <p className="text-xs text-slate-500">
          Các bài tập yoga dưỡng sinh, giải tỏa đau mỏi và nâng cao thể trạng mỗi ngày
        </p>
      </div>

      {/* 2. Top Sub-Tabs Navigation (Strictly Reorganized as Requested) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1 sm:p-1.5 flex items-center gap-1 sm:gap-1.5 shadow-xs">
        <button
          onClick={() => setSubTab('today')}
          className={cn(
            "flex-1 py-2 px-1 sm:px-2.5 rounded-xl text-[9px] sm:text-[11px] font-bold uppercase tracking-tight sm:tracking-normal transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap",
            subTab === 'today'
              ? "bg-teal-600 text-white-pure shadow-sm shadow-teal-600/25"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span>Cho bạn hôm nay</span>
        </button>

        <button
          onClick={() => setSubTab('programs')}
          className={cn(
            "flex-1 py-2 px-1 sm:px-2.5 rounded-xl text-[9px] sm:text-[11px] font-bold uppercase tracking-tight sm:tracking-normal transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap",
            subTab === 'programs'
              ? "bg-teal-600 text-white-pure shadow-sm shadow-teal-600/25"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span>Giáo trình Trị liệu</span>
        </button>

        <button
          onClick={() => setSubTab('history')}
          className={cn(
            "flex-1 py-2 px-1 sm:px-2.5 rounded-xl text-[9px] sm:text-[11px] font-bold uppercase tracking-tight sm:tracking-normal transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap",
            subTab === 'history'
              ? "bg-teal-600 text-white-pure shadow-sm shadow-teal-600/25"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span>Lịch sử luyện tập</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: CHO BẠN HÔM NAY                                                */}
      {/* ========================================================================= */}
      {subTab === 'today' && (
        <div className="space-y-6">
          {/* A. Featured Banner Card: Khuyên dùng hôm nay (Matching blueprint) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Khuyên dùng hôm nay
              </span>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Cá nhân hóa theo sinh hiệu
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-100">
                <img 
                  src={featuredExercise.image} 
                  alt={featuredExercise.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-105 contrast-[1.02]" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent flex flex-col justify-between p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-teal-600 text-force-white shadow-sm flex items-center gap-1">
                      🏷️ {featuredExercise.tag}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/95 backdrop-blur-md text-slate-800 border border-slate-200/90 shadow-2xs">
                      Mức độ: {featuredExercise.level}
                    </span>
                  </div>

                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-white/90 shadow-md">
                    <h3 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-snug">
                      {featuredExercise.title}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-6 space-y-4">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {featuredExercise.description}
                </p>

                {/* Specs row */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-1 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>⏱️ <strong>{featuredExercise.duration} phút</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                    <Flame className="w-4 h-4 text-rose-500" />
                    <span>🔥 <strong>{featuredExercise.kcal} kcal</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>📊 <strong>Mức độ: {featuredExercise.level}</strong></span>
                  </div>
                </div>

                {/* Clear prominent CTA button */}
                <button
                  onClick={() => startExercise(featuredExercise)}
                  className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-force-white font-bold text-xs uppercase tracking-widest shadow-md shadow-teal-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>▶️ Bắt đầu luyện tập ngay</span>
                </button>
              </div>
            </div>
          </div>

          {/* B. Danh sách Luyện tập theo Mục tiêu & Filter Chips */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Danh sách Luyện tập theo Mục tiêu
              </h3>
              <span className="text-[11px] text-slate-500">
                {filteredExercises.length} bài tập
              </span>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'cotsong', label: 'Cột sống' },
                { id: 'timmach', label: 'Tim mạch' },
                { id: 'giamstress', label: 'Giảm stress' },
                { id: 'dotcalo', label: 'Đốt calo' },
                { id: 'thothieng', label: 'Thở & Thiền' },
              ].map(chip => (
                <button
                  key={chip.id}
                  onClick={() => setSelectedFilter(chip.id as any)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer",
                    selectedFilter === chip.id
                      ? "bg-teal-600 text-white border-teal-600 shadow-xs font-bold"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Exercise Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredExercises.map(ex => (
                <div
                  key={ex.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3.5">
                    <img 
                      src={ex.image} 
                      alt={ex.title} 
                      className="w-20 h-20 rounded-xl object-cover border border-slate-100 shrink-0"
                    />
                    <div className="min-w-0 space-y-1">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
                        {ex.tag}
                      </span>
                      <h4 className="font-serif text-base font-bold text-slate-900 leading-snug line-clamp-1">
                        {ex.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {ex.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-3 text-slate-500 text-[11px] font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        {ex.duration} phút
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-rose-500" />
                        {ex.kcal} kcal
                      </span>
                    </div>

                    <button
                      onClick={() => startExercise(ex)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Tập ngay</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: GIÁO TRÌNH TRỊ LIỆU                                            */}
      {/* ========================================================================= */}
      {subTab === 'programs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Lộ trình Trị liệu Đa Tuần
            </span>
            <span className="text-xs text-slate-500">
              Có hướng dẫn & kiểm tra tiến độ
            </span>
          </div>

          <div className="space-y-4">
            {THERAPY_PROGRAMS.map(prog => (
              <div 
                key={prog.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <img 
                      src={prog.image} 
                      alt={prog.title} 
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                    />
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                        {prog.category} • {prog.level}
                      </span>
                      <h4 className="font-serif text-lg font-bold text-slate-900 leading-tight">
                        {prog.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {prog.desc}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => startExercise(featuredExercise)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-force-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all shrink-0 cursor-pointer self-start sm:self-auto"
                  >
                    Thực hành
                  </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Tiến độ: <strong>{prog.completedSessions} / {prog.totalSessions} buổi</strong></span>
                    <span className="font-bold text-teal-700">{Math.round((prog.completedSessions / prog.totalSessions) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-teal-600 rounded-full transition-all duration-500" 
                      style={{ width: `${(prog.completedSessions / prog.totalSessions) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: LỊCH SỬ LUYỆN TẬP                                             */}
      {/* ========================================================================= */}
      {subTab === 'history' && (
        <div className="space-y-5">
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tổng thời gian
              </span>
              <span className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
                {totalStats.totalMinutes}
              </span>
              <span className="text-[10px] text-teal-600 font-medium block">phút tập</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Đốt năng lượng
              </span>
              <span className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
                {totalStats.totalKcal}
              </span>
              <span className="text-[10px] text-rose-500 font-medium block">kcal</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Buổi hoàn thành
              </span>
              <span className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
                {totalStats.sessionCount}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium block">buổi tập</span>
            </div>
          </div>

          {/* History List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider px-1">
              Nhật ký các buổi tập đã hoàn tất
            </h4>
            <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              {workoutHistory.map((item, idx) => (
                <div key={item.id || idx} className="p-4 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                      <CheckCircle className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-800">{item.title}</h5>
                      <span className="text-[11px] text-slate-500">
                        {item.date} • {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-teal-700 block">{item.duration} phút</span>
                    <span className="text-[10px] text-rose-500 font-semibold">{item.kcal} kcal</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE WORKOUT SESSION MODAL                                         */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeExercise && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 lg:p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-none lg:rounded-3xl w-full h-full lg:h-auto lg:max-w-xl lg:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="px-4 sm:px-5 pt-[calc(max(env(safe-area-inset-top,0px),34px)+0.5rem)] lg:pt-5 pb-3.5 sm:pb-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                    <Play className="w-4 h-4 fill-white" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-slate-900 leading-tight">
                      {activeExercise.title}
                    </h3>
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                      {activeExercise.tag} • Mục tiêu {activeExercise.duration} phút
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveExercise(null)}
                  className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Workout Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
                {/* Timer Clock Banner */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-700 via-emerald-700 to-teal-800 text-white-pure text-center space-y-3 shadow-lg shadow-teal-900/15 border border-teal-600/30">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-100 block">
                    Thời gian đang thực hiện
                  </span>
                  <div className="font-mono text-4xl sm:text-5xl font-black tracking-wider text-white-pure drop-shadow-sm">
                    {String(Math.floor(sessionSeconds / 60)).padStart(2, '0')}:
                    {String(sessionSeconds % 60).padStart(2, '0')}
                  </div>

                  {/* Timer Controls */}
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white-pure font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md border border-white/25 active:scale-95 transition-all"
                    >
                      {isTimerRunning ? <Pause className="w-4 h-4 text-white-pure" /> : <Play className="w-4 h-4 fill-white text-white-pure" />}
                      <span className="text-white-pure">{isTimerRunning ? 'Tạm dừng' : 'Tiếp tục'}</span>
                    </button>
                    <button
                      onClick={() => { setSessionSeconds(0); setIsTimerRunning(false); }}
                      className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white-pure text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-white/25 active:scale-95 transition-all"
                    >
                      <RotateCcw className="w-4 h-4 text-white-pure" />
                      <span className="text-white-pure">Đặt lại</span>
                    </button>
                  </div>
                </div>

                {/* Steps & Guidance */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Các bước thực hiện chuẩn y khoa
                  </h4>
                  <div className="space-y-2">
                    {activeExercise.steps.map((st, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Action */}
              <div className="px-4 sm:px-5 py-3.5 pb-[calc(max(env(safe-area-inset-bottom,0px),16px)+0.5rem)] sm:pb-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-500">
                  {sessionCompleted ? 'Đã ghi nhận buổi tập!' : 'Nhấn khi bạn đã hoàn thành bài tập'}
                </span>
                <button
                  disabled={sessionCompleted}
                  onClick={finishExercise}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer",
                    sessionCompleted
                      ? "bg-emerald-600 text-white-pure"
                      : "bg-teal-600 hover:bg-teal-700 text-white-pure shadow-teal-600/25"
                  )}
                >
                  {sessionCompleted ? '✓ Đã hoàn tất' : 'Hoàn thành buổi tập'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
