import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  LogOut, 
  ShieldCheck, 
  HeartHandshake, 
  Info,
  CheckCircle2,
  Power,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';
import { popTopModal, hasAnyOpenModal } from '../utils/modalManager';

interface EdgeGestureHandlerProps {
  onBack?: () => boolean;
  onForward?: () => boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  hasActiveModalOrDrawer: boolean;
  closeActiveModalOrDrawer: () => void;
  currentViewTitle?: string;
  previousViewTitle?: string;
  nextViewTitle?: string;
}

export default function EdgeGestureHandler({
  onBack,
  canGoBack = false,
  hasActiveModalOrDrawer,
  closeActiveModalOrDrawer,
  currentViewTitle = 'Tổng quan',
  previousViewTitle = 'Tổng quan'
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

  // Modal stack reactive tracker
  const [modalCount, setModalCount] = useState(0);

  useEffect(() => {
    const handleStackChange = (e: any) => {
      setModalCount(e?.detail?.count || 0);
    };
    window.addEventListener('modal-stack-change', handleStackChange);
    return () => window.removeEventListener('modal-stack-change', handleStackChange);
  }, []);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    icon?: 'info' | 'success' | 'exit' | 'close' | 'back';
    id: number;
  } | null>(null);

  // Exit dialog state
  const [showExitModal, setShowExitModal] = useState(false);
  const [isAppClosed, setIsAppClosed] = useState(false);

  const startPointerRef = useRef<{ x: number; y: number; edge: 'left' | 'right' | null; isPointerDown: boolean } | null>(null);
  const hasTriggeredHapticRef = useRef(false);

  // S-TimeTable Double-Swipe to Exit Tracker at Root Menus
  const [rootSwipePending, setRootSwipePending] = useState(false);
  const rootSwipeTimerRef = useRef<any>(null);

  // Strict Edge Zone: gestures MUST begin at the edge zone of the screen bezel
  // Dynamically responsive for both phones & tablets
  const getEdgeZone = () => Math.max(38, Math.min(56, window.innerWidth * 0.08));
  const TRIGGER_THRESHOLD = 40; // px required to activate gesture

  const showToast = useCallback((text: string, icon: 'info' | 'success' | 'exit' | 'close' | 'back' = 'info') => {
    setToastMessage({ text, icon, id: Date.now() });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 2000);
  }, []);

  // Check if any modal, card, subwindow or popup is currently active
  const isAnyModalActive = hasActiveModalOrDrawer || modalCount > 0 || hasAnyOpenModal();

  // Unified Gesture Mode: identical hierarchy for BOTH left and right edge swipes
  // 1. If any modal / child card / subwindow is open -> Close it
  // 2. If on sub-screen / can go back -> Navigate back to previous screen
  // 3. If on root menu (Tổng quan, Cơ thể, Bệnh lý, Dược liệu, Luyện tập):
  //    - 1st swipe: Prompt S-TimeTable toast "Vuốt lần nữa để đóng ứng dụng"
  //    - 2nd swipe (within 2.5s): Exit application immediately!
  const getGestureMode = (): 'close_modal' | 'navigate_back' | 'exit_immediate' | 'exit_prompt' => {
    if (isAnyModalActive) {
      return 'close_modal';
    }
    if (canGoBack) {
      return 'navigate_back';
    }
    if (rootSwipePending) {
      return 'exit_immediate';
    }
    return 'exit_prompt';
  };

  const executeUnifiedEdgeAction = useCallback(() => {
    // Priority 1: If any modal/card/popup/subwindow is open -> Close it
    if (isAnyModalActive) {
      if (rootSwipePending) {
        setRootSwipePending(false);
        if (rootSwipeTimerRef.current) clearTimeout(rootSwipeTimerRef.current);
      }
      const popped = popTopModal();
      if (popped) {
        showToast('Đã đóng thẻ / cửa sổ', 'close');
      } else if (hasActiveModalOrDrawer) {
        closeActiveModalOrDrawer();
        showToast('Đã đóng cửa sổ', 'close');
      } else {
        const backEvent = new CustomEvent('app-back-press', { cancelable: true });
        window.dispatchEvent(backEvent);
        showToast('Đã đóng thẻ', 'close');
      }
      try {
        if (navigator.vibrate) navigator.vibrate([20, 30]);
      } catch {}
    }
    // Priority 2: If on a subview / child screen -> Navigate Back to previous screen
    else if (canGoBack) {
      if (onBack) {
        const handled = onBack();
        if (handled) {
          showToast(`Quay lại: ${previousViewTitle || 'Tổng quan'}`, 'back');
        }
      }
    }
    // Priority 3: Already at root menu (Tổng quan, Cơ thể, Bệnh lý, Dược liệu, Luyện tập)
    // Authentic S-TimeTable gesture behavior:
    // - 1st swipe: shows "Vuốt lần nữa để đóng ứng dụng" with 2.5s timer
    // - 2nd swipe: closes app immediately!
    else {
      if (rootSwipePending) {
        // Second swipe confirmed within 2.5 seconds -> Close App!
        setRootSwipePending(false);
        if (rootSwipeTimerRef.current) clearTimeout(rootSwipeTimerRef.current);
        setIsAppClosed(true);
        try {
          if (navigator.vibrate) navigator.vibrate([40, 70, 40]);
        } catch {}
        try {
          window.close();
        } catch {}
      } else {
        // First swipe at root menu -> Activate S-TimeTable confirmation prompt
        setRootSwipePending(true);
        try {
          if (navigator.vibrate) navigator.vibrate(35);
        } catch {}
        if (rootSwipeTimerRef.current) clearTimeout(rootSwipeTimerRef.current);
        rootSwipeTimerRef.current = setTimeout(() => {
          setRootSwipePending(false);
        }, 2500);
      }
    }
  }, [isAnyModalActive, hasActiveModalOrDrawer, closeActiveModalOrDrawer, canGoBack, onBack, previousViewTitle, showToast, rootSwipePending]);

  // Touch event handlers (Mobile & Tablet)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const width = window.innerWidth;
      const x = touch.clientX;
      const y = touch.clientY;
      const edgeZone = getEdgeZone();

      let edge: 'left' | 'right' | null = null;
      if (x <= edgeZone) {
        edge = 'left';
      } else if (x >= width - edgeZone) {
        edge = 'right';
      }

      // ONLY start tracking if initiated strictly at the screen edge
      if (edge) {
        startPointerRef.current = { x, y, edge, isPointerDown: true };
        hasTriggeredHapticRef.current = false;
      } else {
        startPointerRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startPointerRef.current || !startPointerRef.current.isPointerDown || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const start = startPointerRef.current;
      const deltaX = touch.clientX - start.x;
      const deltaY = Math.abs(touch.clientY - start.y);

      // Left edge swipe (swiping inward from left towards right)
      if (start.edge === 'left') {
        if (deltaX > 8 && deltaX > deltaY * 1.2) {
          if (e.cancelable) {
            e.preventDefault();
          }

          const distance = Math.min(Math.max(0, deltaX), 140);
          const isTriggered = distance >= TRIGGER_THRESHOLD;

          if (isTriggered && !hasTriggeredHapticRef.current) {
            try {
              if (navigator.vibrate) navigator.vibrate(25);
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
      } 
      // Right edge swipe (swiping inward from right towards left)
      else if (start.edge === 'right') {
        const pullDistance = start.x - touch.clientX;
        if (pullDistance > 8 && pullDistance > deltaY * 1.2) {
          if (e.cancelable) {
            e.preventDefault();
          }

          const distance = Math.min(Math.max(0, pullDistance), 140);
          const isTriggered = distance >= TRIGGER_THRESHOLD;

          if (isTriggered && !hasTriggeredHapticRef.current) {
            try {
              if (navigator.vibrate) navigator.vibrate(25);
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

    const handleTouchEnd = () => {
      if (startPointerRef.current && (swipeState.side || startPointerRef.current.edge)) {
        const isTriggered = swipeState.isTriggered;
        if (isTriggered) {
          executeUnifiedEdgeAction();
        }
      }

      // Reset swipe state
      startPointerRef.current = null;
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
  }, [swipeState.side, swipeState.isTriggered, executeUnifiedEdgeAction]);

  // Mouse drag support for desktop & preview testing (Strictly at screen edge)
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const width = window.innerWidth;
      const x = e.clientX;
      const y = e.clientY;
      const edgeZone = getEdgeZone();

      let edge: 'left' | 'right' | null = null;
      if (x <= edgeZone) {
        edge = 'left';
      } else if (x >= width - edgeZone) {
        edge = 'right';
      }

      if (edge) {
        startPointerRef.current = { x, y, edge, isPointerDown: true };
        hasTriggeredHapticRef.current = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!startPointerRef.current || !startPointerRef.current.isPointerDown) return;
      const start = startPointerRef.current;
      const deltaX = e.clientX - start.x;
      const deltaY = Math.abs(e.clientY - start.y);

      if (start.edge === 'left') {
        if (deltaX > 8 && deltaX > deltaY * 1.2) {
          const distance = Math.min(Math.max(0, deltaX), 140);
          const isTriggered = distance >= TRIGGER_THRESHOLD;
          setSwipeState({
            side: 'left',
            distance,
            startY: start.y,
            currentY: e.clientY,
            isTriggered
          });
        }
      } else if (start.edge === 'right') {
        const pullDistance = start.x - e.clientX;
        if (pullDistance > 8 && pullDistance > deltaY * 1.2) {
          const distance = Math.min(Math.max(0, pullDistance), 140);
          const isTriggered = distance >= TRIGGER_THRESHOLD;
          setSwipeState({
            side: 'right',
            distance,
            startY: start.y,
            currentY: e.clientY,
            isTriggered
          });
        }
      }
    };

    const handleMouseUp = () => {
      if (startPointerRef.current && (swipeState.side || startPointerRef.current.edge)) {
        if (swipeState.isTriggered) {
          executeUnifiedEdgeAction();
        }
      }

      startPointerRef.current = null;
      hasTriggeredHapticRef.current = false;
      setSwipeState({
        side: null,
        distance: 0,
        startY: 0,
        currentY: 0,
        isTriggered: false
      });
    };

    window.addEventListener('mousedown', handleMouseDown, { capture: true });
    window.addEventListener('mousemove', handleMouseMove, { capture: true });
    window.addEventListener('mouseup', handleMouseUp, { capture: true });

    return () => {
      window.removeEventListener('mousedown', handleMouseDown, { capture: true });
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });
    };
  }, [swipeState.side, swipeState.isTriggered, executeUnifiedEdgeAction]);

  const activeMode = getGestureMode();

  return (
    <>
      {/* Dynamic Visual Feedback Indicator for Edge Swipes (Left & Right) */}
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
                  x: Math.max(0, swipeState.distance - 14)
                }}
                exit={{ opacity: 0, scale: 0.6, x: 0 }}
                transition={{ type: 'spring', damping: 24, stiffness: 340 }}
                style={{ top: `${Math.max(80, Math.min(window.innerHeight - 120, swipeState.currentY || swipeState.startY))}px` }}
                className="absolute left-0 -translate-y-1/2 flex items-center"
              >
                <div
                  className={`flex items-center gap-2.5 pl-3.5 pr-4 py-3 rounded-r-3xl shadow-2xl border transition-all duration-150 ${
                    swipeState.isTriggered
                      ? activeMode === 'close_modal'
                        ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_25px_rgba(217,119,6,0.55)] ring-4 ring-amber-300/40'
                        : activeMode === 'navigate_back'
                          ? 'bg-teal-600 text-white border-teal-400 shadow-[0_0_25px_rgba(13,148,136,0.55)] ring-4 ring-teal-300/40'
                          : activeMode === 'exit_immediate'
                            ? 'bg-rose-700 text-white border-rose-400 shadow-[0_0_30px_rgba(225,29,72,0.7)] ring-4 ring-rose-400/50'
                            : 'bg-rose-600 text-white border-rose-400 shadow-[0_0_25px_rgba(225,29,72,0.55)] ring-4 ring-rose-300/40'
                      : 'bg-slate-900/90 text-slate-100 border-white/20 backdrop-blur-md shadow-lg'
                  }`}
                >
                  <div className={`p-1.5 rounded-full ${swipeState.isTriggered ? 'bg-white/25 animate-pulse' : 'bg-white/15'}`}>
                    {activeMode === 'close_modal' ? (
                      <X className="w-5 h-5" />
                    ) : activeMode === 'navigate_back' ? (
                      <ArrowLeft className="w-5 h-5" />
                    ) : (
                      <Power className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex flex-col text-left select-none">
                    <span className="text-[11px] font-black uppercase tracking-wider leading-none">
                      {activeMode === 'close_modal'
                        ? (swipeState.isTriggered ? 'Thả để đóng thẻ' : 'Đóng thẻ / cửa sổ')
                        : activeMode === 'navigate_back'
                          ? (swipeState.isTriggered ? `Thả để về ${previousViewTitle || 'Tổng quan'}` : `Quay lại ${previousViewTitle || 'Tổng quan'}`)
                          : activeMode === 'exit_immediate'
                            ? (swipeState.isTriggered ? 'Thả để đóng ứng dụng ngay' : 'Đóng ứng dụng (Lần 2)')
                            : (swipeState.isTriggered ? 'Thả để xác nhận đóng' : 'Đóng ứng dụng (S-TimeTable)')}
                    </span>
                    <span className="text-[9px] opacity-80 mt-0.5 font-medium whitespace-nowrap">
                      {swipeState.isTriggered
                        ? (activeMode === 'exit_immediate' ? 'Đã xác nhận • Thả để đóng' : 'Đã kích hoạt cử chỉ')
                        : (activeMode === 'exit_immediate' ? 'Vuốt lần 2 để đóng app' : 'Vuốt mép để đóng app')}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Right Edge Gesture Floating Pill (Identical Action & Feedback to Left Edge) */}
            {swipeState.side === 'right' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: swipeState.isTriggered ? 1.08 : 1,
                  x: -Math.max(0, swipeState.distance - 14)
                }}
                exit={{ opacity: 0, scale: 0.6, x: 0 }}
                transition={{ type: 'spring', damping: 24, stiffness: 340 }}
                style={{ top: `${Math.max(80, Math.min(window.innerHeight - 120, swipeState.currentY || swipeState.startY))}px` }}
                className="absolute right-0 -translate-y-1/2 flex items-center flex-row-reverse"
              >
                <div
                  className={`flex items-center gap-2.5 pr-3.5 pl-4 py-3 rounded-l-3xl shadow-2xl border transition-all duration-150 ${
                    swipeState.isTriggered
                      ? activeMode === 'close_modal'
                        ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_25px_rgba(217,119,6,0.55)] ring-4 ring-amber-300/40'
                        : activeMode === 'navigate_back'
                          ? 'bg-teal-600 text-white border-teal-400 shadow-[0_0_25px_rgba(13,148,136,0.55)] ring-4 ring-teal-300/40'
                          : activeMode === 'exit_immediate'
                            ? 'bg-rose-700 text-white border-rose-400 shadow-[0_0_30px_rgba(225,29,72,0.7)] ring-4 ring-rose-400/50'
                            : 'bg-rose-600 text-white border-rose-400 shadow-[0_0_25px_rgba(225,29,72,0.55)] ring-4 ring-rose-300/40'
                      : 'bg-slate-900/90 text-slate-100 border-white/20 backdrop-blur-md shadow-lg'
                  }`}
                >
                  <div className="flex flex-col text-right select-none">
                    <span className="text-[11px] font-black uppercase tracking-wider leading-none">
                      {activeMode === 'close_modal'
                        ? (swipeState.isTriggered ? 'Thả để đóng thẻ' : 'Đóng thẻ / cửa sổ')
                        : activeMode === 'navigate_back'
                          ? (swipeState.isTriggered ? `Thả để về ${previousViewTitle || 'Tổng quan'}` : `Quay lại ${previousViewTitle || 'Tổng quan'}`)
                          : activeMode === 'exit_immediate'
                            ? (swipeState.isTriggered ? 'Thả để đóng ứng dụng ngay' : 'Đóng ứng dụng (Lần 2)')
                            : (swipeState.isTriggered ? 'Thả để xác nhận đóng' : 'Đóng ứng dụng (S-TimeTable)')}
                    </span>
                    <span className="text-[9px] opacity-80 mt-0.5 font-medium whitespace-nowrap">
                      {swipeState.isTriggered
                        ? (activeMode === 'exit_immediate' ? 'Đã xác nhận • Thả để đóng' : 'Đã kích hoạt cử chỉ')
                        : (activeMode === 'exit_immediate' ? 'Vuốt lần 2 để đóng app' : 'Vuốt mép để đóng app')}
                    </span>
                  </div>

                  <div className={`p-1.5 rounded-full ${swipeState.isTriggered ? 'bg-white/25 animate-pulse' : 'bg-white/15'}`}>
                    {activeMode === 'close_modal' ? (
                      <X className="w-5 h-5" />
                    ) : activeMode === 'navigate_back' ? (
                      <ArrowLeft className="w-5 h-5" />
                    ) : (
                      <Power className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* S-TimeTable Floating Exit Countdown Prompt at Root Menus */}
      <AnimatePresence>
        {rootSwipePending && (
          <div className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-[999999] px-4 w-full max-w-sm pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, y: 25, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 text-white rounded-2xl p-3 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8.5 h-8.5 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                    <Power className="w-4.5 h-4.5 animate-pulse text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-100">Vuốt lần nữa để đóng ứng dụng</p>
                    <p className="text-[10px] text-slate-400 truncate">Menu gốc • Vuốt mép trái hoặc phải để thoát</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setRootSwipePending(false);
                      setIsAppClosed(true);
                      try { window.close(); } catch {}
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black uppercase tracking-wider shadow-sm cursor-pointer active:scale-95"
                  >
                    Đóng ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => setRootSwipePending(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                    title="Ở lại"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Animated Countdown Progress Bar (2.5s) */}
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-2.5">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 2.5, ease: 'linear' }}
                  className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500"
                />
              </div>
            </motion.div>
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
                  <Power className="w-4 h-4 text-rose-400" />
                ) : toastMessage.icon === 'close' ? (
                  <X className="w-4 h-4 text-amber-400" />
                ) : toastMessage.icon === 'back' ? (
                  <ArrowLeft className="w-4 h-4 text-teal-400" />
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
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center shadow-inner">
                <Power className="w-8 h-8 text-rose-600 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Xác nhận Đóng Ứng dụng?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Bạn đang ở menu gốc ({currentViewTitle || 'Tổng quan'}) và vừa thực hiện cử chỉ vuốt mép màn hình. Dữ liệu y tế và nhật ký của bạn đã được bảo lưu an toàn.
                </p>
              </div>

              {/* Security & Sync badge */}
              <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Tiến độ và dữ liệu y tế đã đồng bộ 100%</span>
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
                    setIsAppClosed(true);
                    try {
                      window.close();
                    } catch {}
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Power className="w-4 h-4" />
                  <span>Đóng ứng dụng</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Closed App Standby Screen */}
      <AnimatePresence>
        {isAppClosed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999999] bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-6"
          >
            <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl text-teal-400">
              <HeartHandshake className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-sm">
              <h2 className="text-2xl font-bold text-white font-serif italic">
                Bác sĩ Tâm An đã đóng
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ứng dụng đang ở trạng thái nghỉ. Bạn có thể đóng tab trình duyệt hoặc nhấn nút bên dưới để mở lại ngay bất kỳ lúc nào.
              </p>
            </div>

            <button
              onClick={() => setIsAppClosed(false)}
              className="px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-teal-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Mở lại ứng dụng</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
