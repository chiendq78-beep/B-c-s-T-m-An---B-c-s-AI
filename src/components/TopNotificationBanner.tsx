import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets, Pill, Activity, Bell, X, Check, ExternalLink } from 'lucide-react';
import { AppNotificationItem } from '../services/reminderService';
import { cn } from '../lib/utils';

interface TopNotificationBannerProps {
  onOpenNotificationCenter: () => void;
  onDrinkWaterSuccess?: () => void;
  onOpenVitalsModal?: () => void;
}

export default function TopNotificationBanner({
  onOpenNotificationCenter,
  onDrinkWaterSuccess,
  onOpenVitalsModal
}: TopNotificationBannerProps) {
  const [currentNotification, setCurrentNotification] = useState<AppNotificationItem | null>(null);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    const handleNewNotification = (e: any) => {
      const notif = e.detail as AppNotificationItem;
      if (!notif) return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setCurrentNotification(notif);

      // Auto dismiss after 8 seconds
      timeoutRef.current = setTimeout(() => {
        setCurrentNotification(null);
      }, 8000);
    };

    window.addEventListener('app-new-notification', handleNewNotification);
    return () => {
      window.removeEventListener('app-new-notification', handleNewNotification);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCurrentNotification(null);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentNotification) return;

    if (currentNotification.type === 'water') {
      window.dispatchEvent(new CustomEvent('app-quick-drink-water', { detail: { cups: 1 } }));
      if (onDrinkWaterSuccess) onDrinkWaterSuccess();
    } else if (currentNotification.type === 'vitals') {
      if (onOpenVitalsModal) onOpenVitalsModal();
    } else if (currentNotification.type === 'medication') {
      // Mark as completed
      window.dispatchEvent(new CustomEvent('app-quick-take-med', { detail: currentNotification.metadata }));
    }

    handleDismiss();
  };

  if (!currentNotification) return null;

  const isWater = currentNotification.type === 'water';
  const isMed = currentNotification.type === 'medication';
  const isVitals = currentNotification.type === 'vitals';

  return (
    <div className="fixed top-2 sm:top-3 inset-x-2 sm:inset-x-auto sm:right-4 sm:max-w-md z-[120] pointer-events-none select-none">
      <AnimatePresence>
        <motion.div
          key={currentNotification.id}
          initial={{ opacity: 0, y: -25, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 450, damping: 32 }}
          onClick={() => {
            onOpenNotificationCenter();
            handleDismiss();
          }}
          className={cn(
            "pointer-events-auto rounded-2xl p-3 sm:p-3.5 shadow-xl transition-all cursor-pointer",
            "bg-[#fbfdfc]/98 sm:bg-white/98 backdrop-blur-md border border-emerald-200/90 shadow-emerald-950/10"
          )}
        >
          {/* Top Line: App Branding & Live Tag (Streamlined) */}
          <div className="flex items-center justify-between gap-2 pb-1.5 mb-2 border-b border-emerald-100/80 text-[10.5px]">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-xs" />
              <span>Bác sĩ Tâm An • Thông báo</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-emerald-700/70 font-mono text-[9.5px]">
                {currentNotification.timeStr || "Vừa xong"}
              </span>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-5 h-5 rounded-md hover:bg-emerald-100/60 text-emerald-600/70 hover:text-emerald-900 flex items-center justify-center transition-colors cursor-pointer"
                title="Đóng thông báo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className={cn(
              "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs",
              isWater && "bg-cyan-50 text-cyan-700 border border-cyan-200/90",
              isMed && "bg-emerald-50 text-emerald-700 border border-emerald-200/90",
              isVitals && "bg-teal-50 text-teal-700 border border-teal-200/90",
              !isWater && !isMed && !isVitals && "bg-emerald-50 text-emerald-700 border border-emerald-200/90"
            )}>
              {isWater && <Droplets className="w-4.5 h-4.5 text-cyan-600" />}
              {isMed && <Pill className="w-4.5 h-4.5 text-emerald-600" />}
              {isVitals && <Activity className="w-4.5 h-4.5 text-teal-600" />}
              {!isWater && !isMed && !isVitals && <Bell className="w-4.5 h-4.5 text-emerald-600" />}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <h4 className="font-bold text-xs sm:text-[13px] text-emerald-950 leading-snug line-clamp-1">
                {currentNotification.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-emerald-900/85 leading-relaxed line-clamp-2">
                {currentNotification.body}
              </p>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                {isWater && (
                  <button
                    type="button"
                    onClick={handleActionClick}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] uppercase tracking-wider shadow-2xs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Đã uống (+250ml)</span>
                  </button>
                )}

                {isMed && (
                  <button
                    type="button"
                    onClick={handleActionClick}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] uppercase tracking-wider shadow-2xs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Đã uống thuốc</span>
                  </button>
                )}

                {isVitals && (
                  <button
                    type="button"
                    onClick={handleActionClick}
                    className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10.5px] uppercase tracking-wider shadow-2xs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                  >
                    <Activity className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Ghi chỉ số ngay</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onOpenNotificationCenter();
                    handleDismiss();
                  }}
                  className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[10.5px] flex items-center gap-1 border border-emerald-200/80 transition-all cursor-pointer"
                >
                  <span>Xem chi tiết</span>
                  <ExternalLink className="w-3 h-3 text-emerald-700" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
