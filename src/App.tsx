import { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  Activity, 
  BookOpen, 
  Leaf, 
  MessageSquare,
  Sparkles,
  ChevronRight,
  Menu,
  Bell,
  X,
  Heart,
  LogOut,
  PhoneCall,
  HelpCircle,
  ShieldAlert,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { cn } from './lib/utils';

// Views
import HomeView from './components/views/HomeView';
import AnatomyView from './components/views/AnatomyView';
import DiseaseView from './components/views/DiseaseView';
import HealthView from './components/views/HealthView';
import HerbView from './components/views/HerbView';
import AIChatView from './components/views/AIChatView';
import AuthForm from './components/AuthForm';
import EmergencyModal from './components/EmergencyModal';
import SupportModal from './components/SupportModal';
import NotificationSettingsModal from './components/NotificationSettingsModal';
import MedicationReminderModal from './components/MedicationReminderModal';
import MenuAndSettingsDrawer from './components/MenuAndSettingsDrawer';
import EdgeGestureHandler from './components/EdgeGestureHandler';
import { registerModal, popTopModal } from './utils/modalManager';
import { reminderService } from './services/reminderService';

type ViewType = 'home' | 'anatomy' | 'disease' | 'health' | 'herb';

const viewTitles: Record<ViewType, string> = {
  home: 'Tổng quan',
  anatomy: 'Giải phẫu học 3D',
  disease: 'Tra cứu Bệnh lý',
  herb: 'Dược liệu Việt',
  health: 'Luyện tập Sức khỏe'
};

// Full-Screen AI Doctor Modal
function AIChatModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isMaximized, setIsMaximized] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const unregister = registerModal('ai-chat-modal', onClose);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unregister();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] pointer-events-auto flex items-center justify-center overflow-hidden",
        isMaximized ? "p-0 bg-bg" : "p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm"
      )}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          width: '100%',
          height: '100%',
          maxWidth: isMaximized ? '100%' : '840px',
          maxHeight: isMaximized ? '100%' : '94dvh'
        }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(
          "w-full h-full flex flex-col overflow-hidden bg-bg shadow-2xl",
          isMaximized ? "rounded-none border-0" : "sm:rounded-3xl sm:border sm:border-slate-200"
        )}
      >
        <AIChatView 
          onClose={onClose} 
          isMaximized={isMaximized}
          onToggleMaximize={() => setIsMaximized(prev => !prev)}
        />
      </motion.div>
    </div>
  );
}

