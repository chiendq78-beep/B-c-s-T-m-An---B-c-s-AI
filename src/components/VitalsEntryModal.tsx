import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Activity, Thermometer, Droplets, Heart, Save, Bell, Clock, Scale } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

interface VitalsEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function VitalsEntryModal({ isOpen, onClose, onSuccess }: VitalsEntryModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    heartRate: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    temperature: '',
    spo2: '',
    bloodGlucose: '',
    weight: ''
  });

  const [reminderId, setReminderId] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [savingReminder, setSavingReminder] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!user || !isOpen) return;

    const fetchReminder = async () => {
      try {
        const q = query(
          collection(db, 'reminders'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          setReminderId(docSnap.id);
          const data = docSnap.data();
          setReminderEnabled(data.enabled ?? false);
          setReminderTime(data.time ?? '08:00');
        } else {
          setReminderId(null);
          setReminderEnabled(false);
          setReminderTime('08:00');
        }
      } catch (error) {
        console.error("Error fetching reminder:", error);
      }
    };

    fetchReminder();
  }, [user, isOpen]);

  const handleSaveReminder = async () => {
    if (!user) return;
    setSavingReminder(true);
    setSaveSuccess(false);
    try {
      if (reminderId) {
        await setDoc(doc(db, 'reminders', reminderId), {
          userId: user.uid,
          enabled: reminderEnabled,
          time: reminderTime,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        const docRef = await addDoc(collection(db, 'reminders'), {
          userId: user.uid,
          enabled: reminderEnabled,
          time: reminderTime,
          createdAt: serverTimestamp()
        });
        setReminderId(docRef.id);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving reminder:", error);
    } finally {
      setSavingReminder(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'vitals'), {
        userId: user.uid,
        heartRate: formData.heartRate ? parseFloat(formData.heartRate) : null,
        bloodPressureSystolic: formData.bloodPressureSystolic ? parseFloat(formData.bloodPressureSystolic) : null,
        bloodPressureDiastolic: formData.bloodPressureDiastolic ? parseFloat(formData.bloodPressureDiastolic) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        spo2: formData.spo2 ? parseFloat(formData.spo2) : null,
        bloodGlucose: formData.bloodGlucose ? parseFloat(formData.bloodGlucose) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        timestamp: serverTimestamp()
      });
      onSuccess?.();
      onClose();
      setFormData({
        heartRate: '',
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        temperature: '',
        spo2: '',
        bloodGlucose: '',
        weight: ''
      });
    } catch (error) {
      console.error("Error saving vitals:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
            className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-center text-teal-700 shadow-sm">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-slate-900">Ghi Lại Chỉ Số Sinh Hiệu</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Tiểu đường, Huyết áp, Nhịp tim, SpO2 & Thân nhiệt</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-3.5">
                {/* Blood Glucose (Tiểu đường / Đường huyết) */}
                <div className="col-span-2 sm:col-span-1 space-y-1.5 p-3 rounded-2xl bg-rose-50/60 border border-rose-200/80">
                  <label className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-rose-600" /> Đường huyết (mmol/L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.bloodGlucose}
                    onChange={(e) => setFormData({ ...formData, bloodGlucose: e.target.value })}
                    placeholder="Ví dụ: 5.6"
                    className="w-full bg-white border border-rose-200 rounded-xl py-2.5 px-3 text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
                  />
                  <p className="text-[10px] text-rose-700/70 font-medium">Bình thường: 4.4 - 7.2 mmol/L</p>
                </div>

                {/* Blood Pressure */}
                <div className="col-span-2 sm:col-span-1 space-y-1.5 p-3 rounded-2xl bg-blue-50/60 border border-blue-200/80">
                  <label className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" /> Huyết áp (mmHg)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={formData.bloodPressureSystolic}
                      onChange={(e) => setFormData({ ...formData, bloodPressureSystolic: e.target.value })}
                      placeholder="120"
                      className="w-full bg-white border border-blue-200 rounded-xl py-2.5 px-2.5 text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs text-center"
                    />
                    <span className="text-slate-400 font-bold">/</span>
                    <input
                      type="number"
                      value={formData.bloodPressureDiastolic}
                      onChange={(e) => setFormData({ ...formData, bloodPressureDiastolic: e.target.value })}
                      placeholder="80"
                      className="w-full bg-white border border-blue-200 rounded-xl py-2.5 px-2.5 text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs text-center"
                    />
                  </div>
                  <p className="text-[10px] text-blue-700/70 font-medium">Chuẩn: 120/80 mmHg</p>
                </div>

                {/* Heart Rate */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" /> Nhịp tim (BPM)
                  </label>
                  <input
                    type="number"
                    value={formData.heartRate}
                    onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                    placeholder="75"
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3.5 text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                  />
                </div>

                {/* SpO2 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-teal-600" /> SpO2 (%)
                  </label>
                  <input
                    type="number"
                    value={formData.spo2}
                    onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
                    placeholder="98"
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3.5 text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                  />
                </div>

                {/* Temperature */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-amber-500" /> Thân nhiệt (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    placeholder="36.5"
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3.5 text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                  />
                </div>

                {/* Weight */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-purple-500" /> Cân nặng (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="65.0"
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3.5 text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Daily Reminder Quick Switch */}
              <div className="p-4 border border-slate-200 bg-slate-50 rounded-2xl space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                      reminderEnabled 
                        ? "bg-teal-100 text-teal-700 border border-teal-200" 
                        : "bg-white border border-slate-200 text-slate-400"
                    )}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Bật nhắc đo sinh hiệu hàng ngày</h3>
                      <p className="text-[11px] text-slate-500">Nhắc nhở kiểm tra chỉ số đúng giờ</p>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setReminderEnabled(!reminderEnabled)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer",
                      reminderEnabled ? "bg-teal-600" : "bg-slate-300"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm",
                        reminderEnabled ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                <AnimatePresence>
                  {reminderEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pt-1"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="time"
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-900 outline-none border-none p-0 w-16"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveReminder}
                          disabled={savingReminder}
                          className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {savingReminder ? (
                            <div className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                          ) : saveSuccess ? (
                            "✓ Đã lưu"
                          ) : (
                            "Lưu giờ nhắc"
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-xs shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu chỉ số sinh hiệu</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
