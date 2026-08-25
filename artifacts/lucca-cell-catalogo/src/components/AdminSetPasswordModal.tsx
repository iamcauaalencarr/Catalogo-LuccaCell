import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { supabase, fetchCurrentAdminProfile, AdminProfile, logSecurityAction } from '@/lib/supabase';

interface AdminSetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordSetSuccess: (profile: AdminProfile) => void;
}

export function AdminSetPasswordModal({
  isOpen,
  onClose,
  onPasswordSetSuccess
}: AdminSetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    if (!supabase) {
      setError('Supabase não configurado.');
      return;
    }

    setLoading(true);

    try {
      // 1. Atualizar a senha do usuário autenticado no Supabase Auth
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError.message || 'Erro ao definir senha.');
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('Sessão expirada. Solicite um novo convite.');
        setLoading(false);
        return;
      }

      // 2. Buscar o perfil do administrador no banco
      let profile = await fetchCurrentAdminProfile(data.user.id);

      // Se o perfil ainda não existir no banco, criar automaticamente
      if (!profile) {
        const emailClean = data.user.email || '';
        const { data: newProfile, error: profileErr } = await supabase
          .from('admin_profiles')
          .upsert({
            id: data.user.id,
            email: emailClean,
            name: emailClean.split('@')[0],
            role: 'admin',
            permissions: ['products.read', 'products.create', 'products.update'],
            is_active: true
          })
          .select()
          .single();

        if (newProfile && !profileErr) {
          profile = newProfile as AdminProfile;
        } else {
          profile = {
            id: data.user.id,
            email: emailClean,
            name: emailClean.split('@')[0],
            role: 'admin',
            permissions: ['products.read', 'products.create', 'products.update'],
            is_active: true
          };
        }
      }

      // 3. Registrar log de ativação
      await logSecurityAction('ADMIN_LOGIN_SUCCESS', 'auth', {
        email: profile.email,
        role: profile.role,
        note: 'Primeiro acesso via convite (senha criada)'
      }, { name: profile.name, role: profile.role, email: profile.email });

      // Limpar a URL para remover tokens sensíveis
      if (typeof window !== 'undefined' && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      onPasswordSetSuccess(profile);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[110] bg-[#141210]/85 backdrop-blur-md transition-opacity"
      />
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div 
          className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-[#E7E0D6] bg-[#FFFFFF] text-[#1E1D1B] shadow-[0_25px_60px_rgba(0,0,0,0.2)] animate-rise"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Gold Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#D97757] via-[#E09A38] to-[#D97757]" />

          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#F0D5C7] bg-[#FAF2EB] text-[#D97757]">
                <Sparkles size={24} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#B05330]">
                  Lucca Cell · Boas-Vindas
                </span>
                <h2 className="text-xl font-bold text-[#1E1D1B]">Crie sua Senha de Acesso</h2>
              </div>
            </div>

            <p className="text-xs text-[#6E675D] leading-relaxed mb-6">
              Você foi convidado para a equipe administrativa da <strong>Lucca Cell</strong>. Defina uma senha segura para acessar o painel.
            </p>

            {error && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A443B] mb-1.5">
                  Nova Senha *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#DED6CA] bg-[#FAF8F5] pl-3.5 pr-10 text-xs text-[#1E1D1B] outline-none focus:border-[#D97757] focus:bg-[#FFFFFF] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#8E8578] hover:text-[#1E1D1B]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A443B] mb-1.5">
                  Confirmar Senha *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Repita a senha digitada"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#DED6CA] bg-[#FAF8F5] px-3.5 text-xs text-[#1E1D1B] outline-none focus:border-[#D97757] focus:bg-[#FFFFFF] transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D97757] to-[#C85A32] py-3 text-xs font-extrabold text-white shadow-md hover:from-[#C85A32] hover:to-[#B05330] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    'Salvando e entrando no painel...'
                  ) : (
                    <>
                      <KeyRound size={15} />
                      Salvar Senha e Entrar no Painel
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
