import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, Lock, User, LogIn, UserPlus, Chrome } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { userService } from '../services/dbService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user' // Default to customer
  });
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && !user.emailVerified) {
        setNeedsVerification(true);
      } else if (user && user.emailVerified) {
        setNeedsVerification(false);
        navigate('/');
      }
    });
    return () => unsub();
  }, [navigate]);

  // Handle resend timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-check verification status every 5 seconds
  useEffect(() => {
    let interval: any;
    if (needsVerification && auth.currentUser) {
      interval = setInterval(async () => {
        try {
          await auth.currentUser?.reload();
          if (auth.currentUser?.emailVerified) {
            setNeedsVerification(false);
            navigate('/');
          }
        } catch (e) {
          // Ignore periodic errors to prevent console spam
        }
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [needsVerification, navigate]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (error) {
      toast.error(t('login_failed'));
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await userService.resendVerification();
      toast.success(t('check_email_for_code'));
      setResendCooldown(60);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleResetPassword = async () => {
    if (!formData.email) {
      toast.error(isRtl ? 'يرجى إدخال البريد الإلكتروني أولاً' : 'Please enter your email first');
      return;
    }
    try {
      await userService.resetPassword(formData.email);
      toast.success(t('reset_link_sent'));
    } catch (error: any) {
      toast.error(error.message || t('auth_error'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { user } = await userService.loginWithEmail(formData.email, formData.password);
        if (!user.emailVerified) {
          setNeedsVerification(true);
          setLoading(false);
          return;
        }
        toast.success(t('login_success'));
      } else {
        await userService.registerWithEmail(formData.email, formData.password, formData.name, formData.role);
        setNeedsVerification(true);
        toast.success(t('register_success'));
        setLoading(false);
        return;
      }
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || t('auth_error'));
    } finally {
      if (!needsVerification) setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (auth.currentUser) {
      setLoading(true);
      try {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          toast.success(t('verification_success'));
          navigate('/');
        } else {
          toast.error(isRtl ? 'لم يتم التحقق بعد، يرجى مراجعة بريدك.' : 'Not verified yet, please check your email.');
        }
      } catch (e) {
        toast.error("Retry failed");
      } finally {
        setLoading(false);
      }
    }
  };

  if (needsVerification) {
    return (
      <div className="max-w-md mx-auto mt-12 mb-24">
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-[#3D2B1F]/5 border border-[#3D2B1F]/5 text-center">
          <div className="w-16 h-16 bg-[#C5A028]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#C5A028]">
            <Mail size={32} />
          </div>
          <h1 className="text-2xl font-serif mb-4">{t('verification_required')}</h1>
          <p className="text-[#3D2B1F]/60 text-sm mb-8 leading-relaxed">
            {t('verification_desc')}
          </p>
          <div className="space-y-4">
            <button
              onClick={handleCheckVerification}
              disabled={loading}
              className="w-full bg-[#C5A028] text-white py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isRtl ? 'لقد قمت بالتحقق (تحديث)' : 'I have verified (Refresh)'}
            </button>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className={`w-full text-white py-4 rounded-2xl font-bold transition-all ${resendCooldown > 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#3D2B1F] hover:opacity-90'}`}
            >
              {resendCooldown > 0 ? `${t('resend_verification')} (${resendCooldown}s)` : t('resend_verification')}
            </button>
            <button
              onClick={() => {
                setNeedsVerification(false);
                userService.logout();
              }}
              className="w-full bg-white border border-[#3D2B1F]/10 text-[#3D2B1F] py-4 rounded-2xl font-bold hover:bg-[#F8F8F5] transition-all"
            >
              {isRtl ? 'تسجيل الخروج' : 'Logout'}
            </button>
          </div>
          <p className="mt-8 text-[10px] opacity-40 uppercase tracking-widest">{t('check_email_for_code')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 mb-24">
      <div className="bg-white rounded-3xl p-8 shadow-xl shadow-[#3D2B1F]/5 border border-[#3D2B1F]/5">
        <div className="text-center mb-8">
          <img 
            src="https://i.imgur.com/zF9MSpy.png" 
            alt="Debazah" 
            className="w-16 h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-serif mb-2">
            {isLogin ? t('login_title') : t('register_title')}
          </h1>
          <p className="text-[#3D2B1F]/60 text-sm">
            {isLogin ? t('login_subtitle') : t('register_subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="flex gap-2 p-1 bg-[#F8F8F5] rounded-2xl mb-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'user' })}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${formData.role === 'user' ? 'bg-[#3D2B1F] text-white shadow-md' : 'text-[#3D2B1F]/40 hover:text-[#3D2B1F]'}`}
                >
                  {t('user_type_customer')}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'chef' })}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${formData.role === 'chef' ? 'bg-[#C5A028] text-white shadow-md' : 'text-[#3D2B1F]/40 hover:text-[#3D2B1F]'}`}
                >
                  {t('user_type_chef')}
                </button>
              </div>

              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3D2B1F]/40" size={18} />
                <input
                  type="text"
                  required
                  placeholder={t('full_name')}
                  className="w-full pl-12 pr-4 py-3 bg-[#F8F8F5] rounded-2xl border-none focus:ring-2 focus:ring-[#C5A028]/20 transition-all text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3D2B1F]/40" size={18} />
            <input
              type="email"
              required
              placeholder={t('email')}
              className="w-full pl-12 pr-4 py-3 bg-[#F8F8F5] rounded-2xl border-none focus:ring-2 focus:ring-[#C5A028]/20 transition-all text-sm"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3D2B1F]/40" size={18} />
            <input
              type="password"
              required
              placeholder={t('password')}
              className="w-full pl-12 pr-4 py-3 bg-[#F8F8F5] rounded-2xl border-none focus:ring-2 focus:ring-[#C5A028]/20 transition-all text-sm"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {isLogin && (
            <div className="flex justify-end px-1">
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-xs text-[#C5A028] hover:underline font-medium"
              >
                {t('forgot_password')}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3D2B1F] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#C5A028] transition-all disabled:opacity-50 shadow-lg shadow-[#3D2B1F]/10"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                {isLogin ? t('login') : t('register')}
              </>
            )}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4 text-[#3D2B1F]/20">
          <div className="h-px flex-1 bg-current" />
          <span className="text-[10px] font-black uppercase tracking-widest">{t('or_continue_with')}</span>
          <div className="h-px flex-1 bg-current" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-[#3D2B1F]/10 text-[#3D2B1F] py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#F8F8F5] transition-all"
        >
          <Chrome size={18} className="text-[#4285F4]" />
          {t('continue_with_google')}
        </button>

        <p className="mt-8 text-center text-sm text-[#3D2B1F]/60">
          {isLogin ? t('no_account_yet') : t('already_have_account')}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#C5A028] font-bold hover:underline"
          >
            {isLogin ? t('register_now') : t('login_now')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
