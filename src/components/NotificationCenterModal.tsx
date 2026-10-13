import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Bell, Droplets, Pill, Activity, Check, Trash2, Settings, AlertTriangle, Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { reminderService, AppNotificationItem, isVitalsOrMetric } from '../services/reminderService';
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

    reminderService.ensureActiveRemindersInNotificationCenter();
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

  const [itemToDelete, setItemToDelete] = useState<AppNotificationItem | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  const handleConfirmDeleteItem = () => {
    if (!itemToDelete) return;
    reminderService.deleteNotification(itemToDelete.id);
    setNotifications(prev => prev.filter(n => n.id !== itemToDelete.id));
    showFeedback(isEn ? 'Notification deleted' : 'Đã xóa thông báo');
    setItemToDelete(null);
  };

  const handleConfirmClearAll = () => {
    reminderService.clearNotifications();
    setNotifications([]);
    showFeedback(isEn ? 'Cleared notifications history' : 'Đã xóa toàn bộ lịch sử thông báo');
    setShowClearAllConfirm(false);
  };

  const handleDrinkWaterAction = (notifId: string) => {
    reminderService.markAsRead(notifId);
    reminderService.recordWaterIntake(250);
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

  // Helper to categorize each notification accurately between Water, Vitals/Metrics, and Medication
  const getNotificationCategoryType = (item: AppNotificationItem): 'water' | 'vitals' | 'medication' | 'general' => {
    if (item.type === 'water') return 'water';
    if (item.type === 'vitals' || isVitalsOrMetric(item.metadata?.category, item.metadata?.medName || item.title, item.id)) {
      return 'vitals';
    }
    if (item.type === 'medication') return 'medication';
    return 'general';
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter(item => {
    if (activeTab === 'all') return true;
    return getNotificationCategoryType(item) === activeTab;
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
        className="bg-[#FAF9F5] rounded-none sm:rounded-3xl w-full h-full sm:max-w-2xl sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-0 sm:border sm:border-slate-200"
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

          <div className="flex items-center gap-2 shrink-0">
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
              key="notification-action-feedback"
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
        {/* FILTER TABS & ACTIONS (Color-coded by notification type)                 */}
        {/* ========================================================================= */}
        <div className="px-4 sm:px-6 py-2 border-b border-slate-200/80 bg-white flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs text-force-white",
                activeTab === 'all'
                  ? "bg-teal-600 hover:bg-teal-700 text-white text-force-white ring-2 ring-teal-400/50"
                  : "bg-teal-600 hover:bg-teal-700 text-white text-force-white opacity-90"
              )}
            >
              <span className="text-white text-force-white">{isEn ? "All" : "Tất cả"} ({notifications.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('water')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap",
                activeTab === 'water'
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-sky-50 text-sky-900 hover:bg-sky-100/90 border border-sky-200"
              )}
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>{isEn ? "Water" : "Uống nước"} ({notifications.filter(n => getNotificationCategoryType(n) === 'water').length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('medication')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap",
                activeTab === 'medication'
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-900 hover:bg-amber-100/90 border border-amber-200"
              )}
            >
              <Pill className="w-3.5 h-3.5" />
              <span>{isEn ? "Medication" : "Uống thuốc"} ({notifications.filter(n => getNotificationCategoryType(n) === 'medication').length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vitals')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap",
                activeTab === 'vitals'
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 text-rose-900 hover:bg-rose-100/90 border border-rose-200"
              )}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{isEn ? "Health Vitals" : "Đo chỉ số"} ({notifications.filter(n => getNotificationCategoryType(n) === 'vitals').length})</span>
            </button>
          </div>

          {activeTab !== 'water' && (
            <button
              type="button"
              onClick={() => {
                if (onOpenMedicationModal) {
                  onOpenMedicationModal();
                } else {
                  onOpenSettings();
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold border border-teal-600 flex items-center gap-1 text-[11px] shadow-xs transition-all cursor-pointer active:scale-95 text-force-white shrink-0 ml-auto"
              title={isEn ? "Add reminder" : "Thêm lịch nhắc"}
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-force-white">{isEn ? "Add reminder" : "Thêm lịch nhắc"}</span>
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* NOTIFICATIONS LIST (Color-coded by category: Medication, Water, Vitals)   */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-5 space-y-2.5 bg-[#FAF9F5]">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-2.5 bg-white rounded-2xl border border-dashed border-slate-200 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center mx-auto shadow-2xs">
                <Bell className="w-6 h-6 text-slate-500" />
              </div>
              <div className="max-w-sm mx-auto space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                  {isEn ? "No notifications in this category" : "Chưa có thông báo nào trong mục này"}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isEn 
                    ? "Notifications will appear here when your scheduled reminders trigger."
                    : "Các lời nhắc uống nước định kỳ, lịch uống thuốc và đo chỉ số sẽ tự động xuất hiện ở đây khi đến giờ."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredNotifications.map((notif, idx) => {
                const catType = getNotificationCategoryType(notif);
                const isWater = catType === 'water';
                const isVitals = catType === 'vitals';
                const isMed = catType === 'medication';

                // Clean presentation title and body if it contains outdated/mismatched wording
                let displayTitle = notif.title;
                let displayBody = notif.body;
                if (isVitals) {
                  displayTitle = displayTitle
                    .replace(/💊\s*Lịch nhắc uống thuốc/gi, '🩺 Lịch nhắc đo chỉ số')
                    .replace(/Lịch nhắc uống thuốc & đo chỉ số/gi, 'Lịch nhắc đo chỉ số')
                    .replace(/uống thuốc:/gi, 'đo chỉ số:');
                  if (displayBody.includes('uống thuốc')) {
                    displayBody = displayBody
                      .replace('Hãy uống thuốc đúng giờ theo chỉ định.', 'Hãy kiểm tra và ghi lại số đo đúng giờ.')
                      .replace('Đã đến giờ uống thuốc', 'Đã đến giờ kiểm tra chỉ số');
                  }
                }

                // Distinct color identity per notification type:
                // - Water: Light Sky Blue (#f0f9ff)
                // - Medication: Warm Amber/Golden Peach (#fffbeb)
                // - Vitals: Soft Rose/Coral (#fff1f2)
                // - General: Soft Teal (#f0fdfa)
                const theme = isWater
                  ? {
                      cardBg: notif.read ? "bg-[#f0f9ff]/65" : "bg-[#f0f9ff]",
                      border: notif.read ? "border-sky-200/70" : "border-sky-400 ring-1 ring-sky-300/80 shadow-xs",
                      unreadStripe: "bg-sky-500",
                      iconBox: "bg-white text-sky-600 border border-sky-200 shadow-2xs",
                      title: "text-sky-950 font-bold",
                      body: "text-slate-800",
                      time: "text-sky-700/80",
                      deleteHover: "hover:bg-sky-100 text-sky-600/60 hover:text-rose-600",
                      Icon: Droplets
                    }
                  : isMed
                  ? {
                      cardBg: notif.read ? "bg-[#fffbeb]/65" : "bg-[#fffbeb]",
                      border: notif.read ? "border-amber-200/70" : "border-amber-400 ring-1 ring-amber-300/80 shadow-xs",
                      unreadStripe: "bg-amber-500",
                      iconBox: "bg-white text-amber-600 border border-amber-200 shadow-2xs",
                      title: "text-amber-950 font-bold",
                      body: "text-slate-800",
                      time: "text-amber-700/80",
                      deleteHover: "hover:bg-amber-100 text-amber-600/60 hover:text-rose-600",
                      Icon: Pill
                    }
                  : isVitals
                  ? {
                      cardBg: notif.read ? "bg-[#fff1f2]/65" : "bg-[#fff1f2]",
                      border: notif.read ? "border-rose-200/70" : "border-rose-400 ring-1 ring-rose-300/80 shadow-xs",
                      unreadStripe: "bg-rose-500",
                      iconBox: "bg-white text-rose-600 border border-rose-200 shadow-2xs",
                      title: "text-rose-950 font-bold",
                      body: "text-slate-800",
                      time: "text-rose-700/80",
                      deleteHover: "hover:bg-rose-100 text-rose-600/60 hover:text-rose-700",
                      Icon: Activity
                    }
                  : {
                      cardBg: notif.read ? "bg-[#f0fdfa]/65" : "bg-[#f0fdfa]",
                      border: notif.read ? "border-teal-200/70" : "border-teal-400 ring-1 ring-teal-300/80 shadow-xs",
                      unreadStripe: "bg-teal-500",
                      iconBox: "bg-white text-teal-600 border border-teal-200 shadow-2xs",
                      title: "text-teal-950 font-bold",
                      body: "text-slate-800",
                      time: "text-teal-700/80",
                      deleteHover: "hover:bg-teal-100 text-teal-600/60 hover:text-rose-600",
                      Icon: Bell
                    };

                const NotificationIcon = theme.Icon;

                return (
                  <div
                    key={`${notif.id || 'notif'}-${idx}`}
                    onClick={() => {
                      if (!notif.read) reminderService.markAsRead(notif.id);
                      if (isVitals && onOpenVitalsModal) {
                        onOpenVitalsModal();
                        onClose();
                      }
                    }}
                    className={cn(
                      "p-3 sm:p-3.5 rounded-xl border transition-all duration-200 shadow-2xs relative overflow-hidden group cursor-pointer",
                      theme.cardBg,
                      theme.border,
                      notif.read && "opacity-90"
                    )}
                  >
                    {/* Unread Left Border Stripe */}
                    {!notif.read && (
                      <span className={cn("absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl", theme.unreadStripe)} />
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                        {/* Type Icon Badge */}
                        <div className={cn(
                          "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0",
                          theme.iconBox
                        )}>
                          <NotificationIcon className="w-4.5 h-4.5" />
                        </div>

                        {/* Title & Body (Clean layout without extra badge tag or action buttons) */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className={cn("text-xs sm:text-[13px] font-bold leading-snug", theme.title)}>
                              {displayTitle}
                            </h5>
                            <span className={cn("text-[10px] sm:text-[11px] font-mono shrink-0 font-medium", theme.time)}>
                              {notif.timeStr}
                            </span>
                          </div>

                          <p className={cn("text-xs leading-relaxed", theme.body)}>
                            {displayBody}
                          </p>
                        </div>
                      </div>

                      {/* Delete notification item */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(notif);
                        }}
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5",
                          theme.deleteHover
                        )}
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
              onClick={() => setShowClearAllConfirm(true)}
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

        {/* ========================================================================= */}
        {/* CONFIRMATION POPUP: DELETE SINGLE NOTIFICATION ITEM                       */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {itemToDelete && (
            <motion.div 
              key="delete-notification-item-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
              role="dialog"
              aria-modal="true"
            >
              <div 
                className="fixed inset-0" 
                onClick={() => setItemToDelete(null)} 
              />
              <motion.div
                key="delete-notification-item-dialog"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10"
              >
                <div className="p-5 pb-4 border-b border-slate-100 flex items-start justify-between bg-rose-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                      <Trash2 className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {isEn ? "Delete Notification" : "Xác nhận xóa thông báo"}
                      </h4>
                      <p className="text-[11px] text-rose-700 font-medium">
                        {isEn ? "Remove from notification center" : "Gỡ thông báo này khỏi danh sách"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setItemToDelete(null)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isEn 
                      ? "Are you sure you want to remove this notification from your history?" 
                      : "Bạn có chắc chắn muốn xóa thông báo này khỏi danh sách lịch sử không?"}
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 truncate">{itemToDelete.title}</p>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">{itemToDelete.timeStr}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{itemToDelete.body}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setItemToDelete(null)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-white text-xs font-bold transition-all cursor-pointer"
                  >
                    {isEn ? "Cancel" : "Hủy"}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteItem}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer text-force-white active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                    <span className="text-white text-force-white">{isEn ? "Delete" : "Xóa"}</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* CONFIRMATION POPUP: CLEAR ALL NOTIFICATIONS                               */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {showClearAllConfirm && (
            <motion.div 
              key="clear-all-notifications-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
              role="dialog"
              aria-modal="true"
            >
              <div 
                className="fixed inset-0" 
                onClick={() => setShowClearAllConfirm(false)} 
              />
              <motion.div
                key="clear-all-notifications-dialog"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10"
              >
                <div className="p-5 pb-4 border-b border-slate-100 flex items-start justify-between bg-rose-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                      <Trash2 className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {isEn ? "Clear All Notifications" : "Xóa tất cả thông báo"}
                      </h4>
                      <p className="text-[11px] text-rose-700 font-medium">
                        {isEn ? "Clear all notifications history" : "Dọn sạch hộp thông báo"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowClearAllConfirm(false)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isEn 
                      ? "Are you sure you want to clear all notifications? This action cannot be undone." 
                      : "Bạn có chắc chắn muốn xóa toàn bộ lịch sử thông báo trên thanh thông báo không? Hành động này không thể hoàn tác."}
                  </p>
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      {isEn
                        ? `Will remove ${notifications.length} notifications permanently.`
                        : `Sẽ xóa vĩnh viễn ${notifications.length} thông báo hiện có.`}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowClearAllConfirm(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-white text-xs font-bold transition-all cursor-pointer"
                  >
                    {isEn ? "Cancel" : "Hủy"}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmClearAll}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer text-force-white active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                    <span className="text-white text-force-white">{isEn ? "Clear All" : "Xóa tất cả"}</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
