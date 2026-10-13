import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, X, Clock, Loader2 } from 'lucide-react';
import { HealthReminder, getReminderCategoryInfo, REMINDER_CATEGORIES } from './MedicationReminderModal';
import { useLanguage } from '../contexts/LanguageContext';
import { registerModal } from '../utils/modalManager';

interface ConfirmDeleteReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  reminder: HealthReminder | null;
  isDeleting?: boolean;
}

export default function ConfirmDeleteReminderModal({
  isOpen,
  onClose,
  onConfirm,
  reminder,
  isDeleting = false
}: ConfirmDeleteReminderModalProps) {
  const { t, language } = useLanguage();

  const catInfo = reminder ? getReminderCategoryInfo(reminder) : REMINDER_CATEGORIES[0];
  const IconComponent = catInfo.icon;

  // Support ESC key & edge swipe to cancel/close
  useEffect(() => {
    if (!isOpen || !reminder || isDeleting) return;

    const unregister = registerModal('confirm-delete-reminder-modal', onClose);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unregister();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, reminder, isDeleting, onClose]);

  return (
    <AnimatePresence>
      {isOpen && reminder && (
        <motion.div 
          key="confirm-delete-reminder-backdrop-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-reminder-title"
        >
          {/* Backdrop click */}
          <div 
            className="fixed inset-0" 
            onClick={!isDeleting ? onClose : undefined} 
          />

          <motion.div
            key="confirm-delete-reminder-dialog-box"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10"
          >
          {/* Header Bar */}
          <div className="p-5 pb-4 border-b border-slate-100 flex items-start justify-between bg-rose-50/50">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100/90 text-rose-600 flex items-center justify-center shrink-0 shadow-xs border border-rose-200">
                <Trash2 className="w-5 h-5 text-rose-600 animate-pulse" />
              </div>
              <div>
                <h3 id="delete-reminder-title" className="text-base font-bold text-slate-900">
                  {t('reminder.confirm_delete_title')}
                </h3>
                <p className="text-xs text-rose-700 font-medium mt-0.5">
                  {language === 'en' ? 'Delete this reminder schedule' : 'Gỡ bỏ lịch nhắc nhở này'}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-4">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t('reminder.confirm_delete_desc')}
            </p>

            {/* Reminder Item Preview Card */}
            <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${catInfo.tagClass}`}>
                  <IconComponent className="w-3 h-3" />
                  {language === 'en' ? catInfo.name_en : catInfo.name}
                </span>

                <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-lg shadow-2xs font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {reminder.time}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {reminder.medName}
                </h4>
                {reminder.dosage && (
                  <p className="text-xs text-slate-600 mt-0.5">
                    <span className="font-medium text-slate-500">Mục tiêu/Liều:</span>{' '}
                    <span className="font-semibold text-slate-700">{reminder.dosage}</span>
                  </p>
                )}
                {reminder.notes && (
                  <p className="text-[11px] text-teal-800/80 italic mt-1 bg-teal-50/60 border border-teal-100 rounded-lg px-2 py-1">
                    💡 {reminder.notes}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {t('reminder.cancel_delete_btn')}
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-force-white active:scale-98"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span className="text-white text-force-white">{t('reminder.deleting')}</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-force-white">{t('reminder.delete_btn')}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
}
