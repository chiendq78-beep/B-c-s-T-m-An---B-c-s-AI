import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Save, Bell, Clock, Pill, Trash2, Edit2, Plus, 
  AlertCircle, Sparkles, Heart, Activity, Droplets, 
  Thermometer, Scale, Check, CheckCircle2, ChevronRight, ChevronDown,
  Filter
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, setDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { registerModal } from '../utils/modalManager';
import { reminderService, isVitalsOrMetric } from '../services/reminderService';
import ConfirmDeleteReminderModal from './ConfirmDeleteReminderModal';

export interface MedicationReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
  initialEditingReminder?: HealthReminder | null;
  initialViewMode?: 'list' | 'add' | 'edit';
}

export type ReminderCategory = 'medication' | 'measurement' | 'other' | 'glucose' | 'blood_pressure' | 'spo2' | 'temperature' | 'weight' | 'vitals';

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

// 3 Loại nhắc nhở cơ bản: Uống thuốc, Đo chỉ số và Khác
export const REMINDER_CATEGORIES: {
  id: ReminderCategory;
  name: string;
  name_en: string;
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
    name: 'Uống thuốc',
    name_en: 'Medication',
    icon: Pill,
    colorClass: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    tagClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    defaultTarget: '1 viên / 1 liều',
    placeholderName: 'Ví dụ: Thuốc tiểu đường, Paracetamol 500mg, Sâm Ngọc Linh, Thuốc huyết áp...'
  },
  {
    id: 'measurement',
    name: 'Đo chỉ số',
    name_en: 'Health Measurement',
    icon: Activity,
    colorClass: 'text-blue-600',
    bgLight: 'bg-blue-50',
    borderClass: 'border-blue-200',
    tagClass: 'bg-blue-100 text-blue-700 border-blue-200',
    defaultTarget: 'Huyết áp, Đường huyết, SpO2...',
    placeholderName: 'Ví dụ: Đo đường huyết sau ăn, Đo huyết áp sáng sớm, Đo SpO2, Thân nhiệt, Cân nặng...'
  },
  {
    id: 'other',
    name: 'Khác',
    name_en: 'Other',
    icon: Bell,
    colorClass: 'text-purple-600',
    bgLight: 'bg-purple-50',
    borderClass: 'border-purple-200',
    tagClass: 'bg-purple-100 text-purple-700 border-purple-200',
    defaultTarget: 'Định kỳ',
    placeholderName: 'Ví dụ: Uống trà thảo mộc dưỡng tâm, Tập vật lý trị liệu, Đi bộ thư giãn...'
  }
];

// Quick templates for fast setup
const QUICK_TEMPLATES = [
  {
    category: 'medication' as ReminderCategory,
    title: 'Uống thuốc sáng sau ăn',
    dosage: '1 liều theo đơn',
    time: '07:30',
    notes: 'Uống đúng giờ sau khi ăn sáng'
  },
  {
    category: 'medication' as ReminderCategory,
    title: 'Uống thuốc tối trước khi ngủ',
    dosage: '1 liều theo toa',
    time: '20:30',
    notes: 'Uống cùng nhiều nước ấm sau ăn'
  },
  {
    category: 'measurement' as ReminderCategory,
    title: 'Đo huyết áp sáng thức dậy',
    dosage: 'Mục tiêu: 110-120 / 70-80 mmHg',
    time: '07:00',
    notes: 'Nghỉ ngơi tĩnh 5 phút trước khi bấm đo'
  },
  {
    category: 'measurement' as ReminderCategory,
    title: 'Đo đường huyết sau ăn',
    dosage: 'Mục tiêu: < 7.8 mmol/L',
    time: '20:00',
    notes: 'Đo sau bữa ăn 30 phút đến 2 giờ'
  },
  {
    category: 'other' as ReminderCategory,
    title: 'Uống trà thảo mộc dưỡng tâm',
    dosage: '1 tách trà ấm',
    time: '14:30',
    notes: 'Thư giãn tâm trí vào đầu giờ chiều'
  }
];