function AppContent() {
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [history, setHistory] = useState<ViewType[]>(['home']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const [isAIChatPopupOpen, setIsAIChatPopupOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const [isMedicationReminderOpen, setIsMedicationReminderOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, profile, loading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuInitialTab, setMenuInitialTab] = useState<'navigation' | 'settings'>('navigation');

  const isAnonymousUser = !user || user.isAnonymous;
  const [showPermissionBanner, setShowPermissionBanner] = useState<boolean>(false);

  // Initialize Background Reminders Service for Mobile, Tablet & Desktop
  useEffect(() => {
    reminderService.init(user?.uid);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const dismissed = localStorage.getItem('tam_an_notification_banner_dismissed');
        if (!dismissed) {
          setShowPermissionBanner(true);
        }
      }
    }
  }, [user]);

  const handleEnableNotifications = async () => {
    await reminderService.requestNotificationPermission();
    setShowPermissionBanner(false);
  };

  const handleDismissBanner = () => {
    setShowPermissionBanner(false);
    localStorage.setItem('tam_an_notification_banner_dismissed', 'true');
  };

  // Listen for global open AI chat event with optional prompt
  useEffect(() => {
    const handleOpenAIChat = (e: any) => {
      setIsAIChatPopupOpen(true);
      if (e.detail?.prompt) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('app-set-ai-prompt', { detail: { prompt: e.detail.prompt } }));
        }, 100);
      }
    };
    window.addEventListener('app-open-ai-chat', handleOpenAIChat);
    return () => window.removeEventListener('app-open-ai-chat', handleOpenAIChat);
  }, []);

  // Smoothly scroll window, body, and main containers to top
  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      if (document.documentElement) {
        document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
      if (document.body) {
        document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
      const mainEl = document.querySelector('main');
      if (mainEl) {
        mainEl.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
      const topAnchor = document.getElementById('top-anchor') || document.querySelector('header');
      if (topAnchor) {
        topAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch {
      window.scrollTo(0, 0);
    }
  };

  // Ensure scroll to top whenever activeView changes
  useEffect(() => {
    scrollToTop();
    const t1 = setTimeout(scrollToTop, 50);
    const t2 = setTimeout(scrollToTop, 150);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [activeView]);

  // Navigate to a root menu view while resetting scroll & position
  const navigateToView = (newView: ViewType) => {
    // If tapping the already active root menu (e.g. tapping Home when on Home, or Cơ thể when on Cơ thể),
    // immediately smooth scroll back to top and broadcast reset event to close sub-views/modals
    if (newView === activeView) {
      scrollToTop();
      window.dispatchEvent(new CustomEvent('app-reset-to-root', { detail: { view: newView } }));
      setTimeout(scrollToTop, 60);
      setTimeout(scrollToTop, 180);
      return;
    }

    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newView];
    });
    setHistoryIndex((prev) => prev + 1);
    setActiveView(newView);

    // Scroll to top and reset view state on navigation transition
    scrollToTop();
    window.dispatchEvent(new CustomEvent('app-reset-to-root', { detail: { view: newView } }));
    setTimeout(scrollToTop, 60);
    setTimeout(scrollToTop, 180);
  };

  // Back navigation handler (aligned with S-TimeTable gesture model)
  const handleBack = (): boolean => {
    // 1. Check global modal stack first (closes cards, sub-modals, popups, and dropdowns)
    if (popTopModal()) {
      return true;
    }

    // 2. Dispatch custom event for child modals/views to intercept
    const event = new CustomEvent('app-back-press', { cancelable: true });
    const notPrevented = window.dispatchEvent(event);
    if (!notPrevented) {
      // Sub-view intercepted and closed its modal/detail
      return true;
    }

    // 3. If drawer or App-level modal is open, close it
    if (hasActiveModalOrDrawer) {
      closeActiveModalOrDrawer();
      return true;
    }

    // 4. In S-TimeTable behavior: "Tổng quan, Cơ thể, Bệnh lý, Dược liệu, Luyện tập" are root menus ("menu gốc").
    // When at any of these root menus without open modals, return false so EdgeGestureHandler triggers S-TimeTable app exit!
    return false;
  };

  // Forward navigation handler
  const handleForward = (): boolean => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      setHistoryIndex(targetIndex);
      setActiveView(history[targetIndex]);
      return true;
    }
    return false;
  };

  const hasActiveModalOrDrawer = 
    isMenuOpen || 
    isAIChatPopupOpen || 
    isEmergencyModalOpen || 
    isSupportModalOpen || 
    isNotificationSettingsOpen ||
    isMedicationReminderOpen ||
    isAuthModalOpen;

  const closeActiveModalOrDrawer = () => {
    if (isMenuOpen) setIsMenuOpen(false);
    else if (isAIChatPopupOpen) setIsAIChatPopupOpen(false);
    else if (isEmergencyModalOpen) setIsEmergencyModalOpen(false);
    else if (isSupportModalOpen) setIsSupportModalOpen(false);
    else if (isNotificationSettingsOpen) setIsNotificationSettingsOpen(false);
    else if (isMedicationReminderOpen) setIsMedicationReminderOpen(false);
    else if (isAuthModalOpen) setIsAuthModalOpen(false);
  };

  // Sync App level modals with global modal stack
  useEffect(() => {
    if (!hasActiveModalOrDrawer) return;
    const unregister = registerModal('app-level-modal', closeActiveModalOrDrawer);
    return () => unregister();
  }, [hasActiveModalOrDrawer]);

  // At root menus, canGoBack is false so edge swipe prompts S-TimeTable exit
  const canGoBack = false;
  const canGoForward = historyIndex < history.length - 1;
  const previousViewTitle = undefined;
  const nextViewTitle = canGoForward ? viewTitles[history[historyIndex + 1]] : undefined;

  const renderView = () => {
    switch (activeView) {
      case 'home': return <HomeView setActiveView={navigateToView} />;
      case 'anatomy': return <AnatomyView setActiveView={navigateToView} />;
      case 'disease': return <DiseaseView setActiveView={navigateToView} />;
      case 'health': return <HealthView />;
      case 'herb': return <HerbView />;
      default: return <HomeView setActiveView={navigateToView} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg pb-20 selection:bg-primary/30">
      <div id="top-anchor" className="sr-only" aria-hidden="true" tabIndex={-1} />
      {/* Header with Safe Area Status Bar spacing on Mobile */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-3 sm:px-6 pt-[calc(max(env(safe-area-inset-top,0px),28px)+0.5rem)] sm:pt-3.5 pb-3 sm:pb-3.5 shadow-xs transition-all">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div 
            onClick={() => navigateToView('home')}
            className="flex items-center gap-2.5 sm:gap-4 cursor-pointer select-none group"
            title="Về đầu trang Tổng quan"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 medical-gradient rounded-xl flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-base sm:text-xl italic font-light text-slate-900 leading-tight group-hover:text-teal-700 transition-colors">Bác sĩ Tâm An</h2>
              <p className="text-[8px] sm:text-[9px] text-teal-600 font-bold uppercase tracking-[0.2em]">Expert AI System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick AI Doctor Popup Trigger */}
            <button 
              onClick={() => setIsAIChatPopupOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Tư vấn trực tiếp với Bác sĩ AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
              <span className="hidden sm:inline">Bác sĩ AI</span>
            </button>

            <button 
              onClick={() => setIsNotificationSettingsOpen(true)}
              className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer active:scale-95"
              title="Cài đặt thông báo & nhắc nhở (Uống nước, uống thuốc, đo chỉ số)"
              aria-label="Cài đặt thông báo & nhắc nhở"
            >
              <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-600 hover:text-teal-700 transition-colors" />
              <span className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 w-2 h-2 bg-teal-500 rounded-full shadow-[0_0_6px_rgba(13,148,136,0.6)] animate-pulse"></span>
            </button>
            <button 
              onClick={() => {
                setMenuInitialTab('navigation');
                setIsMenuOpen(true);
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-700 transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Menu điều hướng & Cài đặt hệ thống"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5 text-emerald-700" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Background Notification Enable Banner for Mobile & Tablet */}
      <AnimatePresence>
        {showPermissionBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 text-white shadow-md z-20 border-b border-teal-500/30"
          >
            <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Bell className="w-4 h-4 text-white animate-bounce" />
                </div>
                <p className="font-medium text-[11px] sm:text-xs truncate">
                  Bật thông báo chạy ngầm trên điện thoại/tablet để không bỏ lỡ lịch uống thuốc, đo chỉ số & uống nước!
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  className="bg-white text-teal-800 hover:bg-teal-50 font-bold px-3 py-1.5 rounded-lg text-[10.5px] uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  Bật thông báo
                </button>
                <button
                  type="button"
                  onClick={handleDismissBanner}
                  className="text-white/80 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                  title="Để sau"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Navigation & Medical System Settings Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <MenuAndSettingsDrawer
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            activeView={activeView}
            navigateToView={navigateToView}
            onOpenAIChat={() => setIsAIChatPopupOpen(true)}
            onOpenEmergency={() => setIsEmergencyModalOpen(true)}
            onOpenSupport={() => setIsSupportModalOpen(true)}
            onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            initialTab={menuInitialTab}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto overflow-x-hidden panel-gradient">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="min-h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating AI Assistant FAB Button */}
      <div className="fixed bottom-24 sm:bottom-28 right-4 sm:right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsAIChatPopupOpen(true)}
          className="group flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white pl-3.5 pr-4 py-3 rounded-full shadow-[0_8px_25px_rgba(13,148,136,0.35)] border border-white/20 hover:shadow-[0_10px_30px_rgba(13,148,136,0.45)] transition-all cursor-pointer"
          title="Trò chuyện với Bác sĩ AI Tâm An"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <MessageSquare className="w-4.5 h-4.5 text-white" />
          <span className="text-[11px] font-bold uppercase tracking-wider hidden xs:inline sm:inline">Hỏi Bác Sĩ AI</span>
        </motion.button>
      </div>

      {/* AI Assistant Draggable & Scrollable Modal Popup */}
      <AnimatePresence>
        {isAIChatPopupOpen && (
          <AIChatModal 
            isOpen={isAIChatPopupOpen} 
            onClose={() => setIsAIChatPopupOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Emergency Call 115 Modal Popup */}
      <AnimatePresence>
        {isEmergencyModalOpen && (
          <EmergencyModal
            isOpen={isEmergencyModalOpen}
            onClose={() => setIsEmergencyModalOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Support & Help Center Modal Popup */}
      <AnimatePresence>
        {isSupportModalOpen && (
          <SupportModal
            isOpen={isSupportModalOpen}
            onClose={() => setIsSupportModalOpen(false)}
            onOpenAIChat={() => setIsAIChatPopupOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Notification & Reminder Settings Modal */}
      <AnimatePresence>
        {isNotificationSettingsOpen && (
          <NotificationSettingsModal
            isOpen={isNotificationSettingsOpen}
            onClose={() => setIsNotificationSettingsOpen(false)}
            onOpenMedicationDetailModal={() => setIsMedicationReminderOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Medication Reminder Detail Modal */}
      <AnimatePresence>
        {isMedicationReminderOpen && (
          <MedicationReminderModal
            isOpen={isMedicationReminderOpen}
            onClose={() => setIsMedicationReminderOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Optional Auth Modal Popup */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm"
            >
              <AuthForm 
                onClose={() => setIsAuthModalOpen(false)} 
                onSuccess={() => setIsAuthModalOpen(false)} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-emerald-50/95 sm:bg-emerald-50/90 backdrop-blur-xl border-t border-emerald-200/80 px-2 sm:px-6 py-2 pb-safe shadow-[0_-4px_20px_rgba(5,150,105,0.08)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-1">
          <NavItem active={activeView === 'anatomy'} icon={Activity} label="Cơ thể" onClick={() => navigateToView('anatomy')} />
          <NavItem active={activeView === 'disease'} icon={BookOpen} label="Bệnh lý" onClick={() => navigateToView('disease')} />
          
          {/* Nút Tổng quan ở chính giữa */}
          <div className="relative -top-4 px-1 flex flex-col items-center flex-shrink-0">
            <button 
              onClick={() => navigateToView('home')}
              className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(13,148,136,0.35)] transition-all scale-105 hover:scale-115 active:scale-95 cursor-pointer",
                activeView === 'home' ? "medical-gradient text-white shadow-teal-500/40" : "bg-white text-teal-600 border-2 border-teal-500/30"
              )}
              title="Tổng quan Sức khỏe"
            >
              <Home className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <span className={cn(
              "text-[8px] sm:text-[9.5px] uppercase tracking-wider mt-1",
              activeView === 'home' ? "text-teal-700 font-bold" : "text-slate-600 font-medium"
            )}>
              Tổng quan
            </span>
          </div>

          <NavItem active={activeView === 'herb'} icon={Leaf} label="Dược liệu" onClick={() => navigateToView('herb')} />
          <NavItem active={activeView === 'health'} icon={Heart} label="Luyện tập" onClick={() => navigateToView('health')} />
        </div>
      </nav>

      {/* Edge Swipe Gestures Navigation Handler (Mobile & Tablet) */}
      <EdgeGestureHandler
        onBack={handleBack}
        onForward={handleForward}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        hasActiveModalOrDrawer={hasActiveModalOrDrawer}
        closeActiveModalOrDrawer={closeActiveModalOrDrawer}
        currentViewTitle={viewTitles[activeView]}
        previousViewTitle={previousViewTitle}
        nextViewTitle={nextViewTitle}
      />
    </div>
  );
}

function NavItem({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 transition-all relative group flex-1 py-1 px-0.5 min-w-0 rounded-xl cursor-pointer",
        active ? "text-emerald-700 font-bold" : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-100/60"
      )}
    >
      <Icon className={cn("w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform group-hover:scale-110", active && "scale-110 text-emerald-700")} />
      <span className="text-[8px] sm:text-[9.5px] font-medium uppercase tracking-wider truncate max-w-full text-center">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute -bottom-1.5 w-1.5 h-1.5 bg-emerald-600 rounded-full shadow-[0_0_8px_rgba(5,150,105,0.6)]"
        />
      )}
    </button>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
