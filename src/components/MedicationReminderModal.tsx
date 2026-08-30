import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Save, Bell, Clock, Pill, Trash2, Edit2, Plus, 
  AlertCircle, Sparkles, Heart, Activity, Droplets, 
  Thermometer, Scale, Check, CheckCircle2, ChevronRight,
  Filter
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, setDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

interface MedicationReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
}

export type ReminderCategory = 'glucose' | 'blood_pressure' | 'spo2' | 'temperature' | 'weight' | 'medication' | 'other';

export interface HealthReminder {
  id: string;
  category?: ReminderCategory;
  medName: string; // Title / Name (medicine or metric name)
  dosage: string;  // Dosage or target range
  time: string;
  notes: string;
  enabled: boolean;
  createdAt?: any;
}

// Category Configuration with icons & styles - Medication prioritized at top
export const REMINDER_CATEGORIES: {
  id: ReminderCategory;
  name: string;
  icon: any;
  colorClass: string;
  bgLight: string;
  borderClass: string;
  tagClass: string;
  defaultTarget: string;
  placeholderName: string;
}[] = [
  {
    id: 'medication',
    name: 'Uống thuốc / Dược liệu',
    icon: Pill,
    colorClass: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    tagClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    defaultTarget: '1 viên / 1 liều',
    placeholderName: 'Ví dụ: Thuốc tiểu đường, Paracetamol 500mg, Sâm Ngọc Linh, Trà Atiso...'
  },
  {
    id: 'glucose',
    name: 'Tiểu đường / Đường huyết',
    icon: Droplets,
    colorClass: 'text-rose-600',
    bgLight: 'bg-rose-50',
    borderClass: 'border-rose-200',
    tagClass: 'bg-rose-100 text-rose-700 border-rose-200',
    defaultTarget: '4.4 - 7.2 mmol/L',
    placeholderName: 'Ví dụ: Đo đường huyết sau ăn 30p, Đường huyết lúc đói...'
  },
  {
    id: 'blood_pressure',
    name: 'Huyết áp & Tim mạch',
    icon: Heart,
    colorClass: 'text-blue-600',
    bgLight: 'bg-blue-50',
    borderClass: 'border-blue-200',
    tagClass: 'bg-blue-100 text-blue-700 border-blue-200',
    defaultTarget: '110-120 / 70-80 mmHg',
    placeholderName: 'Ví dụ: Đo huyết áp sáng sớm, Đo huyết áp tối...'
  },
  {
    id: 'spo2',
    name: 'Oxy máu (SpO2)',
    icon: Activity,
    colorClass: 'text-teal-600',
    bgLight: 'bg-teal-50',
    borderClass: 'border-teal-200',
    tagClass: 'bg-teal-100 text-teal-700 border-teal-200',
    defaultTarget: '96% - 99%',
    placeholderName: 'Ví dụ: Đo nồng độ SpO2 hô hấp...'
  },
  {
    id: 'temperature',
    name: 'Thân nhiệt',
    icon: Thermometer,
    colorClass: 'text-amber-600',
    bgLight: 'bg-amber-50',
    borderClass: 'border-amber-200',
    tagClass: 'bg-amber-100 text-amber-700 border-amber-200',
    defaultTarget: '36.5°C - 37.2°C',
    placeholderName: 'Ví dụ: Đo thân nhiệt kiểm tra sốt...'
  },
  {
    id: 'weight',
    name: 'Cân nặng & Thể trạng',
    icon: Scale,
    colorClass: 'text-purple-600',
    bgLight: 'bg-purple-50',
    borderClass: 'border-purple-200',
    tagClass: 'bg-purple-100 text-purple-700 border-purple-200',
    defaultTarget: 'Mục tiêu: 65.0 kg',
    placeholderName: 'Ví dụ: Cân nặng buổi sáng, Đo BMI...'
  },
  {
    id: 'other',
    name: 'Chỉ số khác',
    icon: Bell,
    colorClass: 'text-slate-600',
    bgLight: 'bg-slate-50',
    borderClass: 'border-slate-200',
    tagClass: 'bg-slate-100 text-slate-700 border-slate-200',
    defaultTarget: 'Định kỳ',
    placeholderName: 'Ví dụ: Đo vòng eo, Đo Axit Uric...'
  }
];

