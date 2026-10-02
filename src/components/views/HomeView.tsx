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
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import VitalsEntryModal from '../VitalsEntryModal';
import MedicationReminderModal, { getReminderCategoryInfo, ReminderCategory } from '../MedicationReminderModal';
import BmiCalculatorCard from '../BmiCalculatorCard';
import HealthTrendsChartCard from '../HealthTrendsChartCard';
import HealthReportExportModal from '../HealthReportExportModal';
import { collection, getDocs, limit, query, where, orderBy, setDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { reminderService } from '../../services/reminderService';

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
      const val = saved ? parseFloat(saved) : 60; // default 60 minutes
      return val === 30 ? 60 : val;
    }
    return 60;
  });

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showWaterToast, setShowWaterToast] = useState<boolean>(false);

  // Vietnam GMT+7 Time Greeting (Chào buổi sáng, Chào buổi chiều, Chào buổi tối)
  const greetingData = useMemo(() => {
    try {
      const now = new Date();
      // Format time in Asia/Ho_Chi_Minh timezone (GMT+7)
      const vnHourStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false,
        hour: 'numeric'
      });
      const hour = parseInt(vnHourStr, 10);
      const vnHour = isNaN(hour) ? (now.getUTCHours() + 7) % 24 : hour;

      if (vnHour >= 5 && vnHour < 12) {
        return {
          greeting: 'Chào buổi sáng',
          subtitle: 'Chúc bạn một ngày mới an lành, tràn đầy năng lượng.'
        };
      } else if (vnHour >= 12 && vnHour < 18) {
        return {
          greeting: 'Chào buổi chiều',
          subtitle: 'Duy trì năng lượng và chăm sóc sức khỏe thật tốt nhé.'
        };
      } else {
        return {
          greeting: 'Chào buổi tối',
          subtitle: 'Thư giãn tinh thần và dưỡng sinh giấc ngủ an lành.'
        };
      }
    } catch {
      const now = new Date();
      const vnHour = (now.getUTCHours() + 7) % 24;
      if (vnHour >= 5 && vnHour < 12) {
        return {
          greeting: 'Chào buổi sáng',
          subtitle: 'Chúc bạn một ngày mới an lành, tràn đầy năng lượng.'
        };
      } else if (vnHour >= 12 && vnHour < 18) {
        return {
          greeting: 'Chào buổi chiều',
          subtitle: 'Duy trì năng lượng và chăm sóc sức khỏe thật tốt nhé.'
        };
      } else {
        return {
          greeting: 'Chào buổi tối',
          subtitle: 'Thư giãn tinh thần và dưỡng sinh giấc ngủ an lành.'
        };
      }
    }
  }, []);

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

  // Listen for root menu reset to return to top of Home view
  useEffect(() => {
    const handleResetToRoot = (e: any) => {
      if (e.detail?.view === 'home') {
        setIsVitalsModalOpen(false);
        setIsMedicationModalOpen(false);
        setIsReportModalOpen(false);
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        document.getElementById('top-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    window.addEventListener('app-reset-to-root', handleResetToRoot);
    return () => window.removeEventListener('app-reset-to-root', handleResetToRoot);
  }, []);

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

  const testReminderNotification = async () => {
    await reminderService.requestNotificationPermission();
    reminderService.showNotification(
      '💧 Đã đến giờ uống nước!',
      'Hãy tiếp thêm tinh chất nước tinh khiết để bồi bổ tế bào và đào thải độc tố cơ thể nhé!',
      'water-alert-test'
    );
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
      const val = savedInterval ? parseFloat(savedInterval) : 60;
      setWaterReminderInterval(val === 30 ? 60 : val);
    }
  }, [user]);

  // Set up remaining countdown time when Enable/Interval changes
  useEffect(() => {
    if (waterReminderEnabled) {
      setTimeLeft(Math.round(waterReminderInterval * 60));
    } else {
      setTimeLeft(0);
    }
    // Sync to background reminder service for mobile/tablet background notifications
    reminderService.updateWaterConfig(waterReminderEnabled, waterReminderInterval);
  }, [waterReminderEnabled, waterReminderInterval]);

  // Listen to background reminder event & notification modal updates
  useEffect(() => {
    const handleHealthReminder = (e: any) => {
      if (e.detail?.type === 'water') {
        setShowWaterToast(true);
      }
    };
    const handleWaterUpdated = (e: any) => {
      if (typeof e.detail?.enabled === 'boolean') {
        setWaterReminderEnabled(e.detail.enabled);
      }
      if (typeof e.detail?.interval === 'number') {
        setWaterReminderInterval(e.detail.interval);
      }
    };
    window.addEventListener('app-health-reminder', handleHealthReminder);
    window.addEventListener('water-reminder-updated', handleWaterUpdated);
    return () => {
      window.removeEventListener('app-health-reminder', handleHealthReminder);
      window.removeEventListener('water-reminder-updated', handleWaterUpdated);
    };
  }, []);

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
    { value: 0.25, label: 'TEST' },
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
    <div className="p-3 sm:p-5 space-y-3.5 sm:space-y-4">
      {/* In-app Hydration Toast Alert */}
      <AnimatePresence>
        {showWaterToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="water-toast-alert fixed top-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-50 bg-teal-600 backdrop-blur-xl border border-teal-400/50 rounded-2xl p-4 shadow-[0_10px_30px_rgba(13,148,136,0.35)] flex gap-4 text-white"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-800/80 flex items-center justify-center text-white border border-teal-400/40 flex-shrink-0 shadow-xs animate-bounce">
              <Droplets className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="flex-1 space-y-1 text-left">
              <h4 className="text-[13px] font-bold text-white uppercase tracking-wider">
                Đã đến giờ uống nước!
              </h4>
              <p className="text-xs text-white leading-relaxed font-normal opacity-95">
                Đã đến chu kỳ nhắc nhở. Hãy tiếp thêm tinh chất nước tinh khiết để bồi bổ tế bào cơ thể nhé!
              </p>
              <div className="flex gap-2 pt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateWater(1);
                    setShowWaterToast(false);
                  }}
                  className="btn-water-action bg-teal-800 hover:bg-teal-900 text-white font-bold text-[9.5px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-md border border-teal-400/40"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-white" />
                  Uống ngay 1 cốc (+250ml)
                </button>
                <button
                  type="button"
                  onClick={() => setShowWaterToast(false)}
                  className="btn-water-dismiss bg-teal-900/40 hover:bg-teal-900/70 border border-teal-300/30 text-white font-bold text-[9.5px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer"
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

      {/* Welcome Section */}
      <section className="space-y-0.5">
        <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 truncate leading-tight">
          {greetingData.greeting}, {(() => {
            if (!profile?.fullName || profile.fullName.includes('Người dùng') || profile.fullName === 'Người') {
              return 'Bạn';
            }
            const parts = profile.fullName.trim().split(' ');
            return parts[parts.length - 1] || 'Bạn';
          })()}.
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm truncate">{greetingData.subtitle}</p>
      </section>

      {/* Health Today Card */}
      <section>
        <div className="bg-white rounded-2xl text-slate-900 shadow-sm border border-slate-200 relative overflow-hidden group">
          {/* Card Header with medium-soft green background */}
          <div className="bg-teal-100/70 border-b border-teal-200/90 px-4 sm:px-5 py-3 flex items-center justify-between">
            <span className="bg-white/95 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-teal-800 uppercase tracking-wider border border-teal-200 shadow-xs">
              Sức khỏe hiện tại
            </span>
            <Calendar className="w-4 h-4 text-teal-700" />
          </div>

          <div className="p-4 sm:p-5 relative z-10 space-y-3.5 sm:space-y-4">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 bg-teal-50/70 border border-teal-200/80 rounded-xl p-3 transition-all shadow-xs hover:bg-teal-50">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-teal-200 text-teal-600 flex-shrink-0 shadow-xs">
                  <Heart className="w-5 h-5 text-teal-600 animate-pulse" />
                </div>
                <div>
                  <p className="text-[9.5px] text-teal-800 uppercase tracking-wider font-bold">Nhịp tim</p>
                  <p className="text-lg sm:text-xl font-black text-slate-900 leading-tight">72 <span className="text-[10px] text-slate-600 font-semibold">BPM</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 sm:gap-3 bg-cyan-50/70 border border-cyan-200/80 rounded-xl p-3 transition-all shadow-xs hover:bg-cyan-50">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-cyan-200 text-cyan-600 flex-shrink-0 shadow-xs">
                  <Droplets className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-[9.5px] text-cyan-800 uppercase tracking-wider font-bold">Cấp nước</p>
                  <p className="text-lg sm:text-xl font-black text-slate-900 leading-tight">{(waterCups * 0.25).toFixed(1)} <span className="text-[10px] text-slate-600 font-semibold">/ 2L</span></p>
                </div>
              </div>
            </div>

            {/* Visual water progress bar component */}
            <div id="home-water-meter-container" className="space-y-1.5 pt-2.5 border-t border-slate-100">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-slate-600">Mục tiêu cấp nước hàng ngày</span>
                <span className="text-teal-700 font-mono text-[10px] sm:text-[11px] font-bold">{waterGoal > 0 ? Math.round((waterCups / waterGoal) * 100) : 0}% ({waterCups}/{waterGoal} cốc)</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                <motion.div 
                  id="home-water-meter-bar"
                  className="h-full bg-teal-500 rounded-full shadow-xs"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(waterGoal > 0 ? Math.round((waterCups / waterGoal) * 100) : 0, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="text-[10px] text-slate-600 leading-normal italic font-light">
                {(waterGoal > 0 ? Math.round((waterCups / waterGoal) * 100) : 0) >= 100 
                  ? "🎉 Thật xuất sắc! Bạn đã đạt mục tiêu cấp nước lý tưởng cho hôm nay!" 
                  : waterCups > 0 
                  ? `💧 Bạn đã uống được ${(waterCups * 0.25).toFixed(2)}L nước. Hãy bổ sung thêm ${(Math.max(0, waterGoal - waterCups) * 0.25).toFixed(2)}L nữa nhé.`
                  : "💡 Chưa ghi nhận cốc nước nào hôm nay. Hãy nạp nhanh cốc nước đầu tiên dưới đây!"}
              </p>

              {/* Interactive Quick Add Controls for Water */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-[9.5px] text-slate-700 uppercase tracking-wider font-bold">Ghi nhận nhanh:</span>
                  <div className="flex items-center bg-slate-50 border border-slate-200 p-0.5 rounded-lg gap-1.5">
                    <button
                      type="button"
                      disabled={updatingWater}
                      onClick={() => handleUpdateWater(-1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-white active:scale-95 text-slate-600 hover:text-slate-900 rounded transition-all font-bold cursor-pointer font-mono disabled:opacity-45 text-xs"
                      title="Bớt 1 cốc nước (250ml)"
                    >
                      -
                    </button>
                    <span className="text-xs px-1 font-bold font-mono text-slate-900">{waterCups}</span>
                    <button
                      type="button"
                      disabled={updatingWater}
                      onClick={() => handleUpdateWater(1)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-white active:scale-95 text-teal-700 hover:text-teal-800 rounded transition-all font-bold cursor-pointer font-mono disabled:opacity-45 text-xs"
                      title="Thêm 1 cốc nước (250ml)"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[9.5px] text-slate-500 italic">cốc (~{waterCups * 250}ml/ly)</span>
                </div>
                {updatingWater && (
                  <span className="text-[9px] text-teal-600 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                    Đang đồng bộ...
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              <button 
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                title="Xuất Báo Cáo Sức Khỏe Chi Tiết"
                className="bg-white border border-slate-200 text-slate-800 font-bold py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all uppercase tracking-normal sm:tracking-wider text-[9.5px] sm:text-[11px] cursor-pointer text-center shadow-xs whitespace-nowrap overflow-hidden text-ellipsis"
              >
                Chi tiết
              </button>
              <button 
                type="button"
                onClick={() => setIsVitalsModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-xl shadow-xs active:scale-[0.98] transition-all uppercase tracking-normal sm:tracking-wider text-[9.5px] sm:text-[11px] flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap overflow-hidden"
              >
                <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Ghi sinh hiệu</span>
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
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-3.5 sm:mt-4" id="home-hydration-reminder-panel">
        {/* Header with medium-soft green background */}
        <div className="bg-teal-100/70 border-b border-teal-200/90 px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-200/60 flex items-center justify-center text-teal-700 border border-teal-300/80 shadow-xs">
              <Bell className="w-4 h-4 text-teal-700 animate-pulse" />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-tight">Nhắc nhở uống nước định kỳ</h3>
              <p className="text-[8.5px] sm:text-[9px] text-teal-800 font-bold uppercase tracking-wider mt-0.5">Bảo vệ sức khỏe & Đào thải độc tố</p>
            </div>
          </div>
          
          {/* Main on/off toggle */}
          <button
            id="toggle-water-reminder-switch"
            type="button"
            onClick={() => setWaterReminderEnabled(!waterReminderEnabled)}
            className={cn(
              "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-teal-500/30",
              waterReminderEnabled ? "bg-teal-600" : "bg-slate-200"
            )}
          >
            <span className="sr-only">Bật nhắc nhở nước</span>
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                waterReminderEnabled ? "translate-x-4" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {/* Configurations block inside Card Body */}
        <div className="p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* Interval Selection */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] font-bold text-slate-700 uppercase tracking-wider block">Khoảng thời gian nhắc nhở</label>
              <div className="flex flex-wrap gap-1.5">
                {intervalOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setWaterReminderInterval(opt.value);
                      if (opt.value === 0.25) {
                        testReminderNotification();
                      }
                    }}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-[9.5px] font-bold uppercase tracking-wider border cursor-pointer transition-all active:scale-95",
                      waterReminderInterval === opt.value
                        ? "bg-teal-700 text-white-pure border-teal-700 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live countdown block */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
              <span className="text-[9.5px] font-bold text-slate-700 uppercase tracking-wider block">
                Tiến trình đếm ngược
              </span>

              {waterReminderEnabled ? (
                <span className="text-xl sm:text-2xl font-mono text-teal-700 font-bold leading-none tracking-wider">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              ) : (
                <span className="text-xs italic text-slate-500 font-light">
                  Chưa kích hoạt
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Medication & Health Metric Reminders Section - Unified Card */}
      <section id="home-medication-reminders-section">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
          {/* Card Header with Title, Count Badge and Action Button */}
          <div className="bg-teal-100/70 border-b border-teal-200/90 px-4 sm:px-5 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900">
              Lịch nhắc uống thuốc & Đo chỉ số hôm nay
            </h3>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="bg-white/95 border border-teal-200 text-teal-800 text-[9.5px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs whitespace-nowrap">
                {reminders.filter(r => r.enabled).length} Đang bật
              </span>
              <button
                type="button"
                onClick={() => setIsMedicationModalOpen(true)}
                className="text-xs font-bold text-teal-800 hover:text-teal-900 bg-white/90 hover:bg-white border border-teal-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5 text-teal-700" />
                <span>Hiệu chỉnh</span>
                <ChevronRight className="w-3.5 h-3.5 text-teal-700" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-3 sm:space-y-3.5">

          {/* Reminder List & States */}
          <div className="space-y-2.5">
            {loadingReminders ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-2">
                <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500 font-medium">Đang tải lịch nhắc nhở...</p>
              </div>
            ) : reminders.length === 0 ? (
              <div className="text-center py-6 px-4 space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center border border-teal-100 mx-auto text-teal-600">
                  <Bell className="w-5 h-5 animate-pulse" />
                </div>
                <div className="max-w-md mx-auto">
                  <p className="text-sm font-bold text-slate-800">Chưa có lịch nhắc nhở nào</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Thiết lập lịch nhắc đo chỉ số tiểu đường, huyết áp, nhịp tim hoặc uống thuốc để bảo vệ sức khỏe đúng giờ mỗi ngày.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMedicationModalOpen(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all uppercase tracking-wider shadow-xs cursor-pointer"
                >
                  + Cài đặt lịch nhắc mới
                </button>
              </div>
            ) : (
              <div className="space-y-2">
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
                          "flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all duration-200 gap-2.5 group",
                          reminder.enabled 
                            ? "bg-slate-50/70 border-slate-200 hover:border-teal-300 hover:shadow-xs" 
                            : "bg-slate-50/30 border-slate-200/50 opacity-60"
                        )}
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                          {/* Time indicator */}
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex flex-col items-center justify-center border font-mono shadow-xs flex-shrink-0",
                            reminder.enabled 
                              ? `${catConfig.bgLight} ${catConfig.borderClass} ${catConfig.colorClass}` 
                              : "bg-slate-100 border-slate-200 text-slate-400"
                          )}>
                            <IconComp className="w-3.5 h-3.5 mb-0.5" />
                            <span className="text-[11px] font-bold leading-none">{reminder.time}</span>
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
      </div>
    </section>
    </div>
  );
}
