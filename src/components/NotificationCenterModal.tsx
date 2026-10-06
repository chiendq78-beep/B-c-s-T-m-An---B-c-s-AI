import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Bell, Droplets, Pill, Activity, Check, Trash2, Settings
} from 'lucide-react';
import { cn } from '../lib/utils';
import { reminderService, AppNotificationItem } from '../services/reminderService';
import { registerModal } from '../utils/modalManager';
import { useLanguage } from '../contexts/LanguageContext';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenMedicationModal?: () => void;
  onOpenVitalsModal?: () => void;
  onDrinkWaterSuccess?: () => void;
}

export default function NotificationCenterModal({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenMedicationModal,
  onOpenVitalsModal,
  onDrinkWaterSuccess
}: NotificationCenterModalProps) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState<'all' | 'water' | 'medication' | 'vitals'>('all');
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Load notifications from reminderService
  useEffect(() => {
    if (!isOpen) return;

    setNotifications(reminderService.getNotifications());

    const handleUpdate = (e: any) => {
      if (Array.isArray(e.detail)) {
        setNotifications(e.detail);
      } else {
        setNotifications(reminderService.getNotifications());
      }
    };

    window.addEventListener('app-notifications-updated', handleUpdate);
    window.addEventListener('app-new-notification', () => {
      setNotifications(reminderService.getNotifications());
    });

    return () => {
      window.removeEventListener('app-notifications-updated', handleUpdate);
    };
  }, [isOpen]);

  // Back gesture listener
  useEffect(() => {
    if (!isOpen) return;
    const unregister = registerModal('notification-center-modal', onClose);
    const handleBack = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    window.addEventListener('app-back-press', handleBack);
    return () => {
      unregister();
      window.removeEventListener('app-back-press', handleBack);
    };
  }, [isOpen, onClose]);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleMarkAllRead = () => {
    reminderService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showFeedback(isEn ? 'Marked all as read' : 'Đã đánh dấu đã đọc tất cả');
  };

  const handleClearAll = () => {
    reminderService.clearNotifications();
    setNotifications([]);
    showFeedback(isEn ? 'Cleared notifications history' : 'Đã xóa toàn bộ lịch sử thông báo');
  };

  const handleDrinkWaterAction = (notifId: string) => {
    reminderService.markAsRead(notifId);
    window.dispatchEvent(new CustomEvent('app-quick-drink-water', { detail: { cups: 1 } }));
    if (onDrinkWaterSuccess) onDrinkWaterSuccess();
    showFeedback(isEn ? '💧 Added 250ml water to today record!' : '💧 Đã ghi nhận thêm 250ml nước vào hồ sơ hôm nay!');
  };

  const handleTakeMedAction = (notifId: string, medName?: string) => {
    reminderService.markAsRead(notifId);
    showFeedback(isEn ? `💊 Recorded: ${medName || 'Medicine'} taken!` : `💊 Đã ghi nhận uống thuốc: ${medName || 'Đúng lịch'}!`);
  };

  const handleLogVitalsAction = (notifId: string) => {
    reminderService.markAsRead(notifId);
    if (onOpenVitalsModal) onOpenVitalsModal();
    onClose();
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter(item => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4 bg-slate-900/35 backdrop-blur-xs animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.97, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0, y: 10 }}
        transition={{ duration: 0.18 }}
        className="bg-[#fafcfb] sm:bg-white rounded-none sm:rounded-3xl w-full h-full sm:max-w-2xl sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-0 sm:border sm:border-emerald-100/90"
      >
        {/* ========================================================================= */}
        {/* HEADER BAR (Streamlined, Light White Background, Green Text)              */}
        {/* ========================================================================= */}
        <div className="px-4 sm:px-6 pt-[calc(max(env(safe-area-inset-top,0px),20px)+0.4rem)] sm:pt-4 pb-3 border-b border-emerald-100/90 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/90 flex items-center justify-center shadow-xs shrink-0 relative">
              <Bell className="w-4.5 h-4.5 text-emerald-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-sm sm:text-base font-bold text-emerald-950 tracking-tight leading-snug">
                  {isEn ? "NOTIFICATION CENTER" : "THANH THÔNG BÁO"}
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                    {unreadCount} {isEn ? "new" : "chưa đọc"}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-700/80 font-medium truncate">
                {isEn ? "Water, Medication & Health Vitals Reminders" : "Nhắc nhở uống nước, lịch uống thuốc & đo chỉ số"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                onOpenSettings();
              }}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95"
              title={isEn ? "Configure Reminder Cycles" : "Cài đặt chu kỳ nhắc nhở"}
            >
              <Settings className="w-4 h-4 text-emerald-700" />
              <span className="hidden sm:inline">{isEn ? "Settings" : "Cài đặt"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100/80 hover:bg-emerald-50 text-emerald-800 hover:text-emerald-950 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title={isEn ? "Close" : "Đóng"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback message banner if triggered */}
        <AnimatePresence>
          {actionFeedback && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-50 text-emerald-900 border-b border-emerald-200 text-xs font-semibold px-4 py-1.5 text-center shadow-2xs"
            >
              {actionFeedback}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* FILTER TABS (Streamlined & Clean)                                         */}
        {/* ========================================================================= */}
        <div className="px-4 sm:px-6 py-2 border-b border-emerald-100/80 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
              activeTab === 'all'
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-slate-50 text-emerald-900/80 hover:bg-emerald-50 border border-emerald-100/60"
            )}
          >
            {isEn ? "All" : "Tất cả"} ({notifications.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('water')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap",
              activeTab === 'water'
                ? "bg-cyan-700 text-white shadow-2xs"
                : "bg-cyan-50/70 text-cyan-900 hover:bg-cyan-100/80 border border-cyan-200/60"
            )}
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-600" />
            <span>{isEn ? "Water" : "Uống nước"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('medication')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap",
              activeTab === 'medication'
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100/80 border border-emerald-200/60"
            )}
          >
            <Pill className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isEn ? "Medication" : "Uống thuốc"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vitals')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap",
              activeTab === 'vitals'
                ? "bg-teal-700 text-white shadow-2xs"
                : "bg-teal-50/70 text-teal-900 hover:bg-teal-100/80 border border-teal-200/60"
            )}
          >
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>{isEn ? "Health Vitals" : "Đo chỉ số"}</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* NOTIFICATIONS LIST (Light White Background, Green Text, Clean Cards)      */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-2.5 bg-[#f8fbf9]">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-2.5 bg-white rounded-2xl border border-dashed border-emerald-200 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                <Bell className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="max-w-sm mx-auto space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-emerald-950">
                  {isEn ? "No notifications in this category" : "Chưa có thông báo nào trong mục này"}
                </h4>
                <p className="text-xs text-emerald-800/80 leading-relaxed">
                  {isEn 
                    ? "Notifications will appear here when your scheduled reminders trigger."
                    : "Các lời nhắc uống nước định kỳ, lịch uống thuốc và đo chỉ số sẽ tự động xuất hiện ở đây khi đến giờ."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredNotifications.map((notif) => {
                const isWater = notif.type === 'water';
                const isMed = notif.type === 'medication';
                const isVitals = notif.type === 'vitals';

                return (
                  <div
                    key={notif.id}
                    className={cn(
                      "p-3 sm:p-3.5 rounded-xl border transition-all duration-200 bg-white shadow-2xs relative overflow-hidden group",
                      notif.read ? "border-emerald-100/70 opacity-80" : "border-emerald-300 ring-1 ring-emerald-200/60 shadow-xs"
                    )}
                  >
                    {/* Unread Left Border Stripe */}
                    {!notif.read && (
                      <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-xl" />
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                        {/* Type Icon Badge */}
                        <div className={cn(
                          "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs",
                          isWater && "bg-cyan-50 text-cyan-700 border border-cyan-200/80",
                          isMed && "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
                          isVitals && "bg-teal-50 text-teal-700 border border-teal-200/80",
                          !isWater && !isMed && !isVitals && "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                        )}>
                          {isWater && <Droplets className="w-4.5 h-4.5 text-cyan-600" />}
                          {isMed && <Pill className="w-4.5 h-4.5 text-emerald-600" />}
                          {isVitals && <Activity className="w-4.5 h-4.5 text-teal-600" />}
                          {!isWater && !isMed && !isVitals && <Bell className="w-4.5 h-4.5 text-emerald-600" />}
                        </div>

                        {/* Title & Body */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                              isWater && "bg-cyan-100 text-cyan-800",
                              isMed && "bg-emerald-100 text-emerald-800",
                              isVitals && "bg-teal-100 text-teal-800"
                            )}>
                              {isWater ? (isEn ? "Hydration" : "Uống nước") : isMed ? (isEn ? "Medication" : "Uống thuốc") : (isEn ? "Vitals" : "Đo chỉ số")}
                            </span>
                            <h5 className="font-bold text-xs sm:text-[13px] text-emerald-950 leading-snug">
                              {notif.title}
                            </h5>
                          </div>

                          <p className="text-xs text-emerald-900/85 leading-relaxed">
                            {notif.body}
                          </p>

                          {/* Quick In-Notification Actions */}
                          <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                            {isWater && (
                              <button
                                type="button"
                                onClick={() => handleDrinkWaterAction(notif.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] uppercase tracking-wider shadow-2xs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>{isEn ? "Drank (+250ml)" : "Đã uống (+250ml)"}</span>
                              </button>
                            )}

                            {isMed && (
                              <button
                                type="button"
                                onClick={() => handleTakeMedAction(notif.id, notif.metadata?.medName)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] uppercase tracking-wider shadow-2xs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>{isEn ? "Mark as Taken" : "Đã uống thuốc"}</span>
                              </button>
                            )}

                            {isVitals && (
                              <button
                                type="button"
                                onClick={() => handleLogVitalsAction(notif.id)}
                                className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10.5px] uppercase tracking-wider shadow-2xs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                              >
                                <Activity className="w-3.5 h-3.5 stroke-[3]" />
                                <span>{isEn ? "Log Vitals Now" : "Ghi nhận chỉ số ngay"}</span>
                              </button>
                            )}

                            <span className="text-[10.5px] text-emerald-700/60 font-mono ml-auto">
                              ⏱️ {notif.timeStr}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delete notification item */}
                      <button
                        type="button"
                        onClick={() => reminderService.deleteNotification(notif.id)}
                        className="w-6 h-6 rounded-lg hover:bg-emerald-50 text-emerald-600/50 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title={isEn ? "Remove notification" : "Xóa thông báo"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* FOOTER BAR (Streamlined & Clean)                                          */}
        {/* ========================================================================= */}
        <div className="px-4 sm:px-6 py-2.5 pb-[calc(max(env(safe-area-inset-bottom,0px),12px)+0.4rem)] border-t border-emerald-100/90 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer py-0.5"
            >
              ✓ {isEn ? "Mark all as read" : "Đánh dấu đã đọc"}
            </button>
            <span className="text-emerald-200">•</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-medium text-emerald-700/60 hover:text-rose-600 transition-colors cursor-pointer py-0.5"
            >
              {isEn ? "Clear all" : "Xóa tất cả"}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
          >
            {isEn ? "Close" : "Đóng"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
