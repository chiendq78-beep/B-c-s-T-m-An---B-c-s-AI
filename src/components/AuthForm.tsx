import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  Activity, 
  AlertCircle,
  CheckCircle2,
  X,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { registerModal } from '../utils/modalManager';

interface AuthFormProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function AuthForm({ onClose, onSuccess }: AuthFormProps) {
  const { 
    signInWithGoogle, 
    signUpWithEmail, 
    signInWithEmail
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [googleStatusText, setGoogleStatusText] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Close on Escape or Android Back Gesture
  useEffect(() => {
    if (!onClose) return;
    const unregister = registerModal('auth-page-modal', onClose);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleBackPress = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('app-back-press', handleBackPress);
    return () => {
      unregister();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('app-back-press', handleBackPress);
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    
    // Basic validation
    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setErrorMsg('Vui lòng điền họ và tên của bạn.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email.trim(), password, fullName.trim(), 'user');
        setSuccessMsg('Đăng ký tài khoản thành công! Đang đăng nhập...');
      } else {
        await signInWithEmail(email.trim(), password);
      }
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 600);
    } catch (err: any) {
      console.error(err);
      let localizedError = 'Lỗi hệ thống. Vui lòng thử lại sau.';
      switch (err.code) {
        case 'auth/email-already-in-use':
          localizedError = 'Email này đã được sử dụng bởi một tài khoản khác.';
          break;
        case 'auth/invalid-email':
          localizedError = 'Định dạng email không hợp lệ.';
          break;
        case 'auth/operation-not-allowed':
          localizedError = 'Phương thức đăng nhập này chưa được kích hoạt.';
          break;
        case 'auth/weak-password':
          localizedError = 'Mật khẩu quá yếu, vui lòng chọn mật khẩu mạnh hơn.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          localizedError = 'Email hoặc mật khẩu không chính xác.';
          break;
        default:
          if (err.message) localizedError = err.message;
      }
      setErrorMsg(localizedError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoadingGoogle(true);
    setGoogleStatusText("Đang kết nối tài khoản Google...");

    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      console.error("Google sign in error:", err);
      let msg = "Đăng nhập bằng Google không thành công.";
      if (err.code === 'auth/popup-blocked') {
        msg = "Cửa sổ đăng nhập Google bị chặn trên trình duyệt di động. Vui lòng cho phép mở cửa sổ bật lên (pop-up) trong cài đặt trình duyệt.";
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = "Tên miền hiện tại cần được cấp quyền trong Firebase Auth (Authorized Domains).";
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = "Bạn đã hủy thao tác đăng nhập Google.";
      } else if (err.code === 'auth/network-request-failed') {
        msg = "Lỗi kết nối mạng. Vui lòng kiểm tra Wifi/4G.";
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMsg(msg);
    } finally {
      setLoadingGoogle(false);
      setGoogleStatusText(null);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100 select-none">
      {/* Fullscreen Top Navigation Bar */}
      <div className="shrink-0 flex items-center justify-between px-3 sm:px-6 pt-[calc(max(env(safe-area-inset-top,0px),12px)+0.5rem)] pb-3 border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-2xs">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer active:scale-95 shadow-2xs"
            title="Quay lại"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Quay lại</span>
          </button>
        ) : (
          <div className="w-16" />
        )}

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <span className="font-serif italic text-base sm:text-lg text-slate-900 font-light">Bác sĩ Tâm An</span>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer active:scale-95 shadow-2xs"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      {/* Main Content Area: Centered Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-sm sm:max-w-md mx-auto p-6 sm:p-8 bg-white border border-slate-200/90 rounded-3xl shadow-xl space-y-6">
          {/* Visual Header Branding */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-teal-50 border border-teal-200 text-teal-600 mx-auto rounded-2xl flex items-center justify-center shadow-md animate-pulse">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-serif text-2xl italic font-light text-slate-900">Bác sĩ Tâm An</h1>
              <p className="text-[10px] text-teal-700 font-bold uppercase tracking-[0.25em] mt-0.5">Đồng Bộ & Quản Lý Hồ Sơ</p>
            </div>
          </div>

          {/* Tabs Switch Button */}
          <div className="flex bg-slate-100 border border-slate-200/80 p-1 rounded-2xl shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                !isSignUp ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                isSignUp ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng ký
            </button>
          </div>

          {/* Error & Success Notification Area */}
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span className="font-medium leading-relaxed">{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span className="font-medium leading-relaxed">{successMsg}</span>
            </motion.div>
          )}

          {/* Primary Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required={isSignUp}
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs sm:text-sm font-medium transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Địa chỉ Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="example@taman.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs sm:text-sm font-medium transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs sm:text-sm font-medium transition-all"
                />
              </div>
            </div>

            {/* Submit action button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <span>{isSignUp ? 'Tạo tài khoản' : 'Đăng nhập'}</span>
              )}
            </button>
          </form>

          {/* Alternative Login Providers Divider */}
          <div className="flex items-center">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="px-3 text-[9px] text-slate-500 uppercase tracking-wider font-bold">Hoặc tiếp tục với</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          {/* Official Google Sign-In & Instant Direct Login */}
          <div className="space-y-2.5">
            <button
              type="button"
              disabled={loading || loadingGoogle}
              onClick={handleGoogleSignIn}
              className="w-full h-11 sm:h-12 flex items-center justify-center gap-3 bg-white border border-[#dadce0] hover:border-[#bdc1c6] hover:bg-[#f8fafd] active:bg-[#f1f3f4] text-[#3c4043] text-sm font-medium rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#4285f4]/30"
              aria-label="Đăng nhập bằng Google"
            >
              {loadingGoogle ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin text-[#4285f4]" />
                  <span className="text-sm text-[#3c4043] font-medium">{googleStatusText || "Đang kết nối tài khoản Google..."}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span className="tracking-normal font-medium">Đăng nhập bằng Google</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="shrink-0 text-center pb-[calc(max(env(safe-area-inset-bottom,0px),16px))] pt-2 px-4 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
        <span>Bảo mật & Mã hóa dữ liệu theo tiêu chuẩn Y tế • Bác sĩ Tâm An AI</span>
      </div>
    </div>
  );
}
