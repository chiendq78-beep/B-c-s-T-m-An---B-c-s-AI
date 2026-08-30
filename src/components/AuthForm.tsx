import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  Activity, 
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { motion } from 'motion/react';

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setErrorMsg("Đăng nhập bằng Google không thành công.");
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto p-6 bg-panel border border-border rounded-3xl shadow-2xl space-y-6 relative" id="auth-form-container">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Visual Header Branding */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-teal-500/10 border border-teal-500/20 text-primary mx-auto rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
          <Activity className="w-7 h-7" />
        </div>
        <div>
          <h1 className="font-serif text-2xl italic font-light text-white">Bác sĩ Tâm An</h1>
          <p className="text-[9px] text-primary font-bold uppercase tracking-[0.25em] mt-0.5">Đồng Bộ & Quản Lý Hồ Sơ</p>
        </div>
      </div>

      {/* Tabs Switch Button */}
      <div className="flex bg-bg border border-border/80 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(false);
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
            !isSignUp ? 'bg-primary text-bg font-bold shadow-md' : 'text-text-dim hover:text-white'
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
          className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
            isSignUp ? 'bg-primary text-bg font-bold shadow-md' : 'text-text-dim hover:text-white'
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
          className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-light leading-relaxed">{errorMsg}</span>
        </motion.div>
      )}

      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="font-light leading-relaxed">{successMsg}</span>
        </motion.div>
      )}

      {/* Primary Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Họ và tên</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input
                type="text"
                required={isSignUp}
                placeholder="Nguyen Van A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-text-dim/60 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-light transition-all"
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Địa chỉ Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
            <input
              type="email"
              required
              placeholder="example@taman.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-text-dim/60 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-light transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Mật khẩu</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
            <input
              type="password"
              required
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-text-dim/60 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-light transition-all"
            />
          </div>
        </div>

        {/* Submit action button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-bg font-bold rounded-xl text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-2 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span>{isSignUp ? 'Tạo tài khoản' : 'Đăng nhập'}</span>
          )}
        </button>
      </form>

      {/* Alternative Login Providers Divider */}
      <div className="flex items-center">
        <div className="flex-1 border-t border-border/40"></div>
        <span className="px-3 text-[9px] text-text-dim uppercase tracking-wider font-semibold">Hoặc tiếp tục với</span>
        <div className="flex-1 border-t border-border/40"></div>
      </div>

      {/* Google Login trigger */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-bg border border-border text-white text-xs font-medium py-2.5 px-4 rounded-xl shadow-md hover:bg-neutral-800/55 transition-all hover:border-primary/30 cursor-pointer"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          <span>Google Accounts</span>
        </button>
      </div>
    </div>
  );
}
