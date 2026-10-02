import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, X, User, Bell, Globe, PhoneCall, HelpCircle, 
  FileText, LogOut, ChevronRight, Check, Activity, Shield, 
  Watch, Moon, Sun, Monitor, Type, Heart, Lock, Smartphone, 
  ShieldCheck, AlertCircle, Settings, ExternalLink,
  Home, BookOpen, Leaf, MessageSquare, Compass
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { reminderService } from '../services/reminderService';

type ViewType = 'home' | 'anatomy' | 'disease' | 'health' | 'herb';

interface MenuAndSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeView?: ViewType;
  navigateToView?: (view: ViewType) => void;
  onOpenAIChat?: () => void;
  onOpenEmergency?: () => void;
  onOpenSupport?: () => void;
  onOpenNotificationSettings: () => void;
  onOpenAuthModal: () => void;
  initialTab?: 'navigation' | 'settings';
}

export default function MenuAndSettingsDrawer({
  isOpen,
  onClose,
  activeView = 'home',
  navigateToView,
  onOpenAIChat,
  onOpenEmergency,
  onOpenSupport,
  onOpenNotificationSettings,
  onOpenAuthModal,
  initialTab = 'navigation'
}: MenuAndSettingsDrawerProps) {
  const { user, profile, logout } = useAuth();
  const isAnonymousUser = !user || user.isAnonymous;

  const [activeTab, setActiveTab] = useState<'navigation' | 'settings'>(initialTab);

  // Sync initial tab when drawer opens
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Quick settings states with localStorage persistence
  const [appNotificationsEnabled, setAppNotificationsEnabled] = useState(() => {
    return localStorage.getItem('tam_an_app_notifications') !== 'false';
  });
  const [habitRemindersEnabled, setHabitRemindersEnabled] = useState(() => {
    return localStorage.getItem('tam_an_habit_reminders') !== 'false';
  });
  const [dndEnabled, setDndEnabled] = useState(() => {
    return localStorage.getItem('tam_an_dnd_enabled') === 'true';
  });
  const [dndTime, setDndTime] = useState(() => {
    return localStorage.getItem('tam_an_dnd_time') || '22:00 - 06:00';
  });
  const [language, setLanguage] = useState<'vi' | 'en'>(() => {
    return (localStorage.getItem('tam_an_language') as 'vi' | 'en') || 'vi';
  });
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>(() => {
    return (localStorage.getItem('tam_an_theme') as any) || 'light';
  });
  const [fontSize, setFontSize] = useState<'normal' | 'large'>(() => {
    return (localStorage.getItem('tam_an_font_size') as any) || 'normal';
  });
  const [units, setUnits] = useState<'metric' | 'imperial'>(() => {
    return (localStorage.getItem('tam_an_units') as any) || 'metric';
  });

  // Sub-modal states
  const [activeSubModal, setActiveSubModal] = useState<
    'profile' | 'devices' | 'security' | 'disclaimer' | 'dnd_picker' | 'language_picker' | 'theme_picker' | 'units_picker' | null
  >(null);

  // Sync settings changes
  const toggleAppNotifications = async () => {
    const nextVal = !appNotificationsEnabled;
    setAppNotificationsEnabled(nextVal);
    localStorage.setItem('tam_an_app_notifications', String(nextVal));
    if (nextVal) {
      await reminderService.requestNotificationPermission();
    }
  };

  const toggleHabitReminders = () => {
    const nextVal = !habitRemindersEnabled;
    setHabitRemindersEnabled(nextVal);
    localStorage.setItem('tam_an_habit_reminders', String(nextVal));
  };

  const toggleDnd = () => {
    const nextVal = !dndEnabled;
    setDndEnabled(nextVal);
    localStorage.setItem('tam_an_dnd_enabled', String(nextVal));
  };

  const handleLanguageChange = (lang: 'vi' | 'en') => {
    setLanguage(lang);
    localStorage.setItem('tam_an_language', lang);
    setActiveSubModal(null);
  };

  const handleThemeChange = (mode: 'light' | 'dark' | 'auto') => {
    setThemeMode(mode);
    localStorage.setItem('tam_an_theme', mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (mode === 'light') {
      document.documentElement.classList.remove('dark');
    }
    setActiveSubModal(null);
  };

  // Connected device status state
  const [appleHealthConnected, setAppleHealthConnected] = useState(true);
  const [garminConnected, setGarminConnected] = useState(true);
  const [omronConnected, setOmronConnected] = useState(false);

  if (!isOpen) return null;

  const displayName = profile?.fullName || (isAnonymousUser ? 'Người dùng Trải nghiệm' : 'Đặng Quyết Chiến');

  const renderUserFooter = () => (
    <div className="bg-white/95 border border-emerald-200/80 rounded-2xl p-3 shadow-xs space-y-2 mt-1">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold font-serif text-sm flex-shrink-0 shadow-2xs">
          {isAnonymousUser ? 'K' : (displayName ? displayName.charAt(0).toUpperCase() : 'C')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-semibold text-slate-800 truncate">
              {displayName}
            </h4>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
              {isAnonymousUser ? 'Khách' : 'Thành viên'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 truncate mt-0.5">
            {isAnonymousUser ? 'Chế độ Trải nghiệm (Chưa đăng nhập)' : (profile?.email || user?.email || 'chiendq78@gmail.com')}
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="text-[10px] text-slate-500">
          Phiên bản <span className="font-semibold text-slate-700">v2.4.0</span> (Build 2026)
        </div>

        {!isAnonymousUser ? (
          <button
            type="button"
            onClick={async () => {
              await logout();
              onClose();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-[10.5px] font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAuthModal();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[10.5px] font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <span>Đăng nhập / Đăng ký</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden">
      {/* Dim backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[71] bg-black/60 backdrop-blur-sm cursor-pointer"
      />

      {/* Slide-over menu container */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[440px] max-w-[94vw] sm:max-w-md bg-emerald-50/95 backdrop-blur-2xl border-l border-emerald-200/80 pt-[calc(max(env(safe-area-inset-top,0px),34px)+0.5rem)] sm:pt-4 pb-2 sm:pb-3 px-4 sm:px-6 z-[72] shadow-2xl flex flex-col justify-between overflow-hidden"
        id="navigation-sidebar-drawer"
      >
        {/* Drawer Top Header */}
        <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3 -mx-4 sm:-mx-6 px-4 sm:px-6 shrink-0 bg-emerald-100/60 -mt-1 pt-1 rounded-b-2xl">
          {activeTab === 'settings' ? (
            <button
              onClick={() => setActiveTab('navigation')}
              className="flex items-center gap-2 text-slate-800 hover:text-teal-700 transition-colors cursor-pointer group"
              title="Quay lại Menu Điều hướng"
            >
              <div className="w-8 h-8 rounded-full bg-white/80 group-hover:bg-white flex items-center justify-center border border-emerald-200 shadow-2xs">
                <ArrowLeft className="w-4 h-4 text-teal-800" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm tracking-wide uppercase">CÀI ĐẶT HỆ THỐNG</h3>
                <p className="text-[9px] text-teal-700 font-medium">Bác sĩ Tâm An • Tùy chỉnh Y tế & Cá nhân hóa</p>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8.5 h-8.5 medical-gradient rounded-xl flex items-center justify-center shadow-md">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-serif italic font-light text-slate-900 text-base leading-tight">Bác sĩ Tâm An</h3>
                <p className="text-[8.5px] text-teal-700 font-bold uppercase tracking-wider">Expert AI Medical Portal</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="w-8.5 h-8.5 flex items-center justify-center bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 rounded-full transition-all border border-emerald-200 cursor-pointer shadow-xs active:scale-95"
              title="Đóng (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: MENU ĐIỀU HƯỚNG & CHỨC NĂNG CHÍNH                       */}
        {/* ============================================================== */}
        {activeTab === 'navigation' ? (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1 pt-2 pb-10 sm:pb-12">
            {/* Subsystem menus navigation list */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold pl-2 mb-1">Chức năng chính</p>
                <SidebarNavItem 
                  active={activeView === 'home'} 
                  icon={Home} 
                  title="Tổng quan Sức khỏe" 
                  onClick={() => { navigateToView?.('home'); onClose(); }} 
                />
                <SidebarNavItem 
                  active={activeView === 'anatomy'} 
                  icon={Activity} 
                  title="Giải phẫu học 3D" 
                  onClick={() => { navigateToView?.('anatomy'); onClose(); }} 
                />
                <SidebarNavItem 
                  active={activeView === 'disease'} 
                  icon={BookOpen} 
                  title="Tra cứu Bệnh lý & Đông y" 
                  onClick={() => { navigateToView?.('disease'); onClose(); }} 
                />
                <SidebarNavItem 
                  active={activeView === 'herb'} 
                  icon={Leaf} 
                  title="Dược liệu Cổ truyền Việt" 
                  onClick={() => { navigateToView?.('herb'); onClose(); }} 
                />
                <SidebarNavItem 
                  active={activeView === 'health'} 
                  icon={Heart} 
                  title="Luyện tập & Phục hồi" 
                  onClick={() => { navigateToView?.('health'); onClose(); }} 
                />
              </div>

              {/* Phần 2: Hỗ trợ & Y tế AI */}
              <div className="pt-3 border-t border-emerald-200/70 space-y-2">
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold pl-2 mb-1">Hỗ trợ & Y tế AI</p>
                
                {/* Emergency SOS Banner */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenEmergency?.();
                  }}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl flex items-center justify-between shadow-[0_3px_12px_rgba(225,29,72,0.25)] transition-all cursor-pointer group border border-rose-400/30 mb-1"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center animate-pulse flex-shrink-0">
                      <PhoneCall className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-wider">Cấp cứu Y tế (115)</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white text-rose-700 text-[9.5px] font-black uppercase shadow-xs">
                    SOS
                  </span>
                </button>

                <SidebarNavItem 
                  active={false} 
                  icon={MessageSquare} 
                  title="Trò chuyện Bác sĩ AI" 
                  onClick={() => { 
                    onClose(); 
                    onOpenAIChat?.();
                  }} 
                />
              </div>

              {/* Phần 3: CÀI ĐẶT (Nhóm Cài đặt Hệ thống, Nhắc nhở & Báo giờ, Hỗ trợ & Góp ý) */}
              <div className="pt-3 border-t border-emerald-200/70 space-y-1.5">
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold pl-2 mb-1">Cài đặt</p>
                <SidebarNavItem 
                  active={false} 
                  icon={Settings} 
                  title="Cài đặt Hệ thống" 
                  onClick={() => { 
                    setActiveTab('settings');
                  }} 
                />
                <SidebarNavItem 
                  active={false} 
                  icon={Bell} 
                  title="Cài đặt Nhắc nhở & Báo giờ" 
                  onClick={() => { 
                    onClose(); 
                    onOpenNotificationSettings();
                  }} 
                />
                <SidebarNavItem 
                  active={false} 
                  icon={HelpCircle} 
                  title="Trung tâm Hỗ trợ & Góp ý" 
                  onClick={() => { 
                    onClose(); 
                    onOpenSupport();
                  }} 
                />
              </div>

              {/* Phần 4: Thông tin Người dùng (Nằm trong danh sách cuộn mượt mà) */}
              <div className="pt-3 border-t border-emerald-200/70">
                {renderUserFooter()}
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* TAB 2: CÀI ĐẶT HỆ THỐNG CHI TIẾT                              */
          /* ============================================================== */
          <div className="space-y-4 overflow-y-auto flex-1 pr-1 pt-1 pb-10 sm:pb-12">
            
            {/* Header Quay lại Menu */}
            <div className="flex items-center justify-between pb-2.5 border-b border-emerald-200/70 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('navigation')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-teal-800 hover:text-teal-950 hover:bg-emerald-100/70 font-bold text-xs transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại Menu</span>
              </button>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-1">
                Cài đặt hệ thống
              </span>
            </div>

            {/* 1. 👤 TÀI KHOẢN & HỒ SƠ Y TẾ */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 pl-2 mb-1">
                <User className="w-3.5 h-3.5 text-teal-700" />
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  Tài khoản & Hồ sơ y tế
                </span>
              </div>
              <div className="bg-white/95 border border-emerald-200/80 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveSubModal('profile')}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-teal-50/50 transition-colors group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-semibold text-slate-800 block">Hồ sơ bệnh án & Thể trạng</span>
                    <span className="text-[10px] text-slate-500 block truncate">Thông tin nhóm máu, dị ứng, chiều cao, cân nặng</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-teal-700 font-semibold text-xs">
                    <span className="max-w-[110px] truncate text-[11px] bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                      {displayName}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubModal('devices')}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-teal-50/50 transition-colors group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-semibold text-slate-800 block">Liên kết thiết bị đo (Smartwatch/SPO2)</span>
                    <span className="text-[10px] text-slate-500 block">Đồng bộ nhịp tim, giấc ngủ, huyết áp</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-teal-700 font-semibold text-xs">
                    <span className="text-[10.5px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg">
                      {appleHealthConnected ? 'Đã kết nối Apple Health' : 'Chưa liên kết'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubModal('security')}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-teal-50/50 transition-colors group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-semibold text-slate-800 block">Quản lý tài khoản & Bảo mật</span>
                    <span className="text-[10px] text-slate-500 block">Mật khẩu, xác thực 2 lớp, chuẩn HIPAA</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors shrink-0" />
                </button>
              </div>
            </div>

            {/* 2. 🔔 THÔNG BÁO & LỊCH NHẮC */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 pl-2 mb-1">
                <Bell className="w-3.5 h-3.5 text-teal-700" />
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  Thông báo & Lịch nhắc
                </span>
              </div>
              <div className="bg-white/95 border border-emerald-200/80 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
                <div className="px-3.5 py-2.5 flex items-center justify-between">
                  <div className="pr-2">
                    <span className="text-xs font-semibold text-slate-800 block">Thông báo ứng dụng</span>
                    <span className="text-[10px] text-slate-500">Bật chuông & tin báo trên thiết bị</span>
                  </div>
                  <ToggleSwitch checked={appNotificationsEnabled} onChange={toggleAppNotifications} />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNotificationSettings();
                  }}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-teal-50/50 transition-colors group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-semibold text-slate-800 block">Lịch nhắc uống thuốc / Đo sinh hiệu</span>
                    <span className="text-[10px] text-slate-500 block">Giờ uống thuốc và đo huyết áp, đường huyết</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10.5px] font-mono bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-lg font-bold">
                      08:00, 20:00
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </div>
                </button>

                <div className="px-3.5 py-2.5 flex items-center justify-between">
                  <div className="pr-2">
                    <span className="text-xs font-semibold text-slate-800 block">Nhắc nhở tập luyện & Uống nước</span>
                    <span className="text-[10px] text-slate-500">Mục tiêu 2.000ml nước & bài tập phục hồi</span>
                  </div>
                  <ToggleSwitch checked={habitRemindersEnabled} onChange={toggleHabitReminders} />
                </div>

                <div className="px-3.5 py-2.5 flex items-center justify-between">
                  <div className="pr-2">
                    <span className="text-xs font-semibold text-slate-800 block">Chế độ Không làm phiền (DND)</span>
                    <span className="text-[10px] text-slate-500">Tắt chuông đêm ({dndTime})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ToggleSwitch checked={dndEnabled} onChange={toggleDnd} />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. 🌐 TÙY CHỌN ỨNG DỤNG */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 pl-2 mb-1">
                <Globe className="w-3.5 h-3.5 text-teal-700" />
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  Tùy chọn ứng dụng
                </span>
              </div>
              <div className="bg-white/95 border border-emerald-200/80 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveSubModal('language_picker')}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-teal-50/50 transition-colors group cursor-pointer"
                >
                  <span className="text-xs font-semibold text-slate-800">Ngôn ngữ (Language)</span>
                  <div className="flex items-center gap-1 shrink-0 text-slate-600 text-xs font-medium">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-[11px]">
                      {language === 'vi' ? 'Tiếng Việt 🇻🇳' : 'English 🇬🇧'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubModal('theme_picker')}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-teal-50/50 transition-colors group cursor-pointer"
                >
                  <span className="text-xs font-semibold text-slate-800">Giao diện (Theme)</span>
                  <div className="flex items-center gap-1 shrink-0 text-slate-600 text-xs font-medium">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-[11px]">
                      {themeMode === 'light' ? 'Sáng' : themeMode === 'dark' ? 'Tối' : 'Tự động'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextSize = fontSize === 'normal' ? 'large' : 'normal';
                    setFontSize(nextSize);
                    localStorage.setItem('tam_an_font_size', nextSize);
                  }}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-teal-50/50 transition-colors group cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Cỡ chữ & Trợ năng</span>
                    <span className="text-[10px] text-slate-500">Hỗ trợ người cao tuổi đọc rõ ràng</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-slate-600 text-xs font-medium">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-[11px]">
                      {fontSize === 'normal' ? 'Bình thường' : 'Cỡ chữ Lớn'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubModal('units_picker')}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-teal-50/50 transition-colors group cursor-pointer"
                >
                  <span className="text-xs font-semibold text-slate-800">Đơn vị đo lường</span>
                  <div className="flex items-center gap-1 shrink-0 text-slate-600 text-xs font-medium">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-[11px]">
                      {units === 'metric' ? 'kg, mg/dL, ml' : 'lbs, mmol/L, oz'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </div>
                </button>
              </div>
            </div>

            {/* 4. 📞 TRỢ GIÚP & LIÊN HỆ */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 pl-2 mb-1">
                <PhoneCall className="w-3.5 h-3.5 text-teal-700" />
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  Trợ giúp & Liên hệ
                </span>
              </div>
              <div className="bg-white/95 border border-emerald-200/80 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
                <a
                  href="tel:19006868"
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-teal-50/50 transition-colors group cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Liên hệ Bác sĩ / Tổng đài hỗ trợ</span>
                    <span className="text-[10px] text-slate-500">Tư vấn trực tiếp 24/7 qua hotline</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-teal-700 font-bold text-xs">
                    <span className="bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-lg font-mono">
                      1900 6868
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </div>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSupport();
                  }}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-teal-50/50 transition-colors group cursor-pointer"
                >
                  <span className="text-xs font-semibold text-slate-800">Gửi phản hồi / Báo lỗi AI</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubModal('disclaimer')}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-teal-50/50 transition-colors group cursor-pointer"
                >
                  <div className="pr-2">
                    <span className="text-xs font-semibold text-slate-800 block">Điều khoản dịch vụ & Tuyên bố miễn trừ</span>
                    <span className="text-[9.5px] text-slate-500 line-clamp-1">Miễn trừ trách nhiệm chẩn đoán y khoa của AI</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors shrink-0" />
                </button>
              </div>

              {/* Thẻ người dùng ở chân trang cài đặt */}
              <div className="pt-3 border-t border-emerald-200/70">
                {renderUserFooter()}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ============================================================== */}
      {/* SUB-MODALS / DETAILS SHEETS FOR SETTINGS                       */}
      {/* ============================================================== */}

      {/* Sub-modal: Hồ sơ bệnh án & Thể trạng */}
      <AnimatePresence>
        {activeSubModal === 'profile' && (
          <SettingsSubModal title="Hồ sơ bệnh án & Thể trạng" onClose={() => setActiveSubModal(null)}>
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold font-serif text-lg shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{displayName}</h4>
                  <p className="text-[11px] text-teal-800">Email: {user?.email || 'chiendq78@gmail.com'}</p>
                  <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                    Hồ sơ Y tế đã xác thực
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Nhóm máu</span>
                  <span className="text-sm font-black text-rose-600">O+ (Rh dương)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Thể trạng / BMI</span>
                  <span className="text-sm font-bold text-teal-700">23.1 • Bình thường</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Chiều cao / Cân nặng</span>
                  <span className="text-xs font-semibold text-slate-800">172 cm • 68.5 kg</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Nhịp tim nghỉ TB</span>
                  <span className="text-xs font-semibold text-slate-800">72 bpm (Đều)</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                  Tiền sử bệnh lý & Dị ứng
                </span>
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 space-y-1">
                  <p className="font-semibold">• Dị ứng: <span className="font-normal">Chưa ghi nhận dị ứng kháng sinh / thuốc</span></p>
                  <p className="font-semibold">• Tiền sử: <span className="font-normal">Theo dõi huyết áp định kỳ, căng cơ vai gáy khi làm việc máy tính</span></p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubModal(null)}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
                >
                  Xác nhận & Đóng
                </button>
              </div>
            </div>
          </SettingsSubModal>
        )}
      </AnimatePresence>

      {/* Sub-modal: Liên kết thiết bị đo */}
      <AnimatePresence>
        {activeSubModal === 'devices' && (
          <SettingsSubModal title="Liên kết thiết bị đo (Smartwatch/SPO2)" onClose={() => setActiveSubModal(null)}>
            <div className="space-y-3 text-xs">
              <p className="text-slate-600 text-[11px]">
                Kết nối các thiết bị ngoại vi để tự động đồng bộ dữ liệu nhịp tim, oxy trong máu (SPO2), huyết áp và số bước chân vào hệ thống Bác sĩ AI.
              </p>

              <div className="space-y-2">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <Heart className="w-4 h-4 fill-rose-600" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">Apple Health / Health Connect</span>
                      <span className="text-[10px] text-slate-500">Đã đồng bộ 5 phút trước</span>
                    </div>
                  </div>
                  <ToggleSwitch checked={appleHealthConnected} onChange={() => setAppleHealthConnected(!appleHealthConnected)} />
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Watch className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">Garmin / Smartwatch SPO2</span>
                      <span className="text-[10px] text-slate-500">Đo nồng độ oxy và nhịp tim liên tục</span>
                    </div>
                  </div>
                  <ToggleSwitch checked={garminConnected} onChange={() => setGarminConnected(!garminConnected)} />
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">Máy đo Huyết áp Bluetooth Omron</span>
                      <span className="text-[10px] text-slate-500">Sẵn sàng ghép đôi Bluetooth</span>
                    </div>
                  </div>
                  <ToggleSwitch checked={omronConnected} onChange={() => setOmronConnected(!omronConnected)} />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubModal(null)}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
                >
                  Lưu cấu hình thiết bị
                </button>
              </div>
            </div>
          </SettingsSubModal>
        )}
      </AnimatePresence>

      {/* Sub-modal: Quản lý tài khoản & Bảo mật */}
      <AnimatePresence>
        {activeSubModal === 'security' && (
          <SettingsSubModal title="Quản lý tài khoản & Bảo mật" onClose={() => setActiveSubModal(null)}>
            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">Bảo mật chuẩn y tế HIPAA</span>
                  <span className="text-[10px] text-emerald-800">Dữ liệu cá nhân và chỉ số sinh hiệu được mã hóa đầu cuối AES-256.</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Tài khoản đăng nhập</span>
                  <span className="text-xs font-semibold text-slate-800">{user?.email || 'chiendq78@gmail.com'}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Xác thực 2 lớp (2FA)</span>
                    <span className="text-[10px] text-slate-500">Bảo vệ tài khoản qua mã OTP / Email</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">Đã kích hoạt</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Đổi mật khẩu tài khoản</span>
                    <span className="text-[10px] text-slate-500">Cập nhật mật khẩu định kỳ 90 ngày</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => alert("Hệ thống đã gửi liên kết đặt lại mật khẩu an toàn đến email của bạn.")}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10.5px] font-semibold transition-all cursor-pointer"
                  >
                    Gửi mã
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubModal(null)}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
                >
                  Xác nhận & Đóng
                </button>
              </div>
            </div>
          </SettingsSubModal>
        )}
      </AnimatePresence>

      {/* Sub-modal: Điều khoản dịch vụ & Tuyên bố miễn trừ */}
      <AnimatePresence>
        {activeSubModal === 'disclaimer' && (
          <SettingsSubModal title="Tuyên bố miễn trừ y khoa & Điều khoản" onClose={() => setActiveSubModal(null)}>
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-900">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs">Cảnh báo tính pháp lý & chuyên môn của AI</h5>
                  <p className="text-[11px] mt-0.5 leading-normal">
                    "Các gợi ý, phân tích và hướng dẫn từ Bác sĩ AI mang tính chất tham khảo chuyên môn và y học cổ truyền, không thay thế chẩn đoán chuyên môn, chỉ định hoặc phác đồ điều trị trực tiếp của Bác sĩ chuyên khoa tại cơ sở y tế."
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-[11px] text-slate-600">
                <p>
                  1. <strong>Mục đích ứng dụng:</strong> Hệ thống Bác sĩ Tâm An được thiết kế nhằm hỗ trợ người dùng theo dõi lối sống lành mạnh, nhắc nhở uống thuốc, quản lý chỉ số sinh hiệu và tìm hiểu kiến thức y dược cổ truyền.
                </p>
                <p>
                  2. <strong>Trường hợp khẩn cấp:</strong> Khi gặp các tình trạng nguy cấp như khó thở, đau thắt ngực, bất tỉnh hoặc tai nạn, vui lòng nhấn nút <strong>Cấp cứu 115</strong> hoặc đến ngay cơ sở y tế gần nhất.
                </p>
                <p>
                  3. <strong>Quyền riêng tư dữ liệu:</strong> Toàn bộ dữ liệu nhật ký và hồ sơ thể trạng được lưu trữ an toàn, phục vụ mục đích chăm sóc sức khỏe cho chính người dùng.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubModal(null)}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
                >
                  Tôi đã hiểu & Đồng ý
                </button>
              </div>
            </div>
          </SettingsSubModal>
        )}
      </AnimatePresence>

      {/* Sub-modal: Chọn Ngôn ngữ */}
      <AnimatePresence>
        {activeSubModal === 'language_picker' && (
          <SettingsSubModal title="Chọn ngôn ngữ (Language)" onClose={() => setActiveSubModal(null)}>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => handleLanguageChange('vi')}
                className={cn(
                  "w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer",
                  language === 'vi' ? "bg-teal-50 border-teal-400 text-teal-900 font-bold" : "bg-white border-slate-200 text-slate-700"
                )}
              >
                <span>Tiếng Việt (Việt Nam) 🇻🇳</span>
                {language === 'vi' && <Check className="w-4 h-4 text-teal-600" />}
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={cn(
                  "w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer",
                  language === 'en' ? "bg-teal-50 border-teal-400 text-teal-900 font-bold" : "bg-white border-slate-200 text-slate-700"
                )}
              >
                <span>English (International) 🇬🇧</span>
                {language === 'en' && <Check className="w-4 h-4 text-teal-600" />}
              </button>
            </div>
          </SettingsSubModal>
        )}
      </AnimatePresence>

      {/* Sub-modal: Chọn Giao diện Theme */}
      <AnimatePresence>
        {activeSubModal === 'theme_picker' && (
          <SettingsSubModal title="Giao diện hiển thị (Theme)" onClose={() => setActiveSubModal(null)}>
            <div className="space-y-2 text-xs">
              {[
                { id: 'light', label: 'Giao diện Sáng (Khuyên dùng)', icon: Sun },
                { id: 'dark', label: 'Giao diện Tối (Bảo vệ mắt ban đêm)', icon: Moon },
                { id: 'auto', label: 'Tự động theo thiết bị', icon: Monitor },
              ].map(t => {
                const Icon = t.icon;
                const isSelected = themeMode === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleThemeChange(t.id as any)}
                    className={cn(
                      "w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer",
                      isSelected ? "bg-teal-50 border-teal-400 text-teal-900 font-bold" : "bg-white border-slate-200 text-slate-700"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-teal-600" />
                      <span>{t.label}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-teal-600" />}
                  </button>
                );
              })}
            </div>
          </SettingsSubModal>
        )}
      </AnimatePresence>

      {/* Sub-modal: Chọn Đơn vị đo lường */}
      <AnimatePresence>
        {activeSubModal === 'units_picker' && (
          <SettingsSubModal title="Đơn vị đo lường (Units)" onClose={() => setActiveSubModal(null)}>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setUnits('metric');
                  localStorage.setItem('tam_an_units', 'metric');
                  setActiveSubModal(null);
                }}
                className={cn(
                  "w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer",
                  units === 'metric' ? "bg-teal-50 border-teal-400 text-teal-900 font-bold" : "bg-white border-slate-200 text-slate-700"
                )}
              >
                <div>
                  <span className="block font-bold">Hệ mét chuẩn Việt Nam (Metric)</span>
                  <span className="text-[10px] text-slate-500">Cân nặng: kg • Đường huyết: mg/dL • Nước: ml</span>
                </div>
                {units === 'metric' && <Check className="w-4 h-4 text-teal-600" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setUnits('imperial');
                  localStorage.setItem('tam_an_units', 'imperial');
                  setActiveSubModal(null);
                }}
                className={cn(
                  "w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer",
                  units === 'imperial' ? "bg-teal-50 border-teal-400 text-teal-900 font-bold" : "bg-white border-slate-200 text-slate-700"
                )}
              >
                <div>
                  <span className="block font-bold">Hệ quốc tế Anh/Mỹ (Imperial)</span>
                  <span className="text-[10px] text-slate-500">Cân nặng: lbs • Đường huyết: mmol/L • Nước: oz</span>
                </div>
                {units === 'imperial' && <Check className="w-4 h-4 text-teal-600" />}
              </button>
            </div>
          </SettingsSubModal>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
        checked ? "bg-teal-600" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

function SettingsSubModal({ 
  title, 
  onClose, 
  children 
}: { 
  title: string; 
  onClose: () => void; 
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 overflow-hidden space-y-4 max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
          <h4 className="text-sm font-bold text-slate-900 font-serif">{title}</h4>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto pr-1 flex-1">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function SidebarNavItem({ 
  active, 
  icon: Icon, 
  title, 
  onClick 
}: { 
  active: boolean; 
  icon: React.ElementType; 
  title: string; 
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
        active 
          ? "bg-teal-600 text-white shadow-xs font-bold" 
          : "text-slate-700 hover:text-slate-900 hover:bg-white/80"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className={cn("w-4 h-4 shrink-0", active ? "text-white" : "text-teal-700")} />
        <span className="truncate">{title}</span>
      </div>
      <ChevronRight className={cn("w-3.5 h-3.5 shrink-0", active ? "text-white/80" : "text-slate-400")} />
    </button>
  );
}