// Quick templates for fast setup - Medication prioritized at top
const QUICK_TEMPLATES = [
  {
    category: 'medication' as ReminderCategory,
    title: 'Uống thuốc điều trị / Bổ dưỡng',
    dosage: '1 liều theo toa',
    time: '20:30',
    notes: 'Uống cùng nhiều nước ấm sau ăn'
  },
  {
    category: 'medication' as ReminderCategory,
    title: 'Uống thuốc sáng sau ăn',
    dosage: '1 liều theo đơn',
    time: '07:30',
    notes: 'Uống đúng giờ sau khi ăn sáng'
  },
  {
    category: 'glucose' as ReminderCategory,
    title: 'Đo đường huyết sau ăn',
    dosage: 'Mục tiêu: < 7.8 mmol/L',
    time: '20:00',
    notes: 'Đo sau bữa ăn 30 phút đến 2 giờ'
  },
  {
    category: 'glucose' as ReminderCategory,
    title: 'Đo đường huyết lúc đói sáng sớm',
    dosage: 'Mục tiêu: 4.4 - 7.0 mmol/L',
    time: '06:30',
    notes: 'Đo ngay khi thức dậy, chưa ăn sáng'
  },
  {
    category: 'blood_pressure' as ReminderCategory,
    title: 'Đo huyết áp sáng thức dậy',
    dosage: 'Mục tiêu: 110-120 / 70-80 mmHg',
    time: '07:00',
    notes: 'Nghỉ ngơi tĩnh 5 phút trước khi bấm đo'
  },
  {
    category: 'blood_pressure' as ReminderCategory,
    title: 'Đo huyết áp buổi tối',
    dosage: 'Mục tiêu: < 125/80 mmHg',
    time: '19:30',
    notes: 'Đo trước khi tắm hoặc sau ăn 1 giờ'
  },
  {
    category: 'spo2' as ReminderCategory,
    title: 'Đo nồng độ Oxy SpO2',
    dosage: 'Mục tiêu: 96% - 99%',
    time: '08:00',
    notes: 'Kẹp máy đo SpO2 vào đầu ngón tay trỏ'
  },
  {
    category: 'temperature' as ReminderCategory,
    title: 'Đo thân nhiệt hàng ngày',
    dosage: 'Mục tiêu: 36.5°C - 37.0°C',
    time: '14:00',
    notes: 'Kẹp nhiệt kế nách hoặc đo trán'
  },
  {
    category: 'weight' as ReminderCategory,
    title: 'Cân nặng & Chỉ số BMI',
    dosage: 'BMI chuẩn 18.5 - 22.9',
    time: '06:45',
    notes: 'Cân vào sáng sớm sau khi vệ sinh cá nhân'
  }
];

// Helper to determine category if not explicitly saved
export function getReminderCategoryInfo(reminder: Partial<HealthReminder>) {
  if (reminder.category) {
    const found = REMINDER_CATEGORIES.find(c => c.id === reminder.category);
    if (found) return found;
  }
  
  const name = (reminder.medName || '').toLowerCase();
  if (name.includes('thuốc') || name.includes('dược liệu') || name.includes('viên') || name.includes('liều') || name.includes('kháng sinh') || name.includes('vitamin')) {
    return REMINDER_CATEGORIES[0]; // medication
  }
  if (name.includes('đường huyết') || name.includes('tiểu đường') || name.includes('glucose') || name.includes('hba1c')) {
    return REMINDER_CATEGORIES[1]; // glucose
  }
  if (name.includes('huyết áp') || name.includes('tim mạch') || name.includes('nhịp tim') || name.includes('bp')) {
    return REMINDER_CATEGORIES[2]; // blood_pressure
  }
  if (name.includes('spo2') || name.includes('oxy') || name.includes('oxy máu')) {
    return REMINDER_CATEGORIES[3]; // spo2
  }
  if (name.includes('thân nhiệt') || name.includes('nhiệt độ') || name.includes('sốt')) {
    return REMINDER_CATEGORIES[4]; // temperature
  }
  if (name.includes('cân nặng') || name.includes('bmi') || name.includes('thể trọng')) {
    return REMINDER_CATEGORIES[5]; // weight
  }
  return REMINDER_CATEGORIES[0]; // default to medication
}

