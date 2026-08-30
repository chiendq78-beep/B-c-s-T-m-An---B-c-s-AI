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
  ShieldAlert
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
import EdgeGestureHandler from './components/EdgeGestureHandler';

type ViewType = 'home' | 'anatomy' | 'disease' | 'health' | 'herb';

const viewTitles: Record<ViewType, string> = {
  home: 'Tổng quan',
  anatomy: 'Giải phẫu học 3D',
  disease: 'Tra cứu Bệnh lý',
  herb: 'Dược liệu Việt',
  health: 'Luyện tập Sức khỏe'
};

// Draggable & Resizable AI Doctor Modal
function AIChatModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const dragControls = useDragControls();
  const [isMaximized, setIsMaximized] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div 
      ref={constraintsRef} 
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden"
    >
      {/* Semi-transparent backdrop - clicking dismisses modal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm pointer-events-auto cursor-pointer"
      />

      {/* Draggable & Scrollable AI Chat Window */}
      <motion.div
        drag={!isMaximized}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={constraintsRef}
        dragElastic={0.08}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          width: isMaximized ? '96vw' : '100%',
          height: isMaximized ? '94vh' : '88vh',
          maxWidth: isMaximized ? '1350px' : '680px',
          maxHeight: isMaximized ? '96vh' : '820px'
        }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="pointer-events-auto relative rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col border border-border"
      >
        <AIChatView 
          onClose={onClose} 
          dragControls={dragControls}
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, profile, loading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAnonymousUser = !user || user.isAnonymous;

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

  // Navigate to a new view while preserving forward/backward stack
  const navigateToView = (newView: ViewType) => {
    if (newView === activeView) return;
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newView];
    });
    setHistoryIndex((prev) => prev + 1);
    setActiveView(newView);
  };

  // Back navigation handler
  const handleBack = (): boolean => {
    // 1. Dispatch custom event for child modals/views to intercept
    const event = new CustomEvent('app-back-press', { cancelable: true });
    const notPrevented = window.dispatchEvent(event);
    if (!notPrevented) {
      // Sub-view intercepted and closed its modal/detail
      return true;
    }

    // 2. If drawer/modal in App is open, close it
    if (hasActiveModalOrDrawer) {
      closeActiveModalOrDrawer();
      return true;
    }

    // 3. If history stack exists, go back
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      setHistoryIndex(targetIndex);
      setActiveView(history[targetIndex]);
      return true;
    } 
    // 4. If not at home (root menu), always return to home
    else if (activeView !== 'home') {
      setActiveView('home');
      setHistory(['home']);
      setHistoryIndex(0);
      return true;
    }
    
    // 5. Already at home (root)
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
    isAuthModalOpen;

  const closeActiveModalOrDrawer = () => {
    if (isMenuOpen) setIsMenuOpen(false);
    else if (isAIChatPopupOpen) setIsAIChatPopupOpen(false);
    else if (isEmergencyModalOpen) setIsEmergencyModalOpen(false);
    else if (isSupportModalOpen) setIsSupportModalOpen(false);
    else if (isAuthModalOpen) setIsAuthModalOpen(false);
  };

  // canGoBack is true whenever there is history OR activeView is not home
  const canGoBack = historyIndex > 0 || activeView !== 'home';
  const canGoForward = historyIndex < history.length - 1;
  const previousViewTitle = historyIndex > 0 ? viewTitles[history[historyIndex - 1]] : (activeView !== 'home' ? 'Tổng quan' : undefined);
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
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-3 sm:px-6 py-3.5 shadow-xs">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 medical-gradient rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-base sm:text-xl italic font-light text-slate-900 leading-tight">Bác sĩ Tâm An</h2>
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

            <button className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer">
              <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-600 hover:text-slate-900 transition-colors" />
              <span className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 w-1.5 h-1.5 bg-teal-500 rounded-full shadow-[0_0_6px_rgba(13,148,136,0.5)]"></span>
            </button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
            >
              <Menu className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-600 hover:text-slate-900" />
            </button>
          </div>
        </div>
      </header>

      {/* Background Side Navigation Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Blurry dim overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-over menu container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white/95 backdrop-blur-2xl border-l border-slate-200 px-6 py-6 z-50 shadow-2xl flex flex-col justify-between"
              id="navigation-sidebar-drawer"
            >
              <div className="space-y-5 overflow-y-auto no-scrollbar flex-1 pr-1 pb-4">
                {/* Header inside drawer */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8.5 h-8.5 medical-gradient rounded-xl flex items-center justify-center shadow-md">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-serif italic font-light text-slate-800 text-base leading-tight">Bác sĩ Tâm An</h3>
                      <p className="text-[8px] text-teal-600 font-bold uppercase tracking-wider">Expert AI Portal</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="w-8.5 h-8.5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-full transition-all border border-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Account card info */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold font-serif text-sm flex-shrink-0">
                      {isAnonymousUser ? 'K' : (profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'T')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-slate-800 truncate">
                        {isAnonymousUser ? 'Người dùng Trải nghiệm' : (profile?.fullName || 'Người dùng')}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {isAnonymousUser ? 'Chế độ Khách (Chưa đăng nhập)' : (profile?.email || user?.email)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2.5 border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
                        {isAnonymousUser ? 'Chế độ Khách' : 'Thành viên'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Sẵn sàng
                      </span>
                    </div>

                    {!isAnonymousUser ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await logout();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-[10px] font-bold transition-all cursor-pointer shadow-xs"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Đăng xuất</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsAuthModalOpen(true);
                        }}
                        className="text-[10px] text-teal-600 hover:text-teal-700 font-bold hover:underline cursor-pointer"
                      >
                        Đăng nhập / Đăng ký
                      </button>
                    )}
                  </div>
                </div>

                {/* Subsystem menus navigation list */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-bold pl-2 mb-1">Chức năng chính</p>
                    <SidebarNavItem 
                      active={activeView === 'home'} 
                      icon={Home} 
                      title="Tổng quan" 
                      onClick={() => { navigateToView('home'); setIsMenuOpen(false); }} 
                    />
                    <SidebarNavItem 
                      active={activeView === 'anatomy'} 
                      icon={Activity} 
                      title="Giải phẫu học 3D" 
                      onClick={() => { navigateToView('anatomy'); setIsMenuOpen(false); }} 
                    />
                    <SidebarNavItem 
                      active={activeView === 'disease'} 
                      icon={BookOpen} 
                      title="Tra cứu Bệnh lý" 
                      onClick={() => { navigateToView('disease'); setIsMenuOpen(false); }} 
                    />
                    <SidebarNavItem 
                      active={activeView === 'herb'} 
                      icon={Leaf} 
                      title="Dược liệu Việt" 
                      onClick={() => { navigateToView('herb'); setIsMenuOpen(false); }} 
                    />
                    <SidebarNavItem 
                      active={activeView === 'health'} 
                      icon={Heart} 
                      title="Luyện tập Sức khỏe" 
                      onClick={() => { navigateToView('health'); setIsMenuOpen(false); }} 
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-bold pl-2 mb-1">Hỗ trợ & AI</p>
                    
                    {/* Emergency SOS Banner inside Hỗ trợ & AI section */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsEmergencyModalOpen(true);
                      }}
                      className="w-full py-2 px-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl flex items-center justify-between shadow-[0_3px_12px_rgba(225,29,72,0.25)] transition-all cursor-pointer group border border-rose-400/30 mb-1.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center animate-pulse flex-shrink-0">
                          <PhoneCall className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="text-[11.5px] font-black uppercase tracking-wider">Cấp cứu Y tế (115)</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white text-rose-700 text-[9.5px] font-black uppercase shadow-xs">
                        SOS
                      </span>
                    </button>

                    <SidebarNavItem 
                      active={isAIChatPopupOpen} 
                      icon={MessageSquare} 
                      title="Trợ lý Tâm An AI" 
                      onClick={() => { 
                        setIsMenuOpen(false); 
                        setIsAIChatPopupOpen(true);
                      }} 
                    />
                    <SidebarNavItem 
                      active={isSupportModalOpen} 
                      icon={HelpCircle} 
                      title="Trung tâm Hỗ trợ" 
                      onClick={() => { 
                        setIsMenuOpen(false); 
                        setIsSupportModalOpen(true);
                      }} 
                    />
                  </div>
                </div>
              </div>

              {/* Drawer footer (Login or Logout) */}
              <div className="pt-4 border-t border-slate-100">
                {!isAnonymousUser ? (
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất tài khoản</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>Đăng nhập / Đăng ký</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 px-2 sm:px-6 py-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
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
        active ? "text-primary font-bold" : "text-slate-500 hover:text-teal-700 hover:bg-slate-100/80"
      )}
    >
      <Icon className={cn("w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform group-hover:scale-110", active && "scale-110 text-primary")} />
      <span className="text-[8px] sm:text-[9.5px] font-medium uppercase tracking-wider truncate max-w-full text-center">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute -bottom-1.5 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(13,148,136,0.5)]"
        />
      )}
    </button>
  );
}