export const DEFAULT_GUEST_REMINDERS: HealthReminder[] = [
  { id: 'demo-1', category: 'medication', medName: 'Thuốc Huyết Áp (Amlodipine 5mg)', dosage: '1 viên', time: '08:00', notes: 'Sau ăn sáng 15 phút', enabled: true },
  { id: 'demo-2', category: 'other', medName: 'Trà Thảo Mộc / Dược Liệu Dưỡng Tâm', dosage: '1 gói hãm ấm', time: '14:30', notes: 'Uống ấm giữa chiều', enabled: true },
  { id: 'demo-3', category: 'medication', medName: 'Men Vi Sinh / Dưỡng Khí Can Thận', dosage: '1 viên', time: '20:30', notes: 'Trước khi đi ngủ 30 phút', enabled: true },
  { id: 'demo-4', category: 'measurement', medName: 'Đo đường huyết sau ăn tối', dosage: 'Mục tiêu: < 7.8 mmol/L', time: '21:00', notes: 'Đo sau ăn 2 tiếng', enabled: true }
];

// Helper to determine category if not explicitly saved
export function getReminderCategoryInfo(reminder: Partial<HealthReminder>) {
  if (reminder.category) {
    if (reminder.category === 'medication') return REMINDER_CATEGORIES[0];
    if (['measurement', 'glucose', 'blood_pressure', 'spo2', 'temperature', 'weight', 'vitals'].includes(reminder.category)) {
      return REMINDER_CATEGORIES[1];
    }
    if (reminder.category === 'other') return REMINDER_CATEGORIES[2];
    const found = REMINDER_CATEGORIES.find(c => c.id === reminder.category);
    if (found) return found;
  }
  
  const name = (reminder.medName || '').toLowerCase();
  if (name.includes('thuốc') || name.includes('dược liệu') || name.includes('viên') || name.includes('liều') || name.includes('kháng sinh') || name.includes('vitamin') || name.includes('uống')) {
    return REMINDER_CATEGORIES[0]; // Uống thuốc
  }
  if (name.includes('đo') || name.includes('huyết áp') || name.includes('đường huyết') || name.includes('tiểu đường') || name.includes('glucose') || name.includes('spo2') || name.includes('oxy') || name.includes('thân nhiệt') || name.includes('nhiệt độ') || name.includes('sốt') || name.includes('cân') || name.includes('bmi') || name.includes('chỉ số') || name.includes('sinh hiệu')) {
    return REMINDER_CATEGORIES[1]; // Đo chỉ số
  }
  if (name.includes('trà') || name.includes('tập') || name.includes('đi bộ') || name.includes('thể dục') || name.includes('khám')) {
    return REMINDER_CATEGORIES[2]; // Khác
  }
  return REMINDER_CATEGORIES[0]; // default to Uống thuốc
}

