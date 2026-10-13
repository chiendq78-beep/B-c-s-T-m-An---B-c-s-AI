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
  Info,
  Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { registerModal } from '../../utils/modalManager';
import { useLanguage } from '../../contexts/LanguageContext';
import ActiveWorkoutModal from './ActiveWorkoutModal';
import { getTrackForExercise } from '../../services/workoutMusicService';

import { 
  THERAPY_EXERCISES, 
  findTherapyExercise, 
  TherapyExercise as Exercise 
} from '../../data/therapyExercisesData';

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
    image: '/qigong_cardio.jpg',
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

interface HealthViewProps {
  targetExercise?: string | null;
  onClearTargetExercise?: () => void;
}

export default function HealthView({ targetExercise, onClearTargetExercise }: HealthViewProps = {}) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';
  // Sub-tabs as explicitly requested: [ Cho bạn hôm nay ] | [ Giáo trình Trị liệu ] | [ Lịch sử luyện tập ]
  const [subTab, setSubTab] = useState<'today' | 'programs' | 'history'>('today');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'cotsong' | 'timmach' | 'giamstress' | 'dotcalo' | 'thothieng'>('all');

  // Active workout session modal
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [highlightedExerciseId, setHighlightedExerciseId] = useState<string | null>(null);
  const [linkedNotice, setLinkedNotice] = useState<string | null>(null);

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

  // Listen for root menu reset to return to top of Health view
  useEffect(() => {
    const handleResetToRoot = (e: any) => {
      if (e.detail?.view === 'health') {
        setSubTab('today');
        setActiveExercise(null);
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

  // Register banner notice dismissal in modal manager
  useEffect(() => {
    if (!linkedNotice) return;
    return registerModal('health-linked-notice', () => setLinkedNotice(null));
  }, [linkedNotice]);

  // Sub-tabs (Giáo trình Trị liệu hoặc Lịch sử luyện tập -> quay lại Cho bạn hôm nay)
  useEffect(() => {
    if (activeExercise || subTab === 'today') return;
    return registerModal('health-subtab', () => setSubTab('today'));
  }, [activeExercise, subTab]);

  // Bộ lọc bài tập khi đang ở tab Cho bạn hôm nay -> quay lại Tất cả
  useEffect(() => {
    if (activeExercise || selectedFilter === 'all') return;
    return registerModal('health-filter', () => setSelectedFilter('all'));
  }, [activeExercise, selectedFilter]);

  // Listen for target exercise from props or custom event
  useEffect(() => {
    const handleTarget = (query: string) => {
      const matched = findTherapyExercise(query);
      if (matched) {
        setSubTab('today');
        if (matched.category !== 'all') {
          setSelectedFilter(matched.category as any);
        } else {
          setSelectedFilter('all');
        }
        setHighlightedExerciseId(matched.id);
        setActiveExercise(matched);
        setLinkedNotice(matched.title);

        setTimeout(() => setLinkedNotice(null), 6000);

        setTimeout(() => {
          const el = document.getElementById(`exercise-${matched.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);

        onClearTargetExercise?.();
      }
    };

    if (targetExercise) {
      handleTarget(targetExercise);
    }

    const handleEvent = (e: any) => {
      const q = e.detail?.exerciseName || e.detail?.exercise;
      if (q) {
        handleTarget(q);
      }
    };

    window.addEventListener('app-open-exercise', handleEvent);
    return () => window.removeEventListener('app-open-exercise', handleEvent);
  }, [targetExercise, onClearTargetExercise]);

  const startExercise = (ex: Exercise) => {
    setActiveExercise(ex);
  };

  const handleWorkoutComplete = async (actualMinutes: number, actualKcal: number) => {
    if (!activeExercise) return;

    const record = {
      id: `wh_${Date.now()}`,
      title: activeExercise.title,
      duration: actualMinutes,
      kcal: actualKcal,
      date: isEn ? 'Just now' : 'Vừa xong',
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
          <span>{isEn ? "Therapeutic & Recovery Workouts" : "Luyện tập Trị liệu & Phục hồi"}</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {isEn ? "Health & Workout" : "Sức Khỏe & Vận Động"}
        </h1>
        <p className="text-xs text-slate-500">
          {isEn 
            ? "Yoga therapy, pain relief, and daily wellness workouts" 
            : "Các bài tập yoga dưỡng sinh, giải tỏa đau mỏi và nâng cao thể trạng mỗi ngày"}
        </p>
      </div>

      {/* Linked from Disease Notice Banner */}
      <AnimatePresence>
        {linkedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50/90 border border-emerald-300/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-md border border-teal-200">
                    {isEn ? "Linked from Disease" : "Liên kết từ Bệnh lý"}
                  </span>
                  <span className="text-[10px] text-teal-700 font-medium hidden sm:inline">
                    {isEn ? "Opening workout routine" : "Đang mở bài tập chính xác"}
                  </span>
                </div>
                <h3 className="text-[11.5px] sm:text-xs font-bold text-slate-900 truncate mt-0.5">
                  {linkedNotice}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setLinkedNotice(null)}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-emerald-100/60 transition-colors cursor-pointer shrink-0"
              title="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Top Sub-Tabs Navigation (Optimized for Mobile & Desktop) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1 sm:p-1.5 flex items-center gap-1 sm:gap-1.5 shadow-xs w-full max-w-full overflow-hidden">
        <button
          onClick={() => setSubTab('today')}
          className={cn(
            "flex-1 py-2 px-1 sm:px-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-tight sm:tracking-normal transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap min-w-0",
            subTab === 'today'
              ? "bg-teal-600 text-force-white shadow-sm shadow-teal-600/25"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="sm:hidden truncate">{isEn ? "Today" : "Hôm nay"}</span>
          <span className="hidden sm:inline">{isEn ? "Today For You" : "Cho bạn hôm nay"}</span>
        </button>

        <button
          onClick={() => setSubTab('programs')}
          className={cn(
            "flex-1 py-2 px-1 sm:px-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-tight sm:tracking-normal transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap min-w-0",
            subTab === 'programs'
              ? "bg-teal-600 text-force-white shadow-sm shadow-teal-600/25"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="sm:hidden truncate">{isEn ? "Programs" : "Giáo trình"}</span>
          <span className="hidden sm:inline">{isEn ? "Therapy Programs" : "Giáo trình Trị liệu"}</span>
        </button>

        <button
          onClick={() => setSubTab('history')}
          className={cn(
            "flex-1 py-2 px-1 sm:px-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-tight sm:tracking-normal transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap min-w-0",
            subTab === 'history'
              ? "bg-teal-600 text-force-white shadow-sm shadow-teal-600/25"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span className="sm:hidden truncate">{isEn ? "History" : "Lịch sử"}</span>
          <span className="hidden sm:inline">{isEn ? "Workout History" : "Lịch sử luyện tập"}</span>
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
                {isEn ? "TODAY'S RECOMMENDATION:" : "LỜI KHUYÊN CHO HÔM NAY:"}
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-100">
                <img 
                  src={featuredExercise.image} 
                  alt={featuredExercise.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-105 contrast-[1.02]" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent flex flex-col justify-between p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-wider bg-teal-600 text-force-white shadow-sm flex items-center gap-1 shrink-0">
                      🏷️ {featuredExercise.tag}
                    </span>
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-semibold bg-white/95 backdrop-blur-md text-slate-800 border border-slate-200/90 shadow-2xs shrink-0">
                      {isEn ? "Level: " : "Mức độ: "}{featuredExercise.level}
                    </span>
                  </div>

                  <div className="bg-white/95 backdrop-blur-md rounded-xl py-1.5 px-2.5 sm:py-2 sm:px-3 border border-white/90 shadow-md text-center max-w-[92%] sm:max-w-[85%] mx-auto">
                    <h3 className="font-serif text-[11px] sm:text-xs font-bold tracking-tight text-slate-900 leading-snug text-center">
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
                <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2 pt-1 text-[11px] sm:text-xs text-slate-700 font-medium overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 sm:px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span><strong>{featuredExercise.duration} {isEn ? "min" : "phút"}</strong></span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 sm:px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap">
                    <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span><strong>{featuredExercise.kcal} kcal</strong></span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 sm:px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>{isEn ? "Level: " : "Mức độ: "}{featuredExercise.level}</strong></span>
                  </div>
                </div>

                {/* Clear prominent CTA button */}
                <button
                  onClick={() => startExercise(featuredExercise)}
                  className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-force-white font-bold text-xs uppercase tracking-widest shadow-md shadow-teal-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{isEn ? "Start Workout Now" : "Bắt đầu luyện tập ngay"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* B. Danh sách Luyện tập theo Mục tiêu & Filter Chips */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {isEn ? "Targeted Workout Directory" : "Danh sách Luyện tập theo Mục tiêu"}
              </h3>
              <span className="text-[11px] text-slate-500">
                {filteredExercises.length} {isEn ? "exercises" : "bài tập"}
              </span>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: isEn ? 'All' : 'Tất cả' },
                { id: 'cotsong', label: isEn ? 'Spine' : 'Cột sống' },
                { id: 'timmach', label: isEn ? 'Cardio' : 'Tim mạch' },
                { id: 'giamstress', label: isEn ? 'Stress Relief' : 'Giảm stress' },
                { id: 'dotcalo', label: isEn ? 'Calorie Burn' : 'Đốt calo' },
                { id: 'thothieng', label: isEn ? 'Breath & Zen' : 'Thở & Thiền' },
              ].map((chip, idx) => (
                <button
                  key={`chip-${chip.id}-${idx}`}
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
              {filteredExercises.map((ex, idx) => {
                const isHighlighted = highlightedExerciseId === ex.id;
                return (
                  <div
                    key={`ex-${ex.id}-${idx}`}
                    id={`exercise-${ex.id}`}
                    className={cn(
                      "bg-white rounded-2xl border p-4 space-y-3 transition-all flex flex-col justify-between",
                      isHighlighted
                        ? "border-teal-500 ring-2 ring-teal-500/30 shadow-lg shadow-teal-500/10 bg-teal-50/15"
                        : "border-slate-200 shadow-xs hover:border-teal-300 hover:shadow-md"
                    )}
                  >
                    <div className="flex items-start gap-3.5">
                      <img 
                        src={ex.image} 
                        alt={ex.title} 
                        className="w-20 h-20 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
                            {ex.tag}
                          </span>
                          {isHighlighted && (
                            <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold bg-teal-600 text-white uppercase tracking-wider animate-pulse">
                              {isEn ? "Linked" : "Đang xem"}
                            </span>
                          )}
                        </div>
                        <h4 className="font-serif text-[13.5px] sm:text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                          {ex.title}
                        </h4>
                        <p className="text-[10.5px] text-slate-500 line-clamp-2">
                          {ex.description}
                        </p>
                      </div>
                    </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 text-slate-500 text-[11px] font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-teal-600" />
                          {ex.duration} {isEn ? "min" : "phút"}
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
                        <span>{isEn ? "Start" : "Tập ngay"}</span>
                      </button>
                    </div>

                    {/* Associated Soundscape / Music Pill */}
                    {(() => {
                      const matchedTrack = getTrackForExercise(ex.id, ex.category);
                      return (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50/70 border border-teal-200/60 text-[10.5px] text-teal-800 font-medium">
                          <Music className="w-3 h-3 text-teal-600 shrink-0" />
                          <span className="truncate">
                            <strong className="font-semibold">{isEn ? "Music: " : "Nhạc kèm theo: "}</strong>
                            {matchedTrack.name}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
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
              {isEn ? "Multi-Week Therapy Roadmap" : "Lộ trình Trị liệu Đa Tuần"}
            </span>
            <span className="text-xs text-slate-500">
              {isEn ? "Guided routines with milestone checks" : "Có hướng dẫn & kiểm tra tiến độ"}
            </span>
          </div>

          <div className="space-y-4">
            {THERAPY_PROGRAMS.map((prog, idx) => (
              <div 
                key={`prog-${prog.id}-${idx}`}
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
                    {isEn ? "Practice" : "Thực hành"}
                  </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{isEn ? "Progress: " : "Tiến độ: "}<strong>{prog.completedSessions} / {prog.totalSessions} {isEn ? "sessions" : "buổi"}</strong></span>
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
                {isEn ? "Total Time" : "Tổng thời gian"}
              </span>
              <span className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
                {totalStats.totalMinutes}
              </span>
              <span className="text-[10px] text-teal-600 font-medium block">{isEn ? "minutes" : "phút tập"}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {isEn ? "Burned" : "Đốt năng lượng"}
              </span>
              <span className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
                {totalStats.totalKcal}
              </span>
              <span className="text-[10px] text-rose-500 font-medium block">kcal</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-1 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {isEn ? "Completed" : "Buổi hoàn thành"}
              </span>
              <span className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
                {totalStats.sessionCount}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium block">{isEn ? "sessions" : "buổi tập"}</span>
            </div>
          </div>

          {/* History List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider px-1">
              {isEn ? "Completed Workout Sessions Log" : "Nhật ký các buổi tập đã hoàn tất"}
            </h4>
            <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              {workoutHistory.map((item, idx) => (
                <div key={`history-${item.id || 'sess'}-${idx}`} className="p-4 flex items-center justify-between gap-3 text-xs">
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
                    <span className="font-bold text-teal-700 block">{item.duration} {isEn ? "min" : "phút"}</span>
                    <span className="text-[10px] text-rose-500 font-semibold">{item.kcal} kcal</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACTIVE WORKOUT MODE MODAL (Step Countdown, Pose Guide & Audio Chimes)     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeExercise && (
          <ActiveWorkoutModal
            exercise={activeExercise}
            onClose={() => setActiveExercise(null)}
            onComplete={handleWorkoutComplete}
            isEn={isEn}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
