import React, { useState } from 'react';
import { 
  Lock, ShieldCheck, X, KeyRound, Mail, User, CheckCircle2, AlertCircle, Eye, EyeOff, UserPlus, LogIn, Send 
} from 'lucide-react';
import { signUpAdminWithSupabase, signInAdminWithSupabase, AdminProfile, supabase } from '@/lib/supabase';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (profile: AdminProfile) => void;
}

export function AdminAuthModal({ isOpen, onClose, onLoginSuccess }: AdminAuthModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State: Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const emailClean = loginEmail.trim().toLowerCase();
    const passClean = loginPassword.trim();

    if (!emailClean || !passClean) {
      setLoginError('Por favor, informe seu e-mail e senha.');
      return;
    }

    setLoading(true);

    try {
      if (supabase) {
        const { profile, error, emailUnconfirmed } = await signInAdminWithSupabase(emailClean, passClean);

        if (emailUnconfirmed) {
          setLoginError('Seu e-mail ainda não foi confirmado! Verifique sua caixa de entrada (e spam) e clique no link de ativação antes de fazer login.');
          setLoading(false);
          return;
        }

        if (error || !profile) {
          setLoginError(error?.message || 'E-mail ou senha incorretos.');
          setLoading(false);
          return;
        }

        onLoginSuccess(profile);
        onClose();
        return;
      }

      // Fallback para senha mestre caso Supabase não esteja configurado
      if (passClean === 'luccacell2026') {
        const fallbackProfile: AdminProfile = {
          id: 'master-local',
          name: 'Proprietário Lucca Cell',
          email: emailClean || 'admin@luccacell.com.br',
          role: 'owner',
          permissions: ['products.create', 'products.update', 'products.delete', 'admins.manage', 'reports.read'],
          is_active: true
        };
        onLoginSuccess(fallbackProfile);
        onClose();
        return;
      }

      setLoginError('Credenciais inválidas.');
    } catch (err: any) {
      setLoginError(err.message || 'Erro ao tentar autenticar.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-[#171411]/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div 
          className="relative w-full max-w-md overflow-hidden rounded-t-[24px] sm:rounded-[24px] border border-[#4b3927] bg-[#211b17] text-[#fff7e6] shadow-[0_25px_60px_rgba(0,0,0,0.6)] animate-rise max-h-[92vh] sm:max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Gold Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#d97621] via-[#f4b52e] to-[#e99c28]" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-[#45382c] text-[#bcae98] hover:bg-[#2b241e] hover:text-white transition-colors z-10"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>

          <div className="p-6 sm:p-8 overflow-y-auto flex-1">
            
            {/* Header Icon & Title */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#67502d] bg-[#2b231c] text-[#f4b52e]">
                <ShieldCheck size={26} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#d7ad55]">
                  Segurança & Acesso
                </span>
                <h2 className="display text-[22px] font-semibold leading-tight text-[#fff4dc]">
                  Painel Lucca Cell
                </h2>
              </div>
            </div>

            {/* FORMULÁRIO DE LOGIN (ÚNICA TELA) */}
            <form onSubmit={handleLoginSubmit} className="space-y-4 animate-rise mt-4">
              {loginError && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                  <span className="leading-relaxed">{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#c9bdad] mb-1.5">
                  E-mail do Proprietário
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d7e6d]" size={16} />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="h-11 w-full rounded-xl border border-[#45382c] bg-[#171411] pl-10 pr-4 text-xs text-[#fff4dc] placeholder:text-[#6e6153] outline-none focus:border-[#f4b52e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#c9bdad] mb-1.5">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d7e6d]" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="h-11 w-full rounded-xl border border-[#45382c] bg-[#171411] pl-10 pr-10 text-xs text-[#fff4dc] placeholder:text-[#6e6153] outline-none focus:border-[#f4b52e]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8d7e6d] hover:text-[#fff4dc]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 rounded-full border border-[#69543c] px-5 text-xs font-bold text-[#e8d9bf] hover:border-[#eab23d]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 flex items-center justify-center gap-2 rounded-full bg-[#f4b52e] px-6 text-xs font-extrabold text-[#261c14] active:scale-95 shadow-md disabled:opacity-50"
                >
                  <Lock size={14} />
                  <span>{loading ? 'Validando...' : 'Acessar Painel'}</span>
                </button>
              </div>
            </form>


          </div>
        </div>
      </div>
    </>
  );
}
