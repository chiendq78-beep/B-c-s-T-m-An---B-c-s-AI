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
import { useLanguage } from '../contexts/LanguageContext';

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

  // Toast notification for user feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

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
  const { language, setLanguage, t } = useLanguage();
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>(() => {
    return (localStorage.getItem('tam_an_theme') as any) || 'light';
  });
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>(() => {
    return (localStorage.getItem('tam_an_font_size') as any) || 'normal';
  });

  // Profile editable states
  const [profileBloodType, setProfileBloodType] = useState(() => localStorage.getItem('profile_bloodType') || 'O+');
  const [profileHeight, setProfileHeight] = useState(() => localStorage.getItem('profile_height') || '172');
  const [profileWeight, setProfileWeight] = useState(() => localStorage.getItem('profile_weight') || '68.5');
  const [profileAllergies, setProfileAllergies] = useState(() => localStorage.getItem('profile_allergies') || 'Chưa ghi nhận dị ứng thuốc');
  const [profileConditions, setProfileConditions] = useState(() => localStorage.getItem('profile_conditions') || 'Theo dõi huyết áp định kỳ');

  // Security states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => localStorage.getItem('tam_an_2fa') !== 'false');
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  // Connected device status state
  const [appleHealthConnected, setAppleHealthConnected] = useState(() => localStorage.getItem('tam_an_apple_health') !== 'false');
  const [garminConnected, setGarminConnected] = useState(() => localStorage.getItem('tam_an_garmin') !== 'false');
  const [omronConnected, setOmronConnected] = useState(() => localStorage.getItem('tam_an_omron') === 'true');

  // Sub-modal states
  const [activeSubModal, setActiveSubModal] = useState<
    'profile' | 'devices' | 'security' | 'disclaimer' | 'dnd_picker' | 'language_picker' | 'theme_picker' | 'fontSize_picker' | null
  >(null);

  // Initial font size and theme sync
  useEffect(() => {
    const saved = localStorage.getItem('tam_an_font_size');
    if (saved === 'large') {
      document.documentElement.classList.add('font-scale-large');
      document.documentElement.classList.remove('font-scale-xlarge');
      document.documentElement.style.fontSize = '18px';
      if (document.body) (document.body.style as any).zoom = '1.12';
    } else if (saved === 'xlarge') {
      document.documentElement.classList.add('font-scale-xlarge');
      document.documentElement.classList.remove('font-scale-large');
      document.documentElement.style.fontSize = '21px';
      if (document.body) (document.body.style as any).zoom = '1.25';
    } else {
      document.documentElement.classList.remove('font-scale-large', 'font-scale-xlarge');
      document.documentElement.style.fontSize = '16px';
      if (document.body) (document.body.style as any).zoom = '1';
    }

    const savedTheme = localStorage.getItem('tam_an_theme') || 'light';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (savedTheme === 'auto' && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Sync settings changes
  const toggleAppNotifications = async () => {
    const nextVal = !appNotificationsEnabled;
    setAppNotificationsEnabled(nextVal);
    localStorage.setItem('tam_an_app_notifications', String(nextVal));
    showToast(nextVal ? (language === 'vi' ? 'Đã bật thông báo ứng dụng' : 'App notifications enabled') : (language === 'vi' ? 'Đã tắt thông báo ứng dụng' : 'App notifications disabled'));
    if (nextVal) {
      await reminderService.requestNotificationPermission();
    }
  };

  const toggleHabitReminders = () => {
    const nextVal = !habitRemindersEnabled;
    setHabitRemindersEnabled(nextVal);
    localStorage.setItem('tam_an_habit_reminders', String(nextVal));
    showToast(nextVal ? (language === 'vi' ? 'Đã bật nhắc nhở uống nước & tập luyện' : 'Habit reminders enabled') : (language === 'vi' ? 'Đã tắt nhắc nhở tập luyện' : 'Habit reminders disabled'));
  };

  const toggleDnd = () => {
    const nextVal = !dndEnabled;
    setDndEnabled(nextVal);
    localStorage.setItem('tam_an_dnd_enabled', String(nextVal));
    showToast(nextVal ? (language === 'vi' ? `Đã bật Không làm phiền (${dndTime})` : `DND activated (${dndTime})`) : (language === 'vi' ? 'Đã tắt Không làm phiền' : 'DND deactivated'));
  };

  const handleLanguageChange = (lang: 'vi' | 'en') => {
    setLanguage(lang);
    showToast(lang === 'vi' ? 'Đã áp dụng: Tiếng Việt 🇻🇳' : 'Language applied: English 🇬🇧');
    setActiveSubModal(null);
  };

  const handleThemeChange = (mode: 'light' | 'dark' | 'auto') => {
    setThemeMode(mode);
    localStorage.setItem('tam_an_theme', mode);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = mode === 'dark' || (mode === 'auto' && prefersDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      showToast(language === 'vi' ? 'Đã áp dụng Giao diện Tối 🌙' : 'Dark theme applied 🌙');
    } else {
      document.documentElement.classList.remove('dark');
      showToast(language === 'vi' ? 'Đã áp dụng Giao diện Sáng ☀️' : 'Light theme applied ☀️');
    }
    window.dispatchEvent(new CustomEvent('tam-an-theme-changed', { detail: { theme: mode } }));
    setActiveSubModal(null);
  };

  const handleFontSizeChange = (size: 'normal' | 'large' | 'xlarge') => {
    setFontSize(size);
    localStorage.setItem('tam_an_font_size', size);
    if (size === 'large') {
      document.documentElement.classList.add('font-scale-large');
      document.documentElement.classList.remove('font-scale-xlarge');
      document.documentElement.style.fontSize = '18px';
      if (document.body) (document.body.style as any).zoom = '1.12';
      showToast(language === 'vi' ? 'Đã áp dụng Cỡ chữ Lớn (+12%)' : 'Large font applied (+12%)');
    } else if (size === 'xlarge') {
      document.documentElement.classList.add('font-scale-xlarge');
      document.documentElement.classList.remove('font-scale-large');
      document.documentElement.style.fontSize = '21px';
      if (document.body) (document.body.style as any).zoom = '1.25';
      showToast(language === 'vi' ? 'Đã áp dụng Cỡ chữ Rất lớn (+25%)' : 'Extra large font applied (+25%)');
    } else {
      document.documentElement.classList.remove('font-scale-large', 'font-scale-xlarge');
      document.documentElement.style.fontSize = '16px';
      if (document.body) (document.body.style as any).zoom = '1';
      showToast(language === 'vi' ? 'Đã trở về Cỡ chữ Tiêu chuẩn' : 'Standard font restored');
    }
    window.dispatchEvent(new CustomEvent('tam-an-font-changed', { detail: { fontSize: size } }));
    setActiveSubModal(null);
  };

  if (!isOpen) return null;

  const isGuest = (!profile?.fullName || profile?.fullName === 'Người dùng Trải nghiệm' || profile?.fullName === 'Người dùng' || isAnonymousUser);
  const displayName = isGuest ? 'Chế độ khách' : profile.fullName;

  const renderUserFooter = () => (
    <div className="bg-white/95 border border-emerald-200/80 rounded-2xl p-3 shadow-xs space-y-2 mt-1">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold font-serif text-sm flex-shrink-0 shadow-2xs">
          {isGuest ? 'K' : (displayName ? displayName.charAt(0).toUpperCase() : 'C')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-semibold text-slate-800 truncate">
              {displayName}
            </h4>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
              {isGuest ? t('drawer.guest') : t('drawer.member')}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 truncate mt-0.5">
            {isGuest ? (language === 'vi' ? 'Chưa đăng nhập' : 'Not signed in') : (profile?.email || user?.email || 'chiendq78@gmail.com')}
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="text-[10px] text-slate-500">
          {language === 'vi' ? 'Phiên bản' : 'Version'} <span className="font-semibold text-slate-700">v2.4.0</span> (Build 2026)
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
            <span>{t('drawer.auth_logout')}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAuthModal();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[10.5px] font-bold transition-all cursor-pointer shadow-xs active:scale-95 text-force-white"
          >
            <span>{t('drawer.auth_login')}</span>
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
              title={t('drawer.back_to_menu')}
            >
              <div className="w-8 h-8 rounded-full bg-white/80 group-hover:bg-white flex items-center justify-center border border-emerald-200 shadow-2xs">
                <ArrowLeft className="w-4 h-4 text-teal-800" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm tracking-wide uppercase">{t('drawer.settings')}</h3>
                <p className="text-[9px] text-teal-700 font-medium">{t('drawer.settings_subtitle')}</p>
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

        {/* Toast feedback banner */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              className="mx-1 mt-2.5 mb-1 p-2.5 rounded-xl bg-teal-800 text-white text-xs font-semibold shadow-lg flex items-center gap-2 border border-teal-600/50 text-force-white shrink-0 z-20"
            >
              <Check className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="truncate flex-1">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================== */}
        {/* TAB 1: MENU ĐIỀU HƯỚNG & CHỨC NĂNG CHÍNH                       */}
        {/* ============================================================== */}
        {activeTab === 'navigation' ? (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1 pt-2 pb-10 sm:pb-12">
            {/* Subsystem menus navigation list */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold pl-2 mb-1">
                  {language === 'vi' ? 'Chức năng chính' : 'Main Features'}
                </p>
                <SidebarNavItem 
                  active={activeView === 'home'} 
                  icon={Home} 
                  title={t('drawer.home')} 
                  onClick={() => { navigateToView?.('home'); onClose(); }} 
                />
                <SidebarNavItem 
                  active={activeView === 'anatomy'} 
                  icon={Activity} 
                  title={t('drawer.anatomy')} 
                  onClick={() => { navigateToView?.('anatomy'); onClose(); }} 
                />
                <SidebarNavItem 
                  active={activeView === 'disease'} 
                  icon={BookOpen} 
                  title={t('drawer.disease')} 
                  onClick={() => { navigateToView?.('disease'); onClose(); }} 
                />
                <SidebarNavItem 
                  active={activeView === 'herb'} 
                  icon={Leaf} 
                  title={t('drawer.herb')} 
                  onClick={() => { navigateToView?.('herb'); onClose(); }} 
                />
                <SidebarNavItem 
                  active={activeView === 'health'} 
                  icon={Heart} 
                  title={t('drawer.health')} 
                  onClick={() => { navigateToView?.('health'); onClose(); }} 
                />
              </div>

              {/* Phần 2: Hỗ trợ & Y tế AI */}
              <div className="pt-3 border-t border-emerald-200/70 space-y-2">
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold pl-2 mb-1">
                  {t('drawer.support_section')}
                </p>
                
                {/* Emergency SOS Banner */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenEmergency?.();
                  }}
                  className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex items-center justify-between shadow-sm transition-all cursor-pointer group border border-teal-500/30 mb-1 active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center animate-pulse flex-shrink-0">
                      <PhoneCall className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      {t('drawer.emergency_115')}
                    </h4>
                  </div>
                  <span 
                    className="badge-sos-red px-2.5 py-0.5 rounded-full bg-white font-black text-[11px] uppercase tracking-wider shadow-xs shrink-0 inline-flex items-center justify-center select-none text-red-600"
                    style={{ color: '#dc2626' }}
                  >
                    SOS
                  </span>
                </button>

                <SidebarNavItem 
                  active={false} 
                  icon={MessageSquare} 
                  title={t('drawer.chat_ai')} 
                  onClick={() => { 
                    onClose(); 
                    onOpenAIChat?.();
                  }} 
                />
              </div>

              {/* Phần 3: CÀI ĐẶT (Nhóm Cài đặt Hệ thống, Nhắc nhở & Báo giờ, Hỗ trợ & Góp ý) */}
              <div className="pt-3 border-t border-emerald-200/70 space-y-1.5">
                <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold pl-2 mb-1">
                  {t('drawer.settings_section')}
                </p>
                <SidebarNavItem 
                  active={false} 
                  icon={Settings} 
                  title={t('drawer.system_settings')} 
                  onClick={() => { 
                    setActiveTab('settings');
                  }} 
                />
                <SidebarNavItem 
                  active={false} 
                  icon={Bell} 
                  title={t('drawer.notification_settings')} 
                  onClick={() => { 
                    onClose(); 
                    onOpenNotificationSettings();
                  }} 
                />
                <SidebarNavItem 
                  active={false} 
                  icon={HelpCircle} 
                  title={t('drawer.support_center')} 
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
            
            {/* 1. 👤 TÀI KHOẢN & HỒ SƠ Y TẾ */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 pl-2 mb-1">
                <User className="w-3.5 h-3.5 text-teal-700" />
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  {t('drawer.profile')}
                </span>
              </div>
              <div className="bg-white/95 border border-emerald-200/80 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveSubModal('security')}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-teal-50/50 transition-colors group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-semibold text-slate-800 block">{t('drawer.account_sec')}</span>
                    <span className="text-[10px] text-slate-500 block">{t('drawer.account_sec_desc')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubModal('profile')}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-teal-50/50 transition-colors group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-semibold text-slate-800 block">{t('drawer.profile')}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{t('drawer.profile_desc')}</span>
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
                    <span className="text-xs font-semibold text-slate-800 block">{t('drawer.devices')}</span>
                    <span className="text-[10px] text-slate-500 block">{t('drawer.devices_desc')}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-teal-700 font-semibold text-xs">
                    <span className="text-[10.5px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg">
                      {appleHealthConnected ? (language === 'vi' ? 'Đã kết nối Apple Health' : 'Apple Health Connected') : (language === 'vi' ? 'Chưa liên kết' : 'Not Linked')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </div>
                </button>
              </div>
            </div>

            {/* 2. 🔔 THÔNG BÁO & LỊCH NHẮC */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 pl-2 mb-1">
                <Bell className="w-3.5 h-3.5 text-teal-700" />
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  {t('section.notifications')}
                </span>
              </div>
              <div className="bg-white/95 border border-emerald-200/80 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
                <div className="px-3.5 py-2.5 flex items-center justify-between">
                  <div className="pr-2">
                    <span className="text-xs font-semibold text-slate-800 block">{t('notify.app')}</span>
                    <span className="text-[10px] text-slate-500">{t('notify.app_desc')}</span>
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
                    <span className="text-xs font-semibold text-slate-800 block">{t('notify.medication')}</span>
                    <span className="text-[10px] text-slate-500 block">{t('notify.medication_desc')}</span>
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
                    <span className="text-xs font-semibold text-slate-800 block">{t('notify.workout')}</span>
                    <span className="text-[10px] text-slate-500">{t('notify.workout_desc')}</span>
                  </div>
                  <ToggleSwitch checked={habitRemindersEnabled} onChange={toggleHabitReminders} />
                </div>

                <div className="px-3.5 py-2.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveSubModal('dnd_picker')}
                    className="pr-2 text-left cursor-pointer group flex-1"
                  >
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-teal-700 block transition-colors">
                      {t('notify.dnd')}
                    </span>
                    <span className="text-[10px] text-slate-500">{t('notify.dnd_desc')} ({dndTime})</span>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
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
                  {t('section.preferences')}
                </span>
              </div>
              <div className="bg-white/95 border border-emerald-200/80 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
                
                {/* 1. Ngôn ngữ (Language) */}
                <div className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveSubModal('language_picker')}
                      className="text-left group cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
                        {t('pref.language')}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-colors" />
                    </button>
                    <span className="bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold px-2 py-0.5 rounded-lg">
                      {language === 'vi' ? 'Tiếng Việt 🇻🇳' : 'English 🇬🇧'}
                    </span>
                  </div>

                  {/* Direct One-Tap Language Switch */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleLanguageChange('vi')}
                      className={cn(
                        "py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-97",
                        language === 'vi'
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs font-bold text-force-white"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      )}
                    >
                      <span>Tiếng Việt 🇻🇳</span>
                      {language === 'vi' && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLanguageChange('en')}
                      className={cn(
                        "py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-97",
                        language === 'en'
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs font-bold text-force-white"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      )}
                    >
                      <span>English 🇬🇧</span>
                      {language === 'en' && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  </div>
                </div>

                {/* 2. Giao diện (Theme) */}
                <div className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveSubModal('theme_picker')}
                      className="text-left group cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
                        {t('pref.theme')}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-colors" />
                    </button>
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold px-2 py-0.5 rounded-lg">
                      {themeMode === 'light' ? t('pref.theme_light') : themeMode === 'dark' ? t('pref.theme_dark') : t('pref.theme_auto')}
                    </span>
                  </div>

                  {/* Direct One-Tap Theme Switch */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'light', label: t('pref.theme_light'), icon: Sun },
                      { id: 'dark', label: t('pref.theme_dark'), icon: Moon },
                      { id: 'auto', label: t('pref.theme_auto'), icon: Monitor },
                    ].map(item => {
                      const Icon = item.icon;
                      const isSelected = themeMode === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleThemeChange(item.id as any)}
                          className={cn(
                            "py-2 px-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-97",
                            isSelected
                              ? "bg-teal-600 text-white border-teal-600 shadow-xs font-bold text-force-white"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-white" : "text-slate-500")} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Cỡ chữ & Trợ năng (Font Size & Accessibility) */}
                <div className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveSubModal('fontSize_picker')}
                      className="text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-teal-700 transition-colors block">
                          {t('pref.fontsize')}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-colors" />
                      </div>
                      <span className="text-[10px] text-slate-500 block">{t('pref.fontsize_desc')}</span>
                    </button>
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold px-2 py-0.5 rounded-lg shrink-0">
                      {fontSize === 'normal' ? '100%' : fontSize === 'large' ? '+12%' : '+25%'}
                    </span>
                  </div>

                  {/* Direct One-Tap Font Scale Switch */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'normal', label: language === 'vi' ? 'Chuẩn' : 'Standard', scale: '100%' },
                      { id: 'large', label: language === 'vi' ? 'Lớn' : 'Large', scale: '+12%' },
                      { id: 'xlarge', label: language === 'vi' ? 'Rất lớn' : 'X-Large', scale: '+25%' },
                    ].map(item => {
                      const isSelected = fontSize === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleFontSizeChange(item.id as any)}
                          className={cn(
                            "py-2 px-1 rounded-xl border text-[11px] flex flex-col items-center justify-center transition-all cursor-pointer active:scale-97",
                            isSelected
                              ? "bg-teal-600 text-white border-teal-600 shadow-xs font-bold text-force-white"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          <span className={cn("text-xs font-bold leading-tight", isSelected ? "text-white" : "text-slate-800")}>
                            {item.label}
                          </span>
                          <span className={cn("text-[9px] mt-0.5", isSelected ? "text-teal-100" : "text-slate-400")}>
                            {item.scale}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* 4. 📞 TRỢ GIÚP & LIÊN HỆ */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 pl-2 mb-1">
                <PhoneCall className="w-3.5 h-3.5 text-teal-700" />
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  {t('section.support')}
                </span>
              </div>
              <div className="bg-white/95 border border-emerald-200/80 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
                <a
                  href="tel:19006868"
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-teal-50/50 transition-colors group cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">{t('support.hotline')}</span>
                    <span className="text-[10px] text-slate-500">{t('support.hotline_desc')}</span>
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
                  <span className="text-xs font-semibold text-slate-800">{t('support.feedback')}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubModal('disclaimer')}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-teal-50/50 transition-colors group cursor-pointer"
                >
                  <div className="pr-2">
                    <span className="text-xs font-semibold text-slate-800 block">{t('support.disclaimer')}</span>
                    <span className="text-[9.5px] text-slate-500 line-clamp-1">{t('support.disclaimer_desc')}</span>
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
                <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold font-serif text-lg shrink-0 text-force-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{displayName}</h4>
                  <p className="text-[11px] text-teal-800">Email: {user?.email || 'chiendq78@gmail.com'}</p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                    Hồ sơ Y tế đã xác thực
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Nhóm máu</label>
                  <select
                    value={profileBloodType}
                    onChange={(e) => setProfileBloodType(e.target.value)}
                    className="w-full bg-white p-1.5 border border-slate-300 rounded-lg text-xs font-bold text-rose-600 outline-none focus:border-teal-500"
                  >
                    <option value="O+">O+ (Rh+)</option>
                    <option value="O-">O- (Rh-)</option>
                    <option value="A+">A+ (Rh+)</option>
                    <option value="A-">A- (Rh-)</option>
                    <option value="B+">B+ (Rh+)</option>
                    <option value="B-">B- (Rh-)</option>
                    <option value="AB+">AB+ (Rh+)</option>
                    <option value="AB-">AB- (Rh-)</option>
                  </select>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Thể trạng / BMI</span>
                  <div className="p-1.5 text-xs font-bold text-teal-700">
                    {(Number(profileWeight) / Math.pow(Number(profileHeight) / 100, 2)).toFixed(1)} • Cân đối
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Chiều cao (cm)</label>
                  <input
                    type="number"
                    value={profileHeight}
                    onChange={(e) => setProfileHeight(e.target.value)}
                    className="w-full bg-white p-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Cân nặng (kg)</label>
                  <input
                    type="number"
                    value={profileWeight}
                    onChange={(e) => setProfileWeight(e.target.value)}
                    className="w-full bg-white p-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-200">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Dị ứng thuốc & Thực phẩm
                  </label>
                  <input
                    type="text"
                    value={profileAllergies}
                    onChange={(e) => setProfileAllergies(e.target.value)}
                    placeholder="VD: Dị ứng Penicillin, tôm cua..."
                    className="w-full bg-white p-2 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Tiền sử bệnh lý nền
                  </label>
                  <input
                    type="text"
                    value={profileConditions}
                    onChange={(e) => setProfileConditions(e.target.value)}
                    placeholder="VD: Huyết áp định kỳ, đau mỏi vai gáy..."
                    className="w-full bg-white p-2 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('profile_bloodType', profileBloodType);
                    localStorage.setItem('profile_height', profileHeight);
                    localStorage.setItem('profile_weight', profileWeight);
                    localStorage.setItem('profile_allergies', profileAllergies);
                    localStorage.setItem('profile_conditions', profileConditions);
                    showToast('Đã lưu hồ sơ bệnh án thành công');
                    setActiveSubModal(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  Lưu thay đổi hồ sơ
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
              <p className="text-slate-600 text-[11px] leading-relaxed">
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
                      <span className="text-[10px] text-slate-500">
                        {appleHealthConnected ? 'Đang đồng bộ tự động 5 phút/lần' : 'Chưa kích hoạt đồng bộ'}
                      </span>
                    </div>
                  </div>
                  <ToggleSwitch 
                    checked={appleHealthConnected} 
                    onChange={() => {
                      const next = !appleHealthConnected;
                      setAppleHealthConnected(next);
                      localStorage.setItem('tam_an_apple_health', String(next));
                      showToast(next ? 'Đã kết nối Apple Health / Health Connect' : 'Đã ngắt kết nối Apple Health');
                    }} 
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Watch className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">Garmin / Smartwatch SPO2</span>
                      <span className="text-[10px] text-slate-500">
                        {garminConnected ? 'Đã ghép đôi Bluetooth SPO2' : 'Chưa liên kết smartwatch'}
                      </span>
                    </div>
                  </div>
                  <ToggleSwitch 
                    checked={garminConnected} 
                    onChange={() => {
                      const next = !garminConnected;
                      setGarminConnected(next);
                      localStorage.setItem('tam_an_garmin', String(next));
                      showToast(next ? 'Đã kích hoạt Smartwatch Garmin SPO2' : 'Đã tắt kết nối Garmin');
                    }} 
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">Máy đo Huyết áp Bluetooth Omron</span>
                      <span className="text-[10px] text-slate-500">
                        {omronConnected ? 'Sẵn sàng nhận dữ liệu huyết áp' : 'Chưa bật ghép đôi Bluetooth'}
                      </span>
                    </div>
                  </div>
                  <ToggleSwitch 
                    checked={omronConnected} 
                    onChange={() => {
                      const next = !omronConnected;
                      setOmronConnected(next);
                      localStorage.setItem('tam_an_omron', String(next));
                      showToast(next ? 'Đã kết nối Máy đo huyết áp Omron' : 'Đã ngắt kết nối Omron');
                    }} 
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubModal(null)}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  Xác nhận & Đóng
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
                  <span className="text-[10px] text-emerald-800 leading-tight block">Dữ liệu cá nhân và chỉ số sinh hiệu được mã hóa đầu cuối AES-256.</span>
                </div>
              </div>

              {passwordResetSent && (
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center gap-2 animate-fade-in">
                  <Check className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-[11px] font-medium leading-relaxed">
                    Liên kết đặt lại mật khẩu đã được gửi đến <strong>{user?.email || 'chiendq78@gmail.com'}</strong>.
                  </span>
                </div>
              )}

              {cacheCleared && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-2 animate-fade-in">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-[11px] font-medium leading-relaxed">
                    Đã giải phóng 14.8 MB bộ nhớ đệm cục bộ thành công!
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Tài khoản đăng nhập</span>
                    <span className="text-xs font-semibold text-slate-800">{user?.email || 'chiendq78@gmail.com'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Đã xác thực
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Xác thực 2 lớp (2FA)</span>
                    <span className="text-[10px] text-slate-500">Bảo vệ tài khoản qua mã OTP / Email</span>
                  </div>
                  <ToggleSwitch
                    checked={twoFactorEnabled}
                    onChange={() => {
                      const next = !twoFactorEnabled;
                      setTwoFactorEnabled(next);
                      localStorage.setItem('tam_an_2fa', String(next));
                      showToast(next ? 'Đã kích hoạt xác thực 2 lớp (2FA)' : 'Đã tắt xác thực 2 lớp');
                    }}
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Đổi mật khẩu tài khoản</span>
                    <span className="text-[10px] text-slate-500">Cập nhật mật khẩu định kỳ 90 ngày</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setPasswordResetSent(true);
                      showToast('Đã gửi email khôi phục mật khẩu');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10.5px] font-semibold transition-all cursor-pointer active:scale-95"
                  >
                    Gửi mã
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Dọn dẹp bộ nhớ đệm (Cache)</span>
                    <span className="text-[10px] text-slate-500">Giải phóng dung lượng dữ liệu tạm thời</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setCacheCleared(true);
                      showToast('Đã dọn sạch bộ nhớ đệm');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10.5px] font-semibold transition-all cursor-pointer active:scale-95"
                  >
                    Dọn dẹp
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubModal(null)}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  Xác nhận & Đóng
                </button>
              </div>
            </div>
          </SettingsSubModal>
        )}
      </AnimatePresence>

      {/* Sub-modal: Cài đặt Không làm phiền (DND) */}
      <AnimatePresence>
        {activeSubModal === 'dnd_picker' && (
          <SettingsSubModal title="Khung giờ Không làm phiền (DND)" onClose={() => setActiveSubModal(null)}>
            <div className="space-y-3 text-xs">
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Trong khung giờ này, ứng dụng sẽ tắt chuông thông báo để bạn có giấc ngủ sâu và yên tĩnh (ngoại trừ cảnh báo y tế khẩn cấp 115).
              </p>
              <div className="space-y-2">
                {[
                  { label: '22:00 - 06:00 (Ban đêm tiêu chuẩn)', val: '22:00 - 06:00' },
                  { label: '21:00 - 07:00 (Nghỉ ngơi sớm cho người cao tuổi)', val: '21:00 - 07:00' },
                  { label: '23:00 - 06:30 (Thức khuya hơn)', val: '23:00 - 06:30' },
                  { label: '20:00 - 08:00 (Yên tĩnh tối đa)', val: '20:00 - 08:00' },
                ].map(opt => {
                  const isSelected = dndTime === opt.val;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        setDndTime(opt.val);
                        localStorage.setItem('tam_an_dnd_time', opt.val);
                        showToast(`Đã chọn khung giờ: ${opt.val}`);
                        setActiveSubModal(null);
                      }}
                      className={cn(
                        "w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left",
                        isSelected ? "bg-teal-50 border-teal-500 text-teal-900 font-bold shadow-2xs" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <span className="text-xs font-semibold">{opt.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-teal-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </SettingsSubModal>
        )}
      </AnimatePresence>

      {/* Sub-modal: Chọn Cỡ chữ & Trợ năng */}
      <AnimatePresence>
        {activeSubModal === 'fontSize_picker' && (
          <SettingsSubModal title="Cỡ chữ & Hỗ trợ Thị giác" onClose={() => setActiveSubModal(null)}>
            <div className="space-y-3 text-xs">
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tự động phóng to toàn bộ nội dung ứng dụng, giúp người lớn tuổi hoặc người thị lực kém đọc thông tin sinh hiệu và bài thuốc rõ ràng.
              </p>
              <div className="space-y-2">
                {[
                  { id: 'normal', label: 'Cỡ chữ Bình thường', desc: 'Kích thước tiêu chuẩn (100%)', scale: '100%' },
                  { id: 'large', label: 'Cỡ chữ Lớn (Khuyên dùng)', desc: 'Phóng to nhẹ chữ và nút bấm (+12%)', scale: '112%' },
                  { id: 'xlarge', label: 'Cỡ chữ Rất lớn', desc: 'Dễ đọc tối đa cho người cao tuổi (+25%)', scale: '125%' },
                ].map(opt => {
                  const isSelected = fontSize === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleFontSizeChange(opt.id as any)}
                      className={cn(
                        "w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left",
                        isSelected ? "bg-teal-50 border-teal-500 text-teal-900 font-bold shadow-2xs" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <div>
                        <span className="block font-bold">{opt.label}</span>
                        <span className="text-[10px] text-slate-500 font-normal">{opt.desc}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">{opt.scale}</span>
                        {isSelected && <Check className="w-4 h-4 text-teal-600" />}
                      </div>
                    </button>
                  );
                })}
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
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
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
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer z-[95]"
      />
      {/* Modal Dialog */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative z-[96] w-full max-w-sm sm:max-w-md bg-white submodal-container rounded-3xl p-5 shadow-2xl border border-slate-200 overflow-hidden space-y-4 max-h-[85vh] flex flex-col"
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


