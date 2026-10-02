import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Bell, Droplets, Pill, Activity, Check, Plus, Trash2, 
  Clock, Volume2, VolumeX, Smartphone, AlertCircle, Sparkles, 
  ChevronRight, RefreshCw, Heart, ShieldCheck, CheckCircle2, Play
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { reminderService } from '../services/reminderService';
import { registerModal } from '../utils/modalManager';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMedicationDetailModal?: () => void;
}

interface MedicationItem {
  id: string;
  medName: string;
  dosage: string;
  time: string;
  notes?: string;
  enabled: boolean;
}

interface VitalsScheduleItem {
  id: string;
  title: string;
  time: string;
  category: 'blood_pressure' | 'glucose' | 'spo2' | 'heart';
  enabled: boolean;
}

const DEFAULT_VITALS_SCHEDULE: VitalsScheduleItem[] = [
  { id: 'bp-morning', title: 'Đo huyết áp & Nhịp tim buổi sáng', time: '07:00', category: 'blood_pressure', enabled: true },
  { id: 'glucose-morning', title: 'Đo đường huyết trước ăn sáng', time: '07:15', category: 'glucose', enabled: true },
  { id: 'bp-evening', title: 'Đo huyết áp trước khi đi ngủ', time: '21:00', category: 'blood_pressure', enabled: false },
  { id: 'spo2-afternoon', title: 'Kiểm tra SpO2 & Thân nhiệt', time: '16:00', category: 'spo2', enabled: false },
];

