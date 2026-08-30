import { 
  Activity, 
  Search, 
  ChevronRight, 
  Heart, 
  Wind, 
  Droplets,
  Calendar,
  Sparkles,
  PlusCircle,
  Pill,
  BookOpen,
  User,
  Clock,
  X,
  Bell,
  Check,
  Scale,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import VitalsEntryModal from '../VitalsEntryModal';
import MedicationReminderModal, { getReminderCategoryInfo, ReminderCategory } from '../MedicationReminderModal';
import BmiCalculatorCard from '../BmiCalculatorCard';
import HealthTrendsChartCard from '../HealthTrendsChartCard';
import HealthReportExportModal from '../HealthReportExportModal';
import { collection, getDocs, limit, query, where, orderBy, setDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';

interface HomeViewProps {
  setActiveView: (view: any) => void;
}

export default function HomeView({ setActiveView }: HomeViewProps) {
  const { user, profile } = useAuth();
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [waterCups, setWaterCups] = useState<number>(0);
  const [waterGoal] = useState<number>(8); // 8 cups = 2L
  const [updatingWater, setUpdatingWater] = useState(false);

  // Hydration states
  const [waterReminderEnabled, setWaterReminderEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('waterReminderEnabled');
      return saved ? saved === 'true' : false;
    }
    return false;
  });

  const [waterReminderInterval, setWaterReminderInterval] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('waterReminderInterval');
      return saved ? parseFloat(saved) : 60; // default 60 minutes
    }
    return 60;
  });

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showWaterToast, setShowWaterToast] = useState<boolean>(false);

  // Close modals on back gesture
  useEffect(() => {
    const handleBackModal = (e: Event) => {
      if (isVitalsModalOpen) {
        e.preventDefault();
        setIsVitalsModalOpen(false);
      } else if (isMedicationModalOpen) {
        e.preventDefault();
        setIsMedicationModalOpen(false);
      } else if (isReportModalOpen) {
        e.preventDefault();
        setIsReportModalOpen(false);
      }
    };
    window.addEventListener('app-back-press', handleBackModal);
    return () => window.removeEventListener('app-back-press', handleBackModal);
  }, [isVitalsModalOpen, isMedicationModalOpen, isReportModalOpen]);

  const playWaterChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
      
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (error) {
      console.error("Web Audio API chime blocked or not supported:", error);
    }
  };

  const triggerWaterReminder = () => {
    playWaterChime();
    setShowWaterToast(true);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification('💧 Đến lúc uống nước giải độc!', {
            body: 'Hãy tiếp thêm tinh chất nước tinh khiết để duy trì năng lượng và sức sống nhé!',
            icon: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=128',
            requireInteraction: true
          });
        } catch (err) {
          console.error("Failed to trigger native notification:", err);
        }
      } else if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  const testReminderNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    triggerWaterReminder();
  };

  const handleUpdateWater = async (difference: number) => {
    if (!user) return;
    const newCups = Math.max(0, waterCups + difference);
    setWaterCups(newCups); // optimistically update local state

    setUpdatingWater(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, 'healthJournals'),
        where('userId', '==', user.uid)
      );
      const snap = await getDocs(q);

      let targetDocId: string | null = null;

      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.createdAt) {
          let entryDate: Date;
          try {
            entryDate = data.createdAt.toDate();
          } catch (e) {
            entryDate = new Date(data.createdAt);
          }
          if (entryDate >= today) {
            targetDocId = docSnap.id;
          }
        }
      });

      if (targetDocId) {
        await setDoc(doc(db, 'healthJournals', targetDocId), {
          water: newCups,
          updatedAt: new Date()
        }, { merge: true });
      } else {
        await setDoc(doc(collection(db, 'healthJournals')), {
          userId: user.uid,
          mood: 'Bình thường',
          energy: 'Bình thường',
          sleep: 7,
          water: newCups,
          notes: 'Ghi chép lượng nước uống hàng ngày từ màn hình chính.',
          createdAt: new Date()
        });
      }
    } catch (err) {
      console.error("Error updating water intake:", err);
      setWaterCups(waterCups); // revert display state
    } finally {
      setUpdatingWater(false);
    }
  };

  // Sync settings when changed
  useEffect(() => {
    if (user) {
      localStorage.setItem(`waterReminderEnabled_${user.uid}`, String(waterReminderEnabled));
      localStorage.setItem('waterReminderEnabled', String(waterReminderEnabled));
    }
  }, [waterReminderEnabled, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`waterReminderInterval_${user.uid}`, String(waterReminderInterval));
      localStorage.setItem('waterReminderInterval', String(waterReminderInterval));
    }
  }, [waterReminderInterval, user]);

  // Load configuration based on logged-in user
  useEffect(() => {
    if (user) {
      const savedEnabled = localStorage.getItem(`waterReminderEnabled_${user.uid}`);
      setWaterReminderEnabled(savedEnabled ? savedEnabled === 'true' : false);
      const savedInterval = localStorage.getItem(`waterReminderInterval_${user.uid}`);
      setWaterReminderInterval(savedInterval ? parseFloat(savedInterval) : 60);
    }
  }, [user]);

  // Set up remaining countdown time when Enable/Interval changes
  useEffect(() => {
    if (waterReminderEnabled) {
      setTimeLeft(Math.round(waterReminderInterval * 60));
    } else {
      setTimeLeft(0);
    }
  }, [waterReminderEnabled, waterReminderInterval]);

  // Countdown timer thread
  useEffect(() => {
    if (!waterReminderEnabled) return;
    
    const intervalId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          triggerWaterReminder();
          return Math.round(waterReminderInterval * 60);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [waterReminderEnabled, waterReminderInterval]);

  const intervalOptions = [
    { value: 0.25, label: '15 giây (Thử nghiệm)' },
    { value: 30, label: '30 phút' },
    { value: 60, label: '1 giờ' },
    { value: 120, label: '2 giờ' },
    { value: 180, label: '3 giờ' }
  ];

  useEffect(() => {
    const fetchTodayWater = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'healthJournals'),
          where('userId', '==', user.uid)
        );
        const snap = await getDocs(q);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let totalWaterToday = 0;
        let hasTodayEntry = false;

        snap.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.createdAt) {
            let entryDate: Date;
            try {
              entryDate = data.createdAt.toDate();
            } catch (e) {
              entryDate = new Date(data.createdAt);
            }
            
            if (entryDate >= today) {
              totalWaterToday += (data.water || 0);
              hasTodayEntry = true;
            }
          }
        });

        if (hasTodayEntry) {
          setWaterCups(totalWaterToday);
        } else {
          setWaterCups(0);
        }
      } catch (err) {
        console.error("Error fetching water data:", err);
      }
    };

    fetchTodayWater();
  }, [user]);

  const [reminders, setReminders] = useState<any[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(false);

  const fetchReminders = async () => {
    if (!user) return;
    setLoadingReminders(true);
    try {
      const q = query(
        collection(db, 'medicationReminders'),
        where('userId', '==', user.uid)
      );
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        let cat = data.category as ReminderCategory | undefined;
        if (!cat) {
          cat = getReminderCategoryInfo({ medName: data.medName }).id;
        }
        list.push({
          id: docSnap.id,
          category: cat,
          medName: data.medName || '',
          dosage: data.dosage || '',
          time: data.time || '08:00',
          notes: data.notes || '',
          enabled: data.enabled ?? true,
        });
      });
      // Sort by time
      list.sort((a, b) => a.time.localeCompare(b.time));
      setReminders(list);
    } catch (err) {
      console.error("Error fetching reminders:", err);
    } finally {
      setLoadingReminders(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [user]);

  const handleToggleReminder = async (item: any) => {
    try {
      const nextEnabled = !item.enabled;
      setReminders(prev => prev.map(r => r.id === item.id ? { ...r, enabled: nextEnabled } : r));
      await setDoc(doc(db, 'medicationReminders', item.id), {
        enabled: nextEnabled,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error("Error toggling reminder:", error);
      setReminders(prev => prev.map(r => r.id === item.id ? { ...r, enabled: item.enabled } : r));
    }
  };


  return (
    <div className="p-6 space-y-8">
      {/* In-app Hydration Toast Alert */}
      <AnimatePresence>
        {showWaterToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="fixed top-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-50 bg-slate-950/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 shadow-[0_0_25px_rgba(6,182,212,0.25)] flex gap-4 text-white"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 flex-shrink-0 animate-bounce">
              <Droplets className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 space-y-1 text-left">
              <h4 className="text-[13px] font-bold text-white uppercase tracking-wider">
                Đã đến giờ uống nước!
              </h4>
              <p className="text-xs text-text-dim leading-relaxed font-light">
                Đã đến chu kỳ nhắc nhở. Hãy tiếp thêm tinh chất nước tinh khiết để bồi bổ tế bào cơ thể nhé!
              </p>
              <div className="flex gap-2 pt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateWater(1);
                    setShowWaterToast(false);
                  }}
                  className="bg-cyan-500 hover:bg-cyan-400 text-bg font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-lg shadow-cyan-500/20"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Uống ngay 1 cốc (+250ml)
                </button>
                <button
                  type="button"
                  onClick={() => setShowWaterToast(false)}
                  className="bg-white/5 hover:bg-white/10 border border-white/5 text-text-dim hover:text-white font-bold text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all"
                >
                  Bỏ qua
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <VitalsEntryModal 
        isOpen={isVitalsModalOpen} 
        onClose={() => setIsVitalsModalOpen(false)} 
      />
      <MedicationReminderModal
        isOpen={isMedicationModalOpen}
        onClose={() => {
          setIsMedicationModalOpen(false);
          fetchReminders();
        }}
      />
      <HealthReportExportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Welcome Section & Quick Report Export Header */}
      <section className="flex items-center justify-between gap-3">
        <div className="space-y-0.5 min-w-0 flex-1">
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 truncate leading-tight">
            Chào buổi sáng, {(() => {
              if (!profile?.fullName || profile.fullName.includes('Người dùng') || profile.fullName === 'Người') {
                return 'Bạn';
              }
              const parts = profile.fullName.trim().split(' ');
              return parts[parts.length - 1] || 'Bạn';
            })()}.
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm truncate">Hệ thống đã sẵn sàng cho ngày mới của bạn.</p>
        </div>
        <button
          id="btn-home-export-report"
          type="button"
          onClick={() => setIsReportModalOpen(true)}
          className="flex-shrink-0 flex items-center gap-2 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-white hover:bg-teal-50 text-teal-800 border border-slate-200 hover:border-teal-300 transition-all active:scale-95 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs group"
          title="Xuất báo cáo sức khỏe PDF/Hình ảnh"
        >
          <FileDown className="w-4 h-4 text-teal-600 group-hover:animate-bounce" />
          <span className="hidden sm:inline">Xuất báo cáo</span>
        </button>
      </section>

      {/* Health Today Card */}
      <section>
        <div className="bg-white rounded-3xl p-6 text-slate-900 shadow-xl border border-slate-200 relative overflow-hidden group">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <span className="bg-teal-50 px-3 py-1 rounded-full text-[10px] font-bold text-teal-700 uppercase tracking-wider border border-teal-200 shadow-xs">
                Sức khỏe hiện tại
              </span>
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="flex items-center gap-3.5 sm:gap-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 transition-colors">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 text-teal-600 flex-shrink-0 shadow-xs">
                  <Heart className="w-6 h-6 text-teal-600 animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Nhịp tim</p>
                  <p className="text-xl font-bold text-slate-900">72 <span className="text-xs text-slate-600 font-semibold">BPM</span></p>
                </div>
              </div>
              <div className="flex items-center gap-3.5 sm:gap-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 transition-colors">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 text-cyan-600 flex-shrink-0 shadow-xs">
                  <Droplets className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Cấp nước</p>
                  <p className="text-xl font-bold text-slate-900">{(waterCups * 0.25).toFixed(1)} <span className="text-xs text-slate-600 font-semibold">/ 2L</span></p>
                </div>
              </div>
            </div>

            {/* Visual water progress bar component */}
            <div id="home-water-meter-container" className="space-y-2.5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-slate-600">Mục tiêu cấp nước hàng ngày</span>
                <span className="text-teal-700 font-mono text-[11px] font-bold">{waterGoal > 0 ? Math.round((waterCups / waterGoal) * 100) : 0}% ({waterCups}/{waterGoal} cốc)</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                <motion.div 
                  id="home-water-meter-bar"
                  className="h-full bg-teal-500 rounded-full shadow-xs"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(waterGoal > 0 ? Math.round((waterCups / waterGoal) * 100) : 0, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed italic font-light">
                {(waterGoal > 0 ? Math.round((waterCups / waterGoal) * 100) : 0) >= 100 
                  ? "🎉 Thật xuất sắc! Bạn đã đạt mục tiêu cấp nước lý tưởng cho hôm nay!" 
                  : waterCups > 0 
                  ? `💧 Bạn đã uống được ${(waterCups * 0.25).toFixed(2)}L nước. Hãy bổ sung thêm ${(Math.max(0, waterGoal - waterCups) * 0.25).toFixed(2)}L nữa nhé.`
                  : "💡 Chưa ghi nhận cốc nước nào hôm nay. Hãy nạp nhanh cốc nước đầu tiên dưới đây!"}
              </p>

              {/* Interactive Quick Add Controls for Water */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-700 uppercase tracking-widest font-bold">Ghi nhận nhanh:</span>
                  <div className="flex items-center bg-slate-50 border border-slate-200 p-1 rounded-xl gap-2">
                    <button
                      type="button"
                      disabled={updatingWater}
                      onClick={() => handleUpdateWater(-1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white active:scale-95 text-slate-600 hover:text-slate-900 rounded-lg transition-all font-bold cursor-pointer font-mono disabled:opacity-45"
                      title="Bớt 1 cốc nước (250ml)"
                    >
                      -
                    </button>
                    <span className="text-xs px-1 font-bold font-mono text-slate-900">{waterCups}</span>
                    <button
                      type="button"
                      disabled={updatingWater}
                      onClick={() => handleUpdateWater(1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white active:scale-95 text-teal-700 hover:text-teal-800 rounded-lg transition-all font-bold cursor-pointer font-mono disabled:opacity-45"
                      title="Thêm 1 cốc nước (250ml)"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 italic">cốc (~{waterCups * 250}ml/ly)</span>
                </div>
                {updatingWater && (
                  <span className="text-[9px] text-teal-600 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                    Đang đồng bộ...
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button 
                onClick={() => setActiveView('health')}
                className="bg-white border border-slate-200 text-slate-800 font-bold py-3.5 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all uppercase tracking-widest text-[11px] cursor-pointer text-center shadow-xs"
              >
                Chi tiết
              </button>
              <button 
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="bg-white border border-teal-200 text-teal-700 hover:bg-teal-50 font-bold py-3.5 rounded-xl active:scale-[0.98] transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileDown className="w-3.5 h-3.5" />
                Xuất Báo Cáo
              </button>
              <button 
                onClick={() => setIsVitalsModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Ghi sinh hiệu
              </button>
            </div>
          </div>
          {/* Abstract decoration */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-teal-50 rounded-full blur-3xl pointer-events-none"></div>
        </div>
      </section>


      {/* Body Mass Index (BMI) & Personal Physique Calculator */}
      <BmiCalculatorCard />

      {/* Heart Rate & Health Activity Trends Chart (Recharts) */}
      <HealthTrendsChartCard 
        onOpenVitalsModal={() => setIsVitalsModalOpen(true)}
        onNavigateToHealth={() => setActiveView('health')}
      />

      {/* Periodic Hydration Reminders Hub */}
      <section className="bg-panel rounded-3xl p-6 border border-border mt-6 space-y-4 shadow-2xl" id="home-hydration-reminder-panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white leading-tight">Nhắc nhở uống nước định kỳ</h3>
              <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest mt-0.5">Bảo vệ sức khỏe & Đào thải độc tố</p>
            </div>
          </div>
          
          {/* Main on/off toggle */}
          <button
            id="toggle-water-reminder-switch"
            type="button"
            onClick={() => setWaterReminderEnabled(!waterReminderEnabled)}
            className={cn(
              "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-cyan-500/30",
              waterReminderEnabled ? "bg-cyan-500" : "bg-white/10"
            )}
          >
            <span className="sr-only">Bật nhắc nhở nước</span>
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out",
                waterReminderEnabled ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {/* Configurations block */}
        <div className="space-y-4 pt-2 border-t border-white/[0.03]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Interval Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Khoảng thời gian nhắc nhở</label>
              <div className="flex flex-wrap gap-2">
                {intervalOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setWaterReminderInterval(opt.value)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all active:scale-95",
                      waterReminderInterval === opt.value
                        ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30"
                        : "bg-white/[0.01] border-white/5 text-text-dim hover:text-white"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live countdown & test block */}
            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">Tiến trình đếm ngược</span>
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex-shrink-0",
                  waterReminderEnabled 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse" 
                    : "bg-white/5 text-text-dim border-transparent"
                )}>
                  {waterReminderEnabled ? "Đang chạy" : "Tạm dừng"}
                </span>
              </div>
              
              <div className="flex items-baseline gap-2">
                {waterReminderEnabled ? (
                  <>
                    <span className="text-2xl font-mono text-cyan-400 font-bold leading-none">
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-text-dim">thời gian còn lại</span>
                  </>
                ) : (
                  <span className="text-xs italic text-text-dim font-light">Chưa kích hoạt chế độ tự động nhắc nhở định kỳ.</span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={testReminderNotification}
                  className="bg-white/5 hover:bg-white/10 text-text-dim hover:text-white py-2 px-3 rounded-lg border border-white/5 hover:border-white/10 active:scale-95 transition-all text-[9.5px] uppercase font-bold tracking-wider cursor-pointer"
                  title="Kiểm tra hệ thống âm thanh & thông báo đẩy"
                >
                  Gửi thông báo thử
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Medication & Health Metric Reminders Section - Unified Card */}
      <section id="home-medication-reminders-section">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-5">
          {/* Card Header with Title, Count Badge and Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-serif text-xl font-bold text-slate-900">
                Lịch nhắc uống thuốc & Đo chỉ số hôm nay
              </h3>
              <span className="bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                {reminders.filter(r => r.enabled).length} Đang bật
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMedicationModalOpen(true)}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-2 rounded-xl uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-teal-600" />
                <span>Quản lý & Thêm nhắc nhở</span>
                <ChevronRight className="w-3.5 h-3.5 text-teal-600" />
              </button>
            </div>
          </div>

          {/* Reminder List & States */}
          <div className="space-y-3">
            {loadingReminders ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500 font-medium">Đang tải lịch nhắc nhở...</p>
              </div>
            ) : reminders.length === 0 ? (
              <div className="text-center py-8 px-4 space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center border border-teal-100 mx-auto text-teal-600">
                  <Bell className="w-6 h-6 animate-pulse" />
                </div>
                <div className="max-w-md mx-auto">
                  <p className="text-sm font-bold text-slate-800">Chưa có lịch nhắc nhở nào</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Thiết lập lịch nhắc đo chỉ số tiểu đường, huyết áp, nhịp tim hoặc uống thuốc để bảo vệ sức khỏe đúng giờ mỗi ngày.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMedicationModalOpen(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all uppercase tracking-wider shadow-sm cursor-pointer"
                >
                  + Cài đặt lịch nhắc mới
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {reminders
                  .slice()
                  .sort((a, b) => {
                    const catA = a.category || getReminderCategoryInfo(a).id;
                    const catB = b.category || getReminderCategoryInfo(b).id;
                    const isMedA = catA === 'medication';
                    const isMedB = catB === 'medication';
                    if (isMedA && !isMedB) return -1;
                    if (!isMedA && isMedB) return 1;
                    return a.time.localeCompare(b.time);
                  })
                  .map((reminder) => {
                    const catConfig = getReminderCategoryInfo(reminder);
                    const IconComp = catConfig.icon;
                    const isMetric = catConfig.id !== 'medication';

                    return (
                      <div 
                        key={reminder.id}
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all duration-200 gap-3 group",
                          reminder.enabled 
                            ? "bg-slate-50/70 border-slate-200 hover:border-teal-300 hover:shadow-xs" 
                            : "bg-slate-50/30 border-slate-200/50 opacity-60"
                        )}
                      >
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                          {/* Time indicator */}
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex flex-col items-center justify-center border font-mono shadow-xs flex-shrink-0",
                            reminder.enabled 
                              ? `${catConfig.bgLight} ${catConfig.borderClass} ${catConfig.colorClass}` 
                              : "bg-slate-100 border-slate-200 text-slate-400"
                          )}>
                            <IconComp className="w-4 h-4 mb-0.5" />
                            <span className="text-xs font-bold leading-none">{reminder.time}</span>
                          </div>

                          {/* Reminder Details */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                                catConfig.tagClass
                              )}>
                                {catConfig.name}
                              </span>
                              <span className={cn(
                                "text-sm font-bold text-slate-900",
                                !reminder.enabled && "line-through text-slate-400"
                              )}>
                                {reminder.medName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
                              {reminder.dosage && (
                                <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-mono text-[11px] text-slate-800 font-medium">
                                  {reminder.dosage}
                                </span>
                              )}
                              {reminder.notes && (
                                <span className="text-[11px] text-slate-500 italic truncate max-w-sm">
                                  • {reminder.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 justify-end flex-shrink-0">
                          {/* If it is a metric, provide direct "Ghi chỉ số" button */}
                          {isMetric && (
                            <button
                              type="button"
                              onClick={() => setIsVitalsModalOpen(true)}
                              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="Ghi nhận số đo sinh hiệu ngay"
                            >
                              <Activity className="w-3.5 h-3.5 text-teal-600" />
                              <span className="hidden sm:inline">Ghi số đo</span>
                            </button>
                          )}

                          {/* Toggle button */}
                          <button
                            id={`toggle-reminder-${reminder.id}`}
                            onClick={() => handleToggleReminder(reminder)}
                            className={cn(
                              "px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                              reminder.enabled 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                            )}
                            title={reminder.enabled ? "Tắt nhắc nhở này" : "Bật lại nhắc nhở này"}
                          >
                            {reminder.enabled ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Đang bật</span>
                              </>
                            ) : (
                              <>
                                <Bell className="w-3.5 h-3.5 text-slate-400" />
                                <span>Đã tắt</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
