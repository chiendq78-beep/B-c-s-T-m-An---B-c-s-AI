import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight, 
  X, 
  LogOut, 
  ShieldCheck, 
  HeartHandshake, 
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';

interface EdgeGestureHandlerProps {
  onBack: () => boolean; // returns true if handled back, false if at root
  onForward: () => boolean; // returns true if handled forward, false if at end
  canGoBack: boolean;
  canGoForward: boolean;
  hasActiveModalOrDrawer: boolean;
  closeActiveModalOrDrawer: () => void;
  currentViewTitle?: string;
  previousViewTitle?: string;
  nextViewTitle?: string;
}

export default function EdgeGestureHandler({
  onBack,
  onForward,
  canGoBack,
  canGoForward,
  hasActiveModalOrDrawer,
  closeActiveModalOrDrawer,
  currentViewTitle = 'Trang chủ',
  previousViewTitle,
  nextViewTitle
}: EdgeGestureHandlerProps) {
  // Swipe tracking state
  const [swipeState, setSwipeState] = useState<{
    side: 'left' | 'right' | null;
    distance: number;
    startY: number;
    currentY: number;
    isTriggered: boolean;
  }>({
    side: null,
    distance: 0,
    startY: 0,
    currentY: 0,
    isTriggered: false
  });

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    icon?: 'info' | 'success' | 'exit';
    id: number;
  } | null>(null);

  // Exit dialog state
  const [showExitModal, setShowExitModal] = useState(false);

  // Time of last left edge swipe at root
  const lastExitSwipeTimeRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; edge: 'left' | 'right' | null } | null>(null);
  const hasTriggeredHapticRef = useRef(false);

  const TRIGGER_THRESHOLD = 58; // px required to activate
  const EDGE_ZONE = 48; // px from edge to detect gesture

  const showToast = useCallback((text: string, icon: 'info' | 'success' | 'exit' = 'info') => {
    setToastMessage({ text, icon, id: Date.now() });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 2400);
  }, []);

  // Handle touch events
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const width = window.innerWidth;
      const x = touch.clientX;
      const y = touch.clientY;

      let edge: 'left' | 'right' | null = null;
      if (x <= EDGE_ZONE) {
        edge = 'left';
      } else if (x >= width - EDGE_ZONE) {
        edge = 'right';
      }

      if (edge) {
        touchStartRef.current = { x, y, edge };
        hasTriggeredHapticRef.current = false;
      } else {
        touchStartRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const start = touchStartRef.current;
      const deltaX = touch.clientX - start.x;
      const deltaY = Math.abs(touch.clientY - start.y);

      // Check if moving in correct direction from the edge
      if (start.edge === 'left') {
        // Must move to the right
        if (deltaX > 4 && deltaX > deltaY * 0.4) {
          // Block browser's native back navigation or pull gestures immediately
          if (e.cancelable) {
            e.preventDefault();
          }

          const distance = Math.min(Math.max(0, deltaX), 130);
          const isTriggered = distance >= TRIGGER_THRESHOLD;

          if (isTriggered && !hasTriggeredHapticRef.current) {
            try {
              if (navigator.vibrate) navigator.vibrate(20);
            } catch {}
            hasTriggeredHapticRef.current = true;
          } else if (!isTriggered) {
            hasTriggeredHapticRef.current = false;
          }

          setSwipeState({
            side: 'left',
            distance,
            startY: start.y,
            currentY: touch.clientY,
            isTriggered
          });
        }
      } else if (start.edge === 'right') {
        // Must move to the left
        const pullDistance = start.x - touch.clientX;
        if (pullDistance > 4 && pullDistance > deltaY * 0.4) {
          // Block browser's native forward navigation or swipe gestures
          if (e.cancelable) {
            e.preventDefault();
          }

          const distance = Math.min(Math.max(0, pullDistance), 130);
          const isTriggered = distance >= TRIGGER_THRESHOLD;

          if (isTriggered && !hasTriggeredHapticRef.current) {
            try {
              if (navigator.vibrate) navigator.vibrate(20);
            } catch {}
            hasTriggeredHapticRef.current = true;
          } else if (!isTriggered) {
            hasTriggeredHapticRef.current = false;
          }

          setSwipeState({
            side: 'right',
            distance,
            startY: start.y,
            currentY: touch.clientY,
            isTriggered
          });
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartRef.current && (swipeState.side || touchStartRef.current.edge)) {
        const side = swipeState.side || touchStartRef.current.edge;
        const isTriggered = swipeState.isTriggered;

        if (isTriggered) {
          if (side === 'left') {
            // Left Edge Swipe Action:
            // 1. Close open modal/drawer if any
            if (hasActiveModalOrDrawer) {
              closeActiveModalOrDrawer();
              showToast('Đã đóng cửa sổ', 'info');
            } 
            // 2. Or Navigate Back if history exists or not at home
            else if (canGoBack) {
              const handled = onBack();
              if (handled && previousViewTitle) {
                showToast(`Quay lại: ${previousViewTitle}`, 'info');
              } else if (handled) {
                showToast('Đã quay lại', 'info');
              }
            } 
            // 3. Or Trigger Exit App flow if strictly at root home
            else {
              const now = Date.now();
              if (now - lastExitSwipeTimeRef.current < 2200) {
                // Trigger exit confirmation modal
                setShowExitModal(true);
              } else {
                lastExitSwipeTimeRef.current = now;
                showToast('Vuốt cạnh trái lần nữa để thoát ứng dụng', 'exit');
              }
            }
          } else if (side === 'right') {
            // Right Edge Swipe Action:
            // Navigate forward if available
            if (canGoForward) {
              const handled = onForward();
              if (handled && nextViewTitle) {
                showToast(`Tiến tới: ${nextViewTitle}`, 'info');
              }
            } else {
              showToast('Đang ở trang mới nhất', 'info');
            }
          }
        }
      }

      // Reset state
      touchStartRef.current = null;
      hasTriggeredHapticRef.current = false;
      setSwipeState({
        side: null,
        distance: 0,
        startY: 0,
        currentY: 0,
        isTriggered: false
      });
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    window.addEventListener('touchend', handleTouchEnd, { capture: true });
    window.addEventListener('touchcancel', handleTouchEnd, { capture: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart, { capture: true });
      window.removeEventListener('touchmove', handleTouchMove, { capture: true });
      window.removeEventListener('touchend', handleTouchEnd, { capture: true });
      window.removeEventListener('touchcancel', handleTouchEnd, { capture: true });
    };
  }, [
    swipeState.side,
    swipeState.isTriggered,
    hasActiveModalOrDrawer,
    canGoBack,
    canGoForward,
    onBack,
    onForward,
    closeActiveModalOrDrawer,
    previousViewTitle,
    nextViewTitle,
    showToast
  ]);

  // Determine indicator iconography & labels for Left Swipe
  let leftActionType: 'close' | 'back' | 'exit' = 'back';
  if (hasActiveModalOrDrawer) {
    leftActionType = 'close';
  } else if (!canGoBack) {
    leftActionType = 'exit';
  }

  return (
    <>
      {/* Dynamic Visual Feedback Indicator for Edge Swipes */}
      <AnimatePresence>
        {swipeState.side && (
          <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
            {/* Left Edge Gesture Floating Pill */}
            {swipeState.side === 'left' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: swipeState.isTriggered ? 1.08 : 1,
                  x: Math.max(0, swipeState.distance - 20)
                }}
                exit={{ opacity: 0, scale: 0.6, x: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                style={{ top: `${Math.max(80, Math.min(window.innerHeight - 120, swipeState.currentY || swipeState.startY))}px` }}
                className="absolute left-0 -translate-y-1/2 flex items-center"
              >
                {/* Curved SVG Tear / Bubble */}
                <div
                  className={`flex items-center gap-2 pl-3 pr-4 py-3 rounded-r-3xl shadow-2xl border transition-all duration-150 ${
                    swipeState.isTriggered
                      ? leftActionType === 'exit'
                        ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_25px_rgba(225,29,72,0.6)] ring-4 ring-rose-300/40'
                        : leftActionType === 'close'
                        ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_25px_rgba(217,119,6,0.6)] ring-4 ring-amber-300/40'
                        : 'bg-teal-600 text-white border-teal-400 shadow-[0_0_25px_rgba(13,148,136,0.6)] ring-4 ring-teal-300/40'
                      : 'bg-slate-900/85 text-slate-200 border-white/20 backdrop-blur-md shadow-lg'
                  }`}
                >
                  <div className={`p-1.5 rounded-full ${swipeState.isTriggered ? 'bg-white/25 animate-pulse' : 'bg-white/10'}`}>
                    {leftActionType === 'close' ? (
                      <X className="w-5 h-5" />
                    ) : leftActionType === 'exit' ? (
                      <LogOut className="w-5 h-5" />
                    ) : (
                      <ArrowLeft className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-black uppercase tracking-wider leading-none">
                      {leftActionType === 'close'
                        ? (swipeState.isTriggered ? 'Thả để đóng' : 'Đóng cửa sổ')
                        : leftActionType === 'exit'
                        ? (swipeState.isTriggered ? 'Thả để thoát' : 'Thoát ứng dụng')
                        : (swipeState.isTriggered ? 'Thả để quay lại' : `Về ${previousViewTitle || 'trước'}`)}
                    </span>
                    <span className="text-[9px] opacity-80 mt-0.5 font-medium">
                      {swipeState.isTriggered ? 'Đã kích hoạt' : 'Kéo thêm để chọn'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Right Edge Gesture Floating Pill */}
            {swipeState.side === 'right' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: swipeState.isTriggered ? 1.08 : 1,
                  x: -Math.max(0, swipeState.distance - 20)
                }}
                exit={{ opacity: 0, scale: 0.6, x: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                style={{ top: `${Math.max(80, Math.min(window.innerHeight - 120, swipeState.currentY || swipeState.startY))}px` }}
                className="absolute right-0 -translate-y-1/2 flex items-center flex-row-reverse"
              >
                <div
                  className={`flex items-center gap-2 pr-3 pl-4 py-3 rounded-l-3xl shadow-2xl border transition-all duration-150 ${
                    swipeState.isTriggered
                      ? canGoForward
                        ? 'bg-teal-600 text-white border-teal-400 shadow-[0_0_25px_rgba(13,148,136,0.6)] ring-4 ring-teal-300/40'
                        : 'bg-slate-700 text-white border-slate-500 shadow-md ring-2 ring-slate-400/30'
                      : 'bg-slate-900/85 text-slate-200 border-white/20 backdrop-blur-md shadow-lg'
                  }`}
                >
                  <div className="flex flex-col text-right">
                    <span className="text-[11px] font-black uppercase tracking-wider leading-none">
                      {canGoForward
                        ? (swipeState.isTriggered ? 'Thả để tiến tới' : `Đến ${nextViewTitle || 'tiếp theo'}`)
                        : 'Trang mới nhất'}
                    </span>
                    <span className="text-[9px] opacity-80 mt-0.5 font-medium">
                      {canGoForward 
                        ? (swipeState.isTriggered ? 'Đã kích hoạt' : 'Kéo thêm để tiến')
                        : 'Đã ở cuối lịch sử'}
                    </span>
                  </div>

                  <div className={`p-1.5 rounded-full ${swipeState.isTriggered && canGoForward ? 'bg-white/25 animate-pulse' : 'bg-white/10'}`}>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Floating Gesture Toast Notifications */}
      <AnimatePresence>
        {toastMessage && (
          <div className="fixed top-18 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none px-4 w-full max-w-sm flex justify-center">
            <motion.div
              key={toastMessage.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/90 text-white border border-slate-700/80 shadow-2xl backdrop-blur-xl pointer-events-auto"
            >
              <div className="p-1 rounded-full bg-teal-500/20 text-teal-400 flex-shrink-0">
                {toastMessage.icon === 'exit' ? (
                  <LogOut className="w-4 h-4 text-rose-400" />
                ) : toastMessage.icon === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Info className="w-4 h-4 text-teal-400" />
                )}
              </div>
              <span className="text-xs font-semibold text-slate-100">{toastMessage.text}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exit Confirmation Dialog */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-5"
            >
              {/* Header Visual */}
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 mx-auto flex items-center justify-center shadow-inner">
                <HeartHandshake className="w-8 h-8 text-teal-600 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Xác nhận Thoát Bác sĩ Tâm An?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Tiến độ theo dõi sức khỏe, lịch uống thuốc và chỉ số sinh hiệu của bạn đã được lưu trữ an toàn trên thiết bị.
                </p>
              </div>

              {/* Security & Sync badge */}
              <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Dữ liệu y tế của bạn đã đồng bộ an toàn 100%</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Ở lại ứng dụng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitModal(false);
                    showToast('Đã về trang chủ Tổng quan Bác sĩ Tâm An', 'success');
                    if (onBack) {
                      onBack();
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Về Tổng quan</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
