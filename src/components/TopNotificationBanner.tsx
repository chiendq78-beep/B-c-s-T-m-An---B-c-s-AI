import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets, Pill, Activity, Bell, X, Check, ExternalLink } from 'lucide-react';
import { AppNotificationItem, isVitalsOrMetric } from '../services/reminderService';
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
  const isVitals = currentNotification.type === 'vitals' || 
    isVitalsOrMetric(
      currentNotification.metadata?.category,
      currentNotification.metadata?.medName || currentNotification.title,
      currentNotification.id
    );
  const isMed = !isWater && !isVitals;

  // Clean presentation title and body if it contains outdated/mismatched wording
  let displayTitle = currentNotification.title;
  let displayBody = currentNotification.body;
  if (isVitals) {
    if (displayTitle.includes('uống thuốc & đo chỉ số')) {
      displayTitle = displayTitle.replace('💊 Lịch nhắc uống thuốc & đo chỉ số', '🩺 Lịch nhắc đo chỉ số');
    } else if (displayTitle.startsWith('💊 Lịch nhắc uống thuốc:')) {
      displayTitle = displayTitle.replace('💊 Lịch nhắc uống thuốc:', '🩺 Lịch nhắc đo chỉ số:');
    }
    if (displayBody.includes('Hãy uống thuốc đúng giờ')) {
      displayBody = displayBody.replace('Hãy uống thuốc đúng giờ theo chỉ định.', 'Hãy kiểm tra và ghi lại số đo đúng giờ.');
    }
  }

  return (
    <div className="fixed top-2 sm:top-3 inset-x-2 sm:inset-x-auto sm:right-4 sm:max-w-md z-[120] pointer-events-none select-none">
      <AnimatePresence>
        <motion.div
          key={currentNotification.id || 'current-top-notification'}
          initial={{ opacity: 0, y: -25, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 450, damping: 32 }}
          onClick={() => {
            onOpenNotificationCenter();
            handleDismiss();
          }}
          className={cn(
            "pointer-events-auto rounded-2xl p-3 sm:p-3.5 shadow-xl transition-all cursor-pointer backdrop-blur-md border",
            isWater && "bg-[#f0f9ff]/98 border-sky-300 shadow-sky-950/10",
            isMed && "bg-[#fffbeb]/98 border-amber-300 shadow-amber-950/10",
            isVitals && "bg-[#fff1f2]/98 border-rose-300 shadow-rose-950/10",
            !isWater && !isMed && !isVitals && "bg-white/98 border-emerald-200/90 shadow-emerald-950/10"
          )}
        >
          {/* Top Line: App Branding & Live Tag (Streamlined) */}
          <div className={cn(
            "flex items-center justify-between gap-2 pb-1.5 mb-2 border-b text-[10.5px]",
            isWater && "border-sky-200/80 text-sky-900",
            isMed && "border-amber-200/80 text-amber-900",
            isVitals && "border-rose-200/80 text-rose-900",
            !isWater && !isMed && !isVitals && "border-emerald-100/80 text-emerald-800"
          )}>
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <span className={cn(
                "w-2 h-2 rounded-full animate-pulse shadow-xs",
                isWater && "bg-sky-500",
                isMed && "bg-amber-500",
                isVitals && "bg-rose-500",
                !isWater && !isMed && !isVitals && "bg-emerald-500"
              )} />
              <span>Bác sĩ Tâm An • {isWater ? "Nhắc uống nước" : isVitals ? "Nhắc đo chỉ số" : "Nhắc uống thuốc"}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9.5px] opacity-75">
                {currentNotification.timeStr || "Vừa xong"}
              </span>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-5 h-5 rounded-md hover:bg-black/5 flex items-center justify-center transition-colors cursor-pointer"
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
              isWater && "bg-white text-sky-600 border border-sky-200",
              isMed && "bg-white text-amber-600 border border-amber-200",
              isVitals && "bg-white text-rose-600 border border-rose-200",
              !isWater && !isMed && !isVitals && "bg-white text-emerald-600 border border-emerald-200"
            )}>
              {isWater && <Droplets className="w-4.5 h-4.5 text-sky-600" />}
              {isMed && <Pill className="w-4.5 h-4.5 text-amber-600" />}
              {isVitals && <Activity className="w-4.5 h-4.5 text-rose-600" />}
              {!isWater && !isMed && !isVitals && <Bell className="w-4.5 h-4.5 text-emerald-600" />}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <h4 className={cn(
                "font-bold text-xs sm:text-[13px] leading-snug line-clamp-1",
                isWater && "text-sky-950",
                isMed && "text-amber-950",
                isVitals && "text-rose-950",
                !isWater && !isMed && !isVitals && "text-emerald-950"
              )}>
                {displayTitle}
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-800 leading-relaxed line-clamp-2">
                {displayBody}
              </p>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                {isWater && (
                  <button
                    type="button"
                    onClick={handleActionClick}
                    className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10.5px] uppercase tracking-wider shadow-2xs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Đã uống (+250ml)</span>
                  </button>
                )}

                {isMed && (
                  <button
                    type="button"
                    onClick={handleActionClick}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10.5px] uppercase tracking-wider shadow-2xs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Đã uống thuốc</span>
                  </button>
                )}

                {isVitals && (
                  <button
                    type="button"
                    onClick={handleActionClick}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10.5px] uppercase tracking-wider shadow-2xs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
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
                  className={cn(
                    "px-2 py-1 rounded-lg font-semibold text-[10.5px] flex items-center gap-1 border transition-all cursor-pointer",
                    isWater && "bg-white text-sky-800 border-sky-200 hover:bg-sky-50",
                    isMed && "bg-white text-amber-800 border-amber-200 hover:bg-amber-50",
                    isVitals && "bg-white text-rose-800 border-rose-200 hover:bg-rose-50",
                    !isWater && !isMed && !isVitals && "bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                  )}
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