function SidebarNavItem({ 
  active, 
  icon: Icon, 
  title, 
  onClick
}: { 
  active: boolean, 
  icon: any, 
  title: string, 
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left py-2 px-3 sm:py-2 sm:px-3 rounded-xl flex items-center gap-2.5 transition-all duration-200 ease-out relative group overflow-hidden border cursor-pointer",
        active 
          ? "bg-teal-600 text-white font-bold shadow-sm border-teal-600 ring-2 ring-teal-500/20" 
          : "bg-white hover:bg-teal-50 hover:border-teal-300 text-slate-800 border-slate-200/80 hover:shadow-xs hover:translate-x-0.5"
      )}
    >
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-200 flex-shrink-0",
        active 
          ? "bg-white/20 text-white border-white/20" 
          : "bg-slate-100 text-slate-600 border-slate-200 group-hover:bg-teal-100 group-hover:text-teal-700 group-hover:border-teal-300 group-hover:scale-105"
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className={cn(
          "text-[11.5px] font-bold uppercase tracking-wider transition-colors duration-200 truncate", 
          active ? "text-white" : "text-slate-800 group-hover:text-teal-900"
        )}>
          {title}
        </h4>
      </div>
      {!active && (
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-teal-600 self-center shrink-0 -translate-x-1 group-hover:translate-x-0">
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
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
