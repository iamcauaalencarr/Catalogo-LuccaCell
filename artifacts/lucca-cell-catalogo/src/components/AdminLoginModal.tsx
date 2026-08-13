import React, { useState } from 'react';
import { Lock, ShieldCheck, X, KeyRound, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export function AdminLoginModal({ isOpen, onClose, onLoginSuccess }: AdminLoginModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin' || password === '123456' || password === 'luccacell') {
      setError(false);
      setPassword('');
      onLoginSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-[#171411]/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-[#4b3927] bg-[#211b17] text-[#fff7e6] shadow-[0_25px_60px_rgba(0,0,0,0.5)] animate-rise"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Gold Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#d97621] via-[#f4b52e] to-[#e99c28]" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-[#45382c] text-[#bcae98] hover:bg-[#2b241e] hover:text-white transition-colors"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>

          <div className="p-6 sm:p-8">
            {/* Header Icon */}
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#67502d] bg-[#2b231c] text-[#f4b52e]">
              <ShieldCheck size={28} />
            </div>

            <span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#d7ad55]">
              Área Restrita
            </span>
            <h2 className="display mt-1 text-[26px] font-semibold leading-tight text-[#fff4dc]">
              Painel Admin Lucca Cell
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#bcae98]">
              Insira a senha de administrador para gerenciar produtos, preços e ordens de serviço.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#c9bdad] mb-2">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9c8d7b]" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(false);
                    }}
                    placeholder="Digite a senha (ex: admin)"
                    autoFocus
                    className={`h-11 w-full rounded-xl border bg-[#171411] pl-10 pr-4 text-xs text-[#fff4dc] placeholder:text-[#6e6153] outline-none transition-colors ${
                      error 
                        ? 'border-red-500/80 focus:ring-2 focus:ring-red-500/30' 
                        : 'border-[#45382c] focus:border-[#f4b52e] focus:ring-2 focus:ring-[#f4b52e]/20'
                    }`}
                  />
                </div>
                {error && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400 font-medium">
                    <AlertCircle size={14} />
                    <span>Senha incorreta. Tente 'admin'.</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-[#69543c] px-5 py-2.5 text-xs font-bold text-[#e8d9bf] hover:border-[#eab23d] hover:text-[#ffd45e] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-full bg-[#f4b52e] px-6 py-2.5 text-xs font-extrabold text-[#261c14] hover:bg-[#ffce57] transition-all shadow-md"
                >
                  <Lock size={14} />
                  <span>Entrar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
