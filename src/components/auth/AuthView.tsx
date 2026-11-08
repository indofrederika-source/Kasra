'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  User,
  Store,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Moon,
  Sun,
  Send,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { validatePasswordStrength } from '@/lib/auth/crypto';
import { KasraLogo } from '@/components/ui/KasraLogo';
import { BUSINESS_CATEGORY_PRESETS } from '@/lib/constants/businessCategories';
import confetti from 'canvas-confetti';

interface AuthViewProps {
  onSuccess?: () => void;
  initialMode?: 'login' | 'register';
  onBackToLanding?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onSuccess,
  initialMode = 'login',
  onBackToLanding,
}) => {
  const {
    login,
    register,
    sendPasswordResetEmail,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(
    initialMode === 'register' ? 'register' : 'login'
  );

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regStoreName, setRegStoreName] = useState('');
  const [regCategory, setRegCategory] = useState('');
  const [regCustomCategory, setRegCustomCategory] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [suggestedEmail, setSuggestedEmail] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{
    type: 'error' | 'success';
    msg: string;
  } | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  // UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [alreadyRegisteredEmail, setAlreadyRegisteredEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kasra_ui_theme');
      const darkActive = saved === 'dark';
      setIsDark(darkActive);
      document.documentElement.classList.toggle('dark-theme', darkActive);
    } catch {
      // ignore
    }
  }, []);

  const handleToggleTheme = (nextDark: boolean) => {
    setIsDark(nextDark);
    try {
      localStorage.setItem('kasra_ui_theme', nextDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark-theme', nextDark);
    } catch {
      // ignore
    }
  };

  const pwdStrength = validatePasswordStrength(regPassword);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setAlreadyRegisteredEmail(null);
    setIsSubmitting(true);

    try {
      const res = await login({
        email: loginEmail,
        password: loginPassword,
        rememberMe,
      });

      if (!res.success) {
        setErrorMessage(
          res.error || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.'
        );
      } else {
        onSuccess?.();
      }
    } catch {
      setErrorMessage('Terjadi gangguan koneksi saat masuk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setSuggestedEmail(null);
    setAlreadyRegisteredEmail(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
      return;
    }

    if (!pwdStrength.isValid) {
      setErrorMessage(pwdStrength.message);
      return;
    }

    const finalCategory =
      regCategory === '__custom__' ? regCustomCategory.trim() : regCategory.trim();

    setIsSubmitting(true);

    try {
      const res = await register({
        name: regName,
        email: regEmail,
        storeName: regStoreName,
        businessCategory: finalCategory,
        password: regPassword,
      });

      if (!res.success) {
        if (res.suggestedEmail) {
          setSuggestedEmail(res.suggestedEmail);
        }
        if (res.alreadyRegistered && res.email) {
          setAlreadyRegisteredEmail(res.email);
        }
        setErrorMessage(res.error || 'Gagal membuat akun toko.');
        return;
      }

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
      onSuccess?.();
    } catch {
      setErrorMessage('Terjadi kesalahan saat memproses pendaftaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus(null);
    setIsSendingReset(true);
    try {
      const res = await sendPasswordResetEmail(forgotEmail);
      if (!res.success) {
        setForgotStatus({
          type: 'error',
          msg: res.error || 'Gagal mengirim email pemulihan kata sandi.',
        });
      } else {
        setForgotStatus({
          type: 'success',
          msg:
            res.message ||
            'Tautan reset kata sandi telah dikirim ke email Anda. Cek Kotak Masuk / Spam.',
        });
      }
    } finally {
      setIsSendingReset(false);
    }
  };

  const inputClassName = `w-full py-2.5 text-xs rounded-xl border transition-all focus:outline-none ${
    isDark
      ? 'bg-[#172A57] border-[#345294] text-[#FCF1D0] placeholder:text-[#93A6D1] focus:border-[#FCF1D0]'
      : 'bg-[#EFF3EC] border-[#DEE5D9] text-[#142413] placeholder:text-[#6B7B68] focus:border-[#1E3D1C]'
  }`;

  const primaryBtnClass = isDark
    ? 'bg-[#FCF1D0] hover:opacity-95 text-[#0D1C42]'
    : 'bg-[#1E3D1C] hover:bg-[#162E14] text-[#F8FAF6]';

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-250 ${
        isDark
          ? 'bg-[#0D1C42] text-[#FCF1D0] selection:bg-[#FCF1D0] selection:text-[#0D1C42]'
          : 'bg-[#EFF2EC] text-[#142413] selection:bg-[#1E3D1C] selection:text-[#F8FAF6]'
      }`}
    >
      {/* Background soft ambient blur */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div
          className={`w-[500px] h-[500px] rounded-full blur-3xl -translate-y-24 translate-x-32 ${
            isDark ? 'bg-[#22396F]/45' : 'bg-[#C8DAC1]/40'
          }`}
        />
        <div
          className={`w-[450px] h-[450px] rounded-full blur-3xl translate-y-32 -translate-x-32 ${
            isDark ? 'bg-[#172A57]/60' : 'bg-[#D2E2CC]/45'
          }`}
        />
      </div>

      {/* Top-Left Back to Landing Button */}
      {onBackToLanding && (
        <div className="fixed top-5 left-5 z-30">
          <button
            type="button"
            onClick={onBackToLanding}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border shadow-md text-xs font-bold transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0] hover:bg-[#2B4684]'
                : 'bg-[#F8FAF6] border-[#DEE5D9] text-[#1E3D1C] hover:bg-[#E5EAE0]'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </button>
        </div>
      )}

      {/* Top-Right Compact Icon-Only Theme Switcher */}
      <div className="fixed top-5 right-5 z-30">
        <div
          className={`inline-flex items-center gap-0.5 p-1 rounded-full border shadow-md ${
            isDark
              ? 'bg-[#22396F] border-[#345294]'
              : 'bg-[#E5EAE0] border-[#D8E0D2]'
          }`}
          role="group"
          aria-label="Pilih Tema Tampilan"
        >
          <button
            type="button"
            onClick={() => handleToggleTheme(true)}
            title="Tema Gelap"
            aria-label="Tema Gelap"
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isDark
                ? 'bg-[#FCF1D0] text-[#0D1C42] shadow-xs'
                : 'text-[#627060] hover:text-[#142413]'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleToggleTheme(false)}
            title="Tema Terang"
            aria-label="Tema Terang"
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              !isDark
                ? 'bg-[#1E3D1C] text-[#F8FAF6] shadow-xs'
                : 'text-[#FCF1D0]/75 hover:text-[#FCF1D0]'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-[460px] z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md mb-3 ${
              isDark
                ? 'bg-[#22396F] border border-[#345294] text-[#FCF1D0]'
                : 'bg-gradient-to-br from-[#234720] to-[#152E14] text-[#F8FAF6]'
            }`}
          >
            <KasraLogo className={`w-8 h-8 ${isDark ? 'text-[#FCF1D0]' : 'text-[#F8FAF6]'}`} />
          </div>
          <h1
            className={`text-2xl font-bold tracking-tight ${
              isDark ? 'text-[#FCF1D0]' : 'text-[#142413]'
            }`}
          >
            Ruang Kerja KASRA
          </h1>
          <p
            className={`text-xs mt-1 max-w-xs ${
              isDark ? 'text-[#B8C4E0]' : 'text-[#6B7B68]'
            }`}
          >
            Asisten Finansial & Gudang Pintar Terintegrasi untuk UMKM
          </p>
        </div>

        {/* Main Card Container */}
        <div
          className={`rounded-3xl border p-6 sm:p-8 transition-colors ${
            isDark
              ? 'bg-[#22396F] border-[#345294] shadow-[0_16px_40px_rgba(7,16,38,0.45)]'
              : 'bg-[#F8FAF6] border-[#DEE5D9] shadow-[0_8px_30px_rgba(20,36,19,0.05)]'
          }`}
        >
          {/* Segmented Tab Switcher (Login vs Register) */}
          <div
            className={`grid grid-cols-2 p-1 rounded-2xl mb-6 border ${
              isDark
                ? 'bg-[#172A57] border-[#345294]'
                : 'bg-[#E5EAE0] border-[#D8E0D2]'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setInfoMessage(null);
                setSuggestedEmail(null);
                setAlreadyRegisteredEmail(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? isDark
                    ? 'bg-[#FCF1D0] text-[#0D1C42] shadow-sm'
                    : 'bg-[#FFFFFF] text-[#142413] shadow-xs'
                  : isDark
                  ? 'text-[#B8C4E0] hover:text-[#FCF1D0]'
                  : 'text-[#627060] hover:text-[#142413]'
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
                setInfoMessage(null);
                setSuggestedEmail(null);
                setAlreadyRegisteredEmail(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? isDark
                    ? 'bg-[#FCF1D0] text-[#0D1C42] shadow-sm'
                    : 'bg-[#FFFFFF] text-[#142413] shadow-xs'
                  : isDark
                  ? 'text-[#B8C4E0] hover:text-[#FCF1D0]'
                  : 'text-[#627060] hover:text-[#142413]'
              }`}
            >
              Daftar Toko Baru
            </button>
          </div>

          {/* Error Alert Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 text-xs text-rose-800 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              </div>

              {suggestedEmail && mode === 'register' && (
                <button
                  type="button"
                  onClick={() => {
                    setRegEmail(suggestedEmail);
                    setSuggestedEmail(null);
                    setErrorMessage(null);
                  }}
                  className="ml-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-rose-300 text-rose-800 font-bold text-[11px] hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <span>Gunakan &ldquo;{suggestedEmail}&rdquo;</span>
                </button>
              )}

              {alreadyRegisteredEmail && (
                <div className="ml-6 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail(alreadyRegisteredEmail);
                      setMode('login');
                      setErrorMessage(null);
                      setAlreadyRegisteredEmail(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-rose-300 text-rose-900 font-bold text-[11px] hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <span>Masuk dengan {alreadyRegisteredEmail}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Info Alert Banner */}
          {infoMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{infoMessage}</div>
            </div>
          )}

          {mode === 'login' ? (
            /* ======================================================== */
            /* MODE 1: LOGIN FORM */
            /* ======================================================== */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Akun
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama@gmail.com"
                    autoComplete="email"
                    className={`${inputClassName} pl-10 pr-3.5`}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginEmail);
                      setForgotStatus(null);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Lupa sandi?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun"
                    autoComplete="current-password"
                    className={`${inputClassName} pl-10 pr-10 font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className={`w-4 h-4 rounded ${
                      isDark ? 'accent-[#FCF1D0]' : 'accent-[#1E3D1C]'
                    }`}
                  />
                  <span className="text-xs text-slate-600 font-medium">
                    Ingat sesi saya di peramban ini
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full mt-2 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer ${primaryBtnClass}`}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Masuk ke Kasra</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ======================================================== */
            /* MODE 3: REGISTER FORM (Real Email Validated) */
            /* ======================================================== */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Nama Pemilik */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Pemilik
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Masukkan nama pemilik"
                    className={`${inputClassName} pl-10 pr-3.5`}
                  />
                </div>
              </div>

              {/* Nama Toko & Kategori Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Toko / Usaha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Store className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={regStoreName}
                      onChange={(e) => setRegStoreName(e.target.value)}
                      placeholder="Nama Toko"
                      className={`${inputClassName} pl-10 pr-3.5`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Bisnis (Opsional)
                  </label>
                  <select
                    value={regCategory}
                    onChange={(e) => setRegCategory(e.target.value)}
                    className={`${inputClassName} px-3 cursor-pointer`}
                  >
                    <option value="">Pilih bidang usaha toko...</option>
                    {BUSINESS_CATEGORY_PRESETS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                    <option value="__custom__">Lainnya (Ketik bidang sendiri...)</option>
                  </select>
                </div>
              </div>

              {regCategory === '__custom__' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tulis Kategori Bisnis Anda
                  </label>
                  <input
                    type="text"
                    value={regCustomCategory}
                    onChange={(e) => setRegCustomCategory(e.target.value)}
                    placeholder="Contoh: Petshop, Apotek, Bengkel, Toko Buah..."
                    className={`${inputClassName} px-3.5`}
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Pemilik / Toko
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama@gmail.com"
                    autoComplete="email"
                    className={`${inputClassName} pl-10 pr-3.5`}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Digunakan untuk masuk ke akun toko Anda.
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Baru (Min. 8 karakter)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Kombinasi huruf & angka"
                    autoComplete="new-password"
                    className={`${inputClassName} pl-10 pr-10 font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showRegPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {regPassword.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          pwdStrength.score >= 1
                            ? 'bg-rose-500'
                            : isDark
                            ? 'bg-[#172A57]'
                            : 'bg-slate-200'
                        }`}
                      />
                      <div
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          pwdStrength.score >= 2
                            ? 'bg-amber-500'
                            : isDark
                            ? 'bg-[#172A57]'
                            : 'bg-slate-200'
                        }`}
                      />
                      <div
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          pwdStrength.score >= 3
                            ? 'bg-emerald-500'
                            : isDark
                            ? 'bg-[#172A57]'
                            : 'bg-slate-200'
                        }`}
                      />
                    </div>
                    <p
                      className={`text-[10px] ${
                        pwdStrength.isValid ? 'text-emerald-600 font-medium' : 'text-slate-400'
                      }`}
                    >
                      {pwdStrength.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ulangi Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi"
                    autoComplete="new-password"
                    className={`${inputClassName} pl-10 pr-3.5 font-mono`}
                  />
                </div>
              </div>

              {/* Submit Register Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full mt-3 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer ${primaryBtnClass}`}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Daftar & Masuk ke Kasra</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer Info */}
        <p className="text-center text-[11px] text-slate-400 mt-5">
          KASRA &copy; {new Date().getFullYear()} • Sistem Kasir & Inventaris Pintar UMKM
        </p>
      </div>

      {/* Real Password Reset Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fadeIn">
          <div
            className={`rounded-3xl max-w-sm w-full p-6 border shadow-2xl space-y-4 ${
              isDark
                ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0]'
                : 'bg-[#F8FAF6] border-[#DEE5D9] text-[#142413]'
            }`}
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pulihkan Kata Sandi Akun
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Masukkan email asli yang terdaftar pada akun toko Anda. Kami akan mengirimkan tautan pemulihan kata sandi ke kotak masuk Anda.
              </p>
            </div>

            {forgotStatus && (
              <div
                className={`p-3 rounded-2xl text-xs font-medium border ${
                  forgotStatus.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {forgotStatus.msg}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="nama@gmail.com"
                className={`${inputClassName} px-3.5`}
              />

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={isSendingReset || !forgotEmail.trim()}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer ${primaryBtnClass}`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingReset ? 'Mengirim...' : 'Kirim Tautan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