export default function MedicationReminderModal({ isOpen, onClose, defaultCategory }: MedicationReminderModalProps) {
  const { user } = useAuth();
  
  // State for listed reminders
  const [reminders, setReminders] = useState<HealthReminder[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  
  // Form view support: 'list' | 'add' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [activeFilter, setActiveFilter] = useState<'all' | 'metrics' | 'medication'>('all');
  
  // Current editing / form item
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    category: ReminderCategory;
    medName: string;
    dosage: string;
    time: string;
    notes: string;
    enabled: boolean;
  }>({
    category: 'medication',
    medName: '',
    dosage: '',
    time: '20:30',
    notes: '',
    enabled: true
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quickTemplateNotice, setQuickTemplateNotice] = useState<string | null>(null);

  // Fetch reminders when opened
  useEffect(() => {
    if (!user || !isOpen) return;
    fetchReminders();
    if (defaultCategory) {
      handleOpenAddForm(defaultCategory as ReminderCategory);
    } else {
      setViewMode('list');
    }
  }, [user, isOpen, defaultCategory]);

  const fetchReminders = async () => {
    if (!user) return;
    setLoadingList(true);
    setErrorMessage(null);
    try {
      const q = query(
        collection(db, 'medicationReminders'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const list: HealthReminder[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let cat = data.category as ReminderCategory | undefined;
        if (!cat) {
          const guessed = getReminderCategoryInfo({ medName: data.medName });
          cat = guessed.id;
        }
        list.push({
          id: docSnap.id,
          category: cat,
          medName: data.medName || '',
          dosage: data.dosage || '',
          time: data.time || '08:00',
          notes: data.notes || '',
          enabled: data.enabled ?? true,
          createdAt: data.createdAt
        });
      });
      // Sort by time
      list.sort((a, b) => a.time.localeCompare(b.time));
      setReminders(list);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      setErrorMessage("Không thể tải danh sách nhắc nhở.");
    } finally {
      setLoadingList(false);
    }
  };

  const handleOpenAddForm = (initialCat: ReminderCategory = 'glucose') => {
    const catConfig = REMINDER_CATEGORIES.find(c => c.id === initialCat) || REMINDER_CATEGORIES[0];
    setFormData({
      category: initialCat,
      medName: '',
      dosage: catConfig.defaultTarget,
      time: '08:00',
      notes: '',
      enabled: true
    });
    setSelectedId(null);
    setViewMode('add');
    setErrorMessage(null);
    setQuickTemplateNotice(null);
  };

  const handleOpenEditForm = (item: HealthReminder) => {
    const cat = item.category || getReminderCategoryInfo(item).id;
    setFormData({
      category: cat,
      medName: item.medName,
      dosage: item.dosage,
      time: item.time,
      notes: item.notes,
      enabled: item.enabled
    });
    setSelectedId(item.id);
    setViewMode('edit');
    setErrorMessage(null);
    setQuickTemplateNotice(null);
  };

  const applyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    setFormData({
      category: tpl.category,
      medName: tpl.title,
      dosage: tpl.dosage,
      time: tpl.time,
      notes: tpl.notes,
      enabled: true
    });
    setQuickTemplateNotice(`Đã áp dụng mẫu: "${tpl.title}"`);
    setTimeout(() => setQuickTemplateNotice(null), 3000);
  };

  const handleDeleteReminder = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lịch nhắc nhở này không?")) return;
    try {
      await deleteDoc(doc(db, 'medicationReminders', id));
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error("Error deleting reminder:", error);
      setErrorMessage("Không thể xóa nhắc nhở.");
    }
  };

  const handleToggleEnable = async (item: HealthReminder) => {
    try {
      // Optimistic update
      setReminders(prev => prev.map(r => r.id === item.id ? { ...r, enabled: !r.enabled } : r));
      await setDoc(doc(db, 'medicationReminders', item.id), {
        enabled: !item.enabled,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error toggling reminder:", error);
      // Revert on error
      setReminders(prev => prev.map(r => r.id === item.id ? { ...r, enabled: item.enabled } : r));
      setErrorMessage("Không thể thay đổi trạng thái.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.medName.trim()) {
      setErrorMessage("Vui lòng nhập tên chỉ số hoặc tên thuốc cần nhắc.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      if (viewMode === 'add') {
        const docRef = await addDoc(collection(db, 'medicationReminders'), {
          userId: user.uid,
          category: formData.category,
          medName: formData.medName.trim(),
          dosage: formData.dosage.trim(),
          time: formData.time,
          notes: formData.notes.trim(),
          enabled: formData.enabled,
          createdAt: serverTimestamp()
        });
        
        const newReminder: HealthReminder = {
          id: docRef.id,
          category: formData.category,
          medName: formData.medName.trim(),
          dosage: formData.dosage.trim(),
          time: formData.time,
          notes: formData.notes.trim(),
          enabled: formData.enabled
        };

        setReminders(prev => [...prev, newReminder].sort((a, b) => a.time.localeCompare(b.time)));
      } else if (viewMode === 'edit' && selectedId) {
        await setDoc(doc(db, 'medicationReminders', selectedId), {
          category: formData.category,
          medName: formData.medName.trim(),
          dosage: formData.dosage.trim(),
          time: formData.time,
          notes: formData.notes.trim(),
          enabled: formData.enabled,
          updatedAt: serverTimestamp()
        }, { merge: true });

        setReminders(prev => prev.map(r => r.id === selectedId ? {
          ...r,
          category: formData.category,
          medName: formData.medName.trim(),
          dosage: formData.dosage.trim(),
          time: formData.time,
          notes: formData.notes.trim(),
          enabled: formData.enabled
        } : r).sort((a, b) => a.time.localeCompare(b.time)));
      }

      setViewMode('list');
    } catch (error) {
      console.error("Error saving reminder:", error);
      setErrorMessage("Không thể lưu lịch nhắc nhở.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered items - Prioritizing medication at top
  const filteredReminders = reminders
    .filter(r => {
      const cat = r.category || getReminderCategoryInfo(r).id;
      if (activeFilter === 'metrics') {
        return cat !== 'medication';
      }
      if (activeFilter === 'medication') {
        return cat === 'medication';
      }
      return true;
    })
    .sort((a, b) => {
      const catA = a.category || getReminderCategoryInfo(a).id;
      const catB = b.category || getReminderCategoryInfo(b).id;
      const isMedA = catA === 'medication';
      const isMedB = catB === 'medication';
      if (isMedA && !isMedB) return -1;
      if (!isMedA && isMedB) return 1;
      return a.time.localeCompare(b.time);
    });

  const selectedCategoryConfig = REMINDER_CATEGORIES.find(c => c.id === formData.category) || REMINDER_CATEGORIES[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
            className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-teal-50 border border-teal-200 text-teal-700 rounded-2xl flex items-center justify-center shadow-sm">
                  <Bell className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Quản Lý Nhắc Nhở Sức Khỏe
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Đặt lịch nhắc đo tiểu đường, huyết áp, sinh hiệu & uống thuốc
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="px-6 py-3 flex items-center gap-2 text-rose-700 text-xs bg-rose-50 border-b border-rose-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              
              {/* 1. LIST VIEW */}
              {viewMode === 'list' && (
                <div className="space-y-5">
                  {/* Action Bar & Filter Chips */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    {/* Filters - Uống thuốc prioritized */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      <button
                        type="button"
                        onClick={() => setActiveFilter('all')}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                          activeFilter === 'all'
                            ? "bg-teal-600 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        )}
                      >
                        Tất cả ({reminders.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveFilter('medication')}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer",
                          activeFilter === 'medication'
                            ? "bg-teal-600 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        )}
                      >
                        <Pill className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Uống thuốc ({reminders.filter(r => (r.category || getReminderCategoryInfo(r).id) === 'medication').length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveFilter('metrics')}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer",
                          activeFilter === 'metrics'
                            ? "bg-teal-600 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        )}
                      >
                        <Droplets className="w-3.5 h-3.5 text-rose-500" />
                        <span>Đo chỉ số (Tiểu đường, HA...)</span>
                      </button>
                    </div>

                    {/* Add button */}
                    <button
                      type="button"
                      onClick={() => handleOpenAddForm('medication')}
                      className="bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer shadow-sm flex-shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm nhắc nhở mới</span>
                    </button>
                  </div>

                  {/* Quick Preset Buttons - Medication is first priority card */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        Gợi ý thiết lập nhanh 1 chạm:
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* Priority Card 1: Uống thuốc */}
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenAddForm('medication');
                          applyTemplate(QUICK_TEMPLATES[0]);
                        }}
                        className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 border-2 border-emerald-300 text-left transition-all group cursor-pointer shadow-xs relative"
                      >
                        <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                          <Pill className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Uống thuốc</span>
                          <span className="ml-auto text-[9px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider">Ưu tiên</span>
                        </div>
                        <p className="text-[10px] text-emerald-700 mt-1 font-medium truncate">Theo đơn bác sĩ (20:30)</p>
                      </button>

                      {/* Card 2: Đo tiểu đường */}
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenAddForm('glucose');
                          applyTemplate(QUICK_TEMPLATES[2]);
                        }}
                        className="p-2.5 rounded-xl bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/80 text-left transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                          <Droplets className="w-3.5 h-3.5" />
                          <span>Đo tiểu đường</span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1 truncate">Sau ăn 30p (20:00)</p>
                      </button>

                      {/* Card 3: Đo huyết áp */}
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenAddForm('blood_pressure');
                          applyTemplate(QUICK_TEMPLATES[4]);
                        }}
                        className="p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/80 text-left transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
                          <Heart className="w-3.5 h-3.5" />
                          <span>Đo huyết áp</span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1 truncate">Sáng dậy (07:00)</p>
                      </button>

                      {/* Card 4: Đo Oxy SpO2 */}
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenAddForm('spo2');
                          applyTemplate(QUICK_TEMPLATES[6]);
                        }}
                        className="p-2.5 rounded-xl bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200/80 text-left transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 text-teal-700 font-bold text-xs">
                          <Activity className="w-3.5 h-3.5" />
                          <span>Đo Oxy SpO2</span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1 truncate">Mục tiêu {'>'} 96%</p>
                      </button>
                    </div>
                  </div>

                  {/* Reminder Items List */}
                  {loadingList ? (
                    <div className="py-12 flex flex-col items-center gap-3">
                      <div className="w-7 h-7 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                      <span className="text-xs text-slate-500 font-medium">Đang tải lịch nhắc nhở...</span>
                    </div>
                  ) : filteredReminders.length > 0 ? (
                    <div className="space-y-3">
                      {filteredReminders.map((item) => {
                        const catConfig = getReminderCategoryInfo(item);
                        const IconComponent = catConfig.icon;

                        return (
                          <div 
                            key={item.id}
                            className={cn(
                              "p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 group",
                              item.enabled 
                                ? "bg-white border-slate-200 hover:border-teal-300 hover:shadow-md" 
                                : "bg-slate-50/70 border-slate-200/60 opacity-65"
                            )}
                          >
                            <div className="flex items-start gap-3.5 min-w-0 flex-1">
                              {/* Icon & Time badge */}
                              <div className={cn(
                                "w-12 h-12 rounded-2xl flex flex-col items-center justify-center border flex-shrink-0 font-mono shadow-sm",
                                item.enabled
                                  ? `${catConfig.bgLight} ${catConfig.borderClass} ${catConfig.colorClass}`
                                  : "bg-slate-100 border-slate-200 text-slate-400"
                              )}>
                                <IconComponent className="w-4 h-4 mb-0.5" />
                                <span className="text-xs font-bold leading-none">{item.time}</span>
                              </div>

                              {/* Details */}
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                                    catConfig.tagClass
                                  )}>
                                    {catConfig.name}
                                  </span>
                                  <h4 className={cn(
                                    "text-sm font-bold text-slate-900 truncate",
                                    !item.enabled && "line-through text-slate-400"
                                  )}>
                                    {item.medName}
                                  </h4>
                                </div>

                                {item.dosage && (
                                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                    <span className="font-semibold text-slate-700">Mục tiêu/Liều:</span>
                                    <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-mono text-[11px] text-slate-800">
                                      {item.dosage}
                                    </span>
                                  </div>
                                )}

                                {item.notes && (
                                  <p className="text-[11px] text-teal-800/80 italic font-light bg-teal-50/50 px-2 py-1 rounded-lg border border-teal-100 max-w-xl">
                                    💡 {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Actions & Switch */}
                            <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 flex-shrink-0">
                              {/* Toggle Status */}
                              <button
                                type="button"
                                onClick={() => handleToggleEnable(item)}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                                  item.enabled
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                )}
                                title={item.enabled ? "Bấm để tắt nhắc nhở" : "Bấm để bật nhắc nhở"}
                              >
                                {item.enabled ? (
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

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditForm(item)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 text-slate-600 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 transition-all cursor-pointer"
                                title="Chỉnh sửa nhắc nhở"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteReminder(item.id)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                                title="Xóa lịch này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center p-6 gap-3 bg-slate-50/50">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                        <Bell className="w-6 h-6" />
                      </div>
                      <div className="max-w-md">
                        <p className="text-sm font-bold text-slate-800">Chưa có lịch nhắc nhở nào</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Chọn một mẫu gợi ý phía trên hoặc bấm nút "Thêm nhắc nhở mới" để thiết lập lịch đo tiểu đường, huyết áp hoặc uống thuốc.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. ADD & EDIT VIEW FORM */}
              {(viewMode === 'add' || viewMode === 'edit') && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Form Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <span>{viewMode === 'add' ? 'Thêm Lịch Nhắc Nhở Mới' : 'Cập Nhật Lịch Nhắc Nhở'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className="text-xs font-bold text-slate-500 hover:text-teal-700 transition-colors cursor-pointer"
                    >
                      ← Quay lại danh sách
                    </button>
                  </div>

                  {/* Template applied banner */}
                  {quickTemplateNotice && (
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{quickTemplateNotice}</span>
                    </div>
                  )}

                  {/* 1. Category Selection Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      1. Chọn loại nhắc nhở <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {REMINDER_CATEGORIES.map((cat) => {
                        const IconComp = cat.icon;
                        const isSelected = formData.category === cat.id;

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                category: cat.id,
                                dosage: prev.dosage || cat.defaultTarget
                              }));
                            }}
                            className={cn(
                              "p-3 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer relative",
                              isSelected 
                                ? `${cat.bgLight} ${cat.borderClass} ring-2 ring-teal-600/30 shadow-sm` 
                                : "bg-white border-slate-200 hover:bg-slate-50"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center border",
                                isSelected ? `${cat.bgLight} ${cat.borderClass} ${cat.colorClass}` : "bg-slate-100 border-slate-200 text-slate-500"
                              )}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-teal-600" />
                              )}
                            </div>
                            <span className={cn(
                              "text-xs font-bold truncate",
                              isSelected ? "text-slate-900" : "text-slate-600"
                            )}>
                              {cat.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Quick Presets Bar for Selected Category */}
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      Mẫu điền nhanh cho "{selectedCategoryConfig.name}":
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_TEMPLATES.filter(t => t.category === formData.category).map((tpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => applyTemplate(tpl)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-[11px] font-semibold text-slate-700 hover:text-teal-800 transition-all cursor-pointer shadow-xs"
                        >
                          + {tpl.title} ({tpl.time})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Form Input Fields */}
                  <div className="space-y-4">
                    {/* Name / Title */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        Tên chỉ số / Tên thuốc <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.medName}
                        onChange={(e) => setFormData({ ...formData, medName: e.target.value })}
                        placeholder={selectedCategoryConfig.placeholderName}
                        required
                        className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm font-medium shadow-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Time */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-teal-600" /> Giờ nhắc nhở <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={formData.time}
                          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                          required
                          className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm font-mono font-bold shadow-xs"
                        />
                      </div>

                      {/* Target / Dosage */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <span>Mục tiêu chỉ số / Liều lượng</span>
                        </label>
                        <input
                          type="text"
                          value={formData.dosage}
                          onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                          placeholder={selectedCategoryConfig.defaultTarget}
                          className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm font-medium shadow-xs"
                        />
                      </div>
                    </div>

                    {/* Medical Instructions / Notes */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        Hướng dẫn y khoa & Ghi chú
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Ví dụ: Đo sau ăn 30 phút, lúc bụng đói, nghỉ ngơi tĩnh 5 phút trước khi đo..."
                        rows={2}
                        className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm font-medium resize-none shadow-xs"
                      />
                    </div>

                    {/* Enable notification switch */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div>
                        <p className="text-xs font-bold text-slate-900">Bật thông báo nhắc nhở</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Gửi thông báo đẩy đúng giờ hẹn hàng ngày</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer",
                          formData.enabled ? "bg-teal-600" : "bg-slate-300"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm",
                            formData.enabled ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Submit / Cancel Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer border border-slate-200"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-[2] bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Lưu nhắc nhở</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