export default function NotificationSettingsModal({ 
  isOpen, 
  onClose,
  onOpenMedicationDetailModal 
}: NotificationSettingsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'water' | 'medication' | 'vitals'>('all');

  // Permission State
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  // Sound & Vibrate Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('appNotificationSound') !== 'false';
  });
  const [vibrateEnabled, setVibrateEnabled] = useState<boolean>(() => {
    return localStorage.getItem('appNotificationVibrate') !== 'false';
  });

  // Water Reminder State
  const [waterEnabled, setWaterEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('waterReminderEnabled');
    return saved === 'true';
  });
  const [waterInterval, setWaterInterval] = useState<number>(() => {
    const saved = localStorage.getItem('waterReminderInterval');
    return saved ? parseFloat(saved) : 60;
  });
  const [waterDailyGoal, setWaterDailyGoal] = useState<number>(() => {
    const saved = localStorage.getItem('waterDailyGoal');
    return saved ? parseInt(saved, 10) : 2000;
  });
  const [todayDrankAmount, setTodayDrankAmount] = useState<number>(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`waterDrank_${today}`);
    return saved ? parseInt(saved, 10) : 750;
  });
  const [waterCountdown, setWaterCountdown] = useState<string>('45:00');

  // Medication Reminders State
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [loadingMeds, setLoadingMeds] = useState(false);
  const [isAddingMed, setIsAddingMed] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('1 viên');
  const [newMedTime, setNewMedTime] = useState('08:00');
  const [newMedNotes, setNewMedNotes] = useState('Sau bữa ăn sáng');

  // Vitals Schedule State
  const [vitalsSchedules, setVitalsSchedules] = useState<VitalsScheduleItem[]>(() => {
    const saved = localStorage.getItem('vitalsReminderSchedules');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_VITALS_SCHEDULE;
      }
    }
    return DEFAULT_VITALS_SCHEDULE;
  });

  // Register in modal stack
  useEffect(() => {
    if (!isOpen) return;
    const unregister = registerModal('notification-settings-modal', onClose);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unregister();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, [isOpen]);

  // Sync Water Settings
  useEffect(() => {
    localStorage.setItem('waterReminderEnabled', String(waterEnabled));
    localStorage.setItem('waterReminderInterval', String(waterInterval));
    localStorage.setItem('waterDailyGoal', String(waterDailyGoal));
    if (user?.uid) {
      localStorage.setItem(`waterReminderEnabled_${user.uid}`, String(waterEnabled));
      localStorage.setItem(`waterReminderInterval_${user.uid}`, String(waterInterval));
    }
    reminderService.updateWaterConfig(waterEnabled, waterInterval);
    // Notify HomeView & other components
    window.dispatchEvent(new CustomEvent('water-reminder-updated', {
      detail: { enabled: waterEnabled, interval: waterInterval }
    }));
  }, [waterEnabled, waterInterval, waterDailyGoal, user]);

  // Sync Sound & Vibrate
  useEffect(() => {
    localStorage.setItem('appNotificationSound', String(soundEnabled));
    localStorage.setItem('appNotificationVibrate', String(vibrateEnabled));
  }, [soundEnabled, vibrateEnabled]);

  // Water countdown timer update
  useEffect(() => {
    if (!waterEnabled) {
      setWaterCountdown('Tạm dừng');
      return;
    }
    const updateCountdown = () => {
      const savedNext = localStorage.getItem('waterReminderNextTimestamp');
      if (savedNext) {
        const diffMs = parseInt(savedNext, 10) - Date.now();
        if (diffMs > 0) {
          const totalSec = Math.floor(diffMs / 1000);
          const mins = Math.floor(totalSec / 60);
          const secs = totalSec % 60;
          setWaterCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
        } else {
          setWaterCountdown('Đã đến giờ uống nước!');
        }
      } else {
        setWaterCountdown(`${Math.round(waterInterval)}:00`);
      }
    };
    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [waterEnabled, waterInterval]);

  // Fetch Medication Reminders from Firestore
  useEffect(() => {
    if (!isOpen) return;
    fetchMedications();
  }, [isOpen, user]);

  const fetchMedications = async () => {
    if (!user) {
      // Fallback local sample items if user is guest
      const localMeds = localStorage.getItem('guest_medication_reminders');
      if (localMeds) {
        try {
          setMedications(JSON.parse(localMeds));
          return;
        } catch {}
      }
      setMedications([
        { id: 'demo-1', medName: 'Thuốc Huyết Áp (Amlodipine 5mg)', dosage: '1 viên', time: '08:00', notes: 'Sau ăn sáng 15 phút', enabled: true },
        { id: 'demo-2', medName: 'Trà Thảo Mộc / Dược Liệu Dưỡng Tâm', dosage: '1 gói hãm ấm', time: '14:30', notes: 'Uống ấm giữa chiều', enabled: true },
        { id: 'demo-3', medName: 'Men Vi Sinh / Dưỡng Khí Can Thận', dosage: '1 viên', time: '20:30', notes: 'Trước khi đi ngủ 30 phút', enabled: true },
      ]);
      return;
    }

    setLoadingMeds(true);
    try {
      const q = query(
        collection(db, 'medicationReminders'),
        where('userId', '==', user.uid)
      );
      const snap = await getDocs(q);
      const list: MedicationItem[] = [];
      snap.forEach(d => {
        const data = d.data();
        list.push({
          id: d.id,
          medName: data.medName || 'Thuốc',
          dosage: data.dosage || '',
          time: data.time || '08:00',
          notes: data.notes || '',
          enabled: data.enabled ?? true
        });
      });
      list.sort((a, b) => a.time.localeCompare(b.time));
      setMedications(list);
    } catch (err) {
      console.warn('Error fetching medications in notification modal:', err);
    } finally {
      setLoadingMeds(false);
    }
  };

  // Toggle Medication on/off
  const toggleMedication = async (med: MedicationItem) => {
    const nextState = !med.enabled;
    setMedications(prev => prev.map(m => m.id === med.id ? { ...m, enabled: nextState } : m));
    
    if (user && !med.id.startsWith('demo-')) {
      try {
        await updateDoc(doc(db, 'medicationReminders', med.id), {
          enabled: nextState
        });
      } catch (err) {
        console.error('Error updating medication reminder:', err);
      }
    } else {
      const updated = medications.map(m => m.id === med.id ? { ...m, enabled: nextState } : m);
      localStorage.setItem('guest_medication_reminders', JSON.stringify(updated));
    }
  };

  // Delete Medication
  const deleteMedication = async (id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
    if (user && !id.startsWith('demo-')) {
      try {
        await deleteDoc(doc(db, 'medicationReminders', id));
      } catch (err) {
        console.error('Error deleting medication reminder:', err);
      }
    } else {
      const updated = medications.filter(m => m.id !== id);
      localStorage.setItem('guest_medication_reminders', JSON.stringify(updated));
    }
  };

  // Add Quick Medication
  const handleAddQuickMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    const newItem: MedicationItem = {
      id: user ? 'temp-' + Date.now() : 'local-' + Date.now(),
      medName: newMedName.trim(),
      dosage: newMedDosage.trim() || '1 liều',
      time: newMedTime || '08:00',
      notes: newMedNotes.trim(),
      enabled: true
    };

    if (user) {
      try {
        const docRef = await addDoc(collection(db, 'medicationReminders'), {
          userId: user.uid,
          medName: newItem.medName,
          dosage: newItem.dosage,
          time: newItem.time,
          notes: newItem.notes,
          enabled: true,
          category: 'medication',
          createdAt: serverTimestamp()
        });
        newItem.id = docRef.id;
      } catch (err) {
        console.error('Error adding medication reminder:', err);
      }
    } else {
      const updated = [...medications, newItem];
      localStorage.setItem('guest_medication_reminders', JSON.stringify(updated));
    }

    setMedications(prev => [...prev, newItem].sort((a, b) => a.time.localeCompare(b.time)));
    setNewMedName('');
    setIsAddingMed(false);
  };

  // Toggle Vitals Schedule
  const toggleVitalsSchedule = (id: string) => {
    setVitalsSchedules(prev => {
      const next = prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
      localStorage.setItem('vitalsReminderSchedules', JSON.stringify(next));
      return next;
    });
  };

  // Synthesize Harmonious Medical Chime (Web Audio API)
  const playMedicalChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Two gentle bells: D5 (587Hz) and A5 (880Hz)
      playTone(587.33, 0, 0.7);
      playTone(880.00, 0.16, 1.1);

      if (vibrateEnabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([150, 80, 150]);
      }
    } catch (e) {
      console.warn('Audio tone play error:', e);
    }
  };

  // Test Notification & Sound Trigger
  const handleTestNotification = async () => {
    playMedicalChime();

    let perm = permission;
    if (perm !== 'granted') {
      perm = await reminderService.requestNotificationPermission();
      setPermission(perm);
    }

    if (perm === 'granted' && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        new Notification('🔔 Bác sĩ Tâm An - Nhắc nhở mẫu', {
          body: 'Đã đến giờ uống 1 ly nước ấm và kiểm tra sức khỏe!',
          icon: '/icon-192.png'
        });
      } catch (err) {
        console.warn('Notification constructor error:', err);
      }
    }

    setTestSuccessMessage('✓ Đã phát chuông & gửi thông báo thử nghiệm thành công!');
    setTimeout(() => setTestSuccessMessage(null), 4000);
  };

  // Add 1 glass of water record
  const handleAddWaterCup = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextAmount = todayDrankAmount + 250;
    setTodayDrankAmount(nextAmount);
    localStorage.setItem(`waterDrank_${today}`, String(nextAmount));
    playMedicalChime();
    setTestSuccessMessage('💧 Đã ghi nhận thêm 250ml nước vào mục tiêu hôm nay!');
    setTimeout(() => setTestSuccessMessage(null), 3000);
  };

  if (!isOpen) return null;

  const totalActiveReminders = 
    (waterEnabled ? 1 : 0) + 
    medications.filter(m => m.enabled).length + 
    vitalsSchedules.filter(v => v.enabled).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] w-full h-full flex flex-col bg-slate-50 overflow-hidden"
    >
      {/* Top Header Full Screen */}
      <div className="w-full bg-gradient-to-r from-teal-50 via-emerald-50/70 to-white border-b border-teal-100/90 shadow-2xs shrink-0 pt-[calc(max(env(safe-area-inset-top,0px),34px)+0.5rem)] sm:pt-4 pb-3.5 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-teal-600 text-white-pure flex items-center justify-center shadow-md shadow-teal-600/20 shrink-0">
              <Bell className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white-pure" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif tracking-tight truncate">
                  Cài đặt Thông báo & Nhắc nhở
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200/90 shrink-0">
                  {totalActiveReminders} đang bật
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-normal mt-0.5 truncate">
                Quản lý lịch uống nước định kỳ, giờ uống thuốc & kiểm tra chỉ số sinh hiệu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 font-medium text-xs"
              title="Đóng (Esc)"
            >
              <X className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Đóng</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Permission Bar & Test Notification Action */}
      <div className="w-full bg-white/95 border-b border-slate-200/80 px-4 sm:px-8 py-2.5 shrink-0">
        <div className="max-w-4xl mx-auto w-full flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2.5 h-2.5 rounded-full shrink-0",
              permission === 'granted' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-400"
            )} />
            <span className="text-slate-700 font-medium text-[11px] sm:text-xs">
              {permission === 'granted' 
                ? 'Thông báo trình duyệt & thiết bị: Đã sẵn sàng'
                : 'Thông báo nền thiết bị: Chưa cấp quyền'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {permission !== 'granted' && (
              <button
                type="button"
                onClick={async () => {
                  const res = await reminderService.requestNotificationPermission();
                  setPermission(res);
                }}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white-pure text-[10.5px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                Cấp quyền thông báo
              </button>
            )}

            <button
              type="button"
              onClick={handleTestNotification}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10.5px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Thử nghiệm chuông báo và thông báo"
            >
              <Play className="w-3 h-3 text-teal-600 fill-teal-600" />
              <span>Thử chuông báo</span>
            </button>
          </div>
        </div>
      </div>

      {/* In-app Toast message if tested */}
      <AnimatePresence>
        {testSuccessMessage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full bg-emerald-50 text-emerald-800 text-[11px] font-medium px-4 sm:px-8 py-2 border-b border-emerald-200"
          >
            <div className="max-w-4xl mx-auto w-full flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{testSuccessMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Tabs */}
      <div className="w-full bg-white border-b border-slate-200 px-4 sm:px-8 shrink-0">
        <div className="max-w-4xl mx-auto w-full flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Tất cả', icon: Bell },
            { id: 'water', label: 'Uống nước', icon: Droplets, badge: waterEnabled ? 'Bật' : undefined },
            { id: 'medication', label: 'Uống thuốc', icon: Pill, count: medications.filter(m => m.enabled).length },
            { id: 'vitals', label: 'Đo sinh hiệu', icon: Activity, count: vitalsSchedules.filter(v => v.enabled).length },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "py-3 px-3.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap",
                  isActive 
                    ? "border-teal-600 text-teal-700 font-bold" 
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-teal-600" : "text-slate-400")} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-slate-100 text-slate-700 font-bold border border-slate-200">
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-100 text-emerald-700 font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal Body Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 sm:py-6">
        <div className="max-w-4xl mx-auto w-full space-y-6 pb-6">
          
          {/* SECTION 1: NHẮC UỐNG NƯỚC (Hydration) */}
          {(activeTab === 'all' || activeTab === 'water') && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <Droplets className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                      Nhắc nhở uống nước định kỳ
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Bảo vệ chức năng thận, thanh lọc độc tố & duy trì năng lượng
                    </p>
                  </div>
                </div>

                {/* Main Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setWaterEnabled(!waterEnabled)}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                    waterEnabled ? "bg-teal-600" : "bg-slate-300"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      waterEnabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {waterEnabled && (
                <div className="space-y-4 pt-2 border-t border-slate-200/80">
                  {/* Interval Option Pills */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                      Khoảng cách giữa các lần nhắc
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: '30 phút', val: 30 },
                        { label: '45 phút', val: 45 },
                        { label: '60 phút (Khuyên dùng)', val: 60 },
                        { label: '90 phút', val: 90 },
                        { label: '2 giờ', val: 120 }
                      ].map(opt => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setWaterInterval(opt.val)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                            waterInterval === opt.val
                              ? "bg-teal-600 text-white-pure border-teal-600 shadow-sm"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Daily Goal & Next Reminder Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Tiến trình hôm nay
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {todayDrankAmount} / {waterDailyGoal} ml
                        </span>
                        <span className="text-[10px] text-teal-700 block font-medium">
                          ({Math.round((todayDrankAmount / waterDailyGoal) * 100)}% mục tiêu)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddWaterCup}
                        className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        + 250ml
                      </button>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Lần nhắc tiếp theo sau
                        </span>
                        <span className="text-lg font-mono font-bold text-teal-700">
                          {waterCountdown}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 text-right">
                        <span>Hoạt động</span>
                        <span className="block font-semibold text-slate-600">07:00 - 22:00</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: NHẮC UỐNG THUỐC & DƯỢC LIỆU (Medication) */}
          {(activeTab === 'all' || activeTab === 'medication') && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Pill className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                      Lịch nhắc uống thuốc & Dược liệu
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Uống thuốc đúng giờ, đúng liều lượng theo phác đồ của bác sĩ
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingMed(!isAddingMed)}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white-pure text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm lịch</span>
                </button>
              </div>

              {/* Add form inline */}
              <AnimatePresence>
                {isAddingMed && (
                  <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleAddQuickMed}
                    className="bg-white border border-teal-200 rounded-xl p-4 space-y-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                        Thêm lịch uống thuốc mới
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingMed(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Tên thuốc / Vị thuốc</label>
                        <input
                          type="text"
                          required
                          value={newMedName}
                          onChange={e => setNewMedName(e.target.value)}
                          placeholder="Ví dụ: Thuốc tiểu đường, Kháng sinh, Trà Atiso..."
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Giờ nhắc</label>
                        <input
                          type="time"
                          required
                          value={newMedTime}
                          onChange={e => setNewMedTime(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Liều lượng</label>
                        <input
                          type="text"
                          value={newMedDosage}
                          onChange={e => setNewMedDosage(e.target.value)}
                          placeholder="Ví dụ: 1 viên, 2 thìa, 1 gói..."
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Ghi chú (Trước / Sau ăn)</label>
                        <input
                          type="text"
                          value={newMedNotes}
                          onChange={e => setNewMedNotes(e.target.value)}
                          placeholder="Ví dụ: Uống sau bữa ăn sáng 15 phút"
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingMed(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white-pure shadow-sm"
                      >
                        Lưu nhắc nhở
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Medication List */}
              <div className="space-y-2">
                {medications.length === 0 ? (
                  <div className="text-center py-6 bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                    Chưa có lịch uống thuốc nào. Bấm nút "+ Thêm lịch" để bắt đầu cài đặt.
                  </div>
                ) : (
                  medications.map(med => (
                    <div
                      key={med.id}
                      className={cn(
                        "p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 bg-white",
                        med.enabled ? "border-slate-200 shadow-2xs" : "border-slate-100 opacity-60 bg-slate-50/50"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0",
                          med.enabled ? "bg-teal-50 text-teal-700 border border-teal-200" : "bg-slate-100 text-slate-400"
                        )}>
                          <Clock className="w-4 h-4 mr-0.5 inline" />
                          <span>{med.time}</span>
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                            {med.medName}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            Liều lượng: <strong>{med.dosage}</strong> {med.notes && `• ${med.notes}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Toggle button */}
                        <button
                          type="button"
                          onClick={() => toggleMedication(med)}
                          className={cn(
                            "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                            med.enabled ? "bg-emerald-600" : "bg-slate-200"
                          )}
                          title={med.enabled ? 'Đang bật nhắc nhở' : 'Đang tạm dừng'}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                              med.enabled ? "translate-x-4" : "translate-x-0"
                            )}
                          />
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => deleteMedication(med.id)}
                          className="w-7 h-7 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="Xóa nhắc nhở"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {onOpenMedicationDetailModal && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenMedicationDetailModal();
                    }}
                    className="text-xs text-teal-700 hover:text-teal-800 font-bold underline cursor-pointer"
                  >
                    Mở bảng quản lý tủ thuốc & dược liệu chi tiết →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: NHẮC ĐO SINH HIỆU (Vitals) */}
          {(activeTab === 'all' || activeTab === 'vitals') && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                      Lịch nhắc kiểm tra sinh hiệu
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Theo dõi huyết áp, đường huyết định kỳ để kịp thời phát hiện bất thường
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {vitalsSchedules.map(sched => (
                  <div
                    key={sched.id}
                    className={cn(
                      "p-3 rounded-xl border bg-white flex items-center justify-between gap-2.5 transition-all",
                      sched.enabled ? "border-slate-200 shadow-2xs" : "border-slate-100 opacity-60"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                          {sched.time}
                        </span>
                        <h4 className="text-xs font-semibold text-slate-800 truncate">
                          {sched.title}
                        </h4>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleVitalsSchedule(sched.id)}
                      className={cn(
                        "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                        sched.enabled ? "bg-sky-600" : "bg-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          sched.enabled ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: TÙY CHỌN ÂM THANH & RUNG */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Tùy chọn Chuông báo & Rung
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  <div>
                    <span className="font-semibold text-slate-800 block">Âm thanh chuông báo y tế</span>
                    <span className="text-[10px] text-slate-500">Chuông nhẹ nhàng, êm tai</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={cn(
                    "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                    soundEnabled ? "bg-teal-600" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      soundEnabled ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-teal-600" />
                  <div>
                    <span className="font-semibold text-slate-800 block">Rung trên thiết bị di động</span>
                    <span className="text-[10px] text-slate-500">Báo hiệu kín đáo khi có lịch</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVibrateEnabled(!vibrateEnabled)}
                  className={cn(
                    "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                    vibrateEnabled ? "bg-teal-600" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      vibrateEnabled ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Full-Screen Modal Footer */}
        <div className="w-full bg-white border-t border-slate-200 px-4 sm:px-8 py-3.5 pb-[calc(max(env(safe-area-inset-bottom,0px),16px)+0.5rem)] sm:pb-3.5 shrink-0 shadow-sm">
          <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-3">
            <span className="text-[11px] sm:text-xs text-slate-500">
              Tự động đồng bộ và hoạt động chạy ngầm trên thiết bị
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white-pure text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
            >
              Đã xong
            </button>
          </div>
        </div>
      </motion.div>
  );
}