export default function MedicationReminderModal({ 
  isOpen, 
  onClose, 
  defaultCategory,
  initialEditingReminder,
  initialViewMode
}: MedicationReminderModalProps) {
  const { user } = useAuth();
  
  // State for listed reminders
  const [reminders, setReminders] = useState<HealthReminder[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  
  // Form view support: 'list' | 'add' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [activeFilter, setActiveFilter] = useState<'all' | 'medication' | 'measurement' | 'other'>('all');

  // Delete confirmation modal state
  const [reminderToDelete, setReminderToDelete] = useState<HealthReminder | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
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

  const [testNotifSuccess, setTestNotifSuccess] = useState<string | null>(null);

  // Category dropdown state in add/edit form
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryDropdownOpen]);

  // Close dropdown on view mode switch or modal close
  useEffect(() => {
    setIsCategoryDropdownOpen(false);
  }, [viewMode, isOpen]);

  // Register modal in global stack for edge swipe gestures on mobile/tablet
  useEffect(() => {
    if (!isOpen) return;
    const handleCloseOrBackToList = () => {
      if (viewMode !== 'list') {
        setViewMode('list');
      } else {
        onClose();
      }
    };
    const unregister = registerModal('medication-reminder-modal', handleCloseOrBackToList);
    const handleBackPress = (e: Event) => {
      e.preventDefault();
      handleCloseOrBackToList();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseOrBackToList();
    };
    window.addEventListener('app-back-press', handleBackPress);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unregister();
      window.removeEventListener('app-back-press', handleBackPress);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, viewMode, onClose]);

  const fetchReminders = async () => {
    setLoadingList(true);
    setErrorMessage(null);

    if (!user) {
      try {
        const local = localStorage.getItem('guest_medication_reminders');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.sort((a: HealthReminder, b: HealthReminder) => (a.time || '08:00').localeCompare(b.time || '08:00'));
            setReminders(parsed);
            setLoadingList(false);
            return;
          }
        }
        localStorage.setItem('guest_medication_reminders', JSON.stringify(DEFAULT_GUEST_REMINDERS));
        setReminders(DEFAULT_GUEST_REMINDERS);
      } catch (err) {
        console.warn('Error reading guest reminders:', err);
        setReminders(DEFAULT_GUEST_REMINDERS);
      } finally {
        setLoadingList(false);
      }
      return;
    }

    try {
      const q = query(
        collection(db, 'medicationReminders'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const list: HealthReminder[] = [];
      const seenIds = new Set<string>();
      querySnapshot.forEach((docSnap) => {
        if (seenIds.has(docSnap.id)) return;
        seenIds.add(docSnap.id);
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

  const handleOpenAddForm = (initialCat: ReminderCategory = 'medication') => {
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
      medName: item.medName || '',
      dosage: item.dosage || '',
      time: item.time || '08:00',
      notes: item.notes || '',
      enabled: item.enabled ?? true
    });
    setSelectedId(item.id);
    setViewMode('edit');
    setErrorMessage(null);
    setQuickTemplateNotice(null);
  };

  // Initialize view mode and data when modal opens or editing reminder changes
  useEffect(() => {
    if (!isOpen) return;

    fetchReminders();

    if (initialEditingReminder) {
      handleOpenEditForm(initialEditingReminder);
    } else if (defaultCategory) {
      handleOpenAddForm(defaultCategory as ReminderCategory);
    } else if (initialViewMode) {
      setViewMode(initialViewMode);
    } else {
      setViewMode('list');
    }
  }, [isOpen, initialEditingReminder, initialViewMode, defaultCategory, user]);

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

  const handleDeleteReminder = (item: HealthReminder) => {
    setReminderToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!reminderToDelete) return;
    try {
      setIsDeleting(true);
      const targetId = reminderToDelete.id;
      const updatedList = reminders.filter(r => r.id !== targetId);
      setReminders(updatedList);
      reminderService.removeReminderNotifications(targetId);

      if (!user || targetId.startsWith('demo-') || targetId.startsWith('local-')) {
        localStorage.setItem('guest_medication_reminders', JSON.stringify(updatedList));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('guest-reminders-updated'));
        }
      } else {
        await deleteDoc(doc(db, 'medicationReminders', targetId));
      }

      setReminderToDelete(null);
    } catch (error) {
      console.error("Error deleting reminder:", error);
      setErrorMessage("Không thể xóa nhắc nhở.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleEnable = async (item: HealthReminder) => {
    try {
      const nextEnabled = !item.enabled;
      // Optimistic update
      const updatedList = reminders.map(r => r.id === item.id ? { ...r, enabled: nextEnabled } : r);
      setReminders(updatedList);

      if (nextEnabled) {
        reminderService.syncReminderToNotificationCenter({
          id: item.id,
          medName: item.medName,
          dosage: item.dosage,
          time: item.time,
          notes: item.notes,
          enabled: true,
          category: item.category
        });
      }

      if (!user || item.id.startsWith('demo-') || item.id.startsWith('local-')) {
        localStorage.setItem('guest_medication_reminders', JSON.stringify(updatedList));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('guest-reminders-updated'));
        }
        return;
      }

      await setDoc(doc(db, 'medicationReminders', item.id), {
        enabled: nextEnabled,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error toggling reminder:", error);
      setReminders(prev => prev.map(r => r.id === item.id ? { ...r, enabled: item.enabled } : r));
      setErrorMessage("Không thể thay đổi trạng thái.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.medName.trim()) {
      setErrorMessage("Vui lòng nhập tên chỉ số hoặc tên thuốc cần nhắc.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      // Auto-request device notification permission if not asked yet
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        try {
          await reminderService.requestNotificationPermission();
        } catch (permErr) {
          console.warn('Error requesting permission during submit:', permErr);
        }
      }

      const isVitals = isVitalsOrMetric(formData.category, formData.medName.trim());
      const reminderType = isVitals ? 'vitals' : 'medication';

      if (!user) {
        // Guest mode - persist to localStorage and sync
        let updatedList: HealthReminder[] = [];
        let finalId = selectedId || ('local-' + Date.now());

        if (viewMode === 'add') {
          const newReminder: HealthReminder = {
            id: finalId,
            category: formData.category,
            medName: formData.medName.trim(),
            dosage: formData.dosage.trim(),
            time: formData.time,
            notes: formData.notes.trim(),
            enabled: formData.enabled
          };
          updatedList = [...reminders, newReminder].sort((a, b) => a.time.localeCompare(b.time));
        } else if (viewMode === 'edit' && selectedId) {
          updatedList = reminders.map(r => r.id === selectedId ? {
            ...r,
            category: formData.category,
            medName: formData.medName.trim(),
            dosage: formData.dosage.trim(),
            time: formData.time,
            notes: formData.notes.trim(),
            enabled: formData.enabled
          } : r).sort((a, b) => a.time.localeCompare(b.time));
        } else {
          updatedList = reminders;
        }

        localStorage.setItem('guest_medication_reminders', JSON.stringify(updatedList));
        setReminders(updatedList);

        if (formData.enabled) {
          reminderService.syncReminderToNotificationCenter({
            id: finalId,
            medName: formData.medName.trim(),
            dosage: formData.dosage.trim(),
            time: formData.time,
            notes: formData.notes.trim(),
            enabled: true,
            category: isVitals ? 'vitals' : 'medication'
          });
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('guest-reminders-updated'));
        }

        if (initialEditingReminder) {
          onClose();
        } else {
          setViewMode('list');
        }
        setTestNotifSuccess(`✓ Lịch nhắc đã lưu thành công (hẹn giờ lúc ${formData.time})!`);
        setTimeout(() => setTestNotifSuccess(null), 5000);
        return;
      }

      // Logged in user with Firestore:
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

        if (formData.enabled) {
          reminderService.syncReminderToNotificationCenter({
            id: docRef.id,
            medName: formData.medName.trim(),
            dosage: formData.dosage.trim(),
            time: formData.time,
            notes: formData.notes.trim(),
            enabled: true,
            category: isVitals ? 'vitals' : 'medication'
          });
        }

        setReminders(prev => [...prev, newReminder].sort((a, b) => a.time.localeCompare(b.time)));
      } else if (viewMode === 'edit' && selectedId) {
        await setDoc(doc(db, 'medicationReminders', selectedId), {
          category: isVitals ? 'vitals' : formData.category,
          medName: formData.medName.trim(),
          dosage: formData.dosage.trim(),
          time: formData.time,
          notes: formData.notes.trim(),
          enabled: formData.enabled,
          updatedAt: serverTimestamp()
        }, { merge: true });

        if (formData.enabled) {
          reminderService.syncReminderToNotificationCenter({
            id: selectedId,
            medName: formData.medName.trim(),
            dosage: formData.dosage.trim(),
            time: formData.time,
            notes: formData.notes.trim(),
            enabled: true,
            category: isVitals ? 'vitals' : 'medication'
          });
        }

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

      if (initialEditingReminder) {
        onClose();
      } else {
        setViewMode('list');
      }
      setTestNotifSuccess('✓ Lịch nhắc đã lưu và kích hoạt thông báo trên điện thoại!');
      setTimeout(() => setTestNotifSuccess(null), 5000);
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
      if (activeFilter === 'medication') {
        return cat === 'medication';
      }
      if (activeFilter === 'measurement') {
        return cat === 'measurement' || ['glucose', 'blood_pressure', 'spo2', 'temperature', 'weight', 'vitals'].includes(cat);
      }
      if (activeFilter === 'other') {
        return cat === 'other';
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
  const SelectedCategoryIcon = selectedCategoryConfig.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="medication-reminder-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-0 lg:p-6 bg-slate-900/60 backdrop-blur-sm"
        >
          {/* Backdrop click */}
          <div
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Modal Container */}
          <motion.div
            key="medication-reminder-modal-card"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
            className="relative w-full h-full lg:h-auto lg:max-w-2xl lg:max-h-[90vh] bg-white border-0 lg:border lg:border-slate-200 rounded-none lg:rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 pt-[calc(max(env(safe-area-inset-top,0px),24px)+0.75rem)] lg:pt-6 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between flex-shrink-0">
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

            {/* Success Message */}
            {testNotifSuccess && (
              <div className="px-6 py-2.5 flex items-center gap-2 text-emerald-800 text-xs bg-emerald-50 border-b border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{testNotifSuccess}</span>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
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
                          "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-xs",
                          activeFilter === 'all'
                            ? "bg-teal-600 hover:bg-teal-700 text-white ring-2 ring-teal-400/50"
                            : "bg-teal-700 hover:bg-teal-800 text-white font-medium"
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
                        onClick={() => setActiveFilter('measurement')}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer",
                          activeFilter === 'measurement'
                            ? "bg-teal-600 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        )}
                      >
                        <Activity className="w-3.5 h-3.5 text-blue-600" />
                        <span>Đo chỉ số ({reminders.filter(r => ['measurement', 'glucose', 'blood_pressure', 'spo2', 'temperature', 'weight', 'vitals'].includes(r.category || getReminderCategoryInfo(r).id)).length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveFilter('other')}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer",
                          activeFilter === 'other'
                            ? "bg-teal-600 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        )}
                      >
                        <Bell className="w-3.5 h-3.5 text-purple-600" />
                        <span>Khác ({reminders.filter(r => (r.category || getReminderCategoryInfo(r).id) === 'other').length})</span>
                      </button>
                    </div>

                    {/* Add button */}
                    <button
                      type="button"
                      onClick={() => handleOpenAddForm('medication')}
                      className="bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer shadow-sm flex-shrink-0 sm:ml-auto ml-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm lịch nhắc</span>
                    </button>
                  </div>

                  {/* Reminder Items List */}
                  {loadingList ? (
                    <div className="py-12 flex flex-col items-center gap-3">
                      <div className="w-7 h-7 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                      <span className="text-xs text-slate-500 font-medium">Đang tải lịch nhắc nhở...</span>
                    </div>
                  ) : filteredReminders.length > 0 ? (
                    <div className="space-y-3">
                      {filteredReminders.map((item, idx) => {
                        const catConfig = getReminderCategoryInfo(item);
                        const IconComponent = catConfig.icon;

                        return (
                          <div 
                            key={`rem-${item.id || 'item'}-${idx}`}
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
                              {/* Toggle Status On-Off switch */}
                              <button
                                type="button"
                                role="switch"
                                aria-checked={item.enabled}
                                onClick={() => handleToggleEnable(item)}
                                className={cn(
                                  "px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer select-none",
                                  item.enabled
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                    : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                )}
                                title={item.enabled ? "Gạt để tắt lịch nhắc" : "Gạt để bật lịch nhắc"}
                              >
                                <span className={cn(
                                  "min-w-[24px] text-center",
                                  item.enabled ? "text-emerald-700" : "text-slate-400"
                                )}>
                                  {item.enabled ? "Bật" : "Tắt"}
                                </span>
                                <span
                                  className={cn(
                                    "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ease-in-out p-0.5",
                                    item.enabled ? "bg-emerald-500" : "bg-slate-300"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out",
                                      item.enabled ? "translate-x-4" : "translate-x-0"
                                    )}
                                  />
                                </span>
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
                                onClick={() => handleDeleteReminder(item)}
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
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 truncate pr-2">
                        <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                        <span className="truncate">
                          {viewMode === 'add' ? 'Thêm Lịch Nhắc Nhở Mới' : `Chỉnh Sửa Lịch Nhắc: ${formData.medName || 'Chi tiết'}`}
                        </span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          if (initialEditingReminder) {
                            onClose();
                          } else {
                            setViewMode('list');
                          }
                        }}
                        className="text-xs font-bold text-slate-500 hover:text-teal-700 transition-colors cursor-pointer shrink-0"
                      >
                        {initialEditingReminder ? '✕ Đóng' : '← Quay lại danh sách'}
                      </button>
                    </div>

                  {/* Template applied banner */}
                  {quickTemplateNotice && (
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{quickTemplateNotice}</span>
                    </div>
                  )}

                  {/* 1. Category Selection Dropdown */}
                  <div className="space-y-1.5 relative" ref={categoryDropdownRef}>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      1. Chọn loại nhắc nhở <span className="text-rose-500">*</span>
                    </label>

                    {/* Dropdown Trigger Button */}
                    <button
                      type="button"
                      id="reminder-category-dropdown-trigger"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className={cn(
                        "w-full p-3 sm:p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer bg-white shadow-xs",
                        isCategoryDropdownOpen
                          ? "border-teal-500 ring-2 ring-teal-500/20 shadow-md"
                          : "border-slate-200 hover:border-teal-300 hover:bg-slate-50/50"
                      )}
                      aria-haspopup="listbox"
                      aria-expanded={isCategoryDropdownOpen}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform",
                          `${selectedCategoryConfig.bgLight} ${selectedCategoryConfig.borderClass} ${selectedCategoryConfig.colorClass}`
                        )}>
                          <SelectedCategoryIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-slate-900 block truncate">
                            {selectedCategoryConfig.name}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate font-medium">
                            {selectedCategoryConfig.defaultTarget}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border hidden sm:inline-block",
                          selectedCategoryConfig.tagClass
                        )}>
                          {selectedCategoryConfig.name_en}
                        </span>
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 transition-all",
                          isCategoryDropdownOpen ? "bg-teal-50 text-teal-700 rotate-180" : "bg-slate-100"
                        )}>
                          <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                        </div>
                      </div>
                    </button>

                    {/* Dropdown Menu List */}
                    <AnimatePresence>
                      {isCategoryDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.99 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.99 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden py-1.5 divide-y divide-slate-100 max-h-72 sm:max-h-80 overflow-y-auto"
                          role="listbox"
                        >
                          {REMINDER_CATEGORIES.map((cat, catIdx) => {
                            const IconComp = cat.icon;
                            const isSelected = formData.category === cat.id;

                            return (
                              <button
                                key={`cat-${cat.id}-${catIdx}`}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    category: cat.id,
                                    dosage: prev.dosage || cat.defaultTarget
                                  }));
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full px-3.5 py-2.5 text-left transition-all flex items-center justify-between gap-3 cursor-pointer",
                                  isSelected 
                                    ? "bg-teal-50/70 text-slate-900" 
                                    : "hover:bg-slate-50 text-slate-700"
                                )}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center border shrink-0",
                                    isSelected 
                                      ? `${cat.bgLight} ${cat.borderClass} ${cat.colorClass} shadow-2xs` 
                                      : "bg-slate-100 border-slate-200 text-slate-500"
                                  )}>
                                    <IconComp className="w-4.5 h-4.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className={cn(
                                      "text-xs sm:text-sm block truncate",
                                      isSelected ? "font-bold text-slate-900" : "font-medium text-slate-800"
                                    )}>
                                      {cat.name}
                                    </span>
                                    <span className="text-[11px] text-slate-400 block truncate">
                                      {cat.defaultTarget}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {isSelected ? (
                                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                                      <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                                      {cat.name_en}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Form Input Fields */}
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

                  {/* Submit / Close Buttons: Lưu and Đóng */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Lưu</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (initialEditingReminder) {
                          onClose();
                        } else {
                          setViewMode('list');
                        }
                      }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer border border-slate-200 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      <span>{initialEditingReminder ? 'Đóng' : 'Quay lại'}</span>
                    </button>
                  </div>
                </form>
              )}

            </div>
          </motion.div>

          {/* Confirmation Dialog before Deleting Reminder */}
          <ConfirmDeleteReminderModal
            key="confirm-delete-reminder-submodal"
            isOpen={!!reminderToDelete}
            onClose={() => setReminderToDelete(null)}
            onConfirm={handleConfirmDelete}
            reminder={reminderToDelete}
            isDeleting={isDeleting}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
